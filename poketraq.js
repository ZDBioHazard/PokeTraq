// Create a Leaflet map using OpenStreetMap data.
var map = L.map('map', { center: [35.377, -119.008], zoom: 16, layers: [
    L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map by <a href="http://openstreetmap.org">OpenStreetMap</a>',
        minZoom: 5, maxZoom: 17 })] });
var points = {
    near: L.layerGroup().addTo(map),
    far: L.layerGroup().addTo(map)
};
var area = L.layerGroup().addTo(map);
var me = L.layerGroup().addTo(map);
var marker_mode = 'near';

// Automatically find the user's location on startup.
L.control.locate({ setView: 'untilPan', icon: 'fa fa-crosshairs',
                   drawMarker: false, drawCircle: false,
                   locateOptions: { maxZoom: 16 }}).addTo(map).start();
map.on('locationfound', function( ev ) {
    me.clearLayers();
    // Location accuracy circle.
    L.circle(ev.latlng, { radius: ev.accuracy / 2, stroke: 0, color: '#FFF' }).addTo(me);
    // Sightings range circle.
    L.circle(ev.latlng, { radius: 200, color: '#08F', stroke: 0 }).addTo(me);
    // Visible Pokemon circle.
    L.circle(ev.latlng, { radius: 70, color: '#F80', stroke: 0 }).addTo(me);
    // Location dot.
    L.circleMarker(ev.latlng, { radius: 6, stroke: 0, fillOpacity: 1, color: "#FFF" }).addTo(me);
});

// Go through the markers and build an area map.
function update_search_area( ) {
    var segments = 32;
    var combined = null;
    var near = points.near.getLayers();
    var far = points.far.getLayers();

    // Remove the existing area from the map.
    area.clearLayers();

    // Nothing will be visible if there are no near locations, so exit now.
    if ( near.length == 0 ) {
        return;
    }

    // Intersect the near locations.
    for ( var i = 0 ; i < near.length ; i++ ) {
        var circle = turf.circle(near[i].toGeoJSON(), 200, segments, 'meters');
        if ( i == 0 ) {
            combined = circle;
        } else {
            // FIXME - It's possible there are two separate spawns far
            //         enough away to interfere with this algorithm.
            var intersected = turf.intersect(combined, circle);
            if ( intersected != undefined ) {
                combined = intersected;
            }
        }
        // Remove the visible area from near scans,
        // since you would have found it already.
        combined = turf.difference(combined, turf.circle(near[i].toGeoJSON(), 70, segments, 'meters'));
    }

    // Exclude the far locations. Much easier.
    for ( var i = 0 ; i < far.length ; i++ ) {
        combined = turf.difference(combined, turf.circle(far[i].toGeoJSON(), 200, segments, 'meters'));
    }

    // Add the calculated area to the map.
    L.geoJSON(combined).addTo(area);
}

// Create circles when the map is clicked on.
map.on('click', function( ev ) {
    marker = L.circleMarker(ev.latlng, { radius: 20, stroke: 0, fillOpacity: 1 });

    // Remove markers when they are clicked on.
    marker.on('click', function ( ev ) {
        if ( points.near.hasLayer(ev.target) == true ) {
            points.near.removeLayer(ev.target);
        } else if ( points.far.hasLayer(ev.target) == true ) {
            points.far.removeLayer(ev.target);
        }

        update_search_area();

        // Prevent this click from propagating up to the map.
        L.DomEvent.stopPropagation(ev);
    });

    // Add the marker to a group.
    if ( marker_mode == 'near' ) {
        marker.setStyle({ color: '#0A0' });
        points.near.addLayer(marker);
    } else if ( marker_mode == 'far' ) {
        marker.setStyle({ color: '#C00' });
        points.far.addLayer(marker);
    }

    update_search_area();
});

// Circle management controls.
L.easyBar([
    // Clear all circles button.
    L.easyButton({
        id: 'clear-all',
        states: [{
            stateName: 'clear',
            icon: 'fa-trash-o',
            title: "Clear all placed markers",
            onClick: function( ) {
                points.near.clearLayers();
                points.far.clearLayers();
                area.clearLayers();
            }
        }]
    }),

    // Circle color toggle button.
    L.easyButton({
        id: 'color-toggle',
        states: [{
            stateName: 'near',
            icon: 'fa-check-circle-o',
            title: "Create green markers",
            onClick: function( button ) {
                marker_mode = 'near';
                button.state('far');
            }
        }, {
            stateName: 'far',
            icon: 'fa-times-circle-o',
            title: "Create red markers",
            onClick: function( button ) {
                marker_mode = 'far';
                button.state('near');
            }
        }]
    }),

    // Place a circle at your current location.
    L.easyButton({
        id: 'place-here',
        states: [{
            stateName: 'place',
            icon: 'fa-arrow-circle-o-down',
            title: "Place a marker at your location",
            onClick: function( ) {
                if ( me.getLayers().length < 1 ) {
                    return;
                }
                map.fire('click', { latlng: me.getLayers()[0].getLatLng() });
            }
        }]
    }),
], { position: 'topright' }).addTo(map);

// About dialog.
L.easyButton({
    id: 'about',
    position: 'bottomleft',
    states: [{
        stateName: 'about',
        icon: 'fa-question-circle-o',
        title: 'About this app',
        onClick: function( button ) {
            map.openModal({ content: document.getElementById('about-dialog').innerHTML });
        }
    }]
}).addTo(map);
