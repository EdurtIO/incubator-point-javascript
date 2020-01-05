var config = require('./config');
var common = require('./utils/common');
var md5 = require('./utils/md5');
var JSON = require('./utils/json');
var store = require('./utils/store');

/**
 * 监听器状态
 * @type {Object}
 */
var MONITORSTATE = {
  SENDING: 'monitor_sending',
  SEND: 'monitor_send',
  AUTHING: 'monitor_authing',
  AUTH: 'monitor_auth',
  SENDINGDATALEN: 'monitor_sending_len'
};

var locker = {
  _lockTimer: null,
  _lockState: false,
  cbs: [],
  exec: function (cb) {
    var that = this;
    that.cbs.push(cb);
    if (!that._lockTimer) {
      that._lockTimer = setInterval(function () {
        if (that._lockState || that.cbs.length <= 0) return;
        that._lockState = true;
        var callback = that.cbs.shift();
        callback();
        common.log('队列函数数量：' + that.cbs.length);
        if (that.cbs.length === 0) {
          clearInterval(that._lockTimer);
          that._lockTimer = null;
        }
        that._lockState = false;
      }, 0);
    }
  }
};

var CURRENT_EVENT_ID;

function getCurrentEventID() {
  return store.getSession('CURRENT_EVENT_ID');
}

function setCurrentEventID(cid) {
  store.setSession('CURRENT_EVENT_ID', cid);
}

module.exports = {
  checkOption: {
    /**
     * event和property里的key要是一个合法的变量名，由大小写字母、数字、下划线和$组成，并且首字符不能是数字。
     */
    regChecks: {
      regName: /^((?!^uniqueId$|^originalId$|^time$|^properties$|^id$|^firstId$|^secondId$|^users$|^events$|^event$|^userId$|^date$|^datetime$)[a-zA-Z_$][a-zA-Z\d_$]{0,99})$/i
    },
    /**
     * 检查属性是否有效
     * @params obj 要检测数的对象
     */
    checkPropertiesKey: function (obj) {
      var me = this,
        flag = true;
      common.each(obj, function (content, key) {
        if (!me.regChecks.regName.test(key)) {
          flag = false;
        }
      });
      return flag;
    },
    /**
     * 检查参数
     */
    check: function (a, b) {
      if (typeof this[a] === 'string') {
        return this[this[a]](b);
      } else {
        return this[a](b);
      }
    },
    //判断参数格式类型是否为字符串
    str: function (s) {
      if (!common.isString(s)) {
        common.log('请检查参数格式,必须是字符串');
        return false;
      } else {
        return true;
      }
    },
    /**
     * 事件属性字段验证
     */
    properties: function (p) {
      common.validateProperties(p);
      if (p) {
        if (common.isObject(p)) {
          if (this.checkPropertiesKey(p)) {
            return true;
          } else {
            common.log('properties里的key必须是由字符串数字_组成');
            return false;
          }
        } else {
          common.log('properties可以没有，但有的话必须是对象');
          return false;
        }
      } else {
        return true;
      }
    },
    /**
     * 主体对象属性字段验证
     */
    subject: function (p) {
      common.validateProperties(p);
      if (p) {
        if (common.isObject(p)) {
          if (this.checkPropertiesKey(p)) {
            return true;
          } else {
            common.log('subject里的key必须是由字符串数字_组成');
            return false;
          }
        } else {
          common.log('subject可以没有，但有的话必须是对象');
          return false;
        }
      } else {
        return true;
      }
    },
    /**
     * 客体对象属性字段验证
     */
    object: function (p) {
      common.validateProperties(p);
      if (p) {
        if (common.isObject(p)) {
          if (this.checkPropertiesKey(p)) {
            return true;
          } else {
            common.log('object里的key必须是由字符串数字_组成');
            return false;
          }
        } else {
          common.log('object可以没有，但有的话必须是对象');
          return false;
        }
      } else {
        return true;
      }
    },
    propertiesMust: function (p) {
      common.validateProperties(p);
      if (p === undefined || !common.isObject(p) || common.isEmptyObject(p)) {
        common.log('properties必须是对象且有值');
        return false;
      } else {
        if (this.checkPropertiesKey(p)) {
          return true;
        } else {
          common.log('properties里的key必须是由字符串数字_组成');
          return false;
        }
      }
    },
    // event要检查name
    event: function (s) {
      if (!common.isString(s) || !this['regChecks']['regName'].test(s)) {
        common.log('请检查参数格式,必须是字符串,且eventName必须是字符串_开头');
        return false;
      } else {
        return true;
      }
    },
    test_id: 'str',
    group_id: 'str',
    uniqueId: function (id) {
      if (common.isString(id) && /^.{1,255}$/.test(id)) {
        return true;
      } else {
        common.log('uniqueId必须是不能为空，且小于255位的字符串');
        return false;
      }
    },
    userId: function (id) {
      if (common.isString(id) || common.isNumber(id) && /^.{1,255}$/.test(id)) {
        return true;
      } else {
        common.log('userId必须是不能为空，且小于255位的字符串');
        return false;
      }
    }
  },
  /**
   * 本地上下文环境
   * 获取当前发送器的授权状态
   * 获取当前发送器的事件池
   * @type {Object}
   */
  globalContext: {
    state: {
    },
    eventPool: [],
    get: function (key) {
      return key ? this.state[key] : this.state;
    },
    set: function (key, value) {
      this.state[key] = value;
    },
    getEventPool: function () {
      var pool = common.localStorage.parse(config.LIB_KEY + 'EventPool' + config.appToken, []);
      return pool;
    },
    setEventPool: function (eventPool) {
      common.localStorage.set(config.LIB_KEY + 'EventPool' + config.appToken, JSON.stringify(eventPool));
    },
    /**
     * 事件缓冲到数据池中
     */
    pushEvent: function (event) {
      var that = this;
      event.sending = false;
      locker.exec(function () {
        event.cid = common.UUID();
        var cid = getCurrentEventID();
        if (cid) {
          event.pid = cid;
        }
        setCurrentEventID(event.cid);
        var pool = that.getEventPool();
        pool.push(event);
        that.setEventPool(pool);
      });
    }
  },

  check: function (prop) {
    var flag = true;
    for (var i in prop) {
      if (!this.checkOption.check(i, prop[i])) {
        return false;
      }
    }
    return flag;
  },

  /**
   * 事件发送
   */
  send: function (props) {
  },

  /**
   * 发送器
   */
  monitor: function (sendImmediately) {

  },
  auth: function (cb) {
  },
  //支持两种发送模式：
  //1、sendImmediately:立即发送模式，ajax异步的方式发送事件数据，不对事件数据进行监听
  //2、lately:缓存发送模式，SDK判断缓存数据量，发送数据
  path: function (sendImmediately, cb) {
    var that = this,
      session = store.getSession(),
      authed = session[MONITORSTATE.AUTH],
      sendingState = session[MONITORSTATE.SENDING];

    if (!authed || sendingState) {
      return;
    }

    var url = config.apiHost + '/receive',
      limit = config.sendLimit || 1;

    //更新状态正在发送数据中
    store.setSession(MONITORSTATE.SENDING, true);

    var sendingEvents = that.getWaitSendEvents(),
      postLength = sendingEvents.length,
      dataIds = [];

    if (!sendImmediately && postLength < limit) {
      store.setSession(MONITORSTATE.SENDING, false);
      return;
    }

    common.each(sendingEvents, function (item) {
      item.sending = true;
      dataIds.push(item.cid);
    });

    var postEvents = that.getPackingEvents(sendingEvents);

    /**
     * 200 成功
     * 402 token失效
     * 403 传参错误
     * 500 系统错误
     */
    common.ajax({
      url: url,
      type: "POST",
      cors: true,
      contentType: "application/json",
      data: postEvents,
      success: function (data) {
        try {
          //返回空值：将请求体内的事件踢出栈
          if (common.isEmptyObject(data) || (data.code === 200)) {
            that.removeSendedEvents(dataIds);
          } else if (data.code === 402) {
            //授权失效状态，重新发送授权
            store.setSession(MONITORSTATE.AUTH, false);
            //进行授权请求，请求通过后发起一次事件发送
            that.auth(function (authState) {
              authState && that.path();
            });
          } else {
            //发送失败，将本次发送的数据状态更新为未发送状态
            that.resetUnsendedEvents(dataIds);
          }
        } catch (ex) {
          common.log('事件发送返回消息错误');
        }
      },
      error: function (xhr) {
        common.log(xhr.status);
        common.log(xhr.statusText);
      },
      complete: function () {
        store.setSession(MONITORSTATE.SENDING, false);
        common.log('事件发送完毕.');
      }
    });

    if (sendImmediately) {
      that.removeSendedEvents(dataIds);
      store.setSession(MONITORSTATE.SENDING, false);
    }
  },
  /**
   * 获取事件池内等待发送的数据
   */
  getWaitSendEvents: function () {
    var that = this,
      eventPool = that.globalContext.getEventPool(),
      events = [];
    events = common.arrayFilter(eventPool, function (event, index, arr) {
      return !event.sending;
    });
    common.log('获取到待发送数据：\r\n' + JSON.stringify(events, null, 4));
    return events;
  },
  /**
   * 删除已经发送出去的事件
   */
  removeSendedEvents: function (sendedEventIds) {
    var that = this;
    locker.exec(function () {
      var eventPool = that.globalContext.getEventPool();
      eventPool = common.arrayFilter(eventPool, function (event, index, arr) {
        return sendedEventIds.indexOf(event.cid) === -1;
      });
      that.globalContext.setEventPool(eventPool);
    });
  },
  /**
   * 重置发送失败的事件
   */
  resetUnsendedEvents: function (unSendedEventIds) {
    var that = this;
    locker.exec(function () {
      var eventPool = that.globalContext.getEventPool();
      common.each(eventPool, function (event) {
        if (unSendedEventIds.indexOf(event.cid) >= 0) {
          event.sending = false;
        }
      });
      that.globalContext.setEventPool(eventPool);
    });
  },
  getPackingEvents: function (events) {
    var session = store.getSession(),
      token = session.token,
      sessionId = session.sessionId, deviceId = store.getDeviceId(),
      eventsStr = JSON.stringify(events),
      cache = store.get(),
      dataStr = JSON.stringify({
        "appToken": config.appToken,
        "uniqueId": deviceId,
        "userId": cache ? cache['userId'] : '',
        "events": eventsStr
      }),
      sign = md5(dataStr + token),
      postData = JSON.stringify({
        "datatime": common.formatDate(new Date()),
        //"domain": store.getDomain(),
        "lib": 'js',
        "sign": sign,
        "appToken": config.appToken,
        "randomId": sessionId,
        "data": dataStr
      });
    common.log('发送事件数据：\r\n' + JSON.stringify(events, null, 4));
    return postData;
  }
};