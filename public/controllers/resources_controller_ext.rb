class ResourcesController < ApplicationController

  # override the waypoints controller so it resolves ancestors in addition to top containers
  def waypoints
    search_opts = {
      'resolve[]' => ['top_container_uri_u_sstr:id', 'ancestors:id@compact_resource']
    }
    results = archivesspace.search_records(params[:urls], search_opts, true)

    render :json => Hash[results.records.map {|record|
                          @result = record
                          [record.uri,
                          render_to_string(:partial => 'infinite_item')]}]
  end
end