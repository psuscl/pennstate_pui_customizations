Plugins::add_menu_item('/', 'Home', 0)
Plugins::add_menu_item('#', 'Browse:', 1)

unless AppConfig.has_key? :pui_classification_title_only
  AppConfig[:pui_classification_title_only] = false
end
