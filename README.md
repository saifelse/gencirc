Genetic Circuits Builder
=====================
An HTML5 app that allows users to build genetic circuits.

Features
--------
 - UI to build circuits using drag-and-drop components.
    - Components and Interactions are intelligently placed.
    - Components
      -  Drag a new component from the toolbox onto the canvas.
      -  Drag a component off of the canvas to remove it.
      -  Drag an existing component to rearrange it.
      -  Rename a component by clicking on it's text.
    - Interactions
      -  Select between activating and repressing interactions in the toolbox.
      -  Draw a line between two components to create an interaction (invalid interactions marked in red).
      -  Drag on the knob to adjust the line heights temporarily, or to remove the interaction.
    -  Rename the circuit by clicking on the title.
 - Circuits are stored locally using HTML5 LocalStorage.
    - File menu provides save, open, and new options... presented with intelligent dialogs. 

Running the server
------------------
Download a local copy of the repository. The contents of static can be placed in any 
web accessible directory, and then navigating to index.html. A light webserver is
included for testing (requires [Flask](http://flask.pocoo.org/)). 

    python server.py
    
And then browse to [http://localhost:5000/](http://localhost:5000/)

Building the source
-------------------
While the source is functional, it is not optimized (loads in several files). To build,
install node and  r.js:

    npm install -g requirejs

Within src/js, execute:

    ./build

while will create a build directory at the root.

Bugs/Notes
-----
 - Backbone-localStorage and Backbone-relational do not play well together.
   I had to patch Backbone-localStorage to recursively assign ID's to models on create/update. This is not well tested.

 - The Circuit's SVG uses foreignObject to display a link, which should be replaced with svg:a and svg:text components.

 - Export as PNG is not yet implemented.

 - There are no restrictions on how one can draw an interaction, though a warning does show. This can instead be enforced.




