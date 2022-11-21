unless AppConfig.has_key? :pui_classification_title_only
  AppConfig[:pui_classification_title_only] = false
end

unless AppConfig.has_key? :display_announcement
  AppConfig[:display_announcement] = false
end

AppConfig[:hide_from_simple_search] = ['search', 'resources', 'accessions', 'objects', 'subjects', 'agents', 'classifications']

# various overrides
Rails.application.config.after_initialize do
  class Resource
    def ead_location
      @json['ead_location']
    end
  end
end
