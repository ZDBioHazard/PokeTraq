PokeTraq
========

PokeTraq is just a super-simple web app to help you
track down Pokemon you see in your sightings list.

## How To Track Down Pokemon

Just click/tap on a location to set a "out of range" red circle or "nearby"
green circle markers on the map to notate locations where you see or don't
see the target on the sightings list.

You can observe how the circles overlap to determine where the target could
be. For example, if a green circle and red circle overlap, then you know the
target is in the area covered by the green circle, minus the red circle. If
there are multiple green circles, then you know the target is in the area
where they all overlap. Thus, the target area is the intersection of all
green circles minus the union of all red circles.
