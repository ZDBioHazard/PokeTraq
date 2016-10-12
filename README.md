Pok&eacute;Traq - Manual Triangulation Helper
=============================================

Pok&eacute;Traq is a super-simple web app to help you
track down Pok&eacute;mon you see in your sightings list.

It is hosted at http://poketraq.com

## How To Track Down Pok&eacute;mon

Click on the map to place markers for "nearby" and "too far" points to
help narrow down the possible location of whatever Pok&eacute;mon you're
hunting.

![Nifty Demo](./demo.gif)

* Place green check markers at locations where the target appears on the
  "sightings" list.
* Place red "X" markers at locations where the target does not appear on the
  "sightings" list.
* You can click on a placed marker to remove it.

A blue area will be created around the locations where the target
Pok&eacute;mon could be, based on your markers.

## Development

This is just a simple web app that runs in a single page. It uses
[Leaflet](http://leafletjs.com) and a bunch of plugins to provide maps,
and uses [Turf.js](http://turfjs.org) to calculate the search areas.

The whole app runs out of a single page and has no back-end. You can run
it from a `file://` URL if you want.

## Contributing

If you like this app, please consider
[making a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2UAG73LMY5LE2)
so I can buy some bag slot upgrades. :)
