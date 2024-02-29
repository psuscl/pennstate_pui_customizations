AppConfig[:matomo_enabled] = false

unless AppConfig.has_key? :pui_classification_title_only
  AppConfig[:pui_classification_title_only] = false
end

unless AppConfig.has_key? :display_announcement
  AppConfig[:display_announcement] = false
end

AppConfig[:hide_from_simple_search] = ['search', 'resources', 'accessions', 'objects', 'subjects', 'agents', 'classifications']
AppConfig[:pui_page_custom_actions] = [
  {
    'record_type' => ['resource'],
    'erb_partial' => 'shared/view_catalog_action'
  },
  {
    'record_type' => ['resource'],
    'erb_partial' => 'shared/request_materials_action'
  }
]

# various overrides
Rails.application.config.after_initialize do
  class Resource
    def ead_location
      @json['ead_location']
    end
  end

  class ResourceController
    def waypoints
      search_opts = {
        'resolve[]' => ['top_container_uri_u_sstr:id', 'digital_object_uris:id']
      }
      results = archivesspace.search_records(params[:urls], search_opts, true)
  
      render :json => Hash[results.records.map {|record|
                             @result = record
                             [record.uri,
                              render_to_string(:partial => 'infinite_item')]}]
    end
  end
end
