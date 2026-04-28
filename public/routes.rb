Rails.application.routes.draw do
  get '/alerts', to: 'alerts#index'
end
