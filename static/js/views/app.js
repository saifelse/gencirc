// Author: Saif <saif@mit.edu>
// Filename: app.js

// Initialize app
define([
    'namespace',
    'jquery',
    'backbone',
    'underscore',
    'd3',
    'models/GenCirc',
    'views/NavView',
    'views/ComponentView',
    'views/CircuitView',
    'views/ToolboxView'
  ], function(App, $, Backbone, _, d3, GenCirc, NavView, ComponentView, CircuitView, ToolboxView) {

  App.vent = {};

  App.AppView = Backbone.View.extend({
    el: "body",
    initialize: function(){

      // TODO: REMOVE
      var c1 = new GenCirc.Component({'label': "PROMO1", type: GenCirc.BaseComponents.P.get("name")});
      var c2 = new GenCirc.Component({'label': "RBS01", type: GenCirc.BaseComponents.RBS.get("name")});
      var c3 = new GenCirc.Component({'label': "PROM02", type: GenCirc.BaseComponents.P.get("name")});
      var c4 = new GenCirc.Component({'label': "T01", type: GenCirc.BaseComponents.T.get("name")});
      var c5 = new GenCirc.Component({'label': "CS01", type: GenCirc.BaseComponents.CS.get("name")});

      var i1 = new GenCirc.Interaction({'repressingAction': true, 'promoter': c1, 'sequence':c4}); 
      var i2 = new GenCirc.Interaction({'repressingAction': false, 'promoter': c3, 'sequence':c4}); 
      var circ = new GenCirc.GeneticCircuit({'name': 'HelloCircuit '+Math.round(Math.random()*100), 'components': [c1,c2,c3,c4,c5], 'interactions': [i1,i2]});
      
      this.children = {
        navView: new NavView(),
        circuitView: new CircuitView({model: circ}),
        toolboxView: new ToolboxView()
      };
    },
    render: function(){
      var that = this;
      this.$el.hide();

      // Add the subviews and render them
      var container = $("<div id='container'></div>");
      this.$el.append(container);
      d3.select(container[0]).append("svg").attr("width","100%")
                                           .attr("height","1000px")
                                           .attr("style", "position: absolute; top:42px").select(function() {
                                             return this.appendChild(that.children.circuitView.el);
                                           });
      this.children.circuitView.render();
      this.$el.append(this.children.navView.render().el);
      container.append(this.children.toolboxView.render().el);
      
      // Prevent text from being highlighted:
      container.css('MozUserSelect','none')
               .bind('selectstart',function(){return false;}) 
               .mousedown(function(){return false;});     
       
      // Create a new circuit 
      App.vent.trigger("circuit:new");

      // Set mode to arrow
      App.vent.trigger("request:mode:arrow");
      
      // Display
      this.$el.show(); 
      return this;
    }
  });
  App.Router = Backbone.Router.extend({
    routes: {
      "": "main",
      "generate": 'generate'
    },
    main: function() {
      var appView = new App.AppView();
      appView.render();

    },
    generate: function() {
      var c1 = new GenCirc.Component({'label': "PROMO1", type: GenCirc.BaseComponents.P.get("name")});
      var c2 = new GenCirc.Component({'label': "RBS01", type: GenCirc.BaseComponents.RBS.get("name")});
      var c3 = new GenCirc.Component({'label': "PROM02", type: GenCirc.BaseComponents.P.get("name")});
      var c4 = new GenCirc.Component({'label': "T01", type: GenCirc.BaseComponents.T.get("name")});
      var c4 = new GenCirc.Component({'label': "CS01", type: GenCirc.BaseComponents.CS.get("name")});

      var i1 = new GenCirc.Interaction({'label': 'howdy', 'repressingAction': true, 'promoter': c1, 'sequence':c4}); 
      var i2 = new GenCirc.Interaction({'label': 'doddy', 'repressingAction': false, 'promoter': c3, 'sequence':c4}); 
      var circ = new GenCirc.GeneticCircuit({'name': 'HelloCircuit '+Math.round(Math.random()*100), 'components': [c1,c2,c3,c4], 'interactions': [i1,i2]});

      circ.print();
      console.log("Interactions: "+circ.get("interactions").length);
      console.log("Components: "+circ.get("components").length);
      var circs = new GenCirc.GeneticCircuits();
      circs.create(circ);
      console.log("Hello world!");
    }
  });
  App.initialize = function() {
    var router = new App.Router();
    Backbone.history.start();
  };

  _.extend(App.vent, Backbone.Events);
  var old = App.vent.trigger;
  App.vent.trigger = function(x, y) {
    console.log("app.vent.trigger("+[x,y]+").");
    old.apply(this, [x,y]);
  }
  return App;

/*
    generate: function() {
      var c1 = new GenCirc.Component({'label': "PROMO1", type: GenCirc.BaseComponents.P});
      var c2 = new GenCirc.Component({'label': "RBS01", type: GenCirc.BaseComponents.RBS});
      var c3 = new GenCirc.Component({'label': "PROM02", type: GenCirc.BaseComponents.P});
      var c4 = new GenCirc.Component({'label': "T01", type: GenCirc.BaseComponents.T});
      var c4 = new GenCirc.Component({'label': "CS01", type: GenCirc.BaseComponents.CS});

      var i1 = new GenCirc.Interaction({'repressingAction': true, 'promoter': c1, 'sequence':c4}); 
      var i2 = new GenCirc.Interaction({'repressingAction': false, 'promoter': c3, 'sequence':c4}); 
      var circ = new GenCirc.GeneticCircuit({'name': 'HelloCircuit '+Math.round(Math.random()*100), 'components': [c1,c2,c3,c4], 'interactions': [i1,i2]});
      console.log(circ);
      circ.print();
      var circs = new GenCirc.GeneticCircuits();
      circs.create(circ);
      console.log("Hello world!");
    },
    main: function() {

      var circs = new GenCirc.GeneticCircuits();

      var toolboxView = new ToolboxView();
      $("#toolbox").html(toolboxView.render().el).show();

      var navView = new NavView();
      $("#navigation").html(navView.render().el).show();

      var canvasView = new CanvasView();
      console.log(canvasView);
      // Load locally stored circuits, and then display.
      circs.fetch({
        success: function(circs){
          var view = new MasterView({collection: circs});
          $("#container").html(view.render().el).show();
          circs.each(function(circ) {
            circ.print();
          });
        }
      });
    }
  });



  var router = new Router();
  Backbone.history.start();
*/

});
