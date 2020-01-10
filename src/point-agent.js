var common = require('./utils/common');
var config = require('./config');
var core = require('./core');
var store = require('./utils/store');
var detector = require('./detector/user-agent-detector');
var dom = require('./detector/dom-detector');
var sender = require('./utils/sender');

var pointAgent = {};
pointAgent._ = common;
pointAgent.config = config;

var eventCategories = sender.getEventCategory();

var commonWays = {
    /**
     * 事件自动追踪
     */
    autoTrack: function () {
        var that = this;
        var compaignParams = common.info.campaignParams();
        // 注册load事件是为了获取到页面资源加载完成时间
        dom.addEvent(window, 'load', function () {
            var loadProper = sender.getLoadTime();
            var properties = common.extend(loadProper.properties, compaignParams);
            that.track(loadProper.event, {
                properties: properties,
                subject: {},
                object: {}
            });
        });
        // 移动设备横竖屏转换
        dom.addEvent(window, 'orientationchange', function () {
            var orient = '';
            if (window.orientation == 180 || window.orientation == 0) {
                orient = sender.getChangeOrient('portrait'); // 竖屏
                store.setProps(orient);
            }
            if (window.orientation == 90 || window.orientation == -90) {
                orient = sender.getChangeOrient('landscape'); // 横屏
                store.setProps(orient);
            }
        })
        // 点击事件数据，加入限定收集时间
        var preClickTS = new Date * 1;
        dom.addEvent(document, 'click', function (e) {
            var curDate = new Date * 1;
            if (curDate - preClickTS <= 1000) return;
            preClickTS = curDate;
            var preset = sender.getClickPreset(e);
            var properties = common.extend({}, preset.properties);
            preset && that.track(preset.event, {
                properties: properties,
                subject: {},
                object: {}
            });
        });
        // 页面离开
        dom.addEvent(window, 'beforeunload', function (e) {
            var leavePage = sender.getLeavePage();
            var properties = common.extend(leavePage.properties);
            that.track(leavePage.event, {
                properties: properties,
                subject: {},
                object: {}
            }, true); //离开页面时立即将事件池清空，全部发送
            setTimeout(function () { }, 600);
        });
        dom.addEvent(window, 'unload', function (e) {
            function sleep(ms) {
                var start = Date.now(),
                    expire = start + ms;
                while (Date.now() < expire);
                return;
            }
            setTimeout(function () {
            }, 100);
        })
    }
}

pointAgent.quick = function () {
    var arg = Array.prototype.slice.call(arguments);
    var arg0 = arg[0];
    var arg1 = arg.slice(1);
    if (typeof arg0 === 'string' && commonWays[arg0]) {
        return commonWays[arg0].apply(this, arg1);
    } else if (typeof arg0 === 'function') {
        arg0.apply(this, arg1);
    } else {
        common.log('quick方法中没有这个功能' + arg[0]);
    }
};

pointAgent.autoTrack = function () {
    commonWays.autoTrack.call(this);
};

/*
 * @param {string} event 事件名
 * @param {string} properties 要发送的事件数据，JSON对象，包含三个属性：properties,subject,object
 * @param {boolean} sendImmediately 是否立即发送
 * */
pointAgent.track = function (event, props, sendImmediately) {
    if (core.check({
        event: event,
        properties: props.properties,
        subject: props.subject,
        object: props.object
    })) {
        var category = eventCategories[event] || 'customize';
        core.send(common.extend({
            action: 'track',
            event: event,
            category: category,
            sly: sendImmediately
        }, props));
    }
};

/*
 * @param {object} properties
 * */
pointAgent.setProfile = function (p) {
    if (core.check({
        propertiesMust: p
    })) {
        core.send({
            action: 'profile_set',
            properties: p
        });
    }
};

pointAgent.setOnceProfile = function (p) {
    if (core.check({
        propertiesMust: p
    })) {
        core.send({
            action: 'profile_set_once',
            properties: p
        });
    }
};

/*
 * @param {object} properties
 * */
pointAgent.appendProfile = function (p) {
    if (core.check({
        propertiesMust: p
    })) {
        common.each(p, function (value, key) {
            if (common.isString(value)) {
                p[key] = [value];
            } else if (common.isArray(value)) {

            } else {
                delete p[key];
                common.log('appendProfile属性的值必须是字符串或者数组');
            }
        });
        if (!common.isEmptyObject(p)) {
            core.send({
                action: 'profile_append',
                properties: p
            });
        }
    }
};

/*
 * @param {object} properties
 * */
pointAgent.incrementProfile = function (p) {
    var str = p;
    if (common.isString(p)) {
        p = {}
        p[str] = 1;
    }
    function isChecked(p) {
        for (var i in p) {
            if (!/-*\d+/.test(String(p[i]))) {
                return false;
            }
        }
        return true;
    }
    if (core.check({
        propertiesMust: p
    })) {
        if (isChecked(p)) {
            core.send({
                action: 'profile_increment',
                properties: p
            });
        } else {
            common.log('profile_increment的值只能是数字');
        }
    }
};

pointAgent.deleteProfile = function () {
    core.send({
        action: 'profile_delete'
    });
    store.set('uniqueId', common.UUID());
};

/*
 * @param {object} properties
 * */
pointAgent.unsetProfile = function (p) {
    var str = p;
    var temp = {};
    if (common.isString(p)) {
        p = [];
        p.push(str);
    }
    if (common.isArray(p)) {
        common.each(p, function (v) {
            if (common.isString(v)) {
                temp[v] = true;
            } else {
                common.log('profile_unset给的数组里面的值必须时string,已经过滤掉', v);
            }
        });
        core.send({
            action: 'profile_unset',
            properties: temp
        });
    } else {
        common.log('profile_unset的参数是数组');
    }
};

/*
 * @param {string} uniqueId
 * */
pointAgent.identify = function (id, isSave) {
    if (typeof id === 'undefined') {
        store.set('uniqueId', common.UUID());
    } else if (core.check({
        uniqueId: id
    })) {
        if (isSave === true) {
            store.set('uniqueId', id);
        } else {
            store.change('uniqueId', id);
        }
    } else {
        common.log('identify的参数必须是字符串');
    }
};

pointAgent.userIdentify = function (id, props, isSave) {
    if (typeof id === 'undefined') {
        // ID为空，则生成一个新的CookieID，用来表示新的将会登录
        store.set('uniqueId', common.UUID());
        store.set('userId', '');
        store.clearSubject();
    } else if (core.check({
        userId: id,
        subject: props
    })) {
        if (isSave === true) {
            store.set('userId', id);
            if (!common.isEmptyObject(props)) {
                store.setSubject(props);
            }
        } else {
            store.change('userId', id);
            store.change('subject', props);
        }
    } else {
        common.log('userIdentify的参数输入有误');
    }
};

/**
 * 追踪注册事件
 * param id 注册的用户ID
 * param event 注册事件名称
 * param props 注册时可收集的用户属性，主体对象，客体对象
 */
pointAgent.trackSignup = function (id, event, props) {
    props = props || {
        subject: {},
        object: {},
        properties: {}
    };
    if (core.check({
        userId: id,
        event: event,
        properties: props.properties || {},
        subject: props.subject || {},
        object: props.object || {}
    })) {
        this.userIdentify(id, props.subject, true);
        core.send({
            action: 'trackSignup',
            event: event,
            properties: props.properties || {},
            subject: props.subject || {},
            object: props.object || {}
        });
    }
};

/*
 * @param {string} testid
 * @param {string} groupid
 * */
pointAgent.trackAbtest = function (t, g) {
    if (core.check({
        test_id: t,
        group_id: g
    })) {
        core.send({
            action: 'trackAbtest',
            properties: {
                test_id: t,
                group_id: g
            }
        });
    }
};

pointAgent.register = function (props) {
    if (core.check({
        properties: props
    })) {
        store.setProps(props);
    } else {
        common.log('register输入的参数有误');
    }
};

pointAgent.registerOnce = function (props) {
    if (core.check({
        properties: props
    })) {
        store.setPropsOnce('props', props);
    } else {
        common.log('registerOnce输入的参数有误');
    }
};

pointAgent.registerSession = function (props) {
    if (core.check({
        properties: props
    })) {
        store.setSessionProps(props);
    } else {
        common.log('registerSession输入的参数有误');
    }
};

pointAgent.registerSessionOnce = function (props) {
    if (core.check({
        properties: props
    })) {
        store.setSessionPropsOnce(props);
    } else {
        common.log('registerSessionOnce输入的参数有误');
    }
};

pointAgent.getSessionId = function () {
    return store.getSessionId();
};

pointAgent.getUtils = function () {
    return common;
};

pointAgent.getUADetector = function () {
    return detector;
};

pointAgent.preInit = function () {

};

pointAgent.inited = function () {
    pointAgent.loaded = true;
};

pointAgent.init = function (config) {
    var that = this;
    that.preInit();
    if (config && !common.isEmptyObject(config)) {
        common.extend(that.config, config);
    }
    if (that._agenti) {
        common.each(that._agenti, function (params) {
            that[params[0]].apply(that, Array.prototype.slice.call(params[1]));
        });
    }
    if (that.config['autoTrack'] === !0) {
        that.autoTrack();
    }
    that.inited();
};

module.exports = pointAgent;