var config = require('../config');
var common = require('./common');
var JSON = require('./json');

var key = config.key;

module.exports = {

  getProps: function () {
    return this._state.props;
  },

  getSessionProps: function () {
    return this._sessionState.props;
  },

  getSubject: function () {
    return this._state.subject;
  },

  getObject: function () {
    return this._state.object;
  },

  getSessionSubject: function () {
    return this._sessionState['subject'] || {};
  },
  
  getSessionObject: function () {
    return this._sessionState['object'] || {};
  },

  /**
   * 获取会话的CookieID
   * 默认过期时间为2年
   * 在手动清空Cookie时过期
   */
  getDeviceId: function () {
    return this._state.uniqueId;
  },

  /**
   * 获取本次浏览会话的SessionID
   * 窗口全部关闭，则SessionID过期
   */
  getSessionId: function () {
    return this._sessionState.sessionId;
  },

  getDomain: function () {
    var domain = this._state.domain;
    if (!domain) {
      domain = document.domain || window.location.host;
      this.setOnce('domain', domain);
    }
    return domain;
  },

  toState: function (ds) {
    var state = null;
    if (ds !== null && (typeof (state = JSON.parse(ds)) === 'object')) {
      this._state = state;
    }
  },

  initSessionState: function () {
    var ds = common.cookie.get(key + 'session');
    var state = null;
    if (ds !== null && (typeof (state = JSON.parse(ds)) === 'object')) {
      this._sessionState = state;
    }
  },

  get: function (name) {
    return name ? this._state[name] : this._state;
  },
  getSession: function (name) {
    return name ? this._sessionState[name] : this._sessionState;
  },

  set: function (name, value) {
    this._state[name] = value;
    this.save();
  },

  setOnce: function (name, value) {
    if (!(name in this._state)) {
      this.set(name, value);
    }
  },

  setSession: function (name, value) {
    this._sessionState[name] = value;
    this.sessionSave();
  },

  setSessionOnce: function (name, value) {
    if (!(name in this._sessionState)) {
      this.setSession(name, value);
    }
  },

  // 针对当前页面修改
  change: function (name, value) {
    this._state[name] = value;
  },

  sessionChange: function (name, value) {
    this._sessionState[name] = value;
  },

  setSessionProps: function (newp) {
    this._setSessionProps('props', newp);
  },

  setSessionPropsOnce: function (newp) {
    this._setSessionPropsOnce('props', newp);
  },

  setSessionSubject: function (newp) {
    this._setSessionProps('subject', newp);
  },

  setSessionSubjectOnce: function (newp) {
    this._setSessionPropsOnce('subject', newp);
  },

  clearSessionSubject: function () {
    this._sessionState.subject = {};
    this.sessionSave();
  },

  setSessionObject: function (newp) {
    this._setSessionProps('object', newp);
  },

  setSessionObjectOnce: function (newp) {
    this._setSessionPropsOnce('object', newp);
  },

  clearSessionObject: function () {
    this._sessionState.object = {};
    this.sessionSave();
  },

  setProps: function (newp) {
    this._setProps('props', newp);
  },

  setPropsOnce: function (newp) {
    this._setPropsOnce('props', newp);
  },
  
  setSubject: function (newp) {
    this._setProps('subject', newp);
  },
  
  setSubjectOnce: function (newp) {
    this._setPropsOnce('subject', newp);
  },
  
  clearSubject: function () {
    this._state.subject = {};
    this.save();
  },
  
  setObject: function (newp) {
    this._setProps('subject', newp);
  },
  
  setObjectOnce: function (newp) {
    this._setPropsOnce('subject', newp);
  },
  
  clearObject: function () {
    this._state.object = {};
    this.save();
  },
  
  _setProps: function (objName, newp) {
    var obj = this._state[objName] || {};
    common.extend(obj, newp);
    this.set(objName, obj);
  },
  
  _setPropsOnce: function (objName, newp) {
    var obj = this._state[objName] || {};
    common.coverExtend(obj, newp);
    this.set(objName, obj);
  },
  
  _setSessionProps: function (objName, newp) {
    var obj = this._sessionState[objName] || {};
    common.extend(obj, newp);
    this.setSession(objName, obj);
  },
 
  _setSessionPropsOnce: function (objName, newp) {
    var obj = this._sessionState[objName] || {};
    common.coverExtend(obj, newp);
    this.setSession(objName, obj);
  },
  
  sessionSave: function (props) {
    if (props) {
      this._sessionState = props;
    }
    common.cookie.set(key + 'session', JSON.stringify(this._sessionState), 0, config.crossDomain);
  },
  
  save: function () {
    if (config.crossDomain) {
      common.cookie.set(key + 'point-javascriptcross', JSON.stringify(this._state), this._state['expires'] || 730, true);
    } else {
      common.cookie.set(key + 'point-javascript', JSON.stringify(this._state), this._state['expires'] || 730, false);
    }
  },

  _sessionState: { props: {}, subject: {}, object: {} },
  _state: { props: {}, subject: {}, object: {} },
  
  init: function () {
    var ds = common.cookie.get(key + 'point-javascript');
    var cs = common.cookie.get(key + 'point-javascript-cross');
    var cross = null;
    if (config.crossDomain) {
      cross = cs;
      if (ds !== null) {
        common.log('在根域且子域有值，删除子域的cookie');
        common.cookie.remove(key + 'point-javascript', false);
        common.cookie.remove(key + 'point-javascript', true);
      }
      if (cross === null && ds !== null) {
        common.log('在根域且根域没值，子域有值，根域＝子域的值', ds);
        cross = ds;
      }
    } else {
      common.log('在子域');
      cross = ds;
    }
    this.initSessionState();
    if (cross !== null) {
      this.toState(cross);
      if (config.crossDomain && cs === null) {
        common.log('在根域且根域没值，保存当前值到cookie中');
        this.save();
      }
    } else {
      common.log('uniqueId为空，重新生成');
      this.set('uniqueId', common.UUID());
    }
    this.setSessionOnce('sessionId', common.UUID());
  }
};