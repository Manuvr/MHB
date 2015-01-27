var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var nodemon = require('gulp-nodemon');


// tasks
gulp.task('lint', function() {
    var jshint = require('gulp-jshint');
    gulp.src(['./app/**/*.js', '!./app/bower_components/**'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});
gulp.task('browser-sync', function() {
    browserSync({
        proxy: "http://localhost:4000"
    });
});
gulp.task('nodemon', function (cb) {
    var called = false;
    return nodemon({
        script: 'main.js'
    }).on('start', function() {
            cb();
    });
});

gulp.task('default',['lint', 'browser-sync'] , function() {
});

