# enable/disable Matomo analytics
AppConfig[:matomo_enabled] = true

# display announcement
AppConfig[:display_announcement] = true

# branding image and favicon
AppConfig[:pui_branding_img] = 'assets/pennstate.png'
AppConfig[:pui_branding_img_alt_text] = 'Penn State University Libraries'
AppConfig[:pui_show_favicon] = true

# controller types to hide from simple search
AppConfig[:hide_from_simple_search] = ['search', 'resources', 'accessions', 'objects', 'subjects', 'agents', 'classifications']

# make sure EAD Location appears in resource records
Rails.application.config.after_initialize do
  class Resource
    def ead_location
      @json['ead_location']
    end
  end
end
