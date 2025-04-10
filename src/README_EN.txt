# Page Shadow :
## English :

An extension by Eliastik (eliastiksofts.com) - Contact : http://www.eliastiksofts.com/contact/
* Latest version: 2.11.3 (4/6/2025)
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

### Changelog:

### Version 2.11.3 (4/6/2025) :

* Fixed a bug that could occasionally prevent Cloud archiving from working in Firefox due to quota limits being exceeded;
* Minor UI improvements in the extension interface (displaying and editing filters, creating a preset from the popup);
* Other technical improvements and fixes:
    * Refactored and simplified parts of the codebase;
    * Updated dependencies.

### Version 2.11.2 (3/23/2025):

* Bug fixes and other adjustments:
    * Fixed a bug that prevented custom themes #6 to #10 from being modified;
    * Fixed a bug when resetting settings: the presets cache was not updated;
    * Fixed minor bugs with presets;
    * Dependencies updated.

### Version 2.11.1 (3/9/2025):

* Automatic detection of dark themes: Page Shadow can now identify websites using a dark theme. With this feature, you can configure the extension to:
    * Automatically disable itself on websites or webpages with a dark theme;
    * Automatically enable a specific preset if a dark theme is detected.
* Bug fixes and technical improvements:
    * Fixed a bug where the dark image detection algorithm failed due to CORS restrictions;
    * Fixed a bug where some images were invisible when enabling the Invert colors > Entire page feature on some websites;
    * Fixed a bug where some SVG images were not detected as dark by the image analysis algorithm;
    * Fixed a bug where some colored elements were not detected as such, as their color was defined on a specific color space (OKLCH, OKLAB, etc.);
    * Fixed a bug with transparent backgrounds detection when background color was defined on a specific color space;
    * Fixed a bug with selective inversion when the parent had a bright colored background;
    * Fixed a bug with selective inversion and SVG icons;
    * Fixed a very rare bug where, when opening extension settings, the custom theme editor would malfunction;
    * Code refactoring: most methods have been organized in separate classes and files, each with a unique responsibility;
    * Dependencies updated.

### Version 2.11 (12/22/2024) :

* Added the ability to enable the inversion or attenuation of colored elements. This allows users to disable the inversion of colored elements while enabling entire page inversion, providing an alternative dark mode to the Increase contrast function;
* Added the ability to adjust the filter intensity for the Attenuate colors function;
* Colored text elements are now detected by Page Shadow. They are thus taken into account by the various functions managing colored elements: Increase contrast, Invert colors, and Attenuate colors;
* When opening a new page, the Decrease brightness, Blue light reduction filter and Invert colors features are now applied faster to prevent the appearance of a potentially unpleasant flash, thanks to performance optimization;
* The selective invert feature has been improved: it preserves as far as possible the original colors of images while inverting black and dark colors to white, to make elements more visible against a dark background;
* The algorithm detecting images containing text/logos or other dark elements has been revised and improved: it is much more effective and efficient. It is now enabled by default in this version. To take advantage of this feature, you need to enable the Invert colors > Selective function so that detected images are inverted, making them more readable on a dark background;
    * The algorithm analyzes images on the webpage to detect dark pixel patterns surrounded by transparent backgrounds;
    * The algorithm can be configured via the advanced options of the extension, for advanced users only, or via the Filters functionality;
    * Performance optimizations have been made to the algorithm;
* Special attention was paid to optimizing the performance of the extension: it now adapts to the device's performance and the complexity of web pages for the page analysis engine. The number of elements analyzed automatically adjusts based on the context for better performance. Other optimizations have also been made, significantly improving the extension’s performance:
    * The Page Shadow web page analysis engine's features now have a maximum execution time: if the execution time exceeds a threshold, it temporarily pauses execution to free up resources;
    * The features of the Page Shadow web page analysis engine now execute asynchronously;
    * CSS class changes are now applied in batches;
    * Other code optimizations have been made to improve performance;
    * All these optimizations can be adjusted in the advanced options of the extension, for advanced users only. These optimizations can also be managed via the extension’s Filters feature;
* Added the ability to report a problem with the display of web pages using Page Shadow features to the extension developer: this transmits the URL of the page to the developer after user consent, to help correct the problem;
* Fixed issues with Cloud archiving of Page Shadow settings: in some cases, archiving could fail due to the chunking algorithm used by Page Shadow. The algorithm has been corrected, resolving these issues. Existing Cloud archives are not affected;
* Added 5 additional preset slots (bringing the total to 15) and 5 additional custom theme slots (bringing the total to 10);
* The extension now detects elements where a filter was applied but, due to certain changes, the filter no longer needs to be applied. Filters are now properly removed from the element in this case;
* Gradient-colored backgrounds are now detected by the extension;
* The advanced options interface has been revamped, with options now grouped by category;
* Improved Shadow DOM support: the extension now analyzes elements contained in a Shadow DOM. Other fixes bring greater compatibility with websites using this technology;
* Improved support for pseudo-elements: the extension now analyzes pseudo-elements to improve display on websites using this feature;
* Fixed other bugs and technical improvements:
    * A debug mode has been added, which can be enabled in the advanced options, adding debugging and error logs;
    * Added new filters and advanced options;
    * Fixed a bug with the quick application of the "Increase Contrast" feature, an improvement introduced in version 2.10.4: it was sometimes incorrectly applied to iframes on the page, even when the feature was disabled on the parent page;
    * Fixed the detection of transparent backgrounds on certain websites;
    * Fixed background image detection on some websites;
    * Fixed a bug with some filters;
    * Fixed a bug with changing the settings of the Invert colors function when applying real-time changes to the settings;
    * Fixed detection of real-time settings changes with iframes;
    * Fixed display of the preset applied to the current website in the popup on Firefox: sometimes, no preset was displayed, randomly;
    * Fixed a bug on some websites where the "class" attribute of the HTML element was reset: the extension now detects this behavior and restores the classes necessary for it to function properly;
    * Fixed a bug on some websites modifying their body element: Page Shadow now correctly detects these modifications, avoiding various problems;
    * Fixed a bug in the settings and filters cache in the ManifestV3 version: some obsolete data did not expire correctly at random;
    * Fixed a bug in the ManifestV3 version: messages were regularly sent to the extension's Service Worker, preventing it from going to sleep in the event of inactivity;
    * Fixed inversion of background images on some websites;
    * Fixed inversion of images at the root of the body element;
    * Fixed video inversion in certain cases;
    * Corrected the wording of some extension texts for better clarity;
    * Fixed errors with the right-click menu system;
    * General code improvements, dispatch of certain parts of the code into separate classes, other code improvements for greater readability, addition of new eslint rules;
    * Other minor bug fixes;
    * Dependencies updated.

### Version 2.10.4 (6/9/2024) :

* Addition of a new popup theme: the "Compact" theme. As its name suggests, the elements of this theme have been optimized to reduce the height of the Page Shadow popup;
* The "Modern" theme has also been optimized by modifying the "Apply settings in real time" option, which takes up less space;
* The extension's overall interface has been modified, with most elements rounded off;
* Improved performance when opening a new page using the "Increase contrast" feature: previously, a flash could sometimes be observed while the feature was being applied to the new page. Thanks to performance optimizations, this flash has been completely eliminated;
* The functionality for archiving settings in the Cloud has been improved, and a number of bugs have been corrected:
    * Previously, it was impossible to backup your settings if they were too large. Now, the extension does its best to cut out large settings that didn't meet the quota imposed by web browsers;
    * An alert is now displayed in the extension popup if the last archiving of settings in the Cloud was not successful, indicating how to remedy the situation.
* Experimental addition of automatic detection of dark images for Invert colors > Selective. By default, however, this feature is not enabled. It can be enabled in the extension's advanced options;
* Bug fixes:
    * Fixed a bug where some websites would reset the HTML element's style attribute, resulting in the Increase contrast feature being applied theme 1 instead of the user-selected theme;
    * Fixed a bug where filters could not be applied to the body element;
    * Fixed a bug where transitions flashed white when applying the Increase contrast feature on some websites;
    * Fixed forceDisableDefaultBackgroundColor, forceDisableDefaultBackground and forceDisableDefaultFontColor filters;
    * Fixed a bug with the display of filter errors in advanced settings;
    * Fixed an icon in the “Missing permission” popup;
    * Fixed "Attenuate colors" feature help in "Classic" popup mode;
    * Other minor corrections and code improvements, dependency updates

### Version 2.10.3 (3/5/2023) :

* Major improvement of the display when the function Preserve element colors is enabled with the function Increase contrast: display problems could occur, they have been fixed. The Color preservation function is now enabled by default for new installations;
* In case some important permissions for the extension are not allowed, an alert is now displayed on the popup suggesting to allow them;
* Small adjustments to the user interface: elements have been made more rounded, other adjustments have been made;
* The warning that appears when exiting/refreshing the Advanced Settings page now only appears if unsaved changes have been made;
* Changes in preparation for the release of the Manifestv3 API-based version for Firefox (this version still runs on Manifestv2 for this browser, the MV3-based version will be released later);
* Bug fixes and technical improvements:
    * Fixed a bug when displaying some settings in the popup;
    * Fixed a rare bug that prevented the popup from scrolling in some cases, especially in case of low screen resolution, under Firefox;
    * Fixed the text color of the Increase contrast function that was not applied to the placeholders of the input elements;
    * Fixed a random bug that caused requests to automatically update filters to occur multiple times, unnecessarily;
    * The exchange of page URLs between content script/background service worker is now done using the SHA-256 hash, for privacy reasons;
    * Fixed the display of the Readme file in Firefox when the dark mode of the interface is enabled;
    * Updated dependencies.

### Version 2.10.2 (11/1/2022) :

* Migration to Manifest v3 API (Chrome/Edge/Opera versions only). The impacts on the features of Page Shadow are very minor:
    * The timer used for the "Auto enable/disable" feature. is less precise, so it's possible that the enabling/disabling of Page Shadow is done with a few seconds delay
* Added Attenuate colors feature (replacing Attenuate image colors feature), which allows to attenuate the color of images/backgrounds/videos and colored elements;
* Bug fixes:
    * Fixed a bug with the "Preserve element colors" feature where elements colors was incorrectly detected on some animated elements;
    * Fixed a bug affecting the performance of restoring Cloud archives on Firefox;
    * Fixed a bug where the default theme was the "Switches and icons" theme instead of "Modern";
    * Fixed a minor bug where the message "UI has been updated" was displayed on the extension update notification popup in some cases;
    * Fixed a bug where the Readme file (in advanced settings) was displayed in the wrong dark/light theme depending on the theme set for the device;
    * Fixed a minor bug when accessing an XML type file;
    * Other minor UI fixes
    * Technical improvements:
        * Improved extension build process with Gulp and added new build commands;
        * Removed minor error messages in the JavaScript console from the extension's background process;
        * Update dependencies

### Version 2.10.1 (9/25/2022) :

* Major performance optimization, which limits the flashes that appeared when navigating between pages or changing settings in real time;
* Added "Preserve element colors" function (not enabled by default) to "Increase contrast" function. This function preserves the colors of the elements, but replaces colors very close to white or dark colors;
* Improved user experience when "Modern" popup theme is enabled. This theme is now the default theme for new installations;
* Minor improvements to the Advanced Settings interface: display of an icon on tabs if changes to settings have not been saved, display of a loading indicator when restoring settings archives;
* Add the setting "Enable right-click menu" in General settings (enabled by default);
* Bug fixes and technical improvements:
    * Fixed bug with Firefox and Mutation Observers;
    * Changes to custom themes now apply in real time to pages using that theme;
    * Fixed a bug with some sites using texts with color gradients: texts of this type were not displayed with the "Increase contrast" function;
    * Fixed a bug with the settings Decrease brightness and Blue light filter: on some websites (like Github), when going back to the previous page with the browser back button, the filter intensity increased randomly;
    * Fixed bugs when restoring cloud archives, and improved performance for Firefox when restoring archives;
    * Fixed a bug with the real-time display of settings in Advanced Settings: if a popup setting was changed, and a change to a setting in Advanced Settings had not been saved, that change was lost;
    * Fixed a bug with presets applying to SPA (Single Page Applications) when different presets where set to different pages;
    * Simplification and major reorganization of the extension code including:
        * Use of the same CSS stylesheet for classic themes and custom themes, and use of CSS variables;
        * Simplification of the code managing the message passing between background page and scripts of the extension;
        * The Mutation Observer code has been reworked, fixing issues;
        * Other technical improvements
    * Update dependencies

### Version 2.10 - Hotfix 2 (8/20/2022) :

* Fix the features Decrease brightness/Blue light reduction filter on Firefox
* Fix Mutation Observers on Firefox

### Version 2.10 - Hotfix 1 (8/20/2022) :

* Fix migration of current settings (decrease brightness and night mode)

### Version 2.10 (8/18/2022) :
* Page Shadow has undergone a redesign of its graphical interface. Many new features are available:
    * Added a dark mode for the entire Page Shadow interface. The dark mode is automatically enabled according to the device settings.
    * Added 2 new interface modes for the popup: "Switches and icons" mode (enabled by default) and "Modern" (still in beta, and will be the default interface of the Page Shadow popup on the next version)
    * The Advanced settings interface has undergone a total overhaul: now organized in the form of tabs, which allows easier navigation in the settings
    * Dark/light mode and popup interface theme can be set in Advanced settings
* Separation of "Night mode" from "Decrease page brightness" function: "Night mode" is now a separate function, named "Blue light reduction filter"
    * It's now possible to combine the 2 functions
    * Existing user settings will be automatically migrated to this new setting (including presets)
* Added the "Attenuate image colors" function to avoid displaying colors that are too bright;
* It's now possible to automatically archive Page Shadow settings in the Cloud, at a configurable interval (by default, this feature is disabled);
* A warning is now displayed to warn of the importance of making an archive of the extension settings;
* Optimization of downloading and automatic updating of filters: they are updated only if necessary (date of last update of the file on the server). If an update is necessary, a message is displayed at the level of the list of filters;
* Added advanced options for advanced users in Advanced settings;
* Bug fixes and technical improvements:
    * Fixed a bug that could occur when selecting a custom theme and then a classic (non-custom) theme: the custom theme remained applied to the other tabs;
    * Fixed a rare bug with some websites, where the extension had difficulty applying the "Increase page contrast" function (websites forcing reset of some HTML attributes)
        * Added "delayApplyMutationObserversSafeTimer" filter functionality to fix this issue;
    * Fixed a bug with some websites, where the functions were removed by the website page changes (Github for example, when navigating between pages)
        * Added 2 new filters to configure this bugfix (observeBodyChange and observeBodyChangeTimerInterval)
    * Fixed a bug with the function "Invert entire page colors" on Firefox;
    * Fixed bugs with the function "Invert colors" on all browsers;
    * Fixed bugs with Mutation Observers;
    * Fixed a bug with some websites and the application of some filters (forceDisableDefault...);
    * Fixed applying some filters to the body element;
    * Optimized extension size;
    * Fixed other minor bugs and minor performance optimizations;
    * Font Awesome is now managed with NPM;
    * Simplified code;
    * Updated dependencies.

#### Version 2.9.1 (12/26/2021):
* Improved performance when enabling/disabling Page Shadow and when changing settings
* Improved performance of the processing of web pages by Page Shadow
    - Optimization of "Mutation Observers"
    - These optimizations can be configured thanks to new filter rules
* It's now possible to set a color in RGB or in HSV in the custom themes settings
* Added an optional list "Ultra performance mode"
* Added theme n°16
* Bug fixes:
    - Fixed a bug with the filters applied to the subframes (iframes) of a page: the filters taken into account were those of the parent page and not those of the frames
    - Fixed a bug with websites using the Shadow DOM feature: the Invert the colors setting was not taken into account
    - Fixed a bug when reinstalling default filters: manually added filter sources were deleted following this action
    - Fixed a rare crash when opening a web page from another domain in a new tab from another web page
    - Fixed a bug when Page Shadow was disabled for a website which had opened an "about:blank" popup window: the state was not applied to the popup
    - Fixed a false positive for the automatic detection of transparent elements
    - The advanced settings and the test page now only open in one tab at a time
    - If an error occurs while updating a filter, Page Shadow now retries to update it 5 minutes later
    - Fixed the "Create a preset" popup icon
* Technical improvements:
    - Some elements are now ignored when processing web pages by Page Shadow
    - Update of dependencies

#### Version 2.9 (12/12/2021):
* Added the ability to create a preset and update a preset with current settings directly in the extension menu;
* Added the "Selective" setting for the Invert the colors function: this setting, based on the filters feature, allows you to invert the colors of a small number of elements which may be displayed incorrectly on a dark theme of the Increase page contrast function;
* Improved display of the Increase page contrast function on most websites:
    - Transparent backgrounds are now automatically detected (they were previously colored which could hide certain elements of websites), without going through the filters feature;
    - Fixed detection of background images;
    - Fixed the application of the function on websites using the "Shadow Roots" feature (used for example on bugs.chromium.org);
    - The replacement of the border of the form fields isn't enabled by default (to be activated via the filters)
* Presets enabled for a webpage now have a higher priority than those enabled for the whole website;
* Improved Filters feature (advanced settings):
    - More data is displayed in the filter settings: total number of filters and storage space taken by the filters;
    - The custom filter editor now has an auto-completion system;
    - The filters display and the custom filter editor now have an adapted syntax highlighting;
    - Filters in error are now displayed with a clear error message and the error detection line, which allows you to quickly view the errors;
    - Distinction between standard rule and special rule (which govern the internal functioning of the extension);
    - Added new filter rules.
* When changing custom themes or presets in advanced settings, Page Shadow warns you if changes to settings have not been saved;
* Performance improvement:
    - The settings are now applied in real time only if they have actually changed. In previous versions, the settings were refreshed if a global setting was changed (even if it didn't directly influence a given website). This improves performance;
    - Performance improvement when the percentage of brightness reduction was changed when the Apply the settings in real time function was enabled;
    - Improved performance of "Mutation observers"
* Bugfixes:
    - Fixed filter rules that were not applied in rare cases;
    - Fiex the presets automatically enabled per page for dynamic SPA applications: the setting was not applied when browsing between pages;
    - Fixed display of presets created with old versions of Page Shadow (<2.8): in some cases, the display could be incorrect;
    - Fixed Cloud archiving: in some cases, archiving could not be performed but no error was displayed;
    - Fixed Cloud archiving when the Cloud storage quota was exceeded;
    - Fixed Cloud archiving: settings are splitted into several items to avoid a quota per item overrun error;
    - Fixed a bug with the disabling of Page Shadow on certain websites accessed from Google on Chrome: in the event that Google highlighted a text in the page, the Page Shadow disabling feature for the page didn't work ("#:~:text=" was added at the end of the URL by Google);
    - Fixed the change of disabled/enabled state for a website when the Apply the settings in real time function was disabled: the change is no longer applied in this case;
    - Fixed the treatment of regular expressions in filters;
    - Fixed application of parent page state (enabled/disabled) for iframes;
    - Fixed a bug with the wildcards for the features allowing to disable/enable Page Shadow for a website/webpage, to enable/disable a preset for a website/webpage as well as for filters;
        - It is now possible to escape a wildcard with a backslash (\)
    - Page Shadow is now applied to "about:blank" pages
* Technical improvements:
    - Improved mutation observer: detection of the mutation of the attributes "style" and "class" is now more precise, the sub-elements of elements modified or added to the page are now treated;
        - These improvements can be configured per site/webpage via new special filter rules;
    - Conversion of Promises to async/await, which simplifies the code;
    - The constants have been separated into a new file (constants.js);
    - Filters feature now in a FilterProcessor class;
    - The Opera version is no longer built, the Chromium version running natively on Opera;
    - Added <all_urls> permission for Chromium based browsers (like Firefox version);
    - Fixed calls to "deprecated" functions;
    - Updated dependencies.

#### Version 2.8 (10/24/2021) :
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

#### Version 2.7 (16/08/2019) :
* Added the ability to create multiple custom themes instead of just one before;
* Added Cloud backup in Backups and presets in Advanced settings;
* Improved blacklist/whitelist with more blocking options (wildcard \*, regular expressions, etc.);
* The whitelist now supports the same options as the blacklist, previously it only accepted domains;
* Bug fixes and texts fixes.

#### Version 2.6 (31/10/2018) :
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

#### Version 2.5 (29/04/2018) :
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

#### Version 2.4 (02/01/2018) :
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

#### Version 2.3 (1/12/2017) :
* Added the possibility to create a custom theme;
* Improved the Invert images colors tool: background images are now detected, which greatly improves the rendering of the tool;
* Bug fixes and adjustments:
    - Simplified and improved CSS code, which improves the compatibility with some websites (the tool Increase page contrast now target all HTML elements except some exceptions);
    - The extension now works for local web pages (URLs file://) and for the ftp protocol;
    - Fixed a bug with the tool Decrease page brightness with some websites;
    - Updated some software libraries;
    - Fixed the HTML code of the Advanced settings page;
    - Others minor adjustments and minor bug fixes.

#### Version 2.2 (25/10/2017) :
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

#### Version 2.1.1, or 2.1 REV1 (09/09/2017) :
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

For Chromium, slide the .crx file in the extension window (chrome://extensions).

Then if you want to clean the build directory, run the command `gulp clean-build`

### Licence :

Page Shadow is distributed under GPL-3.0 license (see LICENCE.txt file)

#### License notice

Copyright (C) 2015-2025 Eliastik (eliastiksofts.com)

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