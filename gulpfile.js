'use strict';

var gulp = require('gulp');
var clean = require('gulp-clean');
var zip = require('gulp-zip');
var crx = require('gulp-crx-pack');
var fs = require('fs');

gulp.task('clean', function() {
	return gulp.src('build/*', {read: false})
		.pipe(clean());
});

gulp.task('copy', function() {
	gulp.src(['./src/**', './manifests/chrome/**'])
        .pipe(gulp.dest('./build/chrome/'));
    gulp.src(['./src/**', './manifests/edge/**'])
        .pipe(gulp.dest('./build/edge/'));
    return gulp.src(['./src/**', './manifests/firefox/manifest.json'])
        .pipe(gulp.dest('./build/firefox/'));
});

gulp.task('build', ['copy'], function() {
	var manifestChrome = require('./manifests/chrome/manifest'),
	    manifestEdge = require('./manifests/edge/manifest'),
	    manifestFirefox = require('./manifests/firefox/manifest'),
		distFileName = manifestChrome.name + ' v' + manifestChrome.version;
    var codebase = manifestChrome.codebase;
    gulp.src("./build/firefox/**")
        .pipe(zip(distFileName + '.xpi'))
        .pipe(gulp.dest('./build'));
    gulp.src("./build/edge/**")
        .pipe(zip(distFileName + ' Edge' +'.zip'))
        .pipe(gulp.dest('./build'));
    gulp.src("./build/chrome/**")
        .pipe(zip(distFileName + ' Opera' +'.zip'))
        .pipe(gulp.dest('./build'));
    return gulp.src('./build/chrome')
        .pipe(crx({
          privateKey: fs.readFileSync('./key/key.pem', 'utf8'),
          filename: manifestChrome.name + ' v' + manifestChrome.version + '.crx',
          codebase: codebase,
        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('default', ['clean'], function() {
    gulp.start('build');
});
