var args = process.argv.splice(0);
process.env.ENV = args[2];

var point = require('./bin/point');

point.build();

process.exit();