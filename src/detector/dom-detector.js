var HTML = document.documentElement;

var dom = {
    /**
     * 元素注册事件
     * elem {DOMElement}
     * eventType {String}
     * fn {Function}
     */
    addEvent: window.addEventListener ? function (elem, eventType, fn) {
        elem.addEventListener(eventType, fn, true);
    } : function (elem, eventType, fn) {
        elem.attachEvent('on' + eventType, fn);
    },

    // 标签内的文字内容
    innerText: 'innerText' in HTML ? function (elem) {
        return elem.innerText
    } : function (elem) {
        return elem.textContent
    },

    /**
     * 从一个元素自身开始，向上查找一个匹配指定标签的元素
     * elem {DOMElement}
     * tagName {String}
     * root {DOMElement} 可指定的根元素
     * return {DOMElement|undefined}
     */
    iAncestorTag: function (elem, tagName, root) {
        tagName.test || (tagName = tagName.toUpperCase());
        root || (root = document);
        do {
            if (tagName.test ? tagName.test(elem.tagName) : elem.tagName === tagName) return elem;
        }
        while (elem !== root && (elem = elem.parentNode));
    },

    // 检查目标点事件上类型
    checkTarEvent: function (target) {
        var _tagName = (target.tagName).toUpperCase();
        if (_tagName == 'INPUT') {
            if ((target.type).toUpperCase() == 'BUTTON' || (target.type).toUpperCase() == 'IMAGE' || (target.type).toUpperCase() == 'SUBMIT' || (target.type).toUpperCase() == 'RESET') {
                return 'btn_click';
            } else {
                return 'element_click';
            }
        } else if (_tagName == 'BUTTON') {
            return 'btn_click';
        } else if (_tagName == 'A') {
            return 'link_click';
        } else {
            return 'element_click';
        }
    },

    //页面位置及窗口大小
    getPageSize: function () {
        var scrW, scrH;
        if (window.innerHeight && window.scrollMaxY) { // Mozilla
            scrW = window.innerWidth + window.scrollMaxX;
            scrH = window.innerHeight + window.scrollMaxY;
        } else if (document.body.scrollHeight > document.body.offsetHeight) { // all but IE Mac
            scrW = document.body.scrollWidth;
            scrH = document.body.scrollHeight;
        } else
            if (document.body) { // IE Mac
                scrW = document.body.offsetWidth;
                scrH = document.body.offsetHeight;
            }
        var winW, winH;
        if (window.innerHeight) { // all except IE
            winW = window.innerWidth;
            winH = window.innerHeight;
        } else if (document.documentElement &&
            document.documentElement.clientHeight) { // IE 6 Strict Mode
            winW = document.documentElement.clientWidth;
            winH = document.documentElement.clientHeight;
        } else if (document.body) { //other
            winW = document.body.clientWidth;
            winH = document.body.clientHeight;
        }
        var pageW = (scrW < winW) ? winW : scrW;
        var pageH =
            (scrH < winH) ? winH : scrH;
        return {
            PageWidth: pageW,
            PageHeight: pageH,
            WinWidth: winW,
            WinHeight: winH
        };
    },

    //滚动条位置
    getPageScroll: function () {
        var x, y;
        if (window.pageYOffset) { // all except IE
            y = window.pageYOffset;
            x = window.pageXOffset;
        } else
            if (document.documentElement && document.documentElement.scrollTop) {
                // IE 6 Strict
                x = document.documentElement.scrollLeft;
                y = document.documentElement.scrollTop;
            } else if (document.body) { // all
                //other IE
                x = document.body.scrollLeft;
                y = document.body.scrollTop;
            }
        return {
            X: x,
            Y: y
        };
    },

    // 获取dom结构
    getDomSelector: function (dom) {
        var nodeType = dom.nodeName.toLowerCase();
        if (nodeType == "body" || nodeType == "html") return "body";
        else {
            var parent = dom.parentNode;
            if (dom.getAttribute("id")) return this.getDomSelector(parent) + ">#" + dom.getAttribute("id");
            else if ((nodeType == "input" || nodeType == "select" || nodeType == "textarea" || nodeType == "button") && dom.getAttribute("name")) {
                return this.getDomSelector(parent) + ">" + nodeType + ":input[name='" + dom.getAttribute("name") + "']";
            }
            for (var e = [], d = 0; d < parent.children.length; d++) {
                var f = parent.children[d];
                f.nodeName && f.nodeName.toLowerCase() == nodeType && e.push(f)
            }
            for (d = 0; d < e.length; d++)
                if (e[d] == dom) {
                    return this.getDomSelector(parent) + ">" + nodeType + ":eq(" + d + ")"
                }
        }
    },

    /**
     * 获取事件发生时坐标相对于事件源的相对位置
     */
    getDomEventOffset: function (e, target) {
        var offset = {};
        if (e.offsetX && e.offsetY) {
            offset.offsetX = e.offsetX;
            offset.offsetY = e.offsetY;
        } else {
            var box = target.getBoundingClientRect();
            offset.offsetX = e.clientX - box.left;
            offset.offsetY = e.clientY - box.top;
        }
        return offset;
    },

    /**
     * 获取元素大小
     */
    getDomSize: function (dom) {
        var size = {};
        size.width = dom.offsetWidth;
        size.height = dom.offsetHeight;
        return size;
    }

};

module.exports = dom;