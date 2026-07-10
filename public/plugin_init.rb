Plugins::extend_aspace_routes(File.join(File.dirname(__FILE__), "routes.rb"))

# branding image and favicon
AppConfig[:pui_branding_img] = 'assets/pennstate.png'
AppConfig[:pui_branding_img_alt_text] = 'Penn State University Libraries'
AppConfig[:pui_show_favicon] = true

# controller types to hide from simple search
AppConfig[:hide_from_simple_search] = ['search', 'resources', 'accessions', 'objects', 'subjects', 'agents', 'classifications', 'repositories']

# View Catalog Action button
AppConfig[:pui_page_custom_actions] = [
  {
    'record_type' => ['resource'],
    'erb_partial' => 'shared/view_catalog_action'
  }
]

# make sure EAD Location appears in resource records
Rails.application.config.after_initialize do
  class Resource
    def ead_location
      @json['ead_location']
    end
  end
end
