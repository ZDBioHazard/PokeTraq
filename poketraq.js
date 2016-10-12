// Create a Leaflet map using OpenStreetMap data.
var map = L.map('map', { center: [35.377, -119.008], zoom: 16, doubleClickZoom: false, layers: [
    L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map by <a href="http://openstreetmap.org">OpenStreetMap</a>',
        minZoom: 5, maxZoom: 17 })] });
var points = {
    near: L.layerGroup().addTo(map),
    far: L.layerGroup().addTo(map)
};
var area = L.layerGroup().addTo(map);
var me = L.layerGroup().addTo(map);
var circles = L.layerGroup().addTo(map);
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
    buttons.zone_warning.remove();

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
            } else {
                buttons.zone_warning.addTo(map);
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
    marker = L.marker(ev.latlng);
    marker.circle = L.circle(ev.latlng, { radius: 200, stroke: 0 }).addTo(circles);

    // Remove markers when they are clicked on.
    marker.on('click', function ( ev ) {
        circles.removeLayer(ev.target.circle);
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
        marker.setIcon(L.divIcon({ className: 'fa fa-check-circle-o' }));
        marker.circle.setStyle({ color: '#0F0', fillOpacity: 0.075 });
        points.near.addLayer(marker);
    } else if ( marker_mode == 'far' ) {
        marker.setIcon(L.divIcon({ className: 'fa fa-times-circle-o' }));
        marker.circle.setStyle({ color: '#F00', fillOpacity: 0.05 });
        points.far.addLayer(marker);
    }

    update_search_area();
});

// Dialog windows.
var dialogs = {
    about: { content: document.getElementById('about-dialog').outerHTML, },
    zone_warning: { content: document.getElementById('zone-warning-dialog').outerHTML, },
};

// Button controls.
var buttons = {
    // Clear all circles button.
    clear_all: L.easyButton({
        id: 'clear-all',
        states: [{
            stateName: 'clear',
            icon: 'fa-trash-o',
            title: "Clear all placed markers",
            onClick: function( ) {
                points.near.clearLayers();
                points.far.clearLayers();
                area.clearLayers();
                circles.clearLayers();
                buttons.zone_warning.remove();

                // Pretend to press the green mode button.
                marker_mode = 'near';
                buttons.mode_near.disable();
                buttons.mode_far.enable();
            }
        }]
    }),

    // Near marker mode button.
    mode_near: L.easyButton({
        id: 'mode-near',
        states: [{
            stateName: 'near',
            icon: 'fa-check-circle-o',
            title: "Create green markers",
            onClick: function( button ) {
                marker_mode = 'near';
                buttons.mode_far.enable();
                button.disable();
            }
        }]
    }),

    // Far marker mode button.
    mode_far: L.easyButton({
        id: 'mode-far',
        states: [{
            stateName: 'far',
            icon: 'fa-times-circle-o',
            title: "Create red markers",
            onClick: function( button ) {
                marker_mode = 'far';
                buttons.mode_near.enable();
                button.disable();
            }
        }]
    }),

    // Place a circle at your current location.
    place_here: L.easyButton({
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

    // About dialog.
    about: L.easyButton({
        id: 'about',
        states: [{
            stateName: 'about',
            icon: 'fa-question-circle-o',
            title: 'About this app',
            onClick: function( ) { map.openModal(dialogs.about); },
        }]
    }),

    // Multiple spawn warning.
    zone_warning: L.easyButton({
        id: 'zone-warning',
        states: [{
            stateName: 'zone-warning',
            icon: 'fa-exclamation',
            title: 'Warning: Multiple spawn points',
            onClick: function( ) { map.openModal(dialogs.zone_warning); },
        }]
    }),
};

// Add buttons to the map.
buttons.clear_all.setPosition('topright').addTo(map);
L.easyBar([buttons.mode_near, buttons.mode_far], { position: 'topright' }).addTo(map);
buttons.mode_near.disable();
buttons.place_here.setPosition('topright').addTo(map);
buttons.about.setPosition('bottomleft').addTo(map);
buttons.zone_warning.setPosition('bottomright').remove(); // Added when needed.

// Open the about dialog the first time visiting. Use a number in a string
// to check against in case we ever need to force clear the user's cookie.
var cookie_version = '1';
if ( Cookies.get('saw_about') != cookie_version ) {
    map.openModal(dialogs.about);
    Cookies.set('saw_about', cookie_version, { expires: 365 });
}
