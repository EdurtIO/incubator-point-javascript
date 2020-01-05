var child_process = require('child_process');

var point = {};

/**
 * 打包SDK
 */
point.build = function () {
  point.package();
}

point.package = function () {
  console.log('package sdk starting ...');
  child_process.execSync("grunt sdk", function (err, stdout, stderr) {
    if (err) {
      console.log('get error:' + stderr);
    } else {
      console.log(stdout);
    }
  });
  console.log('package sdk success!!!');
}

module.exports = point;