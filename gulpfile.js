// gulp
var gulp = require('gulp');

// plugins
var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-clean');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var embedlr = require('gulp-embedlr'),
    refresh = require('gulp-livereload'),
    livereloadport = 35729,
    serverport = 5000;

var glove = require('./app.js');


// tasks
gulp.task('lint', function() {
    gulp.src(['./app/**/*.js', '!./app/bower_components/**'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});
gulp.task('clean', function() {
    gulp.src('./dist/*')
        .pipe(clean({force: true}));
    gulp.src('./app/js/bundled.js')
        .pipe(clean({force:true}));
});
gulp.task('minify-css', function() {
    var opts = {comments:true,spare:true};
    gulp.src(['./app/**/*.css', '!./app/bower_components/**'])
        .pipe(minifyCSS(opts))
        .pipe(gulp.dest('./dist/'))
});
gulp.task('minify-js', function() {
    gulp.src(['./app/**/*.js', '!./app/bower_components/**'])
        .pipe(uglify({
            // inSourceMap:
            // outSourceMap: "app.js.map"
        }))
        .pipe(gulp.dest('./dist/'))
});
gulp.task('copy-bower-components', function() {
    gulp.src('./app/bower_components/**')
        .pipe(gulp.dest('dist/bower_components'));
});
gulp.task('copy-html-files', function() {
    gulp.src('./app/**/*.html')
        .pipe(gulp.dest('dist/'));
});
gulp.task('browserify', function() {
    gulp.src(['app/js/main.js'])
        .pipe(browserify({
            insertGlobals: true,
            debug: true
        }))
        .pipe(concat('bundled.js'))
        .pipe(gulp.dest('./app/js'))
});
gulp.task('watch', ['lint'], function() {
    gulp.watch(['./app/js/*.js', './app/js/**/*.js'], [
        'browserify'
    ]);
});


gulp.task('express', function() {
    var express = require('express');
    var app = express();
    app.use(require('connect-livereload')({port:4002}));
    app.use(express.static(__dirname + '/app'));


    // ROUTES FOR API
    // ========================
    var router = express.Router();

    // middleware to use for all requests
    router.use(function(req,res, next) {
        // logging
        console.log('api working...');
        next(); // move to next routes
    });

    router.get('/', function(req, res) {
        res.json({ message:'api is up' });
    });

    router.get('/sendTestData', function(req, res) {
        glove.parser.write(new Buffer([0x08, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
        res.json({ message: 'test data sent' });
    });

    app.use('/api', router);
    var server = app.listen(4000);

    // Set up socket.io
    var io = require('socket.io').listen(server);
    
    console.log('Express running');
});

var tinylr;
gulp.task('livereload', function() {
    tinylr = require('tiny-lr')();
    tinylr.listen(4002);
});

// default task
gulp.task('default',
    ['express', 'livereload', 'browserify', 'watch'] , function() {

});



