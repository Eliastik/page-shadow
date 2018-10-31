# Page Shadow :
## Français :

Une extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Version actuelle : 2.6 (31/10/2018)
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
La compilation nécessite les paquets npm suivants (qui seront créés dans le dossier de ce projet) : gulp (local), fs, gulp-clean, gulp-clean-css, gulp-crx-pack, gulp-minify, gulp-zip, gulp-less et run-sequence

Pour les installer, lancez la commande suivante :
````
npm install
````
Puis pour compiler :

* Mode dev (pas de compression): `gulp` ou `gulp build-dev`
* Mode prod (compression): `gulp build-prod` ou `gulp build-prod-no-js-compress` (compresse uniquement les fichiers css) or `build-prod-no-css-compress` (compresse uniquement les fichiers js)

Les fichiers d'extension compilés seront créés dans le dossier "build".

(Note : le répertoire key contient une clé nécessaire à la création d'une extension Chrome).

Pour installer l'extension dans Firefox, vous devez modifier la valeur suivante dans about:config en "false" : xpinstall.signatures.required
Puis lancez l'installation avec le fichier .xpi

Pour Chrome, faites glisser le fichier .crx dans la fenêtre des extensions (chrome://extensions).

Puis si vous souhaitez nettoyer le répertoire de build, lancez la commande `gulp clean-build`

### Licence :

Copyright (C) 2015-2018 Eliastik (eliastiksofts.com)

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
- Colpick, MIT license/GPL 2.0 ( https://github.com/mrgrain/colpick/blob/master/LICENSE ) ;
- CodeMirror, MIT license ( https://github.com/codemirror/CodeMirror/blob/master/LICENSE ) ;
- Cette extension utilise une photo venant de ce site : http://littlevisuals.co , domaine public ( https://creativecommons.org/publicdomain/zero/1.0/ ).
