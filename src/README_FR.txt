# Page Shadow
## Français :

Une extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Version actuelle : 2.10 (18/08/2022)
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

### Journal des changements :

### Version 2.10 - Hotfix 1 (20/08/2022) :

* Corrige la migration des paramètres actuels (réduction de la luminosité et mode nuit)

#### Version 2.10 (18/08/2022) :
* Page Shadow a subit une refonte de son interface graphique. De nombreuses nouveautés sont disponibles :
    * Ajout d'un mode sombre pour toute l'interface de Page Shadow. Il s'active automatiquement selon les paramètres de l'appareil.
    * Ajout de 2 nouveaux modes d'interface pour la popup : le mode "Switches et icônes" (activé par défaut) et "Moderne" (encore en bêta, et sera l'interface par défaut de la popup de Page Shadow sur la prochaine version)
    * L'interface des Paramètres avancées a subit une refonte totale : elle est désormais organisée sous forme d'onglets, ce qui permet une navigation plus facile dans les paramètres
    * Le mode sombre/claire et le thème de l'interface de la popup sont paramétrables dans les Paramètres avancés
* Séparation du "Mode nuit" de la fonction "Baisser la luminosité de la page" : le "Mode nuit" est désormais une fonction à part, nommée "Filtre de réduction de la lumière bleue"
    * Cela permet de combiner les 2 fonctions
    * Les paramètres des utilisateurs existants seront automatiquement migrés vers ce nouveau fonctionnement (y compris les pré-réglages)
* Ajout de la fonction "Atténuer la couleur des images" permettant d'éviter d'afficher des couleurs trop vives ;
* Il est désormais possible d'archiver automatiquement les paramètres de Page Shadow dans le Cloud, à un intervalle paramétrable (par défaut, cette fonctionnalité est désactivée) ;
* Un avertissement est désormais affiché pour avertir de l'importance d'effectuer une archive de ses paramètres de l'extension ;
* Optimisation du téléchargement et de la mise à jour automatique des filtres : ceux-ci sont mis à jour uniquement si nécessaire (date de dernière mise à jour du fichier sur le serveur). Si une mise à jour est nécessaire, un message est affiché au niveau de la liste des filtres ;
* Ajout d'options avancées pour les utilisateurs avertis dans les Paramètres avancés ;
* Corrections de bugs et améliorations techniques :
    * Correction d'un bug qui pouvait survenir lorsque l'on sélectionnait un thème personnalisé puis un thème classique (non personnalisé) : le thème personnalisé restait appliqué aux autres onglets ;
    * Correction d'un rare bug avec certains sites, où l'extension avait des difficultés à appliquer la fonction "Augmenter le contraste" (les sites web forçant la réinitialisation de certains attributs HTML)
        * Ajout de la fonctionnalité de filtre "delayApplyMutationObserversSafeTimer" pour corriger ce problème ;
    * Correction d'un bug avec certains sites, où les fonctions de l'extension étaient écrasées par certains changements sur les pages (Github par exemple, en naviguant entre pages)
        * Ajout de 2 nouveaux filtres pour configurer cette correction (observeBodyChange et observeBodyChangeTimerInterval)
    * Correction d'un bug avec la fonction "Inverser les couleurs de la page entière" sous Firefox ;
    * Correction de bugs avec la fonction "Inverser les couleurs" sur tous les navigateurs ;
    * Correction de bugs avec les Mutation Observers ;
    * Correction d'un bug avec certains sites web et l'application de certains filtres (forceDisableDefault...) ;
    * Correction de l'application de certains filtres à l'élément body ;
    * Optimisation de la taille de l'extension ;
    * Correction d'autres bugs mineurs et optimisation mineure des performances ;
    * Simplifications du code ;
    * Gestion de Font Awesome avec NPM ;
    * Mise à jour des dépendances.

#### Version 2.9.1 (26/12/2021) :
* Amélioration des performances lors de l'activation/désactivation de Page Shadow et lors de la modification des paramètres
* Amélioration des performances du traitement des pages web par Page Shadow
    - Optimisation des "Mutation Observers"
    - Ces optimisations sont paramétrables grâce à de nouvelles règles de filtre
* Il est désormais possible d'indiquer une couleur en RGB ou en HSV dans les paramètres des thèmes personnalisés
* Ajout d'une liste optionnelle "Mode ultra performance"
* Ajout du thème n°16
* Correction de bugs :
    - Correction d'un bug avec les filtres appliqués aux sous-cadres (iframes) d'une page : les filtres pris en compte étaient ceux de la page parent et non ceux du cadres
    - Correction d'un bug avec les sites web utilisant la fonctionnalité Shadow DOM : le paramétrage Inverser les couleurs n'était pas pris en compte
    - Correction d'un bug lors de la réinstallation des filtres par défaut : les sources de filtre ajoutés manuellement étaient supprimés suite à cette action
    - Correction d'un plantage rare lors de l'ouverture d'une page web d'un autre domaine dans un nouvel onglet à partir d'une autre page web
    - Correction d'un bug lorsque Page Shadow était désactivé pour un site web qui avait ouvert une fenêtre popup "about:blank" : l'état n'était pas appliqué à la popup
    - Correction d'un faux positif pour la détection automatique des éléments transparents
    - Les Paramètres avancés et la page de test ne s'ouvrent désormais que dans un seul onglet à la fois
    - En cas d'erreur lors de la mise à jour d'un filtre, Page Shadow ré-essaye désormais de le mettre à jour 5 minutes plus tard
    - Correction de l'icône de la popup "Créer un pré-réglage"
* Améliorations techniques :
    - Certains éléments sont désormais ignorés lors du traitement des pages web par Page Shadow
    - Mise à jour des dépendances

#### Version 2.9 (12/12/2021) :
* Ajout de la possibilité de créer un pré-réglage et de mettre à jour un pré-réglage avec les paramètres actuels directement dans le menu de l'extension ;
* Ajout du paramétrage "Sélectif" pour la fonctionnalité "Inverser les couleurs" : ce paramètrage, basé sur la fonctionnalité des filtres, permet d'inverser les couleurs d'un nombre restreint d'éléments qui peuvent mal s'afficher sur un thème sombre de la fonctionnalité Augmenter le contraste ;
* Amélioration de l'affichage de la fonctionnalité Augmenter le contraste sur la plupart des sites web
    - Les fonds transparents sont désormais détectés automatiquement (ils étaient auparavant colorés ce qui pouvait cacher certains éléments des sites web), et cela sans passer par la fonctionnalité des filtres ;
    - Correction de la détection des images d'arrière-plan ;
    - Correction de l'application de la fonctionnalité sur les sites web utilisant la fonctionnalité "Shadow Roots" (utilisée par example sur bugs.chromium.org) ;
    - Remplacement de la bordure des champs de formulaire non activés par défaut (à activer via les filtres)
* Les pré-réglages activés pour une page web ont désormais une plus grande priorité par rapport à ceux activés pour le site web globalement ;
* Amélioration de la fonctinnalité Filtres (paramètres avancés) :
    - Plus de données sont affichées au niveau du paramétrage des filtres : nombre de filtre au total et espace de stockage pris par les filtres ;
    - L'édition du filtre personnalisé a désormais un système d'auto-complétion ;
    - L'affichage des filtres et l'éditeur du filtre personnalisé ont désormais une coloration syntaxique adaptée ;
    - Les filtres en erreur sont désormais affichés avec un message d'erreurs clair et la ligne de détection de l'erreur, ce qui permet de visualiser rapidement les erreurs ;
    - Distinction entre règle standard et règle spéciales (qui régissent le fonctionnement interne de l'extension) ;
    - Ajout de nouvelles règles de filtres.
* Lors de la modification des thèmes personnalisés ou des pré-réglages dans les paramètres avancés, Page Shadow vous averti si les changements apportés aux paramètrages n'ont pas été enregistrés ;
* Amélioration des performances :
    - Les paramètres sont désormais appliqués en temps réel uniquement si ceux-ci ont effectivement changé. Dans les précédentes versions, les paramètres étaient rafraîchis si un paramètre global était modifié (même s'il n'influait pas directement sur un site web donné). Cela améliore les performances ;
    - Amélioration des performances lorsque le pourcentage de baisse de luminosité était modifié lorsque la fonction Appliquer les paramètres en temps réel était activée ;
    - Amélioration des performances des "Mutation observers"
* Correction de bugs :
    - Correction des règles qui n'étaient pas appliqués dans de rares cas ;
    - Correction des pré-réglages automatiquement activés par page pour les applications dynamiques SPA : le paramétrage n'était pas appliqué lors de la navigation entre pages ;
    - Correction de l'affichage des pré-réglage créés avec d'anciennes versions de Page Shadow (< 2.8) : dans certains cas, l'affichage pouvait être incorrect ;
    - Correction de l'archivage Cloud : dans certains cas, l'archivage ne pouvait pas être effectué mais aucune erreur n'était affichée ;
    - Correction de l'archivage Cloud lorsque le quota de stockage Cloud était dépassé ;
    - Correction de l'archivage Cloud : découpage des paramètres en plusieurs items pour éviter une erreur de dépassement de quota par item ;
    - Correction d'un bug avec la désactivation de Page Shadow sur certains sites web accédés depuis Google sur Chrome : dans le cas où Google surlignait un texte dans la page, la fonctionnalité de désactivation de Page Shadow pour la page ne fonctionnait pas (ajout de "#:~:text=" à la fin de l'URL par Google) ;
    - Correction du changement de l'état désactivé/activé pour un site web lorsque la fonction Appliquer les paramètres en temps réel était désactivé : le changement n'est désormais plus appliqué dans ce cas ;
    - Correction du traitement des expressions régulières dans les filtres ;
    - Correction de l'application de l'état de la page parent (activé/désactivé) pour les iframes ;
    - Correction d'un bug avec les caractères joker pour les fonctionnalités permettant de désactiver/activer Page Shadow pour un site web/page, d'active/désactiver un pré-réglage pour un site web/page ainsi que pour les filtres ;
        - Il est désormais possible d'échapper un caracètre joker avec un antislash (\)
    - Page Shadow est désormais appliqué aux pages "about:blank"
* Amélioration techniques
    - Mutation observer améliorés : détection de la mutation des changements des attributs "style" et "class" plus précise, traitement des sous-éléments des éléments modifiés ou ajoutés à la page ;
        - Ces améliorations sont paramétrables par site/page via de nouvelles règles de filtre spéciales ;
    - Conversion des Promise en async/await, ce qui simplifie le code ;
    - Les constantes ont été séparées vers un nouveau fichier (constants.js) ;
    - Fonctionnalité des filtres désormais dans une classe FilterProcessor ;
    - La version Opera n'est désormais plus construite, la version Chromium fonctionnant nativement sur Opera ;
    - Ajout de la permission <all_urls> pour les navigateurs basés sur Chromium (comme pour la version Firefox) ;
    - Correction des appels à des fonctions "deprecated" ;
    - Mise à jour des dépendances.

#### Version 2.8 (24/10/2021) :
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

#### Version 2.7 (16/08/2019) :
* Ajout de la possibilité de créer plusieurs thèmes personnalisés au lieu d'un seul auparavant ;
* Ajout de Archive Cloud dans Archives et pré-réglages des Paramètres avancés ;
* Amélioration de la liste noire/blanche avec plus d'options de blocage (joker \*, expressions régulières, etc.) ;
* La liste blanche supporte désormais les mêmes options que la liste noire, auparavant elle acceptait uniquement les domaines ;
* Corrections de bugs et des textes.

#### Version 2.6 (31/10/2018) :
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

#### Version 2.5 (29/04/2018) :
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


#### Version 2.4 (02/01/2018) :
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

#### Version 2.3 (1/12/2017) :
* Ajout de la possibilité de créer un thème personnalisé ;
* Amélioration de l'outil Inverser les couleurs des images : les images d'arrière-plan sont désormais détectées, ce qui améliore grandement le rendu de l'outil ;
* Corrections de bugs et ajustements :
    - Code CSS simplifié et amélioré, ce qui améliore la compatibilité avec certains sites web (l'outil Augmenter le contraste de la page cible tous les éléments HTML sauf quelques exceptions) ;
    - L'extension fonctionne désormais pour les pages web locales (URLs file://) et pour le protocole ftp ;
    - Correction d'un bug avec l'outil Baisser la luminosité de la page avec certains sites web ;
    - Mise à jour de certaines bibliothèques logicielles ;
    - Code HTML de la page des Paramètres avancés corrigé ;
    - Autres petits ajustements et corrections de bugs mineurs.

#### Version 2.2 (25/10/2017) :
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

#### Version 2.1.1, ou 2.1 REV1 (09/09/2017) :
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

Pour installer les dépendances, lancez la commande suivante :
````
npm install
````
Puis pour compiler :

* Mode dev (pas de compression): `gulp` ou `gulp build-dev`
* Mode prod (compression): `gulp build-prod` ou `build-prod-no-css-compress` (compresse uniquement les fichiers js)

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

Copyright (C) 2015-2022 Eliastik (eliastiksofts.com)

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