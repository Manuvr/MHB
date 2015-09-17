'use strict'

var gulp = require('gulp');
var path = require('path');
var webpack = require('webpack');
var gutil = require('gulp-util');

var webpackConfig = require('./webpack.config');

gulp.task('default', ['build']);

gulp.task('build', ['serve'], function(cb) {
  webpack(webpackConfig, function(err){
    gutil.log('webpack built');
    cb(err);
  });
});

gulp.task('serve', function(cb) {

  // TODO: Setup to run express
  var started = false;
  var cp = require('child_process');

});
