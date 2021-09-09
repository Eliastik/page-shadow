'use strict';

const gulp     = require('gulp');
const clean    = require('gulp-clean');
const cleanCss = require('gulp-clean-css');
const less     = require('gulp-less');
const minify   = require('gulp-minify');
const zip      = require('gulp-zip');
const crx      = require('gulp-crx-pack');
const fs       = require('fs');
const babel    = require('gulp-babel');
const webpack  = require('webpack-stream');

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

gulp.task('compile-js', function () {
    gulp.src('./build/global/js/*.js')
        .pipe(babel({
            presets: [
                ['@babel/env', { "modules": false }]
            ],
            plugins: ["@babel/plugin-transform-runtime"]
        }))
        .pipe(gulp.dest('./build/global/js/'))

    return gulp.src('./build/global/js/*.js')
        .pipe(webpack({
            entry: {
                background: './build/global/js/background.js',
                options: './build/global/js/options.js',
                pageTest: './build/global/js/pageTest.js',
                popup: './build/global/js/popup.js',
                content: './build/global/js/content.js'
            },
            output: {
                filename: './[name].js',
            },
            mode: "development",
            devtool: 'cheap-module-source-map'
        }))
        .pipe(gulp.dest('./build/global/js/'));
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

gulp.task('build-dev', gulp.series('clean', 'copy-global', 'compile-less', 'compile-js', 'copyChrome', 'copyEdge', 'copyFirefox', 'build'));

gulp.task('default', gulp.series('build-dev'));

gulp.task('build-prod', gulp.series('clean', 'copy-global', 'compile-less', 'compile-js', 'compress-css', 'compress-js', 'copyChrome', 'copyEdge', 'copyFirefox', 'build', 'clean-directories'));

gulp.task('build-prod-no-js-compress', gulp.series('clean', 'copy-global', 'compile-less', 'compile-js', 'compress-css', 'copyChrome', 'copyEdge', 'copyFirefox', 'build', 'clean-directories'));

gulp.task('build-prod-no-css-compress', gulp.series('clean', 'copy-global', 'compile-less', 'compile-js', 'compress-js', 'copyChrome', 'copyEdge', 'copyFirefox', 'build', 'clean-directories'));

gulp.task('clean-build', gulp.series('clean'));
