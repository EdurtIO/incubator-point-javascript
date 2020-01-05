var agent = require('./utils/common');
var config = require('./config');
var JSON = require('./utils/json');
var detector = require('./detector/user-agent-detector');
var dom = require('./detector/dom-detector');

var pointAgent = {};
pointAgent._ = agent;
pointAgent.config = config;

var commonWays = {
    /**
     * 事件自动追踪
     */
    autoTrack: function () {
        var that = this;
        var compaignParams = agent.info.campaignParams();
        // 注册load事件是为了获取到页面资源加载完成时间
        dom.addEvent(window, 'load', function () {
            var loadProper = {
                event: 'view_page',
                properties: {
                    b_page_load_time: ((new Date()) - config.loadTime) / 1000
                }
            }
            var properties = agent.extend(loadProper.properties, compaignParams);
            that.track(loadProper.event, {
                properties: properties,
                subject: {},
                object: {}
            });
            // _.log('页面加载时间：' + loadTime);
        });
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
        agent.log('quick方法中没有这个功能' + arg[0]);
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
        agent.each(p, function (value, key) {
            if (agent.isString(value)) {
                p[key] = [value];
            } else if (agent.isArray(value)) {

            } else {
                delete p[key];
                agent.log('appendProfile属性的值必须是字符串或者数组');
            }
        });
        if (!agent.isEmptyObject(p)) {
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
    if (agent.isString(p)) {
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
            agent.log('profile_increment的值只能是数字');
        }
    }
};

pointAgent.deleteProfile = function () {
    core.send({
        action: 'profile_delete'
    });
    store.set('uniqueId', agent.UUID());
};

/*
 * @param {object} properties
 * */
pointAgent.unsetProfile = function (p) {
    var str = p;
    var temp = {};
    if (agent.isString(p)) {
        p = [];
        p.push(str);
    }
    if (agent.isArray(p)) {
        agent.each(p, function (v) {
            if (agent.isString(v)) {
                temp[v] = true;
            } else {
                agent.log('profile_unset给的数组里面的值必须时string,已经过滤掉', v);
            }
        });
        core.send({
            action: 'profile_unset',
            properties: temp
        });
    } else {
        agent.log('profile_unset的参数是数组');
    }
};

/*
 * @param {string} uniqueId
 * */
pointAgent.identify = function (id, isSave) {
    if (typeof id === 'undefined') {
        store.set('uniqueId', agent.UUID());
    } else if (core.check({
        uniqueId: id
    })) {
        if (isSave === true) {
            store.set('uniqueId', id);
        } else {
            store.change('uniqueId', id);
        }
    } else {
        agent.log('identify的参数必须是字符串');
    }
};

pointAgent.userIdentify = function (id, props, isSave) {
    if (typeof id === 'undefined') {
        // ID为空，则生成一个新的CookieID，用来表示新的将会登录
        store.set('uniqueId', agent.UUID());
        store.set('userId', '');
        store.clearSubject();
    } else if (core.check({
        userId: id,
        subject: props
    })) {
        if (isSave === true) {
            store.set('userId', id);
            if (!agent.isEmptyObject(props)) {
                store.setSubject(props);
            }
        } else {
            store.change('userId', id);
            store.change('subject', props);
        }
    } else {
        agent.log('userIdentify的参数输入有误');
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
        agent.log('register输入的参数有误');
    }
};

pointAgent.registerOnce = function (props) {
    if (core.check({
        properties: props
    })) {
        store.setPropsOnce('props', props);
    } else {
        agent.log('registerOnce输入的参数有误');
    }
};

pointAgent.registerSession = function (props) {
    if (core.check({
        properties: props
    })) {
        store.setSessionProps(props);
    } else {
        agent.log('registerSession输入的参数有误');
    }
};

pointAgent.registerSessionOnce = function (props) {
    if (core.check({
        properties: props
    })) {
        store.setSessionPropsOnce(props);
    } else {
        agent.log('registerSessionOnce输入的参数有误');
    }
};

pointAgent.getSessionId = function () {
    return store.getSessionId();
};

pointAgent.getUtils = function () {
    return agent;
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
    if (config && !agent.isEmptyObject(config)) {
        agent.extend(that.config, config);
    }
    
    if (that._agenti) {
        agent.each(that._agenti, function (params) {
            that[params[0]].apply(that, Array.prototype.slice.call(params[1]));
        });
    }
    if (that.config['autoTrack'] === !0) {
        that.autoTrack();
    }
    that.inited();
};
module.exports = pointAgent;