/*

The ToolboxView consists of the 3 tools. This view does no heavy lifting...

When another view would like to switch tools or if a button is clicked,
ToolboxView updates and transmits the change.


*/

define([
    'namespace', 'backbone','jquery','underscore','text!templates/toolbox.html',
  ], function(App, Backbone, $, _, toolboxTemplate) {
  var View = Backbone.View.extend({
    className: 'toolboxView',
    events: {
      "click #activating_tool" : "setModeActivating",
      "click #repressing_tool" : "setModeRepressing",
      "click #arrow_tool" : "setModeArrow"
    },
    initialize: function(){
      var compiledTemplate = _.template(toolboxTemplate,{});
      var that = this;

      this.$el.hide();;
      this.$el.append(compiledTemplate);

      // Handles requests to change modes
      App.vent.on("request:mode:arrow", function(){
        that.$el.find("#arrow_tool").click();
      })
      App.vent.on("request:mode:activating", function(){
        that.$el.find("#activating_tool").click();
      })
      App.vent.on("request:mode:repressing", function(){
        that.$el.find("#repressing_tool").click();
      });
    },

    
    render: function(){
      this.$el.show();
      return this;
    },

    setModeActivating: function() {
      App.vent.trigger("mode:activating");
      $("body").addClass("line_draw");
    },

    setModeRepressing:  function() { 
      App.vent.trigger("mode:repressing");
      $("body").addClass("line_draw");
    },

    setModeArrow: function() {
      App.vent.trigger("mode:arrow");
      $("body").removeClass("line_draw");
    }
  });
  return View;
});



