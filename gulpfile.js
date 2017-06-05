'use strict';

var gulp = require('gulp');
var clean = require('gulp-clean');
var zip = require('gulp-zip');
var rename = require("gulp-rename");
var crx = require('gulp-crx-pack');
var fs = require('fs');

gulp.task('clean', function() {
	return gulp.src('build/*', {read: false})
		.pipe(clean());
});

gulp.task('build', function() {
	var manifest = require('./src/manifest'),
		distFileName = manifest.name + ' v' + manifest.version + '.zip';
    var codebase = manifest.codebase;
	gulp.src('build/*', {read: false})
		.pipe(clean());
    gulp.src('./src/**')
        .pipe(zip(distFileName))
        .pipe(gulp.dest('./build'));
    gulp.src("./build/"+ distFileName)
        .pipe(rename(manifest.name + ' v' + manifest.version + '.xpi'))
        .pipe(gulp.dest("./build"));
    return gulp.src('./src/')
        .pipe(crx({
          privateKey: fs.readFileSync('./key/key.pem', 'utf8'),
          filename: manifest.name + '.crx',
          codebase: codebase,
        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('default', ['build']);
