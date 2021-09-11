"use strict";

const gulp     = require("gulp");
const clean    = require("gulp-clean");
const cleanCss = require("gulp-clean-css");
const less     = require("gulp-less");
const zip      = require("gulp-zip");
const crx      = require("gulp-crx-pack");
const fs       = require("fs");
const webpack  = require("webpack-stream");

let currentMode = "development";

gulp.task("set-prod-mode", function() {
    currentMode = "production";
    return gulp.src("./build");
});

gulp.task("clean", function() {
    return gulp.src("./build/*", {read: false})
        .pipe(clean());
});

gulp.task("clean-directories", function() {
    gulp.src("./build/chrome/*", {read: false})
        .pipe(clean());
    gulp.src("./build/edge/*", {read: false})
        .pipe(clean());
    gulp.src("./build/firefox/*", {read: false})
        .pipe(clean());
    return gulp.src("./build/global/*", {read: false})
        .pipe(clean());
});

gulp.task("copy-global", function() {
    return gulp.src(["./src/**", "!./src/img/src/**", "!./src/js/*.js", "!./src/img/icon_old.png", "!./src/css/src/**", "!./src/css/*.less", "!./src/css/content_old.css"])
        .pipe(gulp.dest("./build/global/"));
});

gulp.task("compile-less", function () {
    return gulp.src("./src/css/*.less")
        .pipe(less())
        .pipe(gulp.dest("./build/global/css/"));
});

gulp.task("compress-css", function () {
    return gulp.src("./build/global/css/*.css")
        .pipe(cleanCss())
        .pipe(gulp.dest("./build/global/css/"));
});

gulp.task("compile-js", function () {
    return gulp.src("./src/js/*.js")
        .pipe(webpack({
            entry: {
                background: "./src/js/background.js",
                options: "./src/js/options.js",
                pageTest: "./src/js/pageTest.js",
                popup: "./src/js/popup.js",
                content: "./src/js/content.js"
            },
            output: {
                filename: "./[name].js",
            },
            mode: currentMode,
            devtool: "cheap-module-source-map",
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /(node_modules|libs)/,
                        use: {
                            loader: "babel-loader"
                        }
                    }
                ]
            }
        }))
        .pipe(gulp.dest("./build/global/js/"));
});

gulp.task("copyChrome", function() {
    return gulp.src(["./build/global/**", "./manifests/chrome/**/*"])
        .pipe(gulp.dest("./build/chrome/"));
});

gulp.task("copyEdge", function() {
    return gulp.src(["./build/global/**", "./manifests/edge/*"])
        .pipe(gulp.dest("./build/edge/"));
});

gulp.task("copyFirefox", function() {
    return gulp.src(["./build/global/**", "./manifests/firefox/**/*"])
        .pipe(gulp.dest("./build/firefox/"));
});

gulp.task("build", function() {
    var manifestChrome = require("./manifests/chrome/manifest.json"),
        manifestEdge = require("./manifests/edge/manifest.json"),
        manifestFirefox = require("./manifests/firefox/manifest.json"),
        distFileName = manifestChrome.name + " v" + manifestChrome.version;
    var codebase = manifestChrome.codebase;
    gulp.src("build/firefox/**/**/*")
        .pipe(zip(distFileName + ".xpi"))
        .pipe(gulp.dest("./build"));
    gulp.src("build/edge/**/**/*")
        .pipe(zip(distFileName + " Edge" +".zip"))
        .pipe(gulp.dest("./build"));
    gulp.src("build/chrome/**/**/*")
        .pipe(zip(distFileName + " Opera" +".zip"))
        .pipe(gulp.dest("./build"));
    return gulp.src("./build/chrome/")
        .pipe(crx({
            privateKey: fs.readFileSync("./key/key.pem", "utf8"),
            filename: manifestChrome.name + " v" + manifestChrome.version + ".crx",
            codebase: codebase,
        }))
        .pipe(gulp.dest("./build"));
});

gulp.task("build-dev", gulp.series("clean", "copy-global", "compile-less", "compile-js", "copyChrome", "copyEdge", "copyFirefox", "build", "clean-directories"));

gulp.task("default", gulp.series("build-dev"));

gulp.task("build-prod", gulp.series("set-prod-mode", "clean", "copy-global", "compile-less", "compile-js", "compress-css", "copyChrome", "copyEdge", "copyFirefox", "build", "clean-directories"));

gulp.task("build-prod-no-css-compress", gulp.series("set-prod-mode", "clean", "copy-global", "compile-less", "compile-js", "copyChrome", "copyEdge", "copyFirefox", "build", "clean-directories"));

gulp.task("clean-build", gulp.series("clean"));