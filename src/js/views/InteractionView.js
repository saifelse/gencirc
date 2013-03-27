define([
    'namespace', 'models/GenCirc', 'backbone','jquery','underscore','d3',
  ], function(App, GenCirc, Backbone, $, _, d3) {

  var InteractionView = Backbone.View.extend({

    tagName: "g",
    className: "line",
    
    model: null,

    // Display properties
    maxD: 100,
    knobr: 5,
    minh: 15,
    rowh: 70,

    // Private helpers
    _startLine: null,
    _crossLine: null,
    _endLine: null,
    _knob: null,
    
    _p1x: 0,  _p1y: 0,
    _p2x: 0,  _p2y: 0,
    _p3x: 0,  _p3y: 0,
    _p4x: 0,  _p4y: 0,
    _b1: null, _b2: null,
    _dx1: 0,  _dx2: 0,
    _above: true,

    initialize: function(){
      this.setElement(document.createElementNS("http://www.w3.org/2000/svg","g"));
      var lineGroup = d3.select(this.el);
      lineGroup.attr("class", "line");
      this._startLine = lineGroup.append("svg:line");
      this._crossLine = lineGroup.append("svg:line");
      this._endLine = lineGroup.append("svg:line");
      this._knob = lineGroup.append("svg:circle");
      this._arrow = lineGroup.append("svg:path");

      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(this.model.get("promoter"), 'destroy', this.kill);
      this.listenTo(this.model.get("sequence"), 'destroy', this.kill);

      this._draggableKnob();
      this.$el.hide();
    },

    kill : function() {
      this.model.destroy();
    },

    setLine : function(tr1, tr2, b1, b2, dx1, dx2, above, height) {
      this._above = above;
      this._tr1 = tr1;
      this._tr2 = tr2;
      this._b1 = b1;
      this._b2 = b2;
      this._dx1 = dx1;
      this._dx2 = dx2;

      if (above) {
        var y = tr1.y + b1.y;
        var yh = y - height;
      } else {
        var y = tr1.y + b1.y + this.rowh;
        var yh = y + height;
      }
      var x1 = tr1.x + b1.x + b1.width/2 + dx1;
      var x2 = tr2.x + b1.x + b2.width/2 + dx2;

      // Update points
      this._p1x = this._p2x = x1;
      this._p3x = this._p4x = x2;
      this._p1y = this._p4y = y;
      this._p2y = this._p3y = yh;


      this.render();
    },

    render: function() {
      // Draw lines and knobs
      this._startLine.attr("x1",this._p1x)
                     .attr("y1",this._p1y)
                     .attr("x2",this._p2x)
                     .attr("y2",this._p2y);
      this._crossLine.attr("x1",this._p2x)
                     .attr("y1",this._p2y)
                     .attr("x2",this._p3x)
                     .attr("y2",this._p3y);
      this._endLine.attr("x1",this._p3x)
                   .attr("y1",this._p3y)
                   .attr("x2",this._p4x)
                   .attr("y2",this._p4y);
      this._knob.attr("cx", (this._p2x + this._p3x)/2)
                .attr("cy", (this._p2y + this._p3y)/2)
                .attr("r", this.knobr);
      // Draw Arrow or T
      if (!this.model.get("repressingAction")) {
        var baseY = this._p4y + (this._above ? -5 : +5);
        this._arrow.attr("d", "M " + (this._p4x - 5) + " " + baseY + " " +
                              "L " + (this._p4x + 5) + " " + baseY + " " + 
                              "L " + this._p4x + " " + this._p4y)
                    .attr("fill","black");
      } else {
        this._arrow.attr("d", "M" + (this._p4x - 5) + " " + this._p4y + " " +
                              "L " + (this._p4x + 5) + " " + this._p4y)
                   .attr("style", "stroke:rgb(0,0,0); stroke-width:2");
      }
      // Hint if line is about to be removed.
      var lineGroup = d3.select(this.el);
      if (this._isOutOfBounds()) {
        lineGroup.selectAll("line").attr("style", "stroke:rgb(200,200,200);stroke-width:2");
      } else if (this.model.get("promoter").get("type") != GenCirc.BaseComponents.P.get("name") ||
                 this.model.get("sequence").get("type") != GenCirc.BaseComponents.CS.get("name")){

        lineGroup.selectAll("line, path, circle").attr("style", "stroke:rgb(255,0,0);stroke-width:2; fill:rgb(255,0,0)");

      } else {      
        lineGroup.selectAll("line").attr("style", "stroke:rgb(0,0,0);stroke-width:2");
      }
      this.$el.show();
      return this;
    },  

    _isOutOfBounds : function() {
      return this._b1 != null && Math.abs((this._p2y + this._p3y)/2 - (this._tr1.y + this._b1.y + this.rowh/2)) > this.maxD;
    },

    _draggableKnob : function() {
      var line = this;
      var drag = d3.behavior.drag();
      
      drag.on("dragstart", function() {
        $("body").addClass("line-resize");
      });

      drag.on("drag", function() {
          var m = d3.mouse(this);
          var y = line._p1y;
          var ny;
          var nyh = m[1];
          var nowAbove = nyh < y - line.minh;
          var nowBelow = nyh > line._tr1.y + line.rowh + line.minh;
          var nowSame = !nowAbove && !nowBelow;
          if (nowAbove || nowSame && line._above) {
              ny = line._tr1.y + line._b1.y;
              if (nowSame) {
                  nyh = ny - line.minh;
              }
              line._above = true;
          } else if(nowBelow || nowSame && !line._above) {
              ny = line._tr1.y + line._b1.y + line.rowh;
              if (nowSame) {
                  nyh = ny + line.minh;
              }
              line._above = false;
          }

          line._p1y = line._p4y = ny;
          line._p2y = line._p3y = nyh;
          line.render();
      });

      drag.on("dragend", function() {
          if (line._isOutOfBounds()) {
            line.model.destroy();
          }
          $("body").removeClass("line-resize");
      });
      this._knob.call(drag);
      this._crossLine.call(drag);
      //$(this._knob.node()).addClass("line-resize");
      $(this._knob.node()).css("cursor","row-resize");
      $(this._crossLine.node()).css("cursor","row-resize");
    }
  });
  return InteractionView;
});