// Add listeners
$(window).on('load', function() {
  //Make sure the request number is updated on page load
  updateRequestNumber();

  //When this scrolls, first unbind the click function for updating the
  //request number on all buttons and then add it back.  This makes sure
  //that any buttons that have it don't get multiple instances of the handler
  //added and that any buttons that don't yet have it have it added.
  $(".infinite-record-wrapper").on('scroll', function(){
	  $(".request_list_action_button").unbind('click', updateRequestNumber);
	  $(".request_list_action_button").on('click', updateRequestNumber);
  });

  //If one or more action buttons have loaded, add the click listener and
  //update handler.  After this, as the user scrolls (if this is a scrolling page),
  //the handlers will be added to the click event.
  if ($(".request_list_action_button").length > 0) {
    $(".request_list_action_button").on('click', updateRequestNumber);
  }
  //otherwise wait half a second for the partial to finish loading and then add it.
  else {
    setTimeout(function(){ $(".request_list_action_button").on('click', updateRequestNumber) }, 500);
  }

  //If this is the page that is displaying the list of requests, the user can
  //remove requests from that list.  Add a listener and update request number handler
  //to those buttons as well.
  if ($(".rl-remove-from-list-button").length > 0) {
	  $(".rl-remove-from-list-button").on('click', updateRequestNumber);
  }
});

//Get the request_list object if it exists.  **The request_list object is from the request_list plugin.
//The request_list object will have the number of items currently in the request_list.
//Set the number in the top menu REQUEST (#) value.
function updateRequestNumber() {
	if (window.request_list != null) {
		var requestNumber = window.request_list.getList().length;
		$("#rl-badge-count").text(requestNumber);
	}
}

// Bootstrap 3 tooltips
$(function() { $("[data-toggle='tooltip']").tooltip(); });
