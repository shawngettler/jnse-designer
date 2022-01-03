# JNSE Designer

Browser-based course designer for old-timey golf game *Jack Nicklaus Golf and Course Design: Signature Edition* (1992).

The game came with a standalone course designer, but recreating real-life courses was difficult since there was limited ability to import reference material (a third-party utility would let you create plots from PCX images). The goal of this mostly frivolous project is to be able to use now-easily-found geographic information to quickly generate custom courses.


## Usage

To use the app, you will need to serve the `/app` folder as a website.

If you have Node.js or Python installed, there are simple HTTP servers included which will do just that.


## Features

#### Complete

- Import and export (most) game files
- Create and modify hole layouts, modify hole metadata
- Paint course and hole plots
- Import reference images (e.g. satellite photos) to paint over


#### Missing

- Import official game data from proprietary (?) compression
- Modify course and hole plot elevations
- Place objects, pins, and tees
- Edit objects
- Edit the skybox/panorama
- Edit the course color palette


#### Enhancements

- Import reference elevations (DEM data)
