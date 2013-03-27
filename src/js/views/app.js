/*

App consists of a main view that adds the child views, a very basic router (/ --> view.render),
and a vent, which is a global object that views may use to pass messages.

*/
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
      this.children = {
        navView: new NavView(),
        circuitView: new CircuitView({model: new GenCirc.GeneticCircuit()}),
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
    },
    main: function() {
      var appView = new App.AppView();
      appView.render();

    }
  });
  App.initialize = function() {
    var router = new App.Router();
    Backbone.history.start();
  };

  _.extend(App.vent, Backbone.Events);
  return App;

});
