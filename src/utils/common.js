var config = require('../config');
var JSON = require('./json');
var UserAgentDetector = require('../detector/user-agent-detector');

var ArrayProto = Array.prototype,
  ObjProto = Object.prototype,
  slice = ArrayProto.slice,
  toString = ObjProto.toString,
  hasOwnProperty = ObjProto.hasOwnProperty,
  navigator = window.navigator,
  document = window.document,
  userAgent = navigator.userAgent,
  nativeForEach = ArrayProto.forEach,
  nativeIndexOf = ArrayProto.indexOf,
  nativeIsArray = Array.isArray,
  emptyObj = {};

var point = {};

var each = point.each = function (obj, iterator, context) {
  if (obj == null) {
    return false;
  }
  if (nativeForEach && obj.forEach === nativeForEach) {
    obj.forEach(iterator, context);
  } else if (obj.length === +obj.length) {
    for (var i = 0, l = obj.length; i < l; i++) {
      if (i in obj && iterator.call(context, obj[i], i, obj) === emptyObj) {
        return false;
      }
    }
  } else {
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        if (iterator.call(context, obj[key], key, obj) === emptyObj) {
          return false;
        }
      }
    }
  }
};

point.extend = function (obj) {
  each(slice.call(arguments, 1), function (source) {
    for (var prop in source) {
      if (source[prop] !== void 0) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
};

// 加载未包含的属性
point.coverExtend = function (obj) {
  each(slice.call(arguments, 1), function (source) {
    for (var prop in source) {
      if (source[prop] !== void 0 && obj[prop] === void 0) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
};

point.isArray = nativeIsArray || function (obj) {
  return toString.call(obj) === '[object Array]';
};

point.isFunction = function (f) {
  try {
    return /^\s*\bfunction\b/.test(f);
  } catch (x) {
    return false;
  }
};

point.isArguments = function (obj) {
  return !!(obj && hasOwnProperty.call(obj, 'callee'));
};

point.toArray = function (iterable) {
  if (!iterable) {
    return [];
  }
  if (iterable.toArray) {
    return iterable.toArray();
  }
  if (point.isArray(iterable)) {
    return slice.call(iterable);
  }
  if (point.isArguments(iterable)) {
    return slice.call(iterable);
  }
  return point.values(iterable);
};

point.values = function (obj) {
  var results = [];
  if (obj == null) {
    return results;
  }
  each(obj, function (value) {
    results[results.length] = value;
  });
  return results;
};

point.include = function (obj, target) {
  var found = false;
  if (obj == null) {
    return found;
  }
  if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
    return obj.indexOf(target) != -1;
  }
  each(obj, function (value) {
    if (found || (found = (value === target))) {
      return emptyObj;
    }
  });
  return found;
};

point.includes = function (str, needle) {
  return str.indexOf(needle) !== -1;
};

point.arrayFilter = function (array, predicate) {
  var index = -1,
    length = array ? array.length : 0,
    resIndex = 0,
    result = [];
  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
};

point.inherit = function (subclass, superclass) {
  subclass.prototype = new superclass();
  subclass.prototype.constructor = subclass;
  subclass.superclass = superclass.prototype;
  return subclass;
};

point.isObject = function (obj) {
  return toString.call(obj) == '[object Object]';
};

point.isEmptyObject = function (obj) {
  if (point.isObject(obj)) {
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }
  return false;
};

var rTrim = /^\s+|\s+$/;
point.trim = ''.trim ? function (s) {
  return s.trim()
} : function (s) {
  return s.replace(rTrim);
}

point.isUndefined = function (obj) {
  return obj === void 0;
};

point.isString = function (obj) {
  return toString.call(obj) == '[object String]';
};

point.isDate = function (obj) {
  return toString.call(obj) == '[object Date]';
};

point.isBoolean = function (obj) {
  return toString.call(obj) == '[object Boolean]';
};

point.isNumber = function (obj) {
  return (toString.call(obj) == '[object Number]' && /[\d\.]+/.test(String(obj)));
};

point.encodeDates = function (obj) {
  point.each(obj, function (v, k) {
    if (point.isDate(v)) {
      obj[k] = point.formatDate(v);
    } else if (point.isObject(v)) {
      obj[k] = point.encodeDates(v); // recurse
    }
  });
  return obj;
};

point.formatDate = function (date) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
    '.',
    pad(date.getMilliseconds()),
    '+08:00'
  ].join('');
};

point.searchObjDate = function (o) {
  if (point.isObject(o)) {
    point.each(o, function (a, b) {
      if (point.isObject(a)) {
        point.searchObjDate(o[b]);
      } else {
        if (point.isDate(a)) {
          o[b] = point.formatDate(a);
        }
      }
    });
  }
};

// 验证Properties格式
point.validateProperties = function (p) {
  if (!point.isObject(p)) {
    return p;
  }
  point.each(p, function (v, k) {
    // 如果是数组，把值自动转换成string
    if (point.isArray(v)) {
      var temp = [];
      point.each(v, function (arrv) {
        if (point.isString(arrv)) {
          temp.push(arrv);
        } else {
          point.log('您的数据-', v, '的数组里的值必须是字符串,已经将其删除');
        }
      });
      if (temp.length !== 0) {
        p[k] = temp;
      } else {
        delete p[k];
        point.log('已经删除空的数组');
      }
    }
    // 只能是字符串，数字，日期,布尔，数组
    if (!(point.isString(v) || point.isNumber(v) || point.isDate(v) || point.isBoolean(v) || point.isArray(v))) {
      point.log('您的数据-', v, '-格式不满足要求，我们已经将其删除');
      delete p[k];
    }
  });
  return p;
};

point.generateNewProperties = function (p) {
  var ret = {};
  point.each(p, function (v, k) {
    if (point.isString(v) && v.length > 0) {
      ret[k] = v;
    }
  });
  return ret;
};

point.utf8Encode = function (string) {
  string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  var utftext = '',
    start, end;
  var stringl = 0,
    n;
  start = end = 0;
  stringl = string.length;
  for (n = 0; n < stringl; n++) {
    var c1 = string.charCodeAt(n);
    var enc = null;
    if (c1 < 128) {
      end++;
    } else if ((c1 > 127) && (c1 < 2048)) {
      enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
    } else {
      enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
    }
    if (enc !== null) {
      if (end > start) {
        utftext += string.substring(start, end);
      }
      utftext += enc;
      start = end = n + 1;
    }
  }
  if (end > start) {
    utftext += string.substring(start, string.length);
  }
  return utftext;
};

point.detector = UserAgentDetector;

point.base64Encode = function (data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
    ac = 0,
    enc = '',
    tmp_arr = [];
  if (!data) {
    return data;
  }
  data = point.utf8Encode(data);
  do {
    o1 = data.charCodeAt(i++);
    o2 = data.charCodeAt(i++);
    o3 = data.charCodeAt(i++);
    bits = o1 << 16 | o2 << 8 | o3;
    h1 = bits >> 18 & 0x3f;
    h2 = bits >> 12 & 0x3f;
    h3 = bits >> 6 & 0x3f;
    h4 = bits & 0x3f;
    tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
  } while (i < data.length);
  enc = tmp_arr.join('');
  switch (data.length % 3) {
    case 1:
      enc = enc.slice(0, -2) + '==';
      break;
    case 2:
      enc = enc.slice(0, -1) + '=';
      break;
  }
  return enc;
};

point.UUID = (function () {
  var T = function () {
    var d = 1 * new Date(),
      i = 0;
    while (d == 1 * new Date()) {
      i++;
    }
    return d.toString(16) + i.toString(16);
  };
  var R = function () {
    return Math.random().toString(16).replace('.', '');
  };
  var UA = function (n) {
    var ua = userAgent,
      i, ch, buffer = [],
      ret = 0;
    function xor(result, byte_array) {
      var j, tmp = 0;
      for (j = 0; j < byte_array.length; j++) {
        tmp |= (buffer[j] << j * 8);
      }
      return result ^ tmp;
    }
    for (i = 0; i < ua.length; i++) {
      ch = ua.charCodeAt(i);
      buffer.unshift(ch & 0xFF);
      if (buffer.length >= 4) {
        ret = xor(ret, buffer);
        buffer = [];
      }
    }
    if (buffer.length > 0) {
      ret = xor(ret, buffer);
    }
    return ret.toString(16);
  };
  return function () {
    var se = (screen.height * screen.width).toString(16);
    return (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T());
  };
})();

point.getQueryParam = function (url, param) {
  param = param.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
  var regexS = '[\\?&]' + param + '=([^&#]*)',
    regex = new RegExp(regexS),
    results = regex.exec(url);
  if (results === null || (results && typeof (results[1]) !== 'string' && results[1].length)) {
    return '';
  } else {
    return decodeURIComponent(results[1]).replace(/\+/g, ' ');
  }
};

point.concatQueryParam = function (url, paramKey, paramValue) {
  var hash = '';
  if (url.indexOf("#") != -1) {
    hash = url.split("#")[1];
    url = url.split("#")[0];
  }
  if (paramValue == undefined || paramValue == null) {
    paramValue = ""
  }
  var regexS = '[\\?&]' + paramKey + '=([^&#]*)',
    regex = new RegExp(regexS),
    results = regex.exec(url);
  if (results === null || (results && typeof (results[1]) !== 'string' && results[1].length)) {
    if (url.indexOf("?") != -1 || url.indexOf("=") != -1) {
      url = url + "&" + paramKey + "=" + paramValue;
    } else {
      url = url + "?" + paramKey + "=" + paramValue;
    }
  } else {
    url = url.replace(results[0], results[0].replace(results[1], paramValue));
  }
  if (hash != "") {
    url += "#" + hash;
  }
  return url;
};

point.xhr = function (cors) {
  var xhr;
  if (cors) {
    xhr = new XMLHttpRequest;
    xhr = "withCredentials" in xhr ? xhr : "undefined" != typeof XDomainRequest ? new XDomainRequest : t
  }
  if (XMLHttpRequest) xhr = new XMLHttpRequest;
  if (window.ActiveXObject) try {
    xhr = new ActiveXObject("Msxml2.XMLHTTP")
  } catch (ex) {
    try {
      xhr = new ActiveXObject("Microsoft.XMLHTTP")
    } catch (ex) { }
  }
  return !("setRequestHeader" in xhr) && (xhr.setRequestHeader = function () { }), xhr;
};

point.ajax = function (params) {
  function parseJson(params) {
    try {
      return JSON.parse(params)
    } catch (t) {
      return {}
    }
  }
  var xhr = point.xhr(params.cors);
  if (!params.type) {
    params.type = params.data ? "POST" : "GET"
  }
  params = point.extend({
    success: function () { },
    error: function (xhr, textStatus, errorThrown) {
      point.log(xhr.status);
      point.log(xhr.readyState);
      point.log(textStatus);
    },
    complete: function (xhr) { }
  }, params);
  xhr.onreadystatechange = function () {
    if (4 == xhr.readyState) {
      xhr.status >= 200 && xhr.status < 300 || 304 == xhr.status ? params.success(parseJson(xhr.responseText)) : params.error(xhr);
      params.complete(xhr);
      xhr.onreadystatechange && (xhr.onreadystatechange = null);
      xhr.onload && (xhr.onload = null);
    }
  }
  xhr.open(params.type, params.url, params.async === void 0 ? !0 : params.async);
  /*xhr.withCredentials = true;*/
  if (point.isObject(params.header))
    for (var i in params.header) {
      xhr.setRequestHeader(i, params.header[i]);
    }
  if (params.data) {
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    "application/json" === params.contentType ? xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8") : xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  }
  xhr.send(params.data || null);
};

point.log = function () {
  if (!config.debug) return;
  if (typeof console === 'object' && console.log) {
    try {
      console.log.apply(console, arguments);
    } catch (e) {
      console.log(arguments[0]);
    }
  }
};

point.cookie = {
  get: function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) == 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  },
  set: function (name, value, days, crossSubDomain, is_secure) {
    var cdomain = '',
      expires = '',
      secure = '';
    days = typeof days === 'undefined' ? 730 : days;
    if (crossSubDomain) {
      var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
        domain = matches ? matches[0] : '';
      cdomain = ((domain) ? '; domain=.' + domain : '');
    }
    if (days !== 0) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toGMTString();
    }
    if (is_secure) {
      secure = '; secure';
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
  },

  remove: function (name, crossSubDomain) {
    point.cookie.set(name, '', -1, crossSubDomain);
  }
};

// 本地缓冲器
point.localStorage = {
  get: function (name) {
    return window.localStorage.getItem(name);
  },
  parse: function (name, defaultValue) {
    var storedValue = defaultValue;
    try {
      var value = point.localStorage.get(name);
      storedValue = JSON.parse(value) || defaultValue || {};
    } catch (err) { }
    return storedValue;
  },
  set: function (name, value) {
    if (point.isArray(value) || point.isObject(value)) {
      value = JSON.stringify(value);
    }
    window.localStorage.setItem(name, value);
  },
  remove: function (name) {
    window.localStorage.removeItem(name);
  }
};

point.info = {
  campaignParams: function () {
    var campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' '),
      kw = '',
      params = {};
    point.each(campaign_keywords, function (kwkey) {
      kw = point.getQueryParam(location.href, kwkey);
      if (kw.length) {
        params[kwkey] = kw;
      }
    });
    return params;
  },
  searchEngine: function (referrer) {
    if (referrer.search('https?://(.*)google.([^/?]*)') === 0) {
      return 'google';
    } else if (referrer.search('https?://(.*)bing.com') === 0) {
      return 'bing';
    } else if (referrer.search('https?://(.*)yahoo.com') === 0) {
      return 'yahoo';
    } else if (referrer.search('https?://(.*)duckduckgo.com') === 0) {
      return 'duckduckgo';
    } else if (referrer.search('https?://(.*)sogou.com') === 0) {
      return 'sogou';
    } else if (referrer.search('https?://(.*)so.com') === 0) {
      return '360so';
    } else {
      return null;
    }
  },
  browser: function (user_agent, vendor, opera) {
    var vendor = vendor || '';
    if (opera || point.includes(user_agent, " OPR/")) {
      if (point.includes(user_agent, "Mini")) {
        return "Opera Mini";
      }
      return "Opera";
    } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
      return 'BlackBerry';
    } else if (point.includes(user_agent, "IEMobile") || point.includes(user_agent, "WPDesktop")) {
      return "Internet Explorer Mobile";
    } else if (point.includes(user_agent, "Edge")) {
      return "Microsoft Edge";
    } else if (point.includes(user_agent, "FBIOS")) {
      return "Facebook Mobile";
    } else if (point.includes(user_agent, "Chrome")) {
      return "Chrome";
    } else if (point.includes(user_agent, "CriOS")) {
      return "Chrome iOS";
    } else if (point.includes(vendor, "Apple")) {
      if (point.includes(user_agent, "Mobile")) {
        return "Mobile Safari";
      }
      return "Safari";
    } else if (point.includes(user_agent, "Android")) {
      return "Android Mobile";
    } else if (point.includes(user_agent, "Konqueror")) {
      return "Konqueror";
    } else if (point.includes(user_agent, "Firefox")) {
      return "Firefox";
    } else if (point.includes(user_agent, "MSIE") || point.includes(user_agent, "Trident/")) {
      return "Internet Explorer";
    } else if (point.includes(user_agent, "Gecko")) {
      return "Mozilla";
    } else {
      return "";
    }
  },
  browserVersion: function (userAgent, vendor, opera) {
    var browser = point.info.browser(userAgent, vendor, opera);
    var versionRegexs = {
      "Internet Explorer Mobile": /rv:(\d+(\.\d+)?)/,
      "Microsoft Edge": /Edge\/(\d+(\.\d+)?)/,
      "Chrome": /Chrome\/(\d+(\.\d+)?)/,
      "Chrome iOS": /Chrome\/(\d+(\.\d+)?)/,
      "Safari": /Version\/(\d+(\.\d+)?)/,
      "Mobile Safari": /Version\/(\d+(\.\d+)?)/,
      "Opera": /(Opera|OPR)\/(\d+(\.\d+)?)/,
      "Firefox": /Firefox\/(\d+(\.\d+)?)/,
      "Konqueror": /Konqueror:(\d+(\.\d+)?)/,
      "BlackBerry": /BlackBerry (\d+(\.\d+)?)/,
      "Android Mobile": /android\s(\d+(\.\d+)?)/,
      "Internet Explorer": /(rv:|MSIE )(\d+(\.\d+)?)/,
      "Mozilla": /rv:(\d+(\.\d+)?)/
    };
    var regex = versionRegexs[browser];
    if (regex == undefined) {
      return null;
    }
    var matches = userAgent.match(regex);
    if (!matches) {
      return null;
    }
    return String(parseFloat(matches[matches.length - 2]));
  },
  os: function () {
    var a = userAgent;
    if (/Windows/i.test(a)) {
      if (/Phone/.test(a)) {
        return 'Windows Mobile';
      }
      return 'Windows';
    } else if (/(iPhone|iPad|iPod)/.test(a)) {
      return 'iOS';
    } else if (/Android/.test(a)) {
      return 'Android';
    } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
      return 'BlackBerry';
    } else if (/Mac/i.test(a)) {
      return 'Mac OS X';
    } else if (/Linux/.test(a)) {
      return 'Linux';
    } else {
      return '';
    }
  },
  device: function (user_agent) {
    if (/iPad/.test(user_agent)) {
      return 'iPad';
    } else if (/iPod/i.test(user_agent)) {
      return 'iPod';
    } else if (/iPhone/i.test(user_agent)) {
      return 'iPhone';
    } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
      return 'BlackBerry';
    } else if (/Windows Phone/i.test(user_agent)) {
      return 'Windows Phone';
    } else if (/Windows/i.test(user_agent)) {
      return 'Windows';
    } else if (/Macintosh/i.test(user_agent)) {
      return 'Macintosh';
    } else if (/Android/i.test(user_agent)) {
      return 'Android';
    } else if (/Linux/i.test(user_agent)) {
      return 'Linux';
    } else {
      return '';
    }
  },
  referringDomain: function (referrer) {
    var split = referrer.split('/');
    if (split.length >= 3) {
      return split[2];
    }
    return '';
  },
  // 缓冲临时变量，只针对当前页面有效
  currentProps: {},
  register: function (obj) {
    point.extend(point.info.currentProps, obj);
  },
  // 缓冲临时Subject，只针对当前页面有效
  currentSubject: {},
  registerSubject: function (sbj) {
    point.extend(point.info.currentSubject, sbj);
  },
  // 缓冲临时Object，只针对当前页面有效
  currentObject: {},
  registerObject: function (obj) {
    point.extend(point.info.currentObject, obj);
  }
};

/**
 * 查询url的search或hash字段
 * @param {string} query 查询URL的Key
 * @param {string} url 要匹配的URL
 * @param {boolean} undecode 是否通过uneacape解码
 * @param {boolean} isHash 查询的是否是Hash部分
 * @return 返回匹配结果
 */
point.urlQueryString = function (query, url, undecode, isHash) {
  var search, index;
  if (!url || typeof url !== 'string') {
    url = window.location[isHash ? 'hash' : 'search'];
  }
  index = url.indexOf(isHash ? '#' : '?');
  if (index < 0) {
    return null;
  }
  search = "&" + url.slice(index + 1);
  return search && new RegExp("&" + query + "=([^&#]*)").test(search) ?
    undecode ? RegExp.$1 : unescape(RegExp.$1) :
    null;
};

module.exports = point;