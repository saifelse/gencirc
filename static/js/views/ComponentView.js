/*

ComponentView represents a single component on the canvas.

*/

define([
    'namespace', 'backbone','jquery','underscore','d3', 'models/GenCirc'
  ], function(App, Backbone, $, _, d3, GenCirc) {

  var ComponentView = Backbone.View.extend({

    tagName: "g",
    className: "comp",

    events: {
      "click .comp-label" : "editLabel"
    },
    editLabel: function() {
      App.vent.trigger("component:edit", this.model);
    },
 
    initialize: function(){
      this.setElement(document.createElementNS("http://www.w3.org/2000/svg","g"));
      d3.select(this.el).attr("class", "comp");
      
      // Look up Component Type to customize image:
      var ctype = GenCirc.BaseComponents[this.model.get("type")];

      d3.select(this.el).append("svg:image")
                          .attr("class","icon")
                          .attr("x","-50")
                          .attr("y","0")
                          .attr("width","100")
                          .attr("height","50")
                          .attr("xlink:href",ctype.get("image"));

      
      d3.select(this.el).append("svg:rect")
                        .attr("class","handle")
                        .attr("x", "-40")
                        .attr("y", "0")
                        .attr("r", "10")
                        .attr("width", "80")
                        .attr("height", "50")
                        .attr("fill","red")
                        .attr("fill-opacity",0.0);

      var fo = d3.select(this.el).append("svg:foreignObject")
                        .attr("class","labelFo")
                        .attr("x",-40).attr("y",50).attr("width",80).attr("height",20)
                        .select(function(){return this.appendChild($("<a xmlns='http://www.w3.org/1999/xhtml' style='display:block; text-align:center;' width='80' href='#' class='comp-label'></a>")[0])});

      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

   

    render: function(){
      var label = this.model.get("label");
      d3.select(this.el).select(".comp-label").text(label);
      d3.select(this.el).select(".labelFo").attr("x",-40); // FIXME: hack to force foreignobject to update
      return this;
    }
  },{
  bbox: {
      height: 72, width: 100, y: -2, x: -50
    },
  });

  return ComponentView;
});
