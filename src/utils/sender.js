/**
 * 数据发送器
 * 所有大写的变量名不可修改！！！
 */
var config = require('../config');
var common = require('./common');
var store = require('./store');
var dom = require('../detector/dom-detector');
var detector = require('../detector/user-agent-detector');

var _linkButton = /^(A|BUTTON)$/;

var localState = {
    state: {
    },
    get: function (key) {
      return key ? this.state[key] : this.state;
    },
    set: function (key, value) {
      this.state[key] = value;
    }
};

var sendData = {
    // 获取当前页面停留时间-秒
    getStayTime: function() {
        return ((new Date()) - config.loadTime) / 1000;
    },
    // 获取系统信息
    getComProperties: function() {
        var h1s = document.body && document.body.getElementsByTagName('h1');
        var OS_NAME = detector.os.name,
            OS_FULLVERSION = detector.os.fullVersion,
            DEVICE_NAME = detector.device.name,
            DEVICE_FULLVERSION = detector.device.fullVersion,
            SCREEN_HEIGHT = screen.height,
            SCREEN_WIDTH = screen.width,
            DOC_TITLE = document.title,
            PAGEH1 = '',
            DOC_REFERRER = document.referrer,
            LOCATION_HREF = location.href,
            LOCATION_PATH = location.pathname,
            LIB_VERSION = config.LIB_VERSION,
            BROWSER_NAME = detector.browser.name,
            BROWSER_VERSION = String(detector.browser.version);
        if (h1s && h1s.length && h1s.length > 0) {
            PAGEH1 = h1s[0].innerText || h1s.textContent || '';
        }
        return common.extend({
            b_dollar_os: OS_NAME,
            b_dollar_os_version: OS_FULLVERSION,
            b_dollar_device: DEVICE_NAME,
            b_dollar_device_version: DEVICE_FULLVERSION,
            b_dollar_screen_height: SCREEN_HEIGHT,
            b_dollar_screen_width: SCREEN_WIDTH,
            b_dollar_page_title: DOC_TITLE,
            b_dollar_page_h1: PAGEH1,
            b_dollar_page_referrer: DOC_REFERRER,
            b_dollar_page_url: LOCATION_HREF,
            b_dollar_page_url_path: LOCATION_PATH,
            b_dollar_lib: 'js',
            b_dollar_lib_version: LIB_VERSION,
            b_dollar_browser: BROWSER_NAME,
            b_dollar_browser_version: BROWSER_VERSION
        });
    },
    // 获取不同元素点击事件的数据
    getClickPreset: function(e) {
        var e = e || (e = window.event);
        var target = e.target || e.srcElement,
            aTarget, tarEvent, preset;
        aTarget = dom.iAncestorTag(target, _linkButton) || target;
        tarEvent = dom.checkTarEvent(aTarget);
        var DOMPATH = dom.getDomSelector(aTarget), // 获取DOM Selector
            OFFSET_X = dom.getDomEventOffset(e, aTarget).offsetX,
            OFFSET_Y = dom.getDomEventOffset(e, aTarget).offsetY,
            DOMSIZE_WIDTH = dom.getDomSize(aTarget).width,
            DOMSIZE_HEIGHT = dom.getDomSize(aTarget).height,
            TYPE = aTarget.type || '', // 类型
            TEXT = common.trim(dom.innerText(aTarget)) || aTarget.value || '', // 按钮文字
            HREF = aTarget.href || '', // 链接地址
            NAME = aTarget.getAttribute('name') || '', // 按钮name
            VALUE = aTarget.getAttribute('value') || '',
            CLIENT_X = e.clientX,
            CLIENT_Y = e.clientY;
        if (tarEvent == 'btn_click') {
            preset = {
                event: 'btn_click',
                category: 'click',
                properties: {
                    b_dom_path: DOMPATH,
                    b_offset_x: OFFSET_X,
                    b_offset_y: OFFSET_Y,
                    b_dom_width: DOMSIZE_WIDTH,
                    b_dom_height: DOMSIZE_HEIGHT,
                    b_btn_type: TYPE,
                    b_btn_text: TEXT,
                    b_btn_name: NAME,
                    b_btn_value: VALUE,
                    b_clientX: CLIENT_X,
                    b_clientY: CLIENT_Y
                }
            }
        } else if (tarEvent == 'link_click') {
            preset = {
                event: 'link_click',
                category: 'click',
                properties: {
                    b_dom_path: DOMPATH,
                    b_offset_x: OFFSET_X,
                    b_offset_y: OFFSET_Y,
                    b_dom_width: DOMSIZE_WIDTH,
                    b_dom_height: DOMSIZE_HEIGHT,
                    b_link_url: HREF,
                    b_link_text: TEXT,
                    b_clientX: CLIENT_X,
                    b_clientY: CLIENT_Y
                }
            }
        } else if (tarEvent == 'element_click') {
            preset = {
                event: 'element_click',
                category: 'click',
                properties: {
                    b_dom_path: DOMPATH,
                    b_offset_x: OFFSET_X,
                    b_offset_y: OFFSET_Y,
                    b_dom_width: DOMSIZE_WIDTH,
                    b_dom_height: DOMSIZE_HEIGHT,
                    b_clientX: CLIENT_X,
                    b_clientY: CLIENT_Y
                }
            };
        }
        return preset;
    },
    // 获取页面加载时间
    getLoadTime: function() {
        var PAGELOADTIME = sendData.getStayTime();
        localState.set('pageLoadTime', PAGELOADTIME);
        return {
            event: 'view_page',
            properties: {
                b_page_load_time: PAGELOADTIME
            }
        }
    },
    // 获取离开页面属性
    getLeavePage: function() {
        var PAGELOADTIME = localState.get('pageLoadTime'),
            PAGESTAYTIME = sendData.getStayTime(),
            PAGEWIDTH = dom.getPageSize().PageWidth,
            PAGEHEIGHT = dom.getPageSize().PageHeight,
            SCROLL_X = dom.getPageScroll().X,
            SCROLL_Y = dom.getPageScroll().Y;
        return {
            event: 'leave_page',
            properties: {
                b_page_load_time: PAGELOADTIME,
                b_page_stay_time: PAGESTAYTIME,
                b_page_height: PAGEHEIGHT,
                b_page_width: PAGEWIDTH,
                b_scrollX: SCROLL_X,
                b_scrollY: SCROLL_Y
            }
        }
    },
    // 获取事件对应的category
    getEventCategory: function (){
        return {
            'element_click': 'click',
            'link_click': 'click',
            'btn_click': 'click',
            'view_page': 'load',
            'leave_page': 'load'
        }
    },
    // 屏幕方向变化时获在取屏幕方向
    getChangeOrient: function(orient) {
        // 参数为横屏'landscape'、竖屏'portrait'，参数名不可修改，切记！！！
        return {
            b_dollar_screen_orientation: orient
        }
    },
    // 获取屏幕方向
    getSendOrient: function (){
        // 以下大写的变量名不可修改，切记！！！
        var ORIENTATION = window.screen.msOrientation || (window.screen.orientation ? window.screen.orientation.type : 'unspecified');
        return {
            b_dollar_screen_orientation: ORIENTATION
        }
    },
    mergeData: function(props) {
        var data = {
            properties: {},
            subject: {},
            object: {}
        };
        var orientationPropery;
        common.extend(data, props);
        if (common.isObject(props.properties) && !common.isEmptyObject(props.properties)) {
            common.extend(data.properties, props.properties);
        }
        if (common.isObject(props.subject) && !common.isEmptyObject(props.subject)) {
            common.extend(data.subject, props.subject);
        }
        if (common.isObject(props.object) && !common.isEmptyObject(props.object)) {
            common.extend(data.object, props.object);
        }
        // profile时不传公用属性
        if (!props.action || props.action.slice(0, 7) !== 'profile') {
            orientationPropery = sendData.getSendOrient();
            // 优先级：系统默认属性<本页设置的属性<session属性<全局存储属性<事件属性
            common.extend(data.properties,orientationPropery, store.getProps(), store.getSessionProps(), common.info.currentProps, sendData.getComProperties());
            common.extend(data.subject, store.getSubject(), store.getSessionSubject(), common.info.currentSubject);
            common.extend(data.object, store.getObject(), store.getSessionObject(), common.info.currentObject);
        }
        data.time = common.formatDate(new Date());
        common.searchObjDate(data);
        return data;
    }
};

module.exports = sendData;