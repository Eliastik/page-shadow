"use strict";

const gulp     = require("gulp");
const clean    = require("gulp-clean");
const cleanCss = require("gulp-clean-css");
const less     = require("gulp-less");
const zip      = require("gulp-zip");
const crx      = require("@crxs/gulp-crx");
const fs       = require("fs");
const webpack  = require("webpack-stream");
const rename   = require("gulp-rename");
const compiler = require("webpack");
const eslint   = require("eslint-webpack-plugin");

let currentMode = "development";

gulp.task("set-prod-mode", () => {
    currentMode = "production";
    return gulp.src("./");
});

gulp.task("clean", () => {
    return gulp.src("./build/*", {read: false})
        .pipe(clean());
});

gulp.task("clean-directories", () => {
    gulp.src("./build/chrome/*", {read: false})
        .pipe(clean());
    gulp.src("./build/edge/*", {read: false})
        .pipe(clean());
    gulp.src("./build/firefox/*", {read: false})
        .pipe(clean());
    return gulp.src("./build/global/*", {read: false})
        .pipe(clean());
});

gulp.task("copy-global", () => {
    return gulp.src(["./src/**", "!./src/img/src/**", "!./src/js/*.js", "!./src/img/icon_old.png", "!./src/img/icon_chrome.png", "!./src/css/src/**", "!./src/css/*.less", "!./src/css/content_old.css", "!./src/js/utils/**"])
        .pipe(gulp.dest("./build/global/"));
});

gulp.task("compile-less", () => {
    return gulp.src("./src/css/*.less")
        .pipe(less())
        .pipe(gulp.dest("./build/global/css/"));
});

gulp.task("compress-css", () => {
    return gulp.src("./build/global/css/*.css")
        .pipe(cleanCss())
        .pipe(gulp.dest("./build/global/css/"));
});

gulp.task("compile-js", () => {
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
            devtool: currentMode != "production" ? "inline-source-map" : false,
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /(node_modules|libs)/,
                        use: {
                            loader: "babel-loader"
                        }
                    },
                    {
                        test: /\.css$/i,
                        use: ["style-loader", "css-loader"],
                    },
                    {
                        test: /\.(woff(2)?|ttf|eot)$/,
                        type: "asset/resource",
                        generator: {
                            filename: "../webfonts/[name][ext]",
                        },
                    },
                    {
                        test: /\.(eot|ttf|svg)(\?.*$|$)/,
                        use: ["raw-loader", "ignore-loader"]
                    },
                ]
            },
            optimization: {
                splitChunks: {
                    chunks(chunk) {
                        return chunk.name !== "background" && chunk.name !== "content";
                    },
                    name: "shared"
                }
            },
            plugins: [new eslint()]
        }, compiler))
        .on("error", err => {
            console.error(err);
        })
        .pipe(gulp.dest("./build/global/js/"));
});

gulp.task("copyChrome", () => {
    return gulp.src(["./build/global/**", "./manifests/chrome/**/*", "!./build/global/css/content_invert_firefox.css"])
        .pipe(gulp.dest("./build/chrome/"));
});

gulp.task("copyEdge", () => {
    return gulp.src(["./build/global/**", "./manifests/edge/*", "!./build/global/css/content_invert_firefox.css"])
        .pipe(gulp.dest("./build/edge/"));
});

gulp.task("copyFirefox", () => {
    return gulp.src(["./build/global/**", "./manifests/firefox/**/*", "!./build/global/css/content_invert_firefox.css", "!./build/global/css/content_invert.css"])
        .pipe(gulp.dest("./build/firefox/"));
});

gulp.task("copyFirefoxContentCSS", () => {
    return gulp.src("./build/global/css/content_invert_firefox.css")
        .pipe(rename("content_invert.css"))
        .pipe(gulp.dest("./build/firefox/css/"));
});

gulp.task("build", () => {
    const manifestChrome = require("./manifests/chrome/manifest.json"),
        distFileName = manifestChrome.name + " v" + manifestChrome.version;
    const codebase = manifestChrome.codebase;
    gulp.src("build/firefox/**/**/*")
        .pipe(zip(distFileName + ".xpi"))
        .pipe(gulp.dest("./build"));
    gulp.src("build/edge/**/**/*")
        .pipe(zip(distFileName + " EdgeLegacy" +".zip"))
        .pipe(gulp.dest("./build"));
    return gulp.src("./build/chrome/")
        .pipe(crx({
            privateKey: fs.readFileSync("./key/key.pem", "utf8"),
            filename: manifestChrome.name + " v" + manifestChrome.version + ".crx",
            codebase: codebase,
        }))
        .pipe(gulp.dest("./build"));
});

gulp.task("watch", () => {
    gulp.watch(["src/js/*.js", "src/css/*.css", "src/css/*.less", "src/locales/**/*.json", "src/filters/*.txt", "src/*.html", "src/*.txt"], gulp.series("build-dev"));
});

gulp.task("build-dev", gulp.series("clean", "copy-global", "compile-less", "compile-js", "copyChrome", "copyEdge", "copyFirefox", "copyFirefoxContentCSS", "build", "clean-directories"));

gulp.task("default", gulp.series("build-dev"));

gulp.task("build-prod", gulp.series("set-prod-mode", "clean", "copy-global", "compile-less", "compile-js", "compress-css", "copyChrome", "copyEdge", "copyFirefox", "copyFirefoxContentCSS", "build", "clean-directories"));

gulp.task("build-prod-no-css-compress", gulp.series("set-prod-mode", "clean", "copy-global", "compile-less", "compile-js", "copyChrome", "copyEdge", "copyFirefox", "copyFirefoxContentCSS", "build", "clean-directories"));

gulp.task("clean-build", gulp.series("clean"));