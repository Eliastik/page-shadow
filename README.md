# Page Shadow :
## English :

<img src="https://raw.githubusercontent.com/Eliastik/page-shadow/master/screen.png" width="300" alt="Page Shadow" />

An extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Latest version: 2.8 (10/24/2021)
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

### Version 2.8 (10/24/2021) :
* Added the Filters feature, accessible in Advanced Settings. Filters allow, based on rules, to improve the display of websites when the following options are enabled: Increase page contrast or Invert colors. This advance significantly improves the display of some websites when Page Shadow is enabled. This feature can also improve the performance of Page Shadow on some websites. These filters are updated daily from Internet sources. The lists provided by default are downloaded from the eliastiksofts.com website (the extension developer's website). It's also possible to define custom rules. You don't have to do anything more on your side to take advantage of the feature, it's operational as soon as the extension is installed/updated. Filters are updated automatically;
* Addition of the possibility of defining a list of sites/pages where to automatically enable a preset: it's possible to define this list using checkboxes available in the extension menu, or by defining a list manually (the syntax is the same as the feature to disable a website/a page, and supports regular expressions and wildcards);
* It's now possible to apply the presets using keyboard shortcuts (to be configured manually);
* The maximum number of storable presets has been increased from 5 to 10;
* It's now possible to see the settings stored in the presets in the Advanced settings;
* A notification is displayed when the extension has been updated;
* Many bug fixes, performance improvements and other minor fixes:
    - Fixed the function Invert the colors of entire pages: on some sites, a white background could be visible when the page was scrolled;
    - Fixed the detection of the disabling/activation of a web page on certain sites based on the SPA (Single Page Application) model;
    - The extension is now operational for frames (iframes). Frames use the settings from the parent website;
    - Fixed the application of the translation of certain elements/texts which was not operational in certain cases;
    - Fixed the archiving of the settings with Firefox: the name of the downloaded file is now correct (.json extension);
    - On Firefox, the link Manage keyboard shortcuts in Advanced settings links to an help page on the Firefox website;
    - Fixed the status icon representing if Page Shadow is enabled for the current page when multiple windows are open;
    - Fixed the right-click menu when several windows are open;
    - Fixed the Increase page contrast function for websites using the Shadow Roots feature (in connection with the Filters feature);
    - Better detection of background images;
    - Performance optimization of background image detection;
    - Optimization of the extension size. Version 2.8 is lighter than version 2.7 despite the new features added.
* Technical improvements:
    - Migration of the extension to JavaScript ES6, use of Babel and Webpack. Optimization of the size of JavaScript scripts;
    - Use of browser API instead of chrome API, use of webextension-polyfill;
    - Use of Promises instead of callbacks;
    - Use of npm to manage most of the dependencies;
    - Updated dependencies;
    - Added unlimitedStorage permission;
    - Code cleaning.

### Version 2.7 (16/08/2019) :
* Added the ability to create multiple custom themes instead of just one before;
* Added Cloud backup in Backups and presets in Advanced settings;
* Improved blacklist/whitelist with more blocking options (wildcard \*, regular expressions, etc.);
* The whitelist now supports the same options as the blacklist, previously it only accepted domains;
* Bug fixes and texts fixes.

### Version 2.6 (31/10/2018) :
* Added the ability to set presets (max 5, which can be created from the advanced settings) to restore them later (via the extension menu, advanced settings or the right-click menu);
* Added a keyboard shortcut (Alt+Shift+S) to enable/disable the extension globally;
* Added the Videos and Backgrounds (images) elements in the Invert the colors function, so they can be inverted or not regardless of the entire page and images;
* Added ability to enable or disable background coloring of the images when the function Increase page contrast is enabled;
* Fixed the display of some elements that could be hidden when the function Increase page contrast was enabled (eg in Google News);
* The space taken by the extension menu has been reduced to accommodate the new functions;
* Other minor changes:
    * Small changes in the interface;
    * Performance improvement;
    * Bugfixes;
    * Updated the software libraries;
    * Other minor fixes (code simplification, etc.).

### Version 2.5 (29/04/2018) :
* Better rendering of the tool Increase page contrast + color contrast of the themes corrected;
* Added the ability to enable or disable the extension with one click;
* Added the Enable/disable automatically tool which allows you to automatically enable and/or disable Page Shadow according to the time;
* Added the ability to write a custom CSS for the custom theme;
* Added a function for archiving/restoring the settings of Page Shadow;
* The Invert images colors tool has been renamed to Invert the colors because it now allows you to invert the colors of the images and/or of the entire page indifferently;
* Improved image detection for the Invert the colors tool;
* The icon of the extension changes according to its activation state for the current page (red/green);
* Other minor changes, bug fixes, and performance improvements:
    * Using Less for some CSS files;
    * CSS code fixes;
    * Bug fixes for Firefox Mobile;
    * Other minor fixes and improvements.

### Version 2.4 (02/01/2018) :
* Added the ability to inverse the colors of web pages entirely, not just the images;
* Added new options for custom themes: color of visited links and font;
* The themes now have a color for visited links;
* Added the ability to disable the display of the message after selecting the custom theme for the tool Increase page contrast;
* Bug fixes, performance improvements and adjustments:
    * Improved performance (optimizations) and reduced RAM consumption;
    * Fixed the display of checkboxes with Firefox;
    * Bug corrected with the tool Invert images colors for some websites (some images couldn't be reversed);
    * Bug corrected with the tool Decrease page brightness;
    * Optimization of the layout of the extension menu (reduction of the space taken by some elements);
    * Adjusted some themes;
    * Other minor corrections and adjustments.

### Version 2.3 (1/12/2017) :
* Added the possibility to create a custom theme;
* Improved the Invert images colors tool: background images are now detected, which greatly improves the rendering of the tool;
* Bug fixes and adjustments:
    - Simplified and improved CSS code, which improves the compatibility with some websites (the tool Increase page contrast now target all HTML elements except some exceptions);
    - The extension now works for local web pages (URLs file://) and for the ftp protocol;
    - Fixed a bug with the tool Decrease page brightness with some websites;
    - Updated some software libraries;
    - Fixed the HTML code of the Advanced settings page;
    - Others minor adjustments and minor bug fixes.

### Version 2.2 (25/10/2017) :
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
The compilation need the following npm packages (which will be created in the project directory): gulp (local), fs, gulp-clean, gulp-clean-css, gulp-crx-pack, gulp-minify, gulp-zip and gulp-less.

To install these packages, run the following command:
````
npm install
````
Then to compile:

* Dev mode (no compression): `gulp` or `gulp build-dev`
* Prod mode (compression): `gulp build-prod` or `build-prod-no-css-compress` (only compress js files)

The extension files compiled will be created in the sub-directory "build".

(Note: The key directory contains a key needed to compile the Chrome extension).

To install the extension in Firefox, you need to modify the following value in about:config to "false": xpinstall.signatures.required
Then launch the installation with the .xpi file.

For Chrome, slide the .crx file in the extension window (chrome://extensions).

Then if you want to clean the build directory, run the command `gulp clean-build`

### Licence :

Copyright (C) 2015-2021 Eliastik (eliastiksofts.com)

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
- Bootstrap (CSS and Javascript), MIT license ( https://github.com/twbs/bootstrap/blob/v4-dev/LICENSE ) ;
    - Theme: Paper by Bootswatch (modified) - https://bootswatch.com/paper/
- This extension uses a picture from this site: http://littlevisuals.co , Public domain ( https://creativecommons.org/publicdomain/zero/1.0/ ).
- See package.json dependencies

## Français :

<img src="https://raw.githubusercontent.com/Eliastik/page-shadow/master/screen_fr.png" width="300" alt="Page Shadow" />

Une extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Version actuelle : 2.8 (24/10/2021)
* Site officiel : http://eliastiksofts.com/page-shadow
* Dépôt Github : https://github.com/Eliastik/page-shadow

Ceci est le code source de l'extension Page Shadow, compatible avec Chrome/Chromium, Firefox, Opera et Microsoft Edge. Cette extension utilise la technologie WebExtensions via l'API Chrome (plus d'infos : https://developer.mozilla.org/fr/Add-ons/WebExtensions ).

Page Shadow est une extension comprenant une série d'outils pour améliorer la lecture de pages web dans une pièce mal éclairée/autre. Elle vous permet d'augmenter le contraste de la page, de baisser la luminosité de la page, d'inverser les couleurs des images ou d'activer un mode nuit (applique un filtre orangé sur la page pour réduire la lumière bleue émise par l'écran).

### Installation :
Page Shadow est disponible au téléchargement et à l'installation aux adresses suivantes :

* Chrome : https://chrome.google.com/webstore/detail/eimaelgbclmdoeimifebaagealdkjmki/
* Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
* Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr

Pour les autres navigateurs compatibles, vous pouvez soit l'installer depuis le site officiel : http://eliastiksofts.com/page-shadow
Soit la compiler vous-même (voir section "Compilation").

### Journal des changements :

### Version 2.8 (24/10/2021) :
* Ajout de la fonctionnalité Filtres, accessible dans les Paramètres avancés. Les filtres permettent, à partir de règles, d'améliorer l'affichage des sites web lorsque les options suivantes sont activées : Augmenter le contraste ou Inverser les couleurs. Cette avancée améliore considérablement l'affichage de certains sites web lorsque Page Shadow est activé. Cette fonctionnalité permet également d'améliorer les performances de Page Shadow sur certains sites web. Ces filtres sont quotidiennement mis à jour à partir de sources Internet. Les listes fournies par défaut sont téléchargées depuis le site web eliastiksofts.com (site web du développeur de l'extension). Il est également possible de définir des règles personnalisées. Vous n'avez rien à faire de plus de votre côté pour profiter de la fonctionnalité, elle est opérationnelle dès l'installation/mise à jour de l'extension. Les filtres sont mis à jour automatiquement ;
* Ajout de la possibilité de définir une liste de sites/pages où activer automatiquement un pré-réglage : il est possible de définir cette liste à l'aide de cases à cocher disponibles dans le menu de l'extension, ou en définissant une liste manuellement (la syntaxe est la même que la fonctionnalité permettant de désactiver un site/une page, et supporte les expressions régulières et les jokers) ;
* Il est désormais possible d'appliquer les pré-réglages à l'aide de raccourcis clavier (à paramétrer manuellement) ;
* Le nombre maximum de pré-réglages enregistrables est passé de 5 à 10 ;
* Il est désormais possible de voir les paramètres stockés dans les pré-réglages dans les Paramètres avancés ;
* Affichage d'une notification lorsque l'extension a été mise à jour ;
* Corrections de nombreux bugs, amélioration des performances et autres ajustements :
    - Correction de la fonctionnalité Inverser les couleurs des pages entières : sur certains sites, un fond blanc pouvait être visible lorsque la page était défilée ;
    - Correction de la détection de la désactivation/activation d'une page web sur certains sites basés sur le modèle SPA (Single Page Application) ;
    - L'extension est désormais opérationnelle pour les cadres (iframes). Les cadres utilisent les paramètres du site web parent ;
    - Correction de l'application de la traduction de certains éléments/textes qui n'était pas opérationnelle dans certains cas ;
    - Correction de l'archivage des paramètres avec Firefox : le nom du fichier téléchargé est désormais correct (extension .json) ;
    - Sur Firefox, le lien des Paramètres avancés Gérer les raccourcis clavier renvoi vers l'aide du site de Firefox ;
    - Correction de l'icône de statut représentant si Page Shadow est activé pour la page actuelle lorsque plusieurs fenêtres sont ouvertes ;
    - Correction du menu clic-droit lorsque plusieurs fenêtres sont ouvertes ;
    - Correction de la fonction Augmenter le contraste pour les sites web utilisant la fonctionnalité Shadow Roots (en lien avec la fonctionnalité Filtres) ;
    - Meilleure détection des images d'arrière-plan ;
    - Optimisation des performances de la détection des images d'arrière-plan ;
    - Optimisation de la taille de l'extension. La version 2.8 est plus légère que la version 2.7 malgré les nouvelles fonctionnalités ajoutées.
* Améliorations techniques :
    - Migration de l'extension vers JavaScript ES6, utilisation de Babel et Webpack. Optimisation de la taille des scripts JavaScript ;
    - Utilisation de l'API browser au lieu de l'API chrome, utilisation de webextension-polyfill ;
    - Utilisation des Promise au lieu de callbacks ;
    - Utilisation de npm pour gérer la plupart des dépendances ;
    - Mise à jour des dépendances ;
    - Ajout de la permission unlimitedStorage ;
    - Nettoyage du code.

### Version 2.7 (16/08/2019) :
* Ajout de la possibilité de créer plusieurs thèmes personnalisés au lieu d'un seul auparavant ;
* Ajout de Archive Cloud dans Archives et pré-réglages des Paramètres avancés ;
* Amélioration de la liste noire/blanche avec plus d'options de blocage (joker \*, expressions régulières, etc.) ;
* La liste blanche supporte désormais les mêmes options que la liste noire, auparavant elle acceptait uniquement les domaines ;
* Corrections de bugs et des textes.

### Version 2.6 (31/10/2018) :
* Ajout de la possibilité de définir des pré-réglages (5 max, pouvant être créés depuis les paramètres avancés) afin de les restaurer plus tard (via le menu de l'extension, les paramètres avancés ou le menu du clic-droit) ;
* Ajout d'un raccourci clavier (Alt+Shift+S) permettant d'activer/désactiver l'extension globalement ;
* Ajout des éléments Vidéos et Arrière-plans (images) dans la fonction Inverser les couleurs, ils peuvent ainsi être inversés ou non indépendamment de la page entière et des images ;
* Ajout de la possibilité d'activer ou de désactiver la coloration de l'arrière-plan des images lorsque la fonction Augmenter le contraste de la page est activée ;
* Correction de l'affichage de certains éléments qui pouvaient être masqués lorsque la fonction Augmenter le contraste de la page était activée (par exemple Google Actualités) ;
* L'espace pris par le menu de l'extension a été réduit afin d'accueillir les nouvelles fonctions ;
* Autres changements mineurs :
    * Petits changements dans l'interface ;
    * Amélioration des performances ;
    * Correction de bugs ;
    * Mise à jour des bibliothèques logicielles ;
    * Autres corrections mineures (simplification du code, etc.).

### Version 2.5 (29/04/2018) :
* Meilleur rendu de l'outil Augmenter le contraste de la page + contraste de couleurs des thèmes corrigé ;
* Ajout de la possibilité d'activer ou de désactiver l'extension en un clic ;
* Ajout de l'outil Activer/désactiver automatiquement qui permet d'activer et/ou de désactiver automatiquement Page Shadow selon l'heure de la journée ;
* Ajout de la possibilité d'écrire une feuille de style CSS personnalisé pour le thème personnalisé ;
* Ajout d'une fonction d'archivage/restauration des paramètres de Page Shadow ;
* L'outil Inverser les couleurs des images a été renommé en Inverser les couleurs car il permet désormais d'inverser les couleurs des images et/ou de la page entière indiféremment ;
* Amélioration de la détection des images pour l'outil Inverser les couleurs ;
* L'icône de l'extension change en fonction de son état d'activation sur la page actuelle (rouge/vert) ;
* Autres changements mineurs, corrections de bugs et améliorations des performances :
    * Utilisation de Less pour certaines feuilles de style CSS ;
    * Corrections du code CSS ;
    * Correction de bugs pour Firefox Mobile ;
    * Autres corrections et améliorations mineures.


### Version 2.4 (02/01/2018) :
* Ajout de la possibilité d'inverser les couleurs des pages web entièrement, et non pas seulement les images ;
* Ajout de nouvelles options pour les thèmes personnalisés : couleur des liens visités et police de caractères ;
* Les thèmes ont désormais une couleur pour les liens visités ;
* Ajout de la possibilité de désactiver l'affichage du message après avoir selectionné le thème personnalisé pour l'outil Augmenter le contraste de la page ;
* Corrections de bugs, amélioration des performances et ajustements :
    * Amélioration des performances (optimisations) et réduction de la consommation de mémoire vive ;
    * Correction de l'affichage des cases à cocher avec Firefox ;
    * Bug corrigé avec l'outil Inverser la couleur des images pour certains sites web (certaines images pouvaient ne pas être inversées) ;
    * Bug corrigé avec l'outil Baisser la luminosité de la page ;
    * Optimisation de la mise en page du menu de l'extension (réduction de la place prise par certains éléments) ;
    * Ajustement de certains thèmes ;
    * Autres corrections et ajustements mineurs.

### Version 2.3 (1/12/2017) :
* Ajout de la possibilité de créer un thème personnalisé ;
* Amélioration de l'outil Inverser les couleurs des images : les images d'arrière-plan sont désormais détectées, ce qui améliore grandement le rendu de l'outil ;
* Corrections de bugs et ajustements :
    - Code CSS simplifié et amélioré, ce qui améliore la compatibilité avec certains sites web (l'outil Augmenter le contraste de la page cible tous les éléments HTML sauf quelques exceptions) ;
    - L'extension fonctionne désormais pour les pages web locales (URLs file://) et pour le protocole ftp ;
    - Correction d'un bug avec l'outil Baisser la luminosité de la page avec certains sites web ;
    - Mise à jour de certaines bibliothèques logicielles ;
    - Code HTML de la page des Paramètres avancés corrigé ;
    - Autres petits ajustements et corrections de bugs mineurs.

### Version 2.2 (25/10/2017) :
* Ajout de 5 nouveaux thèmes (10 à 15) ;
* Corrections de bugs, changements importants dans la structure de l'extension et ajustements mineurs :
    - Optimisations et changements importants dans le code de la gestion des paramètres (détection dynamique des changements en temps réel) ;
    - Corrections de bugs pour Firefox pour Android : la désactivation  de l'extension pour un site ou une page fonctionne désormais, le panneau des paramètres principal défile désormais correctement ;
    - Correction d'un bug de l'outil Baisser la luminosité de la page : dans certains cas, le pourcentage de baisse de la luminosité pouvait être incorrect, ce rendait le panneau des paramètres entièrement sombre ;
    - Lors de la réinitialisation des paramètres, la langue est désormais réinitialisée correctement (re-détection de la langue du navigateur au lieu de mettre la langue en français par défaut) ;
    - Correction de certains messages d'erreur (apparaissant dans la console Javascript) ;
    - Meilleure détection de l'URL des pages web visitées ;
    - Correction et optimisation du code de la gestion du menu clic-droit ;
    - Ajout des variables de configuration globale de l'extension dans le fichier "util.js" ;
    - Correction du code gérant les traductions de l'extension ;
    - Mise à jour de certaines bibliothèques logicielles (i18next et Bootstrap Slider) ;
    - Ajout des avis de licence de l'extension dans les fichiers sources ;
    - Ajout d'un lien vers la page d'options dans le gestionnaire d'extensions de Firefox ;
    - Corrections esthétiques, corrections des textes et autres ajustements mineurs ;
    - Les fichiers sources JS et CSS sont désormais compressés dans la version de production de l'extension (ajout de nouvelles commandes de compilation). Cela réduit le poids de l'extension.

### Version 2.1.1, ou 2.1 REV1 (09/09/2017) :
* Révision pour la version 2.1 :
    - Erreur de parsing XML avec Firefox corrigé (bug avec i18nextXHRBackend) ;
    - Les paramètres sont désormais initialisés dès l'installation de l'extension ;
    - Bug corrigé avec le fichier manifeste pour Microsoft Edge (clé persistent dans la clé background).

#### Version 2.1 (04/09/2017) :
* Amélioration des performances par la correction d'un bug : le processeur pouvait être occupé à plus de 50% dans certains cas particuliers ;
* Ajout de la possibilité de basculer la liste des sites à ignorer en liste blanche : tous les sites sont dans ce cas ignorés, et il faut les débloquer manuellement ;
* Ajout de la possibilité de choisir la température de couleur utilisée par le Mode nuit ;
* Corrections de bugs et ajustements mineurs :
    - Corrections pour la nouvelle interface de Youtube (utilisation d'éléments HTML non standards) ;
    - Les images SVG sont désormais prises en charge par l'outil Inverser les couleurs des images ;
    - Mise en page de la fenêtre A propos améliorée et ajout d'icônes dans les Paramètres avancés ;
    - Corrections de certains textes ;
    - Mise à jour de certaines bibliothèques logicielles ;
    - Code optimisé ;
    - Autres petits ajustements et corrections de bugs mineurs.

#### Version 2.0.3 (09/07/2017) :
* Il est désormais possible de désactiver Page Shadow pour un site ou une page particulière via le clic-droit ou via le menu de l'extension ;
* Corrections de bugs et ajustements mineurs :
    - Les thèmes 2 et 3 ont désormais un fond gris pour les images transparentes ;
    - Ajout de la prise en charge des éléments HTML form et caption par l'outil Augmenter le contraste (améliore le rendu de l'outil) ;
    - Correction d'un bug avec le réglage de l'outil Baisser la luminosité de la page ;
    - L'image de la page d'exemple de l'extension se redimensionne désormais correctement lorsque la fenêre du navigateur est redimensionnée ;
    - Prise en charge basique des versions futures de Firefox pour Android (non testé) ;
    - Petits ajustements du code.

#### Version 2.0.2 (17/06/2017) :
* Les paramètres peuvent désormais être appliqués en temps réel ;
* Correction de l'icône de Page Shadow (l'ombre est de meilleure qualité) ;
* Corrections de bugs :
    - Corrections de bugs avec le manifest.json (un manifest.json différent pour chaque navigateur a été créé) ;
    - Correction d'un bug avec la réactivation automatique de l'outil "Augmenter le contraste" avec certains sites particuliers (comme Youtube) ;
    - Corrections de bugs avec le fichier Gulp (qui permet la compilation de l'extension). L'extension peut désormais être compilée pour Edge et Opera ;
    - Autres petits ajustements.

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

Vous pouvez compiler vous-même l'extension en une ligne de commande. Pour cela, vous devez avoir installé npm et gulp.

Pour installer npm sur votre système, plus d'infos ici : https://docs.npmjs.com/getting-started/installing-node

Pour installer gulp avec npm, lancez la commande suivante :
````
npm i -g gulp
````
Faites un Git clone du dépôt et faites un cd vers le dossier du projet (ou bien téléchargez le directement depuis Github) :
````
git clone https://github.com/Eliastik/page-shadow.git
cd page-shadow
````
La compilation nécessite les paquets npm suivants (qui seront créés dans le dossier de ce projet) : gulp (local), fs, gulp-clean, gulp-clean-css, gulp-crx-pack, gulp-minify, gulp-zip et gulp-less.

Pour les installer, lancez la commande suivante :
````
npm install
````
Puis pour compiler :

* Mode dev (pas de compression): `gulp` ou `gulp build-dev`
* Mode prod (compression): `gulp build-prod` ou `build-prod-no-css-compress` (compresse uniquement les fichiers js)

Les fichiers d'extension compilés seront créés dans le dossier "build".

(Note : le répertoire key contient une clé nécessaire à la création d'une extension Chrome).

Pour installer l'extension dans Firefox, vous devez modifier la valeur suivante dans about:config en "false" : xpinstall.signatures.required
Puis lancez l'installation avec le fichier .xpi

Pour Chrome, faites glisser le fichier .crx dans la fenêtre des extensions (chrome://extensions).

Puis si vous souhaitez nettoyer le répertoire de build, lancez la commande `gulp clean-build`

### Licence :

Copyright (C) 2015-2021 Eliastik (eliastiksofts.com)

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
- Bootstrap (CSS et Javascript), MIT license ( https://github.com/twbs/bootstrap/blob/v4-dev/LICENSE ) ;
    - Thème : Paper par Bootswatch (modifié) - https://bootswatch.com/paper/
- Cette extension utilise une photo venant de ce site : http://littlevisuals.co , domaine public ( https://creativecommons.org/publicdomain/zero/1.0/ ).
- Voir les dépendances dans le fichier package.json