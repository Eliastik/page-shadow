# Page Shadow
## Français :

Une extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Version actuelle : 2.11.3 (06/04/2025)
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

### Version 2.11.3 (06/04/2025) :

* Correction d'un bug qui pouvait parfois empêcher l'archivage Cloud de fonctionner sous Firefox en raison d'un dépassement de quota ;
* Corrections mineures d'ergonomie dans l'interface utilisateur de l'extension (affichage et édition des filtres, création d'un pré-réglage dans la popup) ;
* Autres améliorations et corrections techniques :
    * Refactorisation et simplification de certaines parties du code ;
    * Mise à jour des dépendances.

### Version 2.11.2 (23/03/2025) :

* Correction de bugs et autres ajustements :
    * Correction d'un bug qui empêchait de modifier les thèmes personnalisés n°6 à 10 ;
    * Correction d'un bug lors de la réinitialisation des paramètres : le cache des pré-réglages n'était pas mis à jour ;
    * Correction de bugs mineurs avec les pré-réglages ;
    * Mise à jour des dépendances.

### Version 2.11.1 (09/03/2025) :

* Détection automatique des thèmes sombres : Page Shadow peut désormais identifier les sites web utilisant un thème sombre. Grâce à cette fonctionnalité, vous pouvez configurer l'extension pour :
    * Se désactiver automatiquement sur les sites ou pages avec un thème sombre ;
    * Activer automatiquement un pré-réglage spécifique si un thème sombre est détecté.
* Correction de bugs et améliorations techniques :
    * Correction d’un bug où l’algorithme de détection des images sombres échouait à cause des restrictions CORS ;
    * Correction d'un bug où certaines images étaient invisibles en activant la fonctionnalité Inverser les couleurs > Page entières sur certains sites web ;
    * Correction d'un bug où certaines images SVG n'étaient pas détectées comme étant sombres par l'algorithme d'analyse des images ;
    * Correction d'un bug où certains éléments colorés n'étaient pas détectés comme tels, car leur couleur était définie sur un espace de couleur spécifique (OKLCH, OKLAB, etc.) ;
    * Correction d'un bug concernant la détection des arrière-plans transparent lorsque la couleur d'arrière-plan était définie dans un espace de couleur spécifique ;
    * Correction d'un bug avec l'inversion sélective lorsque le parent avait un fond avec couleurs vives ;
    * Correction d'un bug avec l'inversion sélective et les icônes SVG ;
    * Correction d'un bug très rare où, lors de l'ouverture des paramètres de l'extension, l'éditeur de thèmes personnalisés dysfonctionnait ;
    * Refactorisation du code : la plupart des méthodes ont été organisées dans des classes et fichiers distincts, chacun avec une responsabilité unique ;
    * Mise à jour des dépendances.

### Version 2.11 (22/12/2024) :

* Ajout de la possibilité d'activer l'inversion ou l'atténuation des éléments colorés. Il est possible ainsi de désactiver l'inversion des éléments colorés en activant l'inversion de la page entière, pour un mode sombre alternatif à la fonction Augmenter le contraste ;
* Ajout de la possibilité de modifier l'intensité du filtre de la fonction Atténuer les couleurs ;
* Les éléments textuels colorés sont désormais détectés par Page Shadow. Ainsi, ils sont pris en compte par les différentes fonctions gérant les éléments colorés : Augmenter le contraste, Inverser les couleurs et Atténuer les couleurs ;
* Lors de l'ouverture d'une nouvelle page, les fonctionnalités Baisser la luminosité, Filtre de réduction de la lumière bleue et Inverser la page entière sont appliquées plus rapidement afin d'éviter l'affichage d'un flash pouvant être désagréable, grâce à une optimisation des performances ;
* La fonction d'inversion sélective a été améliorée : elle préserve autant que possible les couleurs originales des images tout en inversant les couleurs noires et sombres en blanc, afin de rendre les éléments plus visibles sur un fond sombre ;
* L'algorithme de détection des images comportant des textes/logos ou autres éléments sombres a été revu et amélioré : il est beaucoup plus efficace et plus performant. Il est désormais activé par défaut dans cette version. Pour profiter de cette fonctionnalité, il faut activer la fonction Inverser les couleurs > Sélectif afin d'inverser les images détectées, afin qu'elles soient plus lisibles sur un fond sombre ;
    * L'algorithme analyse les images sur les pages à la recherche de motifs sombres entourés d'un fond transparent ;
    * L'algorithme peut être réglé grâce aux options avancées de l'extension, pour les utilisateurs avertis uniquement, ou via la fonctionnalité des Filtres ;
    * Des optimisations de perfomance ont été apportées à l'algorithme ;
* Une attention particulière a été portée à l'optimisation des performances de l'extension : l'extension s'adapte désormais aux performances de l'appareil et la complexité des pages web pour le moteur d'analyse des pages. Ainsi, le nombre d'éléments analysés s'adapte automatiquement en fonction du contexte pour de meilleures performances. D'autres optimisations ont également été apportées, améliorant considérablement les performances de l'extension :
    * Les fonctionnalités du moteur d'analyse des pages web de Page Shadow ont désormais un temps d'exécution maximal : si le temps d'exécution dépasse un seuil, l'exécution s'arrête temporairement afin de libérer des ressources ;
    * Les fonctionnalités du moteur d'analyse des pages web de Page Shadow s'exécutent désormais de manière asynchrone ;
    * Les changements de classes CSS des éléments s'effectue désormais en batch ;
    * D'autres optimisations du code ont été apportées afin d'améliorer les performances ;
    * Toutes ces optimisations sont réglables dans les options avancés de l'extension, pour les utilisteurs avertis seulement. Ces optimisations peuvent également être réglées via la fonctionnalité Filtres de l'extension ;
* Ajout de la possibilité de signaler un problème d'affichage des fonctionnalités de Page Shadow sur les pages web au développeur de l'extension : cela transmet l'URL de la page au développeur après le consentement de l'utilisateur, afin de l'aider à corriger le problème ;
* Correction de problèmes avec l'archivage Cloud des paramètres de Page Shadow : dans certains cas, il était possible que l'archivage échoue, à cause de l'algorithme de chunking utilisé par Page Shadow. L'algorithme a été corrigé, ce qui corrige ces problèmes. Les archives Cloud existantes ne sont pas impactées ;
* Ajout de 5 slots de pré-réglages supplémentaires (portant leur nombre à 15) ainsi que 5 slots de thèmes personnalisés supplémentaires (portant leur nombre à 10) ;
* L'extension détecte désormais les éléments sur lesquels un filtre était appliqué, mais suite à certains changements, si le filtre ne doit plus s'appliquer à l'élément, celui-ci est désormais retiré ;
* Les arrière-plans sous forme de dégradés colorés sont désormais détectés par l'extension ;
* L'interface des options avancées de l'extension a été revue, les options sont désormais groupées par catégories ;
* Amélioration du support des Shadow DOM : l'extension analyse désormais les éléments contenus dans un Shadow DOM. D'autres corrections apportent une meilleure compatibilité avec les sites utilisant cette technologie ;
* Amélioration du support des pseudo-éléments : l'extension analyse désormais les pseudo-éléments afin d'améliorer l'affichage sur les sites web utilisant cette fonctionnalité ;
* Correction d'autres bugs et améliorations techniques :
    * Ajout d'un mode de débogage, activable dans les options avancées, qui ajoute des logs de débogage et d'erreurs ;
    * Ajout de nouveaux filtres et de nouvelles options avancées ;
    * Correction d'un bug avec l'application rapide de la fonctionnalité "Augmenter le contraste", amélioration apportée par la version 2.10.4 : elle était parfois appliquée aux iframes des pages à tort, de manière aléatoire, alors que la fonction était désactivée sur la page parente ;
    * Correction de la détection des arrière-plans transparents sur certains sites web ;
    * Correction de la détection des images d'arrière-plan sur certains sites web ;
    * Correction d'un bug avec certains filtres ;
    * Correction d'un bug avec la modification des paramètres de la fonction Inverser les couleurs, lors de l'application en temps réel des changements des paramètres ;
    * Correction de la détection des changements des paramètres en temps réel avec les iframes ;
    * Correction de l'affichage du pré-réglage appliqué au site web actuel dans la popup sur Firefox : parfois, aucun pré-réglage n'était affiché, de manière aléatoire ;
    * Correction d'un bug sur certains sites web où l'attribut "class" de l'élément HTML était réinitialisé : l'extension détecte désormais ce comportement et restaure les classes nécessaires à son bon fonctionnement ;
    * Correction d'un bug sur certains sites web modifiant leur élément body : Page Shadow détecte désormais correctement ces modifications, évitant divers problèmes ;
    * Correction d'un bug lié au cache des paramètres et des filtres dans la version ManifestV3 : certaines données obsolètes ne s'expiraient pas correctement de manière aléatoire ;
    * Correction d'un bug sur la version ManifestV3 : des messages étaient envoyés très régulièrement au Service Worker de l'extension ce qui empêchait celui-ci de se mettre en veille en cas d'inactivité ;
    * Correction de l'inversion des images d'arrière-plan sur certains sites web ;
    * Correction de l'inversion des images qui sont à la racine de l'élément body ;
    * Correction de l'inversion des vidéos dans certains cas ;
    * Correction du wording de certains textes de l'extension pour plus de clarté ;
    * Correction d'erreurs avec le système gérant le menu du clic droit ;
    * Amélioration générale du code, dispatch de certaines parties du code dans des classes séparées, autres améliorations du code pour plus de lisibilité, ajout de nouvelles règles eslint ;
    * Autres corrections de bugs mineurs ;
    * Mise à jour des dépendances.

### Version 2.10.4 (09/06/2024) :

* Ajout d'un nouveau thème de popup : le thème "Compact". Comme son nom l'indique, les éléments de ce thème ont été optimisés pour réduire la hauteur de la popup de Page Shadow ;
* Le thème "Moderne" a été également optimisé par la modification de l'option "Appliquer les paramètres en temps réel" qui prend moins de place ;
* L'interface globable de l'extension a été modifiée, la plupart des éléments ont été arrondis ;
* Amélioration des performances lors de l'ouverture d'une nouvelle page avec l'utilisation de la fonctionnalité "Augmenter le contraste" : auparavant, un flash pouvait être parfois observé le temps que la fonctionnalité soit appliquée sur la nouvelle page. Grâce à des optimisations de performances, ce flash a complètement été enlevé ;
* La fonctionnalité d'archivage des paramètres dans le Cloud a été améliorée et des bugs ont été corrigés :
    * Auparavant, la sauvegarde était impossible si certains de vos paramètres étaient trop volumineux. Désormais, l'extension fait de son mieux pour découper les paramètres volumineux qui ne respectaient pas le quota imposé par les navigateurs web ;
    * Une alerte s'affiche désormais dans la popup de l'extension si le dernier archivage dans le Cloud des paramètres ne s'est pas passé correctement, et qui indique comment remédier à la situation
* Ajout expérimentale d'une détection automatique des images sombres pour la fonctionnalité Inverser les couleurs > Sélectif. Par défaut, cette fonctionnalité n'est cependant pas activée. Elle peut être activée dans les options avancées de l'extension ;
* Correction de bugs :
    * Correction d'un bug où certains sites réinitialisaient l'attribut style de l'élément HTML, de ce fait la fonctionnalité Augmenter le contraste se voyait appliquer le thème 1 au lieu du thème choisi par l'utilisateur ;
    * Correction d'un bug où les filtres ne pouvaient pas être appliqués sur l'élément body ;
    * Correction d'un bug où les transitions flashaient en blanc lors de l'application de la fonctionnalité Augmenter le contraste sur certains sites ;
    * Correction des filtres forceDisableDefaultBackgroundColor, forceDisableDefaultBackground et forceDisableDefaultFontColor ;
    * Correction d'un bug avec l'affichage des erreurs des filtres dans les paramètres avancés ;
    * Correction d'une icône dans la popup "Permission manquante" ;
    * Correction de l'aide de la fonctionnalité "Atténuer les couleurs" en mode de popup "Classique" ;
    * Autres corrections mineures et améliorations du code, mise à jour des dépendances

### Version 2.10.3 (05/03/2023) :

* Amélioration majeure de l'affichage lorsque la fonction Conserver les couleurs des éléments est activée avec la fonction Augmenter le contraste : des problèmes d'affichage pouvaient se produire, ils ont été corrigés. La fonction de préservation des couleurs est donc activée par défaut pour les nouvelles installations ;
* Dans le cas où certaines permissions importantes pour le fonctionnement de l'extension ne sont pas autorisées, une alerte s'affiche désormais sur la popup proposant de les autoriser ;
* Petits ajustements de l'interface utilisateur : les éléments ont été rendus plus arrondis, d'autres ajustements ont été effectués ;
* L'avertissement s'affichant si on quitte/actualise la page des Paramètres avancés ne s'affiche désormais que si des modifications non enregistrées ont été effectuées ;
* Modifications préparant la sortie de la version basée sur l'API Manifestv3 pour Firefox (cette version fonctionne encore sous Manifestv2 pour ce navigateur, la sortie de la version se basant sur MV3 se fera plus tard) ;
* Corrections de bugs et améliorations techniques :
    * Correction d'un bug lors de l'affichage de certains paramètres dans la popup ;
    * Correction d'un bug rare empêchant le défilement de la popup dans certains cas, notamment en cas de résolution d'écran faible, sous Firefox ;
    * Correction de la couleur du texte de la fonction Augmenter le contraste qui n'était pas appliquée aux placeholders des éléments input ;
    * Correction d'un bug aléatoire qui faisait que les requêtes mettant à jour de manière automatique les filtres se faisaient parfois de multiples fois, de manière inutile ;
    * L'échange de l'URL des pages entre content script/background service worker s'effectue désormais en utilisant le hash SHA-256, pour des raisons de confidentialité ;
    * Correction de l'affichage du fichier Lisez-moi sous Firefox lorsque le mode sombre de l'interface est activé ;
    * Mise à jour des dépendances.

### Version 2.10.2 (01/11/2022) :

* Migration vers l'API Manifest v3 (versions Chrome/Edge/Opera uniquement). Les impacts sur les fonctionnalités de Page Shadow sont très mineurs :
    * Le timer utilisé pour la fonctionnalité "Activer/désactiver auto." est moins précis, donc il est possible que l'activation/désactivation de Page Shadow se fasse avec quelques secondes de retard
* Ajout de la fonctionnalité Atténuer les couleurs (remplaçant la fonctionnalité Atténuer la couleur des images), qui permet d'atténuer la couleur des images/arrière-plans/vidéos et éléments colorés ;
* Correction des bugs :
    * Correction d'un bug avec la fonctionnalité "Conserver les couleurs des éléments" où la couleur des éléments était mal détectée sur certains éléments animés ;
    * Correction d'un bug affectant les performances de la restauration des archives Cloud sous Firefox ;
    * Correction d'un bug où le thème par défaut pris en compte était le thème "Switches et icônes" au lieu de "Moderne" ;
    * Correction d'un bug mineur où le message "L'interface utilisateur a été modifiée" s'affichait sur la popup de notification de mise à jour de l'extension dans certains cas ;
    * Corection d'un bug où le fichier Lisez-moi (dans les paramètres avancés) s'affichait dans le mauvais thème sombre/clair selon le thème paramétré pour l'appareil ;
    * Correction d'un bug mineur lors de l'accès à un fichier de type XML ;
    * Autres correctifs mineurs de l'interface utilisateur
    * Amélioration techniques :
        * Amélioration du processus de build de l'extension avec Gulp et ajout de nouvelles commandes de build ;
        * Suppression des messages d'erreur mineurs dans la console JavaScript du processus en arrière-plan de l'extension ;
        * Mise à jour des dépendances

### Version 2.10.1 (25/09/2022) :

* Optimisation majeure des performances, ce qui permet de limiter l'apparition de flashs lors de la navigation entre pages ou le changement des paramètres en temps réel ;
* Ajout de la fonction "Préserver les couleurs des éléments" (non activée par défaut) à la fonction "Augmenter le contraste". Cette fonction préserve les couleurs des éléments, mais remplace les couleurs très proches du blanc ou les couleurs sombres ;
* Amélioration de l'expérience d'utilisation lorsque le thème de la popup "Moderne" est activé. Ce thème est désormais le thème par défaut pour les nouvelles installations ;
* Améliorations mineures de l'interface des Paramètres avancés : affichage d'une icône sur les onglets si des modifications des paramètres n'ont pas été enregistrées, affichage d'un témoin de chargement lors de la restauration des archives des paramètres ;
* Ajout du paramètre "Activer le menu du clic droit" (activé par défaut) ;
* Corrections de bugs et améliorations techniques :
    * Correction d'un bug avec Firefox et les Mutation Observers ;
    * Les modifications des thèmes personnalisés s'appliquent désormais en temps réel aux pages utilisant ce thème ;
    * Correction d'un bug avec certains sites utilisant des textes avec des dégradés de couleur : les textes de ce type ne s'affichaient pas avec la fonction "Augmenter le contraste" ;
    * Correction d'un bug avec les fonctions Baisser la luminosité et Filtre de réduction de la lumière bleue : sur certains sites (comme Github), lorsque l'on retournait à la page précédente à l'aide du bouton Retour du navigateur, l'intensité des filtres augmentait de manière aléatoire ;
    * Correction de bugs avec la restauration des archives Cloud, et amélioration des performances pour Firefox lors de la restauration des archives ;
    * Correction d'un bug avec l'affichage en temps réel des paramètres dans les Paramètres avancés : si un paramètre de la popup était modifié, et qu'une modification d'un paramètre dans les paramètres avancés n'avait pas été sauvegardée, cette modification était écrasée ;
    * Correction d'un bug avec l'application des pré-réglages aux SPA (Single Page Application) lorsque des pré-réglages différents étaient paramétrés pour les différents pages ;
    * Simplification et réorganisation majeure du code de l'extension dont :
        * Utilisation de la même feuille de style CSS pour les thèmes classiques et les thèmes personnalisées, et utilisation des variables CSS ;
        * Simplification du code gérant les appels entre background page et scripts de l'extension ;
        * Le code des Mutation Observer ont été remaniés, corrigeant des problèmes ;
        * Autres améliorations techniques
    * Mise à jour des dépendences

### Version 2.10 - Hotfix 2 (20/08/2022) :

* Corrige l'application des fonctions Réduire la luminosité/Filtre de réduction de la lumière bleue sous Firefox
* Corrige les Mutation Observers sous Firefox

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

Vous pouvez compiler vous-même l'extension en une ligne de commande. Pour cela, vous devez avoir installé npm.

Pour installer npm sur votre système, plus d'infos ici : https://docs.npmjs.com/getting-started/installing-node

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

* Mode dev (pas de compression) : `npx gulp` ou `npx gulp build-dev` ou `npx gulp build-directory-dev` (pour ne builder que sous forme de dossiers)
* Mode prod (compression) : `npx gulp build-prod` ou `npx gulp build-directory-prod` (pour ne builder que sous forme de dossiers)
* Mode watch (compilation en temps réel) : `npx gulp watch` (utilise la compilation du mode dev)

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

Puis si vous souhaitez nettoyer le répertoire de build, lancez la commande `npx gulp clean-build`

### Versions Manifestv2 et Manifestv3

Les versions Manifest V2 et Manifest V3 offrent exactement les mêmes fonctionnalités et partagent une base de code commune, à l’exception de quelques différences liées aux API spécifiques à chaque version.

Il existe toutefois une différence subtile : le minuteur utilisé pour certaines fonctionnalités de l’extension (comme l’activation/désactivation automatique selon l’heure, ou la mise à jour automatique des filtres) fonctionne différemment selon la version :

- Manifest V3 : le minuteur repose sur l’API alarms, limitée à une fréquence minimale d’une minute.
- Manifest V2 : un setInterval permet un déclenchement toutes les secondes.

Par conséquent, sur la version Manifest V3, certaines actions programmées (comme l’activation horaire) peuvent être légèrement décalées par rapport à la version Manifest V2.

### Licence :

Page Shadow est distribué sous licence GNU GPL-3.0 (voir le fichier LICENCE.txt)

#### Avis de licence

Copyright (C) 2015-2025 Eliastik (eliastiksofts.com)

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