'use strict';

var gulp = require('gulp');
var clean = require('gulp-clean');
var cleanCss = require('gulp-clean-css');
var less = require('gulp-less');
var minify = require('gulp-minify');
var zip = require('gulp-zip');
var crx = require('gulp-crx-pack');
var sequence = require('run-sequence');
var fs = require('fs');

gulp.task('clean', function() {
	return gulp.src('./build/*', {read: false})
		.pipe(clean());
});

gulp.task('clean-directories', function() {
	gulp.src('./build/chrome/*', {read: false})
		.pipe(clean());
    gulp.src('./build/edge/*', {read: false})
		.pipe(clean());
    gulp.src('./build/firefox/*', {read: false})
		.pipe(clean());
    return gulp.src('./build/global/*', {read: false})
		.pipe(clean());
});

gulp.task('copy-global', function() {
	return gulp.src(['./src/**', '!./src/img/src/**', '!./src/img/icon_old.png', '!./src/css/src/**', '!./src/css/*.less', '!./src/css/content_old.css'])
        .pipe(gulp.dest('./build/global/'));
});

gulp.task('compile-less', function () {
    return gulp.src('./src/css/*.less')
        .pipe(less())
        .pipe(gulp.dest('./build/global/css/'));
});

gulp.task('compress-css', function () {
    return gulp.src('./build/global/css/*.css')
        .pipe(cleanCss())
        .pipe(gulp.dest('./build/global/css/'));
});

gulp.task('compress-js', function () {
    return gulp.src('./build/global/js/*.js')
        .pipe(minify({
            ext:{
                min:'.js'
            },
            noSource: true,
            ignoreFiles: ['*.min.js', '*-min.js']
        }))
        .pipe(gulp.dest('./build/global/js/'));
});

gulp.task('copyChrome', function() {
	return gulp.src(['./build/global/**', './manifests/chrome/**/*'])
        .pipe(gulp.dest('./build/chrome/'));
});

gulp.task('copyEdge', function() {
    return gulp.src(['./build/global/**', './manifests/edge/*'])
        .pipe(gulp.dest('./build/edge/'));
});

gulp.task('copyFirefox', function() {
    return gulp.src(['./build/global/**', './manifests/firefox/**/*'])
        .pipe(gulp.dest('./build/firefox/'));
});

gulp.task('build', function() {
	var manifestChrome = require('./manifests/chrome/manifest.json'),
	    manifestEdge = require('./manifests/edge/manifest.json'),
	    manifestFirefox = require('./manifests/firefox/manifest.json'),
		distFileName = manifestChrome.name + ' v' + manifestChrome.version;
    var codebase = manifestChrome.codebase;
    gulp.src("build/firefox/**/**/*")
        .pipe(zip(distFileName + '.xpi'))
        .pipe(gulp.dest('./build'));
    gulp.src("build/edge/**/**/*")
        .pipe(zip(distFileName + ' Edge' +'.zip'))
        .pipe(gulp.dest('./build'));
    gulp.src("build/chrome/**/**/*")
        .pipe(zip(distFileName + ' Opera' +'.zip'))
        .pipe(gulp.dest('./build'));
    return gulp.src('./build/chrome/')
        .pipe(crx({
          privateKey: fs.readFileSync('./key/key.pem', 'utf8'),
          filename: manifestChrome.name + ' v' + manifestChrome.version + '.crx',
          codebase: codebase,
        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('build-dev', function() {
    sequence('clean', 'copy-global', 'compile-less', 'copyChrome', 'copyEdge', 'copyFirefox', 'build', 'clean-directories');
});

gulp.task('default', ['build-dev']);

gulp.task('build-prod', function() {
    sequence('clean', 'copy-global', 'compile-less', 'compress-css', 'compress-js', 'copyChrome', 'copyEdge', 'copyFirefox', 'build', 'clean-directories');
});

gulp.task('build-prod-no-js-compress', function() {
    sequence('clean', 'copy-global', 'compile-less', 'compress-css', 'copyChrome', 'copyEdge', 'copyFirefox', 'build', 'clean-directories');
});

gulp.task('build-prod-no-css-compress', function() {
    sequence('clean', 'copy-global', 'compile-less', 'compress-js', 'copyChrome', 'copyEdge', 'copyFirefox', 'build', 'clean-directories');
});

gulp.task('clean-build', ['clean']);
