/*

A DragToolView represents a draggable tool (ie a promoter, cs, rbs, or t).
When it is pressed, a copy is dragged and inserted into the circuit.
CircuitView does most of the heavy lifting.
*/


define([
    'namespace', 'backbone','jquery','underscore',
  ], function(App, Backbone, $, _) {
  var View = Backbone.View.extend({
    initialize: function(){
      this.setElement(document.createElementNS("http://www.w3.org/2000/svg","g"));
      d3.select(this.el).attr("class", "tool");
      
      var model = this.model;

      d3.select(this.el).append("svg:rect")
                        .attr("x", "-40")
                        .attr("y", "-5")
                        .attr("r", "10")
                        .attr("width", "80")
                        .attr("height", "80")
                        .attr("rx",5).attr("ry",5)
                        .attr("fill","white")
                        .attr("fill-opacity",1.0);

      d3.select(this.el).append("svg:image")
                    .attr("class","icon")
                    .attr("x","-50")
                    .attr("y","0")
                    .attr("width","100")
                    .attr("height","50")
                    .attr("xlink:href",this.model.get("image"));

      d3.select(this.el).append("svg:rect")
                    .attr("class","handle")
                    .attr("x", "-40")
                    .attr("y", "-5")
                    .attr("r", "10")
                    .attr("width", "80")
                    .attr("height", "80")
                    .attr("rx",5).attr("ry",5)
                    .attr("fill-opacity",0);


      d3.select(this.el).append("svg:foreignObject")
                        .attr("x",-40).attr("y",50).attr("width",80).attr("height",80)
                        .select(function(){
                          return this.appendChild($("<a style='display:block; text-align:center;' width='80' class='comp-label noSelect'>"+model.get("name")+"</a>")[0])
                        });  

      this.$el.hide();


    },
    render: function(){
      this.$el.show();
      return this;
    }
  });
  return View;
});

