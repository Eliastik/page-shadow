# Page Shadow :
## English :

An extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Latest version: 2.0.2 (17/06/2017)
* Official website: http://eliastiksofts.com/page-shadow
* Github repository: https://github.com/Eliastik/page-shadow

This is the source code for the extension Page Shadow, compatible with Chrome/Chromium, Firefox, Opera and Microsoft Edge. This extension uses the WebExtensions technology via the Chrome API (more infos : https://developer.mozilla.org/fr/Add-ons/WebExtensions )

Page Shadow is an extension with a series of tools to improve the reading of web pages in badly lit room/other. It allows you to increase page contrast, decrease page brightness, invert image colors, or activate night mode (applies an orange filter on the page to reduce the blue light emitted by the screen).

### Installation:
Page Shadow is avalaible to download and install at the following addresses:

* Chrome : https://chrome.google.com/webstore/detail/eimaelgbclmdoeimifebaagealdkjmki/
* Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
* Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr

For the other compatibles browser, you can install this extension from the official website: http://eliastiksofts.com/page-shadow
Or you can compile yourself (see Compilation section).

### Changelog:

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
The compilation need the following npm packages (which will be created in the project directory): gulp (local), gulp-clean, gulp-crx-pack, gulp-zip and run-sequence.

To install these packages, run the following command:
````
npm install
````
Then to compile:
````
gulp
````
The extension files compiled will be created in the sub-directory "build".

(Note: The key directory contains a key needed to compile the Chrome extension).

To install the extension in Firefox, you need to modify the following value in about:config to "false": xpinstall.signatures.required
Then launch the installation with the .xpi file.

For Chrome, slide the .crx file in the extension window (chrome://extensions).

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
