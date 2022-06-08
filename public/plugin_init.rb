unless AppConfig.has_key? :pui_classification_title_only
  AppConfig[:pui_classification_title_only] = false
end

unless AppConfig.has_key? :display_announcement
  AppConfig[:display_announcement] = true
end

AppConfig[:hide_from_simple_search] = ['search', 'resources', 'accessions', 'digital_objects', 'subjects', 'agents', 'classifications']
