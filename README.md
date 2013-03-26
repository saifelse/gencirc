Genetic Circuits Builder
=====================
An HTML5 app that allows users to build genetic circuits.

Features
--------
 - UI to build circuits using drag-and-drop components
 - Store circuits locally using HTML5 LocalStorage 

Running the server
------------------

    python server.py

Notes
-----

Most of the graphics are SVGSs, manipulated with d3.js and jquery. 

Backbone-localStorage and Backbone-relational do not play well together.
I had to patch Backbone-localStorage to recursively assign ID's to models on create/update.
