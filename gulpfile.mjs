"use strict";

import gulp               from "gulp";
import zip                from "gulp-zip";
import clean              from "gulp-clean";
import less               from "gulp-less";
import crx                from "gulp-crx-pack";
import fs                 from "fs";
import webpack            from "webpack-stream";
import rename             from "gulp-rename";
import compiler           from "webpack";
import eslint             from "eslint-webpack-plugin";
import plumber            from "gulp-plumber";
import LessPluginCleanCSS from "less-plugin-clean-css";

let currentMode = "development";

const zipTimestamp = new Date(2022, 10, 1);

gulp.task("set-prod-mode", () => {
    currentMode = "production";
    return gulp.src("./");
});

gulp.task("clean", () => {
    return gulp.src("./build/", { read: false, allowEmpty: true })
        .pipe(clean());
});

gulp.task("clean-directories", () => {
    return gulp.src(["./build/chrome/", "./build/firefox/", "./build/global/"], { read: false, allowEmpty: true })
        .pipe(clean());
});

gulp.task("copy-global", () => {
    return gulp.src(["./src/**", "!./src/img/src/**", "!./src/js/*.js", "!./src/img/icon_old.png", "!./src/img/icon_chrome.png", "!./src/css/src/**",
        "!./src/css/*.less", "!./src/css/*.css", "!./src/js/classes/**", "!./src/js/utils/**", "!./src/_locales/**/{options,pageTest,popup}.json"], { encoding: false })
        .pipe(gulp.dest("./build/global/"));
});

gulp.task("compile-less", () => {
    return gulp.src(["./src/css/*.less", "./src/css/*.css"])
        .pipe(less())
        .pipe(gulp.dest("./build/global/css/"));
});

gulp.task("compile-less-compressed", () => {
    const cleanCSSPlugin = new LessPluginCleanCSS({ advanced: true });

    return gulp.src(["./src/css/*.less", "./src/css/*.css"])
        .pipe(less({
            plugins: [cleanCSSPlugin]
        }))
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
            plugins: [new eslint({
                overrideConfigFile: "./eslint.config.mjs",
                configType: "flat"
            })]
        }, compiler))
        .pipe(plumber())
        .pipe(gulp.dest("./build/global/js/", { encoding: false }));
});

gulp.task("copyChrome", () => {
    return gulp.src(["./build/global/**", "./manifests/chrome/**/*", "!./build/global/css/content_invert_firefox.css"], { encoding: false })
        .pipe(gulp.dest("./build/chrome/"));
});

gulp.task("copyFirefox", () => {
    return gulp.src(["./build/global/**", "./manifests/firefox/**/*", "!./build/global/css/content_invert_firefox.css", "!./build/global/css/content_invert.css"], { encoding: false })
        .pipe(gulp.dest("./build/firefox/"));
});

gulp.task("copyFirefoxContentCSS", () => {
    return gulp.src("./build/global/css/content_invert_firefox.css")
        .pipe(rename("content_invert.css"))
        .pipe(gulp.dest("./build/firefox/css/"));
});

gulp.task("build", () => {
    const manifestChrome = JSON.parse(fs.readFileSync("./manifests/chrome/manifest.json", "utf8"));
    const distFileName = manifestChrome.name + " v" + manifestChrome.version;
    const codebase = manifestChrome.codebase;

    gulp.src("build/firefox/**/**/*")
        .pipe(zip(distFileName + " Firefox.xpi", { compress: true, modifiedTime: zipTimestamp }))
        .pipe(gulp.dest("./build"));

    gulp.src("build/chrome/**/**/*")
        .pipe(zip(distFileName + " Chrome.zip", { compress: true, modifiedTime: zipTimestamp }))
        .pipe(gulp.dest("./build"));

    return gulp.src("./build/chrome/")
        .pipe(crx({
            privateKey: fs.readFileSync("./key/key.pem", "utf8"),
            filename: manifestChrome.name + " v" + manifestChrome.version + " Chromium.crx",
            codebase: codebase,
        }))
        .pipe(gulp.dest("./build"));
});

gulp.task("watch", () => {
    gulp.watch(["src/js/*.js", "src/js/classes/*.js", "src/js/utils/*.js", "src/css/*.css", "src/css/*.less", "src/locales/**/*.json", "src/*.html", "src/*.txt", "manifests/**/*.json"], gulp.series("build-directory-dev"));
});

gulp.task("build-directory-dev", gulp.series("clean", "copy-global", "compile-less", "compile-js", "copyChrome", "copyFirefox", "copyFirefoxContentCSS"));

gulp.task("build-dev", gulp.series("build-directory-dev", "build", "clean-directories"));

gulp.task("build-directory-prod", gulp.series("set-prod-mode", "clean", "copy-global", "compile-less-compressed", "compile-js", "copyChrome", "copyFirefox", "copyFirefoxContentCSS"));

gulp.task("build-prod", gulp.series("build-directory-prod", "build", "clean-directories"));

gulp.task("clean-build", gulp.series("clean"));

gulp.task("default", gulp.series("build-prod"));

gulp.task("build", gulp.series("build-prod"));