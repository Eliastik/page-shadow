# Page Shadow :
![Screenshot](screen.png)
## English :

An extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
Latest version: 2.0.1 (08/06/2017)
Official website: http://eliastiksofts.com/page-shadow

This is the source code for the extension Page Shadow, compatible with Chrome/Chromium, Firefox (via WebExtensions), Opera and Microsoft Edge.

Page Shadow is an extension with a series of tools to improve the reading of web pages in badly lit room/other. It allows you to increase page contrast, decrease page brightness, invert image colors, or activate night mode (applies an orange filter on the page to reduce the blue light emitted by the screen).

### Installation:
Page Shadow is avalaible at the following addresses:

* Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
* Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr

For the other compatibles browser, you can install this extension from the official website: http://eliastiksofts.com/page-shadow
Or you can compile yourself (see Compilation section).

### Changelog:

#### Version 2.0.1 (09/06/2017) :
* Microsoft Edge support
* Performance improvements and bugs fixes :
    - Switched to chrome.storage API instead of localstorage
    - Removed Jquery dependency for Content Scripts
    - Fixed bug with browser language detection : the form field in the advanced settings remained blank in certains cases
    - Fixed bug with the Increase page contrast tool with some websites (such as Youtube) ;
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

You can compile yourself the extension for Chrome (crx) and Firefox (xpi) with only one line of code. To do this, you must have installed npm and gulp.

To install npm, read this page: https://docs.npmjs.com/getting-started/installing-node

To install gulp with npm, run the following command:
````
npm i -g gulp
````
The compilation need the following npm packages (which will be created in the project directory): gulp (local), gulp-clean, gulp-crx-pack and gulp-zip.

To install these packages, run the following command:
````
npm install gulp gulp-clean gulp-crx-pack gulp-zip --save-dev
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

## Français :

Une extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
Version actuelle : 2.0.1 (08/06/2017)
Site officiel : http://eliastiksofts.com/page-shadow

Ceci est le code source de l'extension Page Shadow, compatible avec Chrome/Chromium, Firefox (via WebExtensions), Opera et Microsoft Edge.

Page Shadow est une extension comprenant une série d'outils pour améliorer la lecture de pages web dans une pièce mal éclairée/autre. Elle vous permet d'augmenter le contraste de la page, de baisser la luminosité de la page, d'inverser les couleurs des images ou d'activer un mode nuit (applique un filtre orangé sur la page pour réduire la lumière bleue émise par l'écran).
### Installation :
Page Shadow est disponible dans le centre d'extension officiel de Firefox et Opera :

* Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
* Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr

Pour les autres navigateurs compatibles, vous pouvez soit l'installer depuis le site officiel : http://eliastiksofts.com/page-shadow
Soit la compiler vous-même (voir section "Compilation").

### Journal des changements :

#### Version 2.0.1 (09/06/2017) :
* Compatibilité Microsoft Edge ;
* Amélioration des performances et corrections de bugs :
    - Basculement de l'API localstorage vers l'API chrome.storage ;
    - Suppression de Jquery en tant que Content Script ;
    - Correction d'un bug avec la détection de la langue du navigateur : le champ dans les options avancées restait vide dans certains cas ;
    - Correction d'un bug de l'outil "Augmenter le contraste" avec certains sites (comme Youtube) ;
    - Autres petits ajustements.

#### Version 2.0 (05/06/2017) :
* Compatibilité Firefox ;
* Nouveau thème graphique basé sur Bootstrap ;
* Moteur de traduction intégré et ajout d'une traduction en anglais ;
* Ajout de thèmes de couleur pour l'outil "Augmenter le contraste" ;
* Ajout d'un mode nuit ;
* Ajout d'un mode permettant d'inverser la couleur des images ;
* Amélioration des performances ;
* Corrections diverses (bugs, textes).
    
#### Version 1.2.1 :
* Correction d'un bug dans les paramètres avancés ;
* Ajout d'informations sur l'application dans les paramètres avancés.
    
#### Version 1.2 :
* Optimisation de la mise en page de la popup ;
* Amélioration de l'outil "Augmenter le contraste". Les images transparentes sont désormais prises en charge ;
* Quelques ajustements.
    
#### Version 1.1 :
* Amélioration de la fonction "Augmenter le contraste".
    
#### Version 1.0 :
* Version initiale.
    
### Compilation :

Vous pouvez compiler vous-même l'extension pour Chrome (crx) et Firefox (xpi) en une ligne de code. Pour cela, vous devez avoir installé npm et gulp.

Pour installer npm, plus d'infos ici : https://docs.npmjs.com/getting-started/installing-node

Pour installer gulp avec npm, lancez la commande suivante :
````
npm i -g gulp
````
La compilation nécessite les paquets npm suivants (qui seront créés dans le dossier de ce projet) : gulp (local), gulp-clean, gulp-crx-pack et gulp-zip.

Pour les installer, lancez la commande suivante :
````
npm install gulp gulp-clean gulp-crx-pack gulp-zip --save-dev
````
Puis pour compiler :
````
gulp
````
Les fichiers d'extension compilés seront créés dans le dossier "build".

(Note : le répertoire key contient une clé nécessaire à la création d'une extension Chrome).

Pour installer l'extension dans Firefox, vous devez modifier la valeur suivante dans about:config en "false" : xpinstall.signatures.required
Puis lancez l'installation avec le fichier .xpi

Pour Chrome, faites glisser le fichier .crx dans la fenêtre des extensions (chrome://extensions).

### Licence :

Copyright (C) 2015-2017 Eliastik (eliastiksofts.com)

Ce programme est un logiciel libre ; vous pouvez le redistribuer ou le
modifier suivant les termes de la GNU General Public License telle que
publiée par la Free Software Foundation ; soit la version 3 de la
licence, soit (à votre gré) toute version ultérieure.

Ce programme est distribué dans l'espoir qu'il sera utile,
mais SANS AUCUNE GARANTIE ; sans même la garantie tacite de 
QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
Consultez la GNU General Public License pour plus de détails.

Vous devez avoir reçu une copie de la GNU General Public License en même temps
que ce programme ; si ce n'est pas le cas, consultez <http://www.gnu.org/licenses>.

### Credits :

- Source Sans Pro (version 2.020), SIL Open Font License version 1.1 ( http://scripts.sil.org/OFL ) : https://github.com/adobe-fonts/source-sans-pro/blob/master/LICENSE.txt
- Font Awesome, SIL Open Font License version 1.1 ( http://scripts.sil.org/OFL )
- Jquery, MIT license ( https://tldrlegal.com/license/mit-license ) ;
- Bootstrap (CSS et Javascript), MIT license ( https://github.com/twbs/bootstrap/blob/v4-dev/LICENSE ) ;
    - Thème : Paper par Bootswatch (modifié) - https://bootswatch.com/paper/
- i18next, MIT license ( https://github.com/i18next/i18next/blob/master/LICENSE ) ;
- Bootstrap Slider, MIT license ( https://github.com/seiyria/bootstrap-slider/blob/master/LICENSE.md ) ;
- Cette extension utilise une photo venant de ce site : http://littlevisuals.co , domaine public ( https://creativecommons.org/publicdomain/zero/1.0/ ).
