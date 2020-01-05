module.exports = {
    version: '0.1.0',
    key: 'POINTAGENT',//与SDK安装时的Key对应
    limit: 10, // 发送限制，多于当前设置条数，就会发送事件
    crossDomain: true, // 是否跨域
    loadTime: new Date(),// SDK加载时间
    remoteHost: '', // 远程数据服务接收地址
    appToken: 'pointAgent', // 应用授权密钥
    debug: false // 打印log日志
};
