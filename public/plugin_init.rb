unless AppConfig.has_key? :pui_classification_title_only
  AppConfig[:pui_classification_title_only] = false
end

unless AppConfig.has_key? :display_announcement
  AppConfig[:display_announcement] = true
end
