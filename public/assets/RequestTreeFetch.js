(function (exports) {
  class RequestTreeFetch {
    /**
     * @constructor
     * @param {string} appUrlPrefix - The proper app prefix
     * @param {string} resourceUri - The URI of the collection resource
     */
    constructor(appUrlPrefix, resourceUri) {
      this.appUrlPrefix = appUrlPrefix;
      this.resourceUri = resourceUri;
      this.repoId = resourceUri.split('/')[2];
      this.baseUri = `${this.resourceUri}/tree`;
      this.rootUri = `${this.baseUri}/root`;
      this.nodeUri = `${this.baseUri}/node`;
      this.batchUri = `${this.baseUri}/waypoint`; // TODO: rename endpoint to /batch
      //this.waypointUri = `${this.resourceUri}/infinite/waypoints?${query}`; // need to figure out what to do with this
    }

    /**
     * Fetches the root
     * @returns {Object} - Root object returned from the server
     */
    async root() {
      try {
        const response = await fetch(this.appUrlPrefix + this.rootUri);

        return await response.json();
      } catch (err) {
        console.error(err);
      }
    }

    /**
     * Fetches the node with the given id
     * @param {number} id - ID of the node, ie: 18028
     * @returns {Object} - Node object as returned from the server
     */
    async node(id) {
      const query = new URLSearchParams();

      query.append(
        'node',
        `/repositories/${this.repoId}/archival_objects/${id}`
      );

      try {
        const response = await fetch(`${this.nodeUri}?${query}`);

        return await response.json();
      } catch (err) {
        console.error(err);
      }
    }

    /**
     * Fetches a batch of the given parent's children
     * @param {string} parentRef - The parent reference for the endpoint; either '' for root,
     * or the URI of the parent node, ie: '/repositories/:rid/archival_objects/:id'
     * @param {number} offset - The `offset` URL param
     * @returns {array} - Array of node objects as returned from the server
     */
    async batch(parentRef, offset) {
      const query = new URLSearchParams();

      query.append('node', parentRef);
      query.append('offset', offset);

      try {
        const response = await fetch(`${this.batchUri}?${query}`);

        return await response.json();
      } catch (err) {
        console.error('Error fetching batch:', err);
        return null;
      }
    }

    /**
     * Fetch one waypoint of records
     * @param {number} wpNum - The waypoint number to fetch
     * @returns {Object} - Waypoint object with the shape
     * `{ wpNum, records }` comprised of the waypoint number and an
     * object of records markup keyed by uri
     */
    async waypoint(wpNum) {
      const waypoint = document.querySelector(
        `.waypoint[data-waypoint-number='${wpNum}']:not(.populated)`
      );

      const query = new URLSearchParams();

      waypoint.dataset.uris.split(';').forEach(uri => {
        query.append('urls[]', uri);
      });

      const url = `${this.appUrlPrefix}${this.resourceUri}/infinite/waypoints?${query}`;

      try {
        const response = await fetch(url);
        const records = await response.json();
        return { wpNum, records };
      } catch (err) {
        console.error(err);
      }
    }
  }

  exports.RequestTreeFetch = RequestTreeFetch;
})(window);
