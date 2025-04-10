# Page Shadow - English

## Changelog:

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

### Version 2.9.1 (12/26/2021):
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

### Version 2.9 (12/12/2021) :
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
* Technical improvements
    - Improved mutation observer: detection of the mutation of the attributes "style" and "class" is now more precise, the sub-elements of elements modified or added to the page are now treated;
        - These improvements can be configured per site/webpage via new special filter rules;
    - Conversion of Promises to async/await, which simplifies the code;
    - The constants have been separated into a new file (constants.js);
    - Filters feature now in a FilterProcessor class;
    - The Opera version is no longer built, the Chromium version running natively on Opera;
    - Added <all_urls> permission for Chromium based browsers (like Firefox version);
    - Fixed calls to "deprecated" functions;
    - Updated dependencies.

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

### Version 2.1 (04/09/2017) :
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

### Version 2.0.3 (09/07/2017) :
* It is now possible to disable Page Shadow for a particular website or page via the right-click or via the extension menu
* Bug fixes and minor adjustments :
    - Themes 2 and 3 now have a gray background for transparent images
    - Added support for HTML form and caption elements by the Increase page contrast tool (improves rendering of the tool)
    - Fixed a bug with tool setting Decrease page brightness
    - The image on the test page of the extension now correctly resizes when the browser window is resized
    - Basic support for future versions of Firefox for Android (not tested)
    - Small adjustments of the code

### Version 2.0.2 (17/06/2017) :
* The settings can now be applied in real time
* Fixed Page Shadow icon (the shadow is better)
* Bugs fixes :
    - Bug fixed with the manifest.json file (one manifest.json different for each browser have been created)
    - Bug fixed with the automatic reactivation of the tool Increase page contrast with some particular websites (such as Youtube)
    - Bug fixed with the Gulpfile (which allows the compilation of the extension). The extension can now be compiled for Edge and Opera
    - Other minor adjustements.

### Version 2.0.1 (09/06/2017) :
* Microsoft Edge support
* Performance improvements and bugs fixes :
    - Switched to chrome.storage API instead of localstorage
    - Removed Jquery dependency for Content Scripts
    - Fixed bug with browser language detection : the form field in the advanced settings remained blank in certains cases
    - Fixed bug with the Increase page contrast tool with some websites (such as Youtube)
    - Other minor adjustements.

### Version 2.0 (05/06/2017) :
* Firefox support
* New graphical theme based on Bootstrap
* Integrated translation engine and added English translation
* Added color themes for the "Increase contrast" tool
* Added night mode
* Added a mode to invert the color of the images
* Performance improvements
* Various fixes (bugs, texts)

### Version 1.2.1 :
* Fixed bug in the advanced settings
* Adding informations about the extension in the advanced settings

### Version 1.2 :
* Optimisation of the popup layout
* Improved function "Increase page contrast". The transparent images are now supported
* Some adjustements

### Version 1.1 :
* Improved function "Increase page contrast"

### Version 1.0 :
* Initial version


# Page Shadow - Français

## Journal des changements :

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

### Version 2.10 (18/08/2022) :

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

### Version 2.9.1 (26/12/2021) :
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

### Version 2.9 (12/12/2021) :
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

### Version 2.1 (04/09/2017) :
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

### Version 2.0.3 (09/07/2017) :
* Il est désormais possible de désactiver Page Shadow pour un site ou une page particulière via le clic-droit ou via le menu de l'extension ;
* Corrections de bugs et ajustements mineurs :
    - Les thèmes 2 et 3 ont désormais un fond gris pour les images transparentes ;
    - Ajout de la prise en charge des éléments HTML form et caption par l'outil Augmenter le contraste (améliore le rendu de l'outil) ;
    - Correction d'un bug avec le réglage de l'outil Baisser la luminosité de la page ;
    - L'image de la page d'exemple de l'extension se redimensionne désormais correctement lorsque la fenêre du navigateur est redimensionnée ;
    - Prise en charge basique des versions futures de Firefox pour Android (non testé) ;
    - Petits ajustements du code.

### Version 2.0.2 (17/06/2017) :
* Les paramètres peuvent désormais être appliqués en temps réel ;
* Correction de l'icône de Page Shadow (l'ombre est de meilleure qualité) ;
* Corrections de bugs :
    - Corrections de bugs avec le manifest.json (un manifest.json différent pour chaque navigateur a été créé) ;
    - Correction d'un bug avec la réactivation automatique de l'outil "Augmenter le contraste" avec certains sites particuliers (comme Youtube) ;
    - Corrections de bugs avec le fichier Gulp (qui permet la compilation de l'extension). L'extension peut désormais être compilée pour Edge et Opera ;
    - Autres petits ajustements.

### Version 2.0.1 (09/06/2017) :
* Compatibilité Microsoft Edge ;
* Amélioration des performances et corrections de bugs :
    - Basculement de l'API localstorage vers l'API chrome.storage ;
    - Suppression de Jquery en tant que Content Script ;
    - Correction d'un bug avec la détection de la langue du navigateur : le champ dans les options avancées restait vide dans certains cas ;
    - Correction d'un bug de l'outil "Augmenter le contraste" avec certains sites (comme Youtube) ;
    - Autres petits ajustements.

### Version 2.0 (05/06/2017) :
* Compatibilité Firefox ;
* Nouveau thème graphique basé sur Bootstrap ;
* Moteur de traduction intégré et ajout d'une traduction en anglais ;
* Ajout de thèmes de couleur pour l'outil "Augmenter le contraste" ;
* Ajout d'un mode nuit ;
* Ajout d'un mode permettant d'inverser la couleur des images ;
* Amélioration des performances ;
* Corrections diverses (bugs, textes).

### Version 1.2.1 :
* Correction d'un bug dans les paramètres avancés ;
* Ajout d'informations sur l'application dans les paramètres avancés.

### Version 1.2 :
* Optimisation de la mise en page de la popup ;
* Amélioration de l'outil "Augmenter le contraste". Les images transparentes sont désormais prises en charge ;
* Quelques ajustements.

### Version 1.1 :
* Amélioration de la fonction "Augmenter le contraste".

### Version 1.0 :
* Version initiale.