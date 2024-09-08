# Page Shadow

## Roadmap / to-do list

This is a roadmap/to-do list of things that are planned to be fixed or developed for Page Shadow.

### 2.10

#### Planned/ideas

* [x] Update the UI ? (update to Bootstrap 5 ?)
    * [x] Advanced settings design with tabs
    * [x] Interface dark mode
    * [x] Update popup design (icons, etc.) -> improve popup design: icons for option + settings ?
        * [x] Alternative popup design ?
* [x] Option to attenuate the color of the images for the "Increase contrast" mode (see https://web.dev/prefers-color-scheme/#dark-mode-best-practices)
* [x] Import Font Awesome with npm
* [x] Filters: don't update if file "Last-modified" header from server has not changed compared to the local version and last update
    * [x] Show update available for filters (check last-modified header)
* [x] Display a warning after a certain time to ask the user to archive their settings
    * [x] Auto backup to Cloud option
* [x] Settings for developpers in the advanced settings page
* [x] User suggestion: It would be great if the brightness reduction without night mode and the brightness reduction with night mode could be combined.
    * [x] Separate brightness reduction and night mode settings (renamed "Blue-light reduction filter")

#### Known issues/bugs

* [x] When selecting a custom theme and then choosing a classic theme, the other tabs keep the custom theme
* [x] Bug with some websites (Github) : Increase contrast setting cannot be applied -> classes on body element are removed
    * [x] Other bug: the settings are not working when changing of a page on Github -> document.body changes between page refreshing
* [x] (Minor) Background image on body element is not detected
* [x] (Minor) SVG with use element is not working with Invert colors function (see Leroy Merlin website)

### 2.10.1

#### Planned/ideas

* [x] Optimize background detection (method "detectBackground" of PageAnalyzer class)
* [x] Preserve bright colors
    * [x] Option in popup to enable/disable this detection
    * [x] Keep good text color contrast
    * [x] Bright color detection: fix text color?
* [x] Further optimize content.js code
* [x] Enhance UX of Modern popup theme
* [x] Attenuate the "flash" when navigating between pages
    * [x] The slowdown process have been identified: getSettings -> cache system to implement for settings
* [x] Increase contrast : use only one stylesheet + CSS variable to apply default themes
    * [x] Same with custom themes -> use CSS variables
* [x] Try to simplify the code of content.js
* [x] Rework the Mutation Observers to simplify the code and fix somes issues (see the mutation-observers-reworking branch) -> Wrapper class
* [x] Attenuate the "flash" when changing settings
* [x] waitAndApply... -> class
* [x] Logging ? -> No

#### Known issues/bugs

* [x] (Minor) Texts with gradient are not visible (example on frandroid.com)
* [x] (Minor) Changing custom theme settings should apply in real-time to websites using the theme
* [x] (Medium) Issue on Firefox with Mutation Observer (Invert colors)
* [x] (Medium) Firefox bug: Page Color inversion - broken float: https://stackoverflow.com/questions/52937708/why-does-applying-a-css-filter-on-the-parent-break-the-child-positioning (difficult to fix)
    * Seems to be fixed on latest Firefox versions
* [x] (Medium) On Github, when navigating between pages and going back with the browser back button and using the "Decrease brightness" or "Blue light reduction filter", sometimes the effect is increased (double)

### Next version (2.10.2)

#### Planned

* [x] (Important) Update to Manifest v3 (check manifestv3 branch)
    * Bugs linked to MV3 migration:
        * [x] Filters don't update on the first install of the extension (update also broken ?)
        * [x] Auto cloud backup doesn't work: error with window.navigator.platform not available in Background Service Worker
* [x] Option to attenuate color of Preserve color function

#### Bugs

* [x] (Minor) Performance issue on Firefox when loading a preset or restoring setting archive -> small optimization have already been made
* [x] (Medium) Fix Preserve bright color on some website (wrong background detection)
    * The function detects extension's theme background color and not actual background colors of some elements, randomly
* [x] (Minor) When dark mode is enabled in the OS, the Readme file in the settings appear inverted (black text on white background when Dark theme is enabled)

### Next version (2.10.3)

#### Planned

* [x] Manifestv3 for Firefox
    * [x] Display an information popup to inform users to allow the permission "Access data on all websites" for the extension to work properly
* [x] Only display confirmation on Advanced settings page reload/exit when a change of the settings is unsaved (uses existing code for displaying icon)
* [x] Use SHA-256 to exchange URLs between background script and content script

#### Bugs

* [x] (Medium) Fix Preserve bright color white text on white background/black text on black background
    * Similar to the issue of wrong background detection
* [x] (Minor) When using the Modern popup theme, if the features Invert colors or Blue light reduction filter are not enabled, when opening the options of these features, the options displayed are not the stored options (no checkbox checked, default color temperature)
* [x] (Medium) Fix displaying of settings with the popup theme "Modern"
* [x] (Minor) User bug: button to validate the hour of auto enable/disable (popup) for the extension is not displayed and it's not possible to scroll to access it (only on Firefox)
* [x] (Minor) Page Shadow filters: seem to flood HEAD request

### Next release (2.10.4)

### Planed

* [x] Limit flashing when opening a website and detecting colored elements?
    * [x] Experimental - Test needed. Sometimes the "preApplySettings" message is randomly not received
    * [x] Not working with custom themes - fixed: cache custom themes settings
* [x] Add border radius to select/inputs
* [x] Merge utils/filterProcessor.js and FilterProcessor class
* [x] Auto cloud saving/backup: don't save the date when an error occurred
* [x] Auto cloud saving/backup: display an alert window in the popup if there was an error when auto saving in the cloud + save date/hour when a saving error occurs
* [x] Compact popup theme
* [x] Automatic selective invert image color (for logos and black text images)
    * [x] Don't work when the image is not yet loaded (reproduced on this page: https://tungmphung.com/reinforcement-learning-q-learning-deep-q-learning-introduction-with-tensorflow/)

#### Bugs to fix

* [x] (Very minor) Fix icon on "Missing permission" popup
* [x] (Medium) Some websites reset the style attribute of the html, which force the default theme for the Increase contrast feature by deleting the CSS variables
    * Reproduced on this website (very random, Maj+F5 to reproduce): https://formation.lefebvre-dalloz.fr/actualite/scrum-comment-animer-la-retrospective-du-sprint
* [x] (Very minor) When classic popup theme is enabled, the help tooltip for the feature "Attenuate colors" is wrong (not complete)
* [x] (Medium) Auto cloud saving/backup: fails when there is a long blacklist/whitelist (maybe also for the list of websites for presets?)
* [x] (Very minor) Some websites causes an error in the console "e.parentNode.closest is not a function", without visible impacts
* [x] (Medium) Filters for body element not working, add possibility to invert body background image?
* [x] (Medium) Website: webdeveloper.beehiiv.com/p/build-react-400-lines-code - text color not applied when Increase page contrast is enabled -> fixed "forceDisableDefaultFontColor" filter
* [x] (Minor) Bug with error in filters: open errors from a built-in filter, then the errors from custom filter: the window will be blank (random)
* [x] (Minor) Transition background color (background white) blink when Increase page contrast is enabled - Exemple: https://iq.opengenus.org/lstopo-in-linux/

### Release - Next

#### Features

* [ ] Reduce delay applying reduce brightness/blue light reduction filter + invert entire page
* [ ] Fix dark image detection (using contours detection?) + enable by default?
    * [x] Optimize by reducing size of the image before analyze
* [ ] Publish Manifestv3 for Firefox
    * [ ] Fix Cloud backup on Firefox ; all other feature works

#### Bugs to fix

* [x] (Major) Still some errors with QUOTA_BYTES_PER_ITEM in cloud archive. The chunk method need to be fixed
* [x] (Medium) Bug with fast apply mode and iframes + preset: iframe use global settings instead of preset settings from parent page
* [x] (Minor) Background gradient not detected as bright colors
* [x] (Minor) Fix transition white that disable some transitions? -> no, seems OK
* [ ] (Minor) Sometimes when opening custom themes settings, the link color of the custom theme 1 is copied to the text color randomly + edit icon displayed

#### Ideas

* [x] Add possibility to change the filter intensity for the Attenuate colors feature?
* [x] Add possibility to not invert bright color for the Invert colors features?
* [x] Increase the number of presets/custom themes?
* [ ] Detect bright color text + enable for bright color inversion/color reduction?

### Common

* [ ] FAQ for common questions?

### Planned/ideas

* [ ] Several "shades" of background color for the themes? -> detect element with lightness < 0.05 (use existing hsl code)
* [ ] Improving codebase
    * [ ] Comment the code: doc for methods/functions
    * [ ] Simplify code applying Shadow Roots styles?
    * [ ] Separate code treating mutations of page elements to a separate class?
    * [ ] Separate method applying mutation observers to another class?
    * [ ] Modularize content.js classes with less dependencies between classes?
* [ ] Others codebase improvements
    * [ ] No longer rely on classes for styling (filter rules and background detection) -> auto generation of a CSS style sheet? (see https://developer.mozilla.org/fr/docs/Mozilla/Add-ons/WebExtensions/API/tabs/insertCSS)
* [ ] Filters module improving
    * [ ] Filters: UI to report a website problem
    * [ ] Filters: Element picker to create custom rule easily
    * [ ] Filters: match if an element is present in the page -> to match sites based on Medium/Gitlab/other types (conditonal filter)
    * [ ] Store filters on a Github repository ?
* [ ] Prevent the attenuation of subelements (when enabling Colored elements attenuation)?

### Known issues/bugs

* [ ] (Minor) Filter: disable class for matched filter on an element but no longer matched following changes in the element
* [ ] (Minor) On local opened page, the right click actions doesn't work (Chrome only)
* [ ] (Minor) Ignore get parameters (after ? character) in URL for preset list and whitelist/blacklist list?
* [ ] (Minor) Issues with Shadow DOM: Google Earth broken with "Increase page contrast" mode -> fixed by disabling auto override with filter rules ; to definitely fix: detection of transparent backgrounds in Shadow Roots
