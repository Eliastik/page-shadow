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

gulp.task('build', function() {
	var manifest = require('./src/manifest'),
		distFileName = manifest.name + ' v' + manifest.version;
    var codebase = manifest.codebase;
	gulp.src('build/*', {read: false})
		.pipe(clean());
    gulp.src('./src/**')
        .pipe(zip(distFileName + '.zip'))
        .pipe(gulp.dest('./build'));
    gulp.src("./src/**")
        .pipe(zip(distFileName + '.xpi'))
        .pipe(gulp.dest('./build'));
    return gulp.src('./src/')
        .pipe(crx({
          privateKey: fs.readFileSync('./key/key.pem', 'utf8'),
          filename: manifest.name + ' v' + manifest.version + '.crx',
          codebase: codebase,
        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('default', ['build']);
