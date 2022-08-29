# Page Shadow

## Roadmap / to-do list

This is a roadmap/to-do list of things that are planned to be fixed or developed for Page Shadow.

### Common

* [x] Update to extension manifest v3
* [ ] FAQ for common questions

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

### 2.10

#### Planned/ideas

* [ ] Further optimize content.js code
    * [ ] Simplify code applying Shadow Roots styles?
* [ ] Preserve bright colors?/Several "shades" of background color for the themes?
* [ ] Enhance UX of Modern popup theme
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

* [ ] (Minor) Issues with Shadow DOM: Google Earth broken with "Increase page contrast" mode -> fixed by disabling auto override with filter rules ; to definitely fix: detection of transparent backgrounds in Shadow Roots
* [ ] (Minor) Filter: disable class for matched filter on an element but no longer matched following changes in the element
* [ ] (Minor) Texts with gradient are not visible (example on frandroid.com)
* [ ] (Minor) Changing custom theme settings should apply in real-time to websites using the theme
* [ ] (Medium) Issue on Firefox with Mutation Observer (Invert colors)
* [x] (Medium) Firefox bug: Page Color inversion - broken float: https://stackoverflow.com/questions/52937708/why-does-applying-a-css-filter-on-the-parent-break-the-child-positioning (difficult to fix)
    * Seems to be fixed on latest Firefox versions

#### Planned/ideas

* [ ] No longer rely on classes for styling (filter rules and background detection) -> auto generation of a CSS style sheet? (see https://developer.mozilla.org/fr/docs/Mozilla/Add-ons/WebExtensions/API/tabs/insertCSS)
* [ ] Filters: UI to report a website problem
* [ ] Filters: Element picker to create custom rule easily
* [ ] Filters: match if an element is present in the page -> to match sites based on Medium/Gitlab/other types (conditonal filter)
* [ ] Store filters on a Github repository ?
