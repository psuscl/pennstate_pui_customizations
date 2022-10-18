# Penn State PUI Customizations

Customizations to the [Penn State University Libraries ArchivesSpace public user interface](https://aspace.libraries.psu.edu).

## Changelog

**20221019**

* added a content warning that appears when a user browses to the site for the first time
  * it then stores a browser cookie indicating you've seen it, and it won't pop up again for seven days

**20220608**

Two streams of changes here:

* Look and feel changes for a bigger site update around Aeon requesting:
  * moved sidebars to the left on resource and object views
  * changed the col ratios from 3/9 to 4/8
  * moved the main menu up out of its own navbar and into the header, and made it responsive for mobile devices
    * in fact, no longer use the shared/navigation partial at all
  * clean up the header code so that simple_search is suppressed from controllers where the sidebar search is present
    * add first-class data models (resources, digital objects, etc.) to a 'hide_from_simple_search' configuration (in plugin_init.rb) to facilitate
* Support for [the Harvard request_list plugin](https://github.com/harvard-library/request_list):
  * Listeners in pennstate.js to update request counter on click of an add/remove request button
  * Add a "My Requests" link to the ASpace main menu, with special logic to add a 'request_list_menu_item' ID to its link (because we need it for some jquery functions)

**20220422**

* made a few changes to container margins and padding to add some whitespace
* converted main-content from container-fluid to container

**20220411**

* added a static page for our [vertical files](https://aspace.libraries.psu.edu/verticalfiles)
* removed the default search behavior from the home page and replaced it with a simple search box in the navbars
* removed the margins from the title information on resource pages
* removed some extraneous CSS

**20220314**

* accessibility and appearance improvements to navbars, footer, etc
* remove more extra CSS
* add the announcements section to the top of the page

**20220309**

* fix the headers:
    * resolve JavaScript conflicts between ArchivesSpace and PSUL
    * replace the PSUL website header with the [catalog](https://catalog.libraries.psu.edu) header
* add some Lyrasis branding
* start merging the aspace_plugin_pennstate PUI elements here    

**20220308**

* committed existing customizations that Strat Tech made:
    * Added a custom stylesheet to align with UL style guide
    * Changed colors for fonts, titles, and labels
    * Added custom header and footer
    * Included the record_innards file
