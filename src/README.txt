# Page Shadow :
## English :

## Français :

Un programme by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/

Version actuelle : 2.0.1 (08/06/2017)

Extension available in english and in french
Extension disponible en français et en anglais

Obtenez les dernières mises à jour de l'extension sur http://eliastiksofts.com/page-shadow

Ceci est le code source de l'extension Page Shadow, compatible avec Chrome/Chromium, Firefox (via WebExtensions), Opera et Microsoft Edge.

Une extension comprenant une série d'outils pour améliorer la lecture d'une page dans une pièce mal éclairée/autre. Elle vous permet d'augmenter le contraste de la page, de baisser la luminosité de la page et bien d'autres choses en un clic.

### Installation :

Page Shadow est disponible dans le centre d'extension officiel de Firefox et Opera :

- Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
- Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr

Pour les autres navigateurs compatibles, vous pouvez soit l'installer depuis le site officiel : http://eliastiksofts.com/page-shadow
Soit la compiler vous-même (voir section "Compilation").

### Journal des changements :

* Version 2.0.1 (09/06/2017) :
    - Compatibilité Microsoft Edge ;
    - Amélioration des performances et corrections de bugs :
        - Basculement de l'API localstorage vers l'API chrome.storage ;
        - Suppression de Jquery en tant que Content Script ;
        - Correction d'un bug avec la détection de la langue du navigateur : le champ dans les options avancées restait vide dans certains cas ;
        - Autres petits ajustements.

* Version 2.0 (05/06/2017) :
    - Compatibilité Firefox ;
    - Nouveau thème graphique basé sur Bootstrap ;
    - Moteur de traduction intégré et ajout d'une traduction en anglais ;
    - Ajout de thèmes de couleur pour l'outil "Augmenter le contraste" ;
    - Ajout d'un mode nuit ;
    - Ajout d'un mode permettant d'inverser la couleur des images ;
    - Amélioration des performances ;
    - Corrections diverses (bugs, textes).
    
* Version 1.2.1 :
    - Correction d'un bug dans les paramètres avancés ;
    - Ajout d'informations sur l'application dans les paramètres avancés.
    
* Version 1.2 :
    - Optimisation de la mise en page de la popup ;
    - Amélioration de l'outil "Augmenter le contraste". Les images transparentes sont désormais prises en charge ;
    - Quelques ajustements.
    
* Version 1.1 :
    - Amélioration de la fonction "Augmenter le contraste".
    
* Version 1.0 :
    - Version initiale.
    
Compilation :
=============

Vous pouvez compiler vous-même l'extension pour Chrome (crx) et Firefox (xpi) en une ligne de code. Pour cela, vous devez avoir installé npm et gulp.

Pour installer npm, plus d'infos ici : https://docs.npmjs.com/getting-started/installing-node

Pour installer gulp avec npm, lancez la commande suivante :

npm i -g gulp

La compilation nécessite les paquets npm suivants (qui seront créés dans le dossier de ce projet) : gulp (local), gulp-clean, gulp-crx-pack, gulp-rename et gulp-zip.

Pour les installer, lancez la commande suivante :

npm install gulp gulp-clean gulp-crx-pack gulp-rename gulp-zip --save-dev

Puis pour compiler :

gulp

Les fichiers d'extension compilés seront créés dans le dossier "build".

(Note : le répertoire key contient une clé nécessaire à la création d'une extension Chrome).

Pour installer l'extension dans Firefox, vous devez modifier la valeur suivante dans about:config en "false" : xpinstall.signatures.required
Puis lancez l'installation avec le fichier .xpi

Pour Chrome, faites glisser le fichier .crx dans la fenêtre des extensions (chrome://extensions).

Licence :
=========

Copyright (C) 2015 Eliastik (eliastiksofts.com)

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
-----
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


Credits :
=========

- Source Sans Pro (version 2.020), SIL Open Font License version 1.1 ( http://scripts.sil.org/OFL ) : https://github.com/adobe-fonts/source-sans-pro/blob/master/LICENSE.txt
- Font Awesome, SIL Open Font License version 1.1 ( http://scripts.sil.org/OFL )
- Jquery, MIT license ( https://tldrlegal.com/license/mit-license ) ;
- Bootstrap (CSS and Javascript), MIT license ( https://github.com/twbs/bootstrap/blob/v4-dev/LICENSE ) ;
    - Theme: Paper by Bootswatch (modified) - https://bootswatch.com/paper/
- i18next, MIT license ( https://github.com/i18next/i18next/blob/master/LICENSE ) ;
- Bootstrap Slider, MIT license ( https://github.com/seiyria/bootstrap-slider/blob/master/LICENSE.md ) ;
- This extension uses a picture from this site: http://littlevisuals.co , Public domain ( https://creativecommons.org/publicdomain/zero/1.0/ ).
