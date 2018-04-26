# Ballistic Hawk Physics Engine

Version 0.2

This is an attempt to use native javascript libraries to build the basis of a game physics engine for a space combat simulation with semi-realistic orbital physics. To work around the limitations of the n-body problem this implementation uses nested orbital systems that are pinned to a center common axis.

## Demo

This project can be downloaded and run directly from github. To do so please:

1. Clone the repository.
2. Run "bower install"
3. Open index.html in your WebGL compatible browser of choice.

In the demo you can pan and zoom using the mouse and scroll wheel. In the demo you should see a main body, a reference grid, and 2 nested orbiting bodies. You may need to zoom out to see the smaller bodies.

## Issues

* Javascript does not support the numerical precision to use m/s as the base unit for such a simulator due to the rapid drop off of numerical precision. As a result the base unit for the simulation is AU (astronomical units), or the distance from the earth to the sun.

* Gravitational Effects are deliberately restricted to the local orbital system (EG. the gravity of the sun does not affect the orbit of the moon, only the orbit of the combined earth/moon system). This is to reduce computational complexity and avoid the issues associated with solving the n-body problem. For most static cases (and the intended use case) this was determined to be an acceptable compromise given that this is an attempt at a game engine, not a completely accurate physics simulator.


## Dependencies

Most dependencies can be found in the js/ sub folder of the repo

* Bower
* numbers.js
* Babylon 2.1
* Cannon.js
* gl-matrix-64.js
* HandJS
* OimoPhysics
* Poly2Tri
