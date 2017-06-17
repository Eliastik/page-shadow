'use strict';

var gulp = require('gulp');
var clean = require('gulp-clean');
var zip = require('gulp-zip');
var crx = require('gulp-crx-pack');
var sequence = require('run-sequence');
var fs = require('fs');

gulp.task('clean', function() {
	return gulp.src('build/*', {read: false})
		.pipe(clean());
});

gulp.task('copyChrome', function() {
	return gulp.src(['./src/**', './manifests/chrome/**/*'])
        .pipe(gulp.dest('./build/chrome/'));
});

gulp.task('copyEdge', function() {
    return gulp.src(['./src/**', './manifests/edge/*'])
        .pipe(gulp.dest('./build/edge/'));
});

gulp.task('copyFirefox', function() {
    return gulp.src(['./src/**', './manifests/firefox/**/*'])
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

gulp.task('default', function() {
    sequence('clean', 'copyChrome', 'copyEdge', 'copyFirefox', 'build');
});
