var point = require('./utils/common');
var pointAgent = require('./point-agent');

var defaultConfig = {
  limit: 10, 
  crossDomain: true,
  loadTime: new Date(),// SDK加载时间
  remoteHost: '', // 远程数据服务接收地址
  appToken: '', // 应用授权密钥
  debug: false, // 打印log日志
  autoTrack: true // 是否自动回调
};

var agent = window[pointAgent.config.key] || pointAgent.config.key;

if (agent) {
  agent = window[agent];
}

if (agent.para) {
  point.extend(defaultConfig, agent.para);
}

defaultConfig.loadTime = agent.lt || 1 * new Date;

point.extend(agent, pointAgent);

agent.init(defaultConfig);