var path = require('path');

// 引入配置信息
var config = require('./config');

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      basePath: '.',
      srcPath: 'src'
    },
    banner: '/*!  */\n',
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      sdk: {
        src: 'dist/' + config.point.name + config.point.subfix,
        dest: 'dist/' + config.point.nameMin + config.point.subfix
      }
    },
    shell: {
      createSDK: {
        command: [
          'cd src',
          'browserify main.js > ../dist/' + config.point.name + config.point.subfix
        ].join('&&')
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  /**
   * 创建Common SDK包
   */
  grunt.registerTask('sdk', ['shell:createSDK', 'uglify:sdk']);

};