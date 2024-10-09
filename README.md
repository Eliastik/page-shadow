# Page Shadow :
## English :

<img src="https://raw.githubusercontent.com/Eliastik/page-shadow/master/screen.png" width="300" alt="Page Shadow" /> <img src="https://raw.githubusercontent.com/Eliastik/page-shadow/master/screen_2.png" width="300" alt="Page Shadow" />

An extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Latest version: 2.11 (10/9/2024)
* Official website: http://eliastiksofts.com/page-shadow
* Github repository: https://github.com/Eliastik/page-shadow

This is the source code for the extension Page Shadow, compatible with Chrome/Chromium, Firefox, Opera and Microsoft Edge. This extension uses the WebExtensions technology via the Browser API (more infos : https://developer.mozilla.org/fr/Add-ons/WebExtensions ).

Page Shadow is a dark mode extension. It includes a series of tools to improve the reading of web pages in a dark environment.

It allows you:

- To increase the contrast of the pages, that is to say to reinforce the dark tones of the pages: the extension transforms the design of any site into a "dark mode" theme;
- To decrease the brightness of the pages;
- To invert the colors of images or entire pages;
- To attenuate the colors of images;
- To enable a night mode (applies an orange filter on the pages to reduce the blue light emitted by the screen).

Page Shadow has many settings to personalize your extension: settings adapted to each site, automatic enable/disable, etc.

### Installation:

Page Shadow is avalaible to download and install at the following addresses:

* Chrome : https://chrome.google.com/webstore/detail/eimaelgbclmdoeimifebaagealdkjmki/
* Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
* Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr
* Edge : https://microsoftedge.microsoft.com/addons/detail/ofcbmommmmaoekccnfojdpjgopgcbgbd

For the other compatibles browser, you can install this extension from the official website: http://eliastiksofts.com/page-shadow
Or you can compile it yourself (see Compilation section).

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

To install the depedencies, run the following command:
````
npm install
````
Then to compile:

* Dev mode (no compression): `gulp` or `gulp build-dev` or `gulp build-directory-dev` (only compile as folders)
* Prod mode (with compression): `gulp build-prod` or `gulp build-directory-prod` (only compile as folders)
* Watch mode (real-time compilation): `gulp watch` (uses dev mode compilation)

If you encounter the following error message when compiling:

````
error:25066067:DSO support routines:dlfcn_load:could not load the shared library
````

Try to launch the following command: `export OPENSSL_CONF=/dev/null`

The extension files compiled will be created in the sub-directory "build".

(Note: The key directory contains a key needed to compile the Chrome extension).

To install the extension in Firefox, you need to install Firefox Developer Edition then modify the following value in about:config to "false": xpinstall.signatures.required
Then launch the installation with the .xpi file.

For Chromium, slide the .crx file into the extension page (chrome://extensions).

Then if you want to clean the build directory, run the command `gulp clean-build`

### Licence :

Page Shadow is distributed under GPL-3.0 license (see LICENCE.txt file)

#### License notice

Copyright (C) 2015-2024 Eliastik (eliastiksofts.com)

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
- Bootstrap (CSS and Javascript), MIT license ( https://github.com/twbs/bootstrap/blob/v4-dev/LICENSE ) ;
    - Theme: Paper by Bootswatch (modified) - https://bootswatch.com/paper/
- This extension uses a picture from this site: http://littlevisuals.co , Public domain ( https://creativecommons.org/publicdomain/zero/1.0/ ).
- See package.json dependencies

## Français :

<img src="https://raw.githubusercontent.com/Eliastik/page-shadow/master/screen_fr.png" width="300" alt="Page Shadow" /> <img src="https://raw.githubusercontent.com/Eliastik/page-shadow/master/screen_fr_2.png" width="300" alt="Page Shadow" />

Une extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Version actuelle : 2.11 (09/10/2024)
* Site officiel : http://eliastiksofts.com/page-shadow
* Dépôt Github : https://github.com/Eliastik/page-shadow

Ceci est le code source de l'extension Page Shadow, compatible avec Chrome/Chromium, Firefox, Opera et Microsoft Edge. Cette extension utilise la technologie WebExtensions via l'API Browser (plus d'infos : https://developer.mozilla.org/fr/Add-ons/WebExtensions ).

Page Shadow est une extension de mode sombre (dark mode). Elle comprend une série d'outils pour améliorer la lecture de pages web dans une pièce mal éclairée ou dans un environnement sombre.

Elle vous permet :

- D'augmenter le contraste des pages, c'est à-dire de renforcer les tons sombres des pages : l'extension transforme le design de n'importe quel site en "mode sombre" ;
- De baisser la luminosité des pages ;
- D'inverser les couleurs des images ou des pages entières ;
- D'atténuer les couleurs des images ;
- D'activer un mode nuit (applique un filtre orangé sur les pages pour réduire la lumière bleue émise par l'écran).

Page Shadow dispose de nombreux paramètres pour personnaliser votre expérience de l'extension : réglages adaptés à chaque site, activation/désactivation automatique, etc.

### Installation :

Page Shadow est disponible au téléchargement et à l'installation aux adresses suivantes :

* Chrome : https://chrome.google.com/webstore/detail/eimaelgbclmdoeimifebaagealdkjmki/
* Firefox : https://addons.mozilla.org/fr/firefox/addon/page-shadow/
* Opera : https://addons.opera.com/fr/extensions/details/page-shadow/?display=fr
* Edge : https://microsoftedge.microsoft.com/addons/detail/ofcbmommmmaoekccnfojdpjgopgcbgbd

Pour les autres navigateurs compatibles, vous pouvez soit l'installer depuis le site officiel : http://eliastiksofts.com/page-shadow
Soit la compiler vous-même (voir section "Compilation").

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

Pour installer les dépendances, lancez la commande suivante :
````
npm install
````
Puis pour compiler :

* Mode dev (pas de compression) : `gulp` ou `gulp build-dev` ou `gulp build-directory-dev` (pour ne builder que sous forme de dossiers)
* Mode prod (compression) : `gulp build-prod` ou `gulp build-directory-prod` (pour ne builder que sous forme de dossiers)
* Mode watch (compilation en temps réel) : `gulp watch` (utilise la compilation du mode dev)

Si vous rencontrez l'erreur suivante lors de la compilation :

````
error:25066067:DSO support routines:dlfcn_load:could not load the shared library
````

Essayez de lancer la commande suivante : `export OPENSSL_CONF=/dev/null`

Les fichiers d'extension compilés seront créés dans le dossier "build".

(Note : le répertoire key contient une clé nécessaire à la création d'une extension Chrome).

Pour installer l'extension dans Firefox, vous devez installer Firefox Developer Edition et modifier la valeur suivante dans about:config en "false" : xpinstall.signatures.required
Puis lancez l'installation avec le fichier .xpi

Pour Chromium, faites glisser le fichier .crx dans la fenêtre des extensions (chrome://extensions).

Puis si vous souhaitez nettoyer le répertoire de build, lancez la commande `gulp clean-build`

### Licence :

Page Shadow est distribué sous licence GNU GPL-3.0 (voir le fichier LICENCE.txt)

#### Avis de licence

Copyright (C) 2015-2024 Eliastik (eliastiksofts.com)

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
- Bootstrap (CSS et Javascript), MIT license ( https://github.com/twbs/bootstrap/blob/v4-dev/LICENSE ) ;
    - Thème : Paper par Bootswatch (modifié) - https://bootswatch.com/paper/
- Cette extension utilise une photo venant de ce site : http://littlevisuals.co , domaine public ( https://creativecommons.org/publicdomain/zero/1.0/ ).
- Voir les dépendances dans le fichier package.json