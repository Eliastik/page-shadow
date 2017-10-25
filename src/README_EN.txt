# Page Shadow :
## English :

An extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Latest version: 2.1.2 (25/10/2017)
* Official website: http://eliastiksofts.com/page-shadow
* Github repository: https://github.com/Eliastik/page-shadow

This is the source code for the extension Page Shadow, compatible with Chrome/Chromium, Firefox, Opera and Microsoft Edge. This extension uses the WebExtensions technology via the Chrome API (more infos : https://developer.mozilla.org/fr/Add-ons/WebExtensions ).

Page Shadow is an extension designed to render a web page more readable in a dark environment. It allows you to increase page contrast, decrease page brightness, invert images colors, or activate a night mode (apply an orange filter on the page to reduce the blue light emitted by the screen).

### Installation:
Page Shadow is avalaible to download and install at the following addresses:

* Chrome : https://chrome.google.com/webstore/detail/eimaelgbclmdoeimifebaagealdkjmki/
* Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
* Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr

For the other compatibles browser, you can install this extension from the official website: http://eliastiksofts.com/page-shadow
Or you can compile it yourself (see Compilation section).

### Changelog:

### Version 2.1.2 (25/10/2017) :
* Added 5 new themes (10 to 15);
* Bug fixes, major changes in the extension structure and minor adjustments:
    - Optimizations and important changes in the code of the management of the parameters (dynamic detection of the changes in real time);
    - Bug fixes for Firefox Android: disabling the extension for a site or page now works, the main settings panel now scrolls correctly;
    - Fixed a bug in the tool Decrease page brightness: in some cases, the percentage of brightness decrease could be incorrect, that made the settings panel completely dark;
    - When resetting the settings, the language is now reseted correctly (re-detection of the browser language instead of setting the default language to French);
    - Fixed some error messages (appearing in the Javascript console);
    - Better detection of the URLs of the web pages visited;
    - Correction and optimization of the management code of the right-click menu;
    - Added global configuration variables of the extension in the file "util.js";
    - Correction of the code managing the translations of the extension;
    - Updated some software libraries (i18next and Bootstrap Slider);
    - Added extension license informations to the source files;
    - Added a link to the options page in the Firefox Extensions Manager;
    - Aesthetic corrections, text corrections and other minor adjustments;
    - The JS and CSS source files are now compressed in the production version of the extension (added new compilation commands). This reduces the weight of the extension.

### Version 2.1.1, or 2.1 REV1 (09/09/2017) :
* Revision for the version 2.1:
    - XML parsing error in Firefox fixed (bug in i18nextXHRBackend) ;
    - The settings are now initialised directly after the installation of the extension ;
    - Bug fixed with the manifest file for Microsoft Edge (persistent key in background key).

#### Version 2.1 (04/09/2017) :
* Improved performance by fixing a bug: the processor could be occupied more than 50% in some special cases ;
* Added the possibility to toggle the list of websites ignored to a whitelist: all the websites are in this case ignored, and need to be unlocked manually ;
* Added the possibility to choose the color temperature used by the Night mode ;
* Bugs fixed and minor adjustments:
    - Corrections for the new Youtube interface (utilisation of non-standard HTML elements) ;
    - The SVG images are now supported by the tool Invert images colors ;
    - Improved layout of the window About and added icons in the Advanced settings ;
    - Corrections of some texts ;
    - Updated some libraries ;
    - Optimised code ;
    - Others minor adjustments and minor bugs fixed.

#### Version 2.0.3 (09/07/2017) :
* It is now possible to disable Page Shadow for a particular website or page via the right-click or via the extension menu
* Bug fixes and minor adjustments :
    - Themes 2 and 3 now have a gray background for transparent images
    - Added support for HTML form and caption elements by the Increase page contrast tool (improves rendering of the tool)
    - Fixed a bug with tool setting Decrease page brightness
    - The image on the test page of the extension now correctly resizes when the browser window is resized
    - Basic support for future versions of Firefox for Android (not tested)
    - Small adjustments of the code

#### Version 2.0.2 (17/06/2017) :
* The settings can now be applied in real time
* Fixed Page Shadow icon (the shadow is better)
* Bugs fixes :
    - Bug fixed with the manifest.json file (one manifest.json different for each browser have been created)
    - Bug fixed with the automatic reactivation of the tool Increase page contrast with some particular websites (such as Youtube)
    - Bug fixed with the Gulpfile (which allows the compilation of the extension). The extension can now be compiled for Edge and Opera
    - Other minor adjustements.

#### Version 2.0.1 (09/06/2017) :
* Microsoft Edge support
* Performance improvements and bugs fixes :
    - Switched to chrome.storage API instead of localstorage
    - Removed Jquery dependency for Content Scripts
    - Fixed bug with browser language detection : the form field in the advanced settings remained blank in certains cases
    - Fixed bug with the Increase page contrast tool with some websites (such as Youtube)
    - Other minor adjustements.

#### Version 2.0 (05/06/2017) :
* Firefox support
* New graphical theme based on Bootstrap
* Integrated translation engine and added English translation
* Added color themes for the "Increase contrast" tool
* Added night mode
* Added a mode to invert the color of the images
* Performance improvements
* Various fixes (bugs, texts)

#### Version 1.2.1 :
* Fixed bug in the advanced settings
* Adding informations about the extension in the advanced settings

#### Version 1.2 :
* Optimisation of the popup layout
* Improved function "Increase page contrast". The transparent images are now supported
* Some adjustements

#### Version 1.1 :
* Improved function "Increase page contrast"

#### Version 1.0 :
* Initial version

### Compilation :

You can compile yourself the extension with only one command line. To do this, you have to install npm and gulp.

To install npm for your OS, read this page: https://docs.npmjs.com/getting-started/installing-node

To install gulp with npm, run the following command:
````
npm i -g gulp
````
Git clone the repository and cd to the project directory (or download it directly from Github):
````
git clone https://github.com/Eliastik/page-shadow.git
cd page-shadow
````
The compilation need the following npm packages (which will be created in the project directory): gulp (local), fs, gulp-clean, gulp-clean-css, gulp-crx-pack, gulp-minify, gulp-zip and run-sequence

To install these packages, run the following command:
````
npm install
````
Then to compile:

* Dev mode (no compression): `gulp` or `gulp build-dev`
* Prod mode (compression): `gulp build-prod` or `gulp build-prod-no-js-compress` (only compress css files) or `build-prod-no-css-compress` (only compress js files)

The extension files compiled will be created in the sub-directory "build".

(Note: The key directory contains a key needed to compile the Chrome extension).

To install the extension in Firefox, you need to modify the following value in about:config to "false": xpinstall.signatures.required
Then launch the installation with the .xpi file.

For Chrome, slide the .crx file in the extension window (chrome://extensions).

Then if you want to clean the build directory, run the command `gulp clean-build`

### Licence :

Copyright (C) 2015-2017 Eliastik (eliastiksofts.com)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

### Credits :

- Source Sans Pro (version 2.020), SIL Open Font License version 1.1 ( http://scripts.sil.org/OFL ) : https://github.com/adobe-fonts/source-sans-pro/blob/master/LICENSE.txt
- Font Awesome, SIL Open Font License version 1.1 ( http://scripts.sil.org/OFL )
- Jquery, MIT license ( https://tldrlegal.com/license/mit-license ) ;
- Bootstrap (CSS and Javascript), MIT license ( https://github.com/twbs/bootstrap/blob/v4-dev/LICENSE ) ;
    - Theme: Paper by Bootswatch (modified) - https://bootswatch.com/paper/
- i18next, MIT license ( https://github.com/i18next/i18next/blob/master/LICENSE ) ;
- Bootstrap Slider, MIT license ( https://github.com/seiyria/bootstrap-slider/blob/master/LICENSE.md ) ;
- This extension uses a picture from this site: http://littlevisuals.co , Public domain ( https://creativecommons.org/publicdomain/zero/1.0/ ).
