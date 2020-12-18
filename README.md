# Cities From Maps: CSC 292 Final Project

This project allows a user to turn a map into a procedurally generated city. Cities currently feature roads, sidewalks, and buildings.


### Dependencies 
The server runs on `http-server`, which can be installed with `npm install --global http-server`

### Usage
To start the server, run `http-server`. This will launch the server on port 8080, allowing the project to be accessed using a browser at url `localhost:8080`. 

To create a new map, select *New Map* and create a map with the tools provided. The *line* feature creates straight roads, while the *curve* feature creates bezier curves. Once completed, selecting *save* will download the map as `map.json`.

To upload a created map or one of the preloaded ones, select *Generate From Map*, then select the map file you wish to use. The *Maximum Lot Size* field specifies how large individual plots can be. The default setting is 2000, which generates good-looking cities for the prebuilt maps, which include a small, medium, and large city. Depending on the size of the blocks of a map, you may wish to change this setting.

The city may then take a few seconds to procedurally generate and load. Once loaded, the left, right, and middle mouse buttons can be used to move the camera. The top right corner shows a map of the city. 

### Design

This project is built exclusively in Javascript, using the Three.js library to render cities and my implementations for all other functionality. Variance in building features is implemented with a grammar-like structure: buildings subdivide into ground sections, middle sections, and roof sections. The middle sections further subdivide into floors, which subdivide into windows.

### Known Issues

If roads are laid out close together, the algorithm for building generation may invert the intended block shapes and yield some undesirable results. For best results, lay out roads at fairly large angles to each other.

### Future Plans

The grammar-like structure of the building generation allows for a lot of future expansion. Currently, each nonterminal in the "grammar" only has one production, but by adding more, the structure of buildings could vary greatly.

For the ground sections, I would like to add doors adjacent to the roads, so that each building would have a door leading to it.

For roof sections, I would like to add cutouts to the top which create a wall around the roof. This feature is currently being implemented in the dev branch, but is not functional yet.

I would also like to add postprocessing effects, as Three.js provides an intuitive pipeline for them.