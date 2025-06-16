// a simplified version of LargeTree that takes out most of the infinite scroll functionality
// we'll see how much we can live with the hits on performance this causes

(function(exports) {
  var SCROLL_DELAY_MS = 100;
  var THRESHOLD_EMS = 300;

  function LargeTreeReplacement(datasource, container, root_uri, read_only, renderer, tree_loaded_callback) {
    this.source = datasource;
    this.elt = container;
    this.scrollTimer = undefined;
    this.renderer = renderer;

    this.progressIndicator = $('<progress class="largetree-progress-indicator" />');
    this.elt.before(this.progressIndicator);

    this.elt.css('will-change', 'transform');

    this.root_uri = root_uri;
    this.root_tree_id = TreeIds.uri_to_tree_id(root_uri);

    this.read_only = read_only;

    this.waypoints = {};

    this.populateWaypointHooks = [];
    this.collapseNodeHooks = [];

    this.errorHandler = $.noop;

    this.initEventHandlers();
    this.renderRoot(function (rootNode) {
      tree_loaded_callback(rootNode);
    });
  }

  LargeTreeReplacement.prototype.setGeneralErrorHandler = function (callback) {
    this.errorHandler = callback;
  };

  LargeTreeReplacement.prototype.currentlyLoading = function () {
    this.progressIndicator.css('visibility', 'visible');
  }

  LargeTreeReplacement.prototype.doneLoading = function () {
    var self = this;
    setTimeout(function () {
      self.progressIndicator.css('visibility', 'hidden');
    }, 0);
  }


  LargeTreeReplacement.prototype.addPlugin = function (plugin) {
    plugin.initialize(this);

    return plugin;
  };

  LargeTreeReplacement.prototype.addPopulateWaypointHook = function (callback) {
    this.populateWaypointHooks.push(callback);
  };

  LargeTreeReplacement.prototype.addCollapseNodeHook = function (callback) {
    this.collapseNodeHooks.push(callback);
  };

  LargeTreeReplacement.prototype.displayNode = function (tree_id, done_callback) {
    var self = this;

    var node_id = TreeIds.parse_tree_id(tree_id).id;

    var displaySelectedNode = function () {
      var node = $('#' + tree_id);

      if (done_callback) {
        done_callback(node);
      }
    };

    if (tree_id === self.root_tree_id) {
      /* We don't need to do any fetching for the root node. */
      displaySelectedNode();
    } else {
      self.source.fetchPathFromRoot(node_id).done(function (paths) {
        self.recursivelyPopulateWaypoints(paths[node_id], displaySelectedNode);
      });
    }
  };

  LargeTreeReplacement.prototype.displayLoadingMask = function (scrollPosition) {
    var self = this;

    var loadingMask = self.elt.clone(false);

    loadingMask.on('click', function (e) { e.preventDefault(); return false; });

    loadingMask.find('*').removeAttr('id');
    loadingMask.attr('id', 'tree-container-loading');
    loadingMask.css('z-index', 2000)
               .css('position', 'absolute')
               .css('left', self.elt.offset().left)
               .css('top', self.elt.offset().top);

    loadingMask.width(self.elt.width());

    var spinner = $('<div class="spinner" />');
    spinner.css('font-size', '50px')
           .css('display', 'inline')
           .css('z-index', 2500)
           .css('position', 'fixed')
           .css('margin', 0)
           .css('left', '50%')
           .css('top', '50%');


    $('body').prepend(loadingMask);
    $('body').prepend(spinner);

    loadingMask.scrollTop(scrollPosition);

    return {
      remove: function () {
        loadingMask.remove();
        spinner.remove();
      }
    };
  };

  LargeTreeReplacement.prototype.recursivelyPopulateWaypoints = function (path, done_callback) {
      var self = this;

      /*
        Here, `path` is a list of objects like:
          node: /some/uri; offset: NN
        which means "expand subtree /some/uri then populate waypoint NN".
        The top-level is special because we automatically show it as expanded, so we skip expanding the root node.
      */

      if (!path || path.length === 0) {
        done_callback();
        return;
      }

      var waypoint_description = path.shift();

      var next_fn = function () {
          if (!self.waypoints[waypoint_description.node]) {
              throw "An error occurred while expanding.";
          }

          var waypoint = self.waypoints[waypoint_description.node][waypoint_description.offset];

          if (!waypoint) {
              throw "An error occurred while expanding.";
          }

          self.populateWaypoint(waypoint, function () {
              self.recursivelyPopulateWaypoints(path, done_callback);
          });
      };

      if (waypoint_description.node) {
          var tree_id = TreeIds.uri_to_tree_id(waypoint_description.node);

          if ($('#' + tree_id).find('.expandme').find('.expanded').length > 0) {
              next_fn();
          } else {
              self.toggleNode($('#' + tree_id).find('.expandme'), next_fn);
          }
      } else {
          /* this is the root node (subtree already expanded) */
          next_fn();
      }
  };

  LargeTreeReplacement.prototype.deleteWaypoints = function (parent) {
      var waypoint = parent.nextUntil('.table-row').find('.waypoint').first();

      if (!waypoint.hasClass('waypoint')) {
          /* Nothing left to burn */
          return false;
      }

      if (!waypoint.hasClass('populated')) {
          waypoint.remove();

          return true;
      }

      var waypointLevel = waypoint.data('level');

      if (!waypointLevel) {
          return false;
      }

      /* Delete all elements up to and including the end waypoint marker */
      while (true) {
          var elt = waypoint.next();

          if (elt.length === 0) {
              break;
          }

          if (elt.hasClass('end-marker') && waypointLevel == elt.data('level')) {
              elt.remove();
              break;
          } else {
              elt.remove();
          }
      }

      waypoint.remove();

      return true;
  };

  LargeTreeReplacement.prototype.toggleNode = function (button, done_callback) {
      var self = this;
      var parent = button.closest('.table-row');

      if (button.data('expanded')) {
          self.collapseNode(parent, done_callback);
      } else {
          self.expandNode(parent, done_callback);
      }
  };

  LargeTreeReplacement.prototype.expandNode = function (row, done_callback) {
      var self = this;
      var button = row.find('.expandme');

      if (button.data('expanded')) {
          if (done_callback) {
              done_callback();
          }
          return;
      }

      $(button).data('expanded', true);
      button.attr('aria-expanded', 'true');
      button.find('.expandme-icon').addClass('expanded');

      if (!row.data('uri')) {
        throw "Can't expand node because uri is unknown";
      }

      self.source.fetchNode(row.data('uri'))
          .done(function (node) {
              self.appendWaypoints(row, row.data('uri'), node.waypoints, node.waypoint_size, row.data('level') + 1);

              if (done_callback) {
                  setTimeout(done_callback, 100);
              }
          })
          .fail(function () {
              self.errorHandler.apply(self, ['fetch_node_failed'].concat([].slice.call(arguments)));
          });
  };

  LargeTreeReplacement.prototype.collapseNode = function (row, done_callback) {
      var self = this;
      while (self.deleteWaypoints(row)) {
          /* Remove the elements from one or more waypoints */
      }

      var button = row.find('.expandme');

      $(button).data('expanded', false);
      button.attr('aria-expanded', 'false');
      button.find('.expandme-icon').removeClass('expanded');

      /* Removing elements might have scrolled something else into view */
      setTimeout(function () {
          self.considerPopulatingWaypoint();
      }, 0);

      /* remove the empty table-row-group */
      row.next('.table-row-group').remove();

      $(self.collapseNodeHooks).each(function (idx, hook) {
          hook();
      });

      if (done_callback) {
        done_callback();
      }
  };

  LargeTreeReplacement.prototype.initEventHandlers = function () {
      var self = this;
      var currentlyExpanding = false;

      /* Content loading */
      this.elt.on('scroll', function (event) {
          if (self.scrollTimer) {
            clearTimeout(self.scrollTimer);
          }

          var handleScroll = function () {
            if (!currentlyExpanding) {
              currentlyExpanding = true;

              self.considerPopulatingWaypoint(function () {
                currentlyExpanding = false;
                if (self.elt.is('.expand-all')) {
                  self.considerExpandingRow();
                }
              });
            }
          };

          self.scrollTimer = setTimeout(handleScroll, SCROLL_DELAY_MS);
      });

      /* Expand/collapse nodes */
      $(this.elt).on('click', '.expandme', function (e) {
          e.preventDefault();
          self.toggleNode($(this));
      });
  };

  LargeTreeReplacement.prototype.makeWaypoint = function (uri, offset, indentLevel) {
      var result = $('<div class="table-row waypoint" />');
      result.addClass('indent-level-' + indentLevel);

      result.data('level', indentLevel);
      result.data('uri', uri);
      result.data('offset', offset);

      if (!this.waypoints[uri]) {
          this.waypoints[uri] = {};
      }

      /* Keep a lookup table of waypoints so we can find and populate them programmatically */
      this.waypoints[uri][offset] = result;

      return result;
  };

  LargeTreeReplacement.prototype.appendWaypoints = function (elt, parentURI, waypointCount, waypointSize, indentLevel) {
      var child_count = elt.data('child_count');
      for (var i = waypointCount - 1; i >= 0; i--) {
        var waypoint = this.makeWaypoint(parentURI, i, indentLevel);

        waypoint.data('child_count_at_this_level', child_count);

        /* We force the line height to a constant 2em so we can predictably
          guess how tall to make waypoints.  See LargeTreeReplacement.less for where we
          set this on table.td elements. */
        waypoint.css('height', (waypointSize * 2) + 'em');
        var group_wrapper = $('<div role="list" class="table-row-group"></div>');
        elt.after(group_wrapper);
        group_wrapper.wrapInner(waypoint);
      }

      var self = this;
      setTimeout(function () {self.considerPopulatingWaypoint(); }, 0);
  };

  LargeTreeReplacement.prototype.renderRoot = function (done_callback) {
      var self = this;
      self.waypoints = {};

      var rootList = $('<div class="table root" role="list"/>');

      this.source.fetchRootNode().done(function (rootNode) {
        var row = self.renderer.get_root_template();

        row.data('uri', rootNode.uri);
        row.attr('id', TreeIds.uri_to_tree_id(rootNode.uri));
        row.addClass('root-row');
        row.attr('role', 'listitem');
        row.data('level', 0);
        row.data('child_count', rootNode.child_count);
        row.data('jsonmodel_type', rootNode.jsonmodel_type);
        row.find('.title').addClass('record-title').text(rootNode.title);

        rootList.append(row);
        self.appendWaypoints(row, null, rootNode.waypoints, rootNode.waypoint_size, 1);
        /* Remove any existing table */
        self.elt.find('div.root').remove();

        self.elt.prepend(rootList);
        self.renderer.add_root_columns(row, rootNode);
        if (done_callback) {
          /* Note that this will fire before the waypoint nodes are loaded */
          done_callback(rootNode);
        }
      });
  };

  LargeTreeReplacement.prototype.considerPopulatingWaypoint = function (done_callback) {
      var self = this;

      if (!done_callback) {
        done_callback = $.noop;
      }

      var emHeight = parseFloat($("body").css("font-size"));
      var threshold_px = emHeight * THRESHOLD_EMS;
      var containerTop = this.elt.offset().top;
      var containerHeight = this.elt.outerHeight();

      /* Pick a reasonable guess at which waypoint we might want to populate
        (based on our scroll position) */
      var allWaypoints = self.elt.find('.waypoint');

      if (allWaypoints.length == 0) {
        done_callback();
        return;
      }

      var scrollPercent = self.elt.scrollTop() / self.elt.find('div.root').height();
      var startIdx = Math.floor(scrollPercent * allWaypoints.length);

      var waypointToPopulate;
      var evaluateWaypointFn = function (elt) {
        /* The element's top is measured from the top of the page, but we
          want it relative to the top of the container.  Adjust as
          appropriate. */
        var eltTop = elt.offset().top - containerTop;
        var eltBottom = eltTop + elt.height();

        var waypointVisible = (Math.abs(eltTop) <= (containerHeight + threshold_px)) ||
                              (Math.abs(eltBottom) <= (containerHeight + threshold_px)) ||
                              (eltTop < 0 && eltBottom > 0);

        if (waypointVisible) {
          var candidate = {
            elt: elt,
            top: eltTop,
            level: elt.data('level'),
          };

          if (!waypointToPopulate) {
            waypointToPopulate = candidate;
          } else {
            if (waypointToPopulate.level > candidate.level || waypointToPopulate.top > candidate.top) {
              waypointToPopulate = candidate;
            }
          }

          return true;
        } else {
          return false;
        }
      };

      /* Search for a waypoint by scanning backwards */
      for (var i = startIdx; i >= 0; i--) {
          var waypoint = $(allWaypoints[i]);

          if (waypoint.hasClass('populated')) {
            /* nothing to do for this one */
            continue;
          }

          var waypointWasVisible = evaluateWaypointFn(waypoint);

          if (!waypointWasVisible && i < startIdx) {
            /* No point considering waypoints even further up in the DOM */
            break;
          }
      }

      /* Now scan forwards */
      for (var i = startIdx + 1; i < allWaypoints.length; i++) {
          var waypoint = $(allWaypoints[i]);

          if (waypoint.hasClass('populated')) {
              /* nothing to do for this one */
              continue;
          }

          var waypointWasVisible = evaluateWaypointFn(waypoint);

          if (!waypointWasVisible) {
              /* No point considering waypoints even further down in the DOM */
              break;
          }
      }

      if (waypointToPopulate) {
          self.currentlyLoading();
          self.populateWaypoint(waypointToPopulate.elt, function () {
              setTimeout(function () {
                  self.considerPopulatingWaypoint(done_callback);
              }, 0);
          });
      } else {
          self.doneLoading();
          done_callback();
      }
  };

  var activeWaypointPopulates = {};

  LargeTreeReplacement.prototype.populateWaypoint = function (elt, done_callback) {
      if (elt.hasClass('populated')) {
          done_callback();
          return;
      }

      var self = this;
      var uri = elt.data('uri');
      var offset = elt.data('offset');
      var level = elt.data('level');

      var key = uri + "_" + offset;
      if (activeWaypointPopulates[key]) {
          return;
      }

      activeWaypointPopulates[key] = true;

      this.source.fetchWaypoint(uri, offset).done(function (nodes) {
          var endMarker = self.renderer.endpoint_marker();
          endMarker.data('level', level);
          endMarker.data('child_count_at_this_level', elt.data('child_count_at_this_level'));
          endMarker.addClass('indent-level-' + level);
          elt.after(endMarker);

          var newRows = [];

          $(nodes).each(function (idx, node) {
            var row = self.renderer.get_node_template();

            row.addClass('indent-level-' + level).addClass('table-row-' + node.level);
            row.data('level', level);
            row.data('child_count', node.child_count);
            var button = row.find('.expandme');
            row.attr('role', 'listitem');
            var title = row.find('.title');
            var strippedTitle = $("<div>").html(node.title).text();
            // prefix series and subseries with their node level
            if(node.level == 'series' || node.level == 'subseries') {
              title.addClass('review-record');
              title.append($('<span />').addClass('record-'+node.level).addClass('px-1').text(self.capitalize(node.level) + ": "));
              title.find('span').append($('<a class="record-title" />').prop('href', TreeIds.link_url(node.uri)).text(node.title));
            } else {
              $.ajax(self.url_for('infinite/waypoints'), {
                method: 'GET',
                data: {
                  urls: [node.uri]
                }
              }).done(function(records) {
                title.append(records[node.uri]);
                if(window.request_list !== 'undefined') {
                  window.request_list.setUpList();
                }
              });
            }
            button.append($('<span class="sr-only" />').text(strippedTitle));
            title.attr('title', strippedTitle);
            
            var ex = row.find('.expandme');
            if (node.child_count === 0) {
              ex.remove();
              //ex.css('visibility', 'hidden');
              //ex.attr('aria-hidden', 'true');
            }

            self.renderer.add_node_columns(row, node);

            var tree_id = TreeIds.uri_to_tree_id(node.uri);

            row.data('uri', node.uri);
            row.data('jsonmodel_type', node.jsonmodel_type);
            row.data('position', node.position);
            row.data('parent_id', node.parent_id);
            row.attr('id', tree_id);

            newRows.push(row);
          });

          elt.after.apply(elt, newRows);

          elt.addClass('populated');

          activeWaypointPopulates[key] = false;

          $(self.populateWaypointHooks).each(function (idx, hook) {
            hook();
          });

          done_callback();
      });
  };

  LargeTreeReplacement.prototype.considerExpandingRow = function (done_callback) {
    var self = this;

    if (!done_callback) {
      done_callback = $.noop;
    }

    var emHeight = parseFloat($("body").css("font-size"));
    var threshold_px = emHeight * THRESHOLD_EMS;
    var containerTop = this.elt.offset().top;
    var containerHeight = this.elt.outerHeight();

    /* Pick a reasonable guess at which row we might want to expand
        (based on our scroll position) */
    let allExpandables = self.elt.find('.expandme').not('[aria-expanded="true"]').not('[aria-hidden="true"]');
    if (allExpandables.length == 0) {
      done_callback();
      return;
    }

    var scrollPercent = self.elt.scrollTop() / self.elt.find('div.root').height();
    var startIdx = Math.floor(scrollPercent * allExpandables.length);
    var rowToExpand;
    var evaluateExpandableFn = function (elt) {
      /* The element's top is measured from the top of the page, but we
          want it relative to the top of the container.  Adjust as
          appropriate. */
      var eltTop = elt.offset().top - containerTop;
      var eltBottom = eltTop + elt.height();

      var btnVisible = (Math.abs(eltTop) <= (containerHeight + threshold_px)) ||
                        (Math.abs(eltBottom) <= (containerHeight + threshold_px)) ||
                        (eltTop < 0 && eltBottom > 0);

      if (btnVisible) {
          var candidate = {
              elt: elt,
              top: eltTop,
          };

          if (!rowToExpand) {
              rowToExpand = candidate;
          } else {
              if (rowToExpand.top > candidate.top) {
                  rowToExpand = candidate;
              }
          }

          return true;
      } else {
          return false;
      }
    };

    /* Search for an expandable row by scanning backwards */
    for (var i = startIdx; i >= 0; i--) {
      var expandable = $(allExpandables[i]);

      var expandableWasVisible = evaluateExpandableFn(expandable);

      if (!expandableWasVisible && i < startIdx) {
        /* No point considering expand buttons even further up in the DOM */
        break;
      }
    }

    /* Now scan forwards */
    for (var i = startIdx + 1; i < allExpandables.length; i++) {
      var expandable = $(allExpandables[i]);

      if (expandable.attr('aria-expanded') == 'true') {
        /* nothing to do for this one */
        continue;
      }

      var expandableWasVisible = evaluateExpandableFn(expandable);

      if (!expandableWasVisible) {
        /* No point considering rows even further down in the DOM */
        break;
      }
    }

    if (rowToExpand) {
        self.expandNode(rowToExpand.elt.closest('.table-row'), function() {
            $('.expandme').addClass('disabled').attr('disabled', 'disabled').attr('aria-disabled', 'true');
            self.considerExpandingRow(done_callback);
        })
    } else {
        done_callback();
    }
  };

  LargeTreeReplacement.prototype.capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  LargeTreeReplacement.prototype.constructContainerInfo = function(node) {
    tc = node.containers.filter(container => container.instance_type !== "digital_object")[0];
    var text = tc.top_container_type + " " + tc.top_container_indicator;
    if(tc.type_2) {
        text = text + ", " + tc.type_2 + " " + tc.indicator_2;
    }

    return text;
  };

  LargeTreeReplacement.prototype.url_for = function(action) {
    var self = this;

    return self.root_uri + '/' + action;
  };

  exports.LargeTreeReplacement = LargeTreeReplacement;
}(window));
