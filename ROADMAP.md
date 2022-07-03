# Page Shadow

## Roadmap / to-do list

This is a roadmap/to-do list of things that are planned to be fixed or developed for Page Shadow.

### Common

* [ ] Update to extension manifest v3
* [ ] FAQ for common questions

### 2.10

#### Planned/ideas

* [ ] Update the UI ? (update to Bootstrap 5 ?)
    * [x] Advanced settings design with tabs
    * [x] Interface dark mode
    * [x] Update popup design (icons, etc.) -> improve popup design: icons for option + settings ?
        * [ ] Alternative popup design ?
* [x] Import Font Awesome with npm
* [x] Filters: don't update if file "Last-modified" header from server has not changed compared to the local version and last update
    * [x] Show update available for filters (check last-modified header)
* [ ] Display a warning after a certain time to ask the user to archive their settings
* [ ] Settings for developpers in the advanced settings page
* [ ] Option to attenuate the color of the images for the "Increase contrast" mode (see https://web.dev/prefers-color-scheme/#dark-mode-best-practices)

### Known issues/bugs

* [ ] Issues with Shadow DOM: Google Earth broken with "Increase page contrast" mode -> fixed by disabling auto override with filter rules ; to definitely fix: detection of transparent backgrounds in Shadow Roots
* [x] When selecting a custom theme and then choosing a classic theme, the other tabs keep the custom theme
* [ ] Filter: disable class for matched filter on an element but no longer matched following changes in the element
* [ ] Firefox bug: Page Color inversion - broken float: https://stackoverflow.com/questions/52937708/why-does-applying-a-css-filter-on-the-parent-break-the-child-positioning (difficult to fix)

### Future

* [ ] No longer rely on classes for styling -> auto generation of a CSS style sheet? (see https://developer.mozilla.org/fr/docs/Mozilla/Add-ons/WebExtensions/API/tabs/insertCSS)
* [ ] Filters: UI to report a website problem
* [ ] Filters: Element picker to create custom rule easily
* [ ] Filters: match if an element is present in the page -> to match sites based on Medium/Gitlab/other types (conditonal filter)
* [ ] Store filters on a Github repository ?
* [ ] Preserve bright colors?/Several "shades" of background color for the themes?
* [ ] User suggestion: It would be great if the brightness reduction without night mode and the brightness reduction with night mode could be combined.