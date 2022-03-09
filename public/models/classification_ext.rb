require Rails.root.join('app', 'models', 'classification')

class Classification < Record

  private

  # DEPAUL REQUEST (makes sense, this is quick and dirty)
  def parse_full_title
    if AppConfig[:pui_classification_title_only]
      "#{json['title']}"
    else
      # original method
      "#{parse_identifier}#{I18n.t('classification.identifier_separator')} #{json['title']}"
    end
  end

end