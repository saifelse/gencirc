// Author: Saif <saif@mit.edu>
// Filename: app.js


// Define shortcuts and dependencies for libraries

require.config({
  baseUrl: '/js/',
  urlArgs: "v=" +  (new Date()).getTime(),
  paths: {
    app: 'views/app',
    namespace: 'helpers/namespace',
    jquery: 'lib/jquery-1.9.1.min',
    d3: 'lib/d3.v3.js',
    underscore: 'lib/underscore',
    backbone: 'lib/backbone',
    'backbone.localStorage': 'lib/backbone.localStorage',
    'backbone.relational': 'lib/backbone.relational',
    bbloader: 'helpers/bbloader',
    bootstrap: 'lib/bootstrap'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: ['underscore','jquery'],
      exports: 'Backbone'
    },
    'bootstrap' : {
      deps: ['jquery']
    },
    'backbone.localStorage': {
      deps: ['backbone'],
      exports: 'Backbone'
    },
    'backbone.relational': {
      deps: ['backbone'],
      exports: 'Backbone'
    },
    d3: {
      exports: 'd3'
    }
  }
});


// Initialize app
require(['app'],function(App) {
  App.initialize();
});
