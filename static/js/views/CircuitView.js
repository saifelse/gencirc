/*

ComponentView represents a single component on the canvas.

Expects a collection of components.

*/

define([
    'namespace','backbone','jquery','underscore','d3',
    'views/ComponentView',
    'views/InteractionView',
    'views/DragToolView',
    'models/GenCirc'
  ], function(App, Backbone, $, _, d3, ComponentView, InteractionView, DragToolView, GenCirc) {

  var CircuitView = Backbone.View.extend({

    tagName: "g",
    className: "circuit",

    // Display Parameters
    posX: 50,
    posY: 100,
    spaceH: 75,
    bYMin: -100,
    bYMax: 200,
    trashOpacity: 0.3,

    // Data
    model: null,

    children: {
      interactionViews: [],
      componentViews: [],
      dragToolViews: [],
    },
    changed: true,

    initialize: function(){
      var that = this;

      // Set up elements. FIXME: We can't use a template because we lose the namespacing for SVG?
      this.setElement(document.createElementNS("http://www.w3.org/2000/svg","g"));
      var toolBack = d3.select(this.el).append("svg:rect").attr("x",0).attr("y",0).attr("width",125).attr("height","100%").attr("fill","#333");
      var tools = d3.select(this.el).append("svg:g").attr("class", "tools");
      var mainCircuit = d3.select(this.el).append("svg:g").attr("transform","translate(200 200)");
      var greyTrack = mainCircuit.append("svg:rect").attr("x",-75).attr("y",120).attr("height",7).attr("width","100%").attr("fill","#ccc");
      var interactions = mainCircuit.append("svg:g").attr("class", "lines");
      var comps = mainCircuit.append("svg:g").attr("class", "comps");

      var nameBox = d3.select(this.el).append("svg:g").attr("transform","translate(125 10)");
      var nameLink = nameBox.append("a").attr("xlink:href","#");
      var nameText = nameLink.append("svg:text").attr("x",40)
                                               .attr("y", 55)
                                               .attr("height", 20)
                                               .attr("width", 200)
                                               .attr("font-size", 30)
                                               .attr("class","name-label");

      nameLink.on("click", function() {
        App.vent.trigger("circuit:edit:name", that.model);
      });

      // Initialize tools
      GenCirc.BaseComponents.each(function(baseComponent, i){
        var dragToolView = new DragToolView({model: baseComponent});
        that.children.dragToolViews.push(dragToolView);
        d3.select(dragToolView.el).attr("transform","translate(60 "+(250+i*100)+")");
        tools.select(function() {
          return this.appendChild(dragToolView.render().el);
        })
      });
      // Register listeners when the tool changes
      App.vent.on("mode:arrow", this.setModeArrow, this);
      App.vent.on("mode:activating", this.setModeActivating, this);
      App.vent.on("mode:repressing", this.setModeRepressing, this);

      // Register listeners for Menu Actions
      App.vent.on("circuit:tryclose", this.handleCheckClose, this);
      App.vent.on("circuit:new", this.newCircuit, this);
      App.vent.on("circuit:save", this.saveCircuit, this);
      App.vent.on("circuit:open", this.loadCircuit, this);
      App.vent.on("circuit:discard", this.discardCircuit, this);

      // Activate draggable tools.
      this._toolboxify();
    },
    discardCircuit : function() {
      if(this.model && this.model.id) {
        var id = this.model.id;
        this.model.clear();
        var model = new GenCirc.GeneticCircuit({id:id});
        model.fetch();
        this.model = model;
      }else{
        this.model = new GenCirc.GeneticCircuit({"name":"untitled", "components":[], "interactions":[]});
      }
      this.loadCircuit(this.model);
    },

    newCircuit : function() {
      this.loadCircuit(new GenCirc.GeneticCircuit({"name":"untitled", "components":[], "interactions":[]}));
    },

    saveCircuit : function(model) {
      if(this.model.id) {
        this.model.set("timestamp", new Date().getTime());
        this.model.save();
      } else {
        var gc = new GenCirc.GeneticCircuits();
        gc.create(this.model);
      }
      this.changed = false;
      this.render();
    },

    loadCircuit : function(model) {
      this.changed = false;

      var that = this;
      var interactions = d3.select(this.el).select(".lines"); 
      var comps = d3.select(this.el).select(".comps"); 
      var nameText = d3.select(this.el).select(".name-label");

      // Clear out old views
      for (var i in this.children.interactionViews) {
        this.children.interactionViews[i].remove();
      }
      for (var i in this.children.componentViews) {
        this.children.componentViews[i].remove();
      }
      this.children.interactionViews = [];
      this.children.componentViews = [];

      // Load in new views
      this.model = model;

      // Initialize components
      this.model.get('components').each(function(compModel, i) {
        var comp = new ComponentView({model: compModel});
        that.children.componentViews.push(comp);
        comps.select(function() {
          return this.appendChild(comp.render().el);
        });
      });

      // Initialize interactions
      this.model.get("interactions").each(function(interactionModel, i) {
        var interactionView = new InteractionView({model: interactionModel});
        that.children.interactionViews.push(interactionView);
        interactions.select(function() {
          console.log("AND I AM BORN!");
          console.log(interactionView.model.get("promoter"));
          console.log(interactionView.model.get("sequence"));
          return this.appendChild(interactionView.render().el);
        });
      });

      // Register Listeners

      var components = this.model.get("components");
      var interactions = this.model.get("interactions");
      
     

      // Register listeners for changes to the model to update the views.
      this.stopListening();
      this.listenTo(components, "change", this.onChangeComponent);
      this.listenTo(interactions,"add", this.onAddInteraction);
      this.listenTo(interactions,"remove", this.onRemoveInteraction);
      this.listenTo(components,"add", this.onAddComponent);
      this.listenTo(components,"remove", this.onRemoveComponent);
      this.listenTo(components,"move", this.onMoveComponent);
      // Register listeners to update the model
      this.listenTo(interactions,"destroy", this.onDestroy);
      this.listenTo(components,"destroy", this.onDestroy);
      this.render();
      App.vent.trigger("request:mode:arrow");
    },

    render: function(){
      // Update the title
      d3.select(this.el).select(".name-label").text((this.changed ? "* " : "") + this.model.get("name"));

      // Update the circuit
      this._snap(null);     
      return this;
    },
    handleCheckClose : function(action) {
      if (this.changed) {
        App.vent.trigger("warn:unsaved", action);
      } else {
        App.vent.trigger(action);
      }
    },

    onAddInteraction : function(model, collection, options) {
      // Add interaction view and render it.
      var interactionView = new InteractionView({model: model});
      this.children.interactionViews.push(interactionView);
      d3.select(this.el).select(".lines").select(function(){
        return this.appendChild(interactionView.render().el);
      })
      this.changed = true;
      this.render();
    },

    onRemoveInteraction : function(model, collection, options) {
      console.log("You are dead to me interaciton.");
      // Remove interaction and render.
      this.children.interactionViews = _(this.children.interactionViews).reject(function (m){
        return m == model;
      });
      this.changed = true;
      this.render();
    },

    onAddComponent : function(model, collection, options) {
      // Update our children and rerender.
      this.children.componentViews.push(options.view);
      this.changed = true;
      this.render();
    },

    onMoveComponent : function(model, collection, options) {
      // Nothing was physically removed, so we can just render the changes.
      this.changed = true;
      this.render();
    },

    onRemoveComponent : function(model, collection, options) {
      // Update our children and rerender.
      this.children.componentViews = _(this.children.componentViews).reject(function (m){
        return m == model;
      });
      this.changed = true;
      this.render();
    },

    onChangeComponent : function(model, collection, options) {
      // When a component is renamed.
      this.changed = true;
      this.render();
    },

    setModeArrow : function() {
      var that = this;
      _(this.children.componentViews).each(function(componentView, index) {
        that._draggable(d3.select(componentView.el), componentView.model)
      });
    },

    setModeRepressing : function() {
      this._setModeInteraction(true);
    },
    setModeActivating : function() {
      this._setModeInteraction(false);
    },
    // PRIVATE METHODS

    // Snaps elements in items to a line (y=50) with 50 units of horizontal spacing
    // Specify a skip element to prevent it from snapping (ie dragged element)
    _snap : function(skip) {

      // Determine where the dragged component used to be and where it wants to be
      var skipView = skip ? _.findWhere(this.children.componentViews, {el: skip.node()}) : null;
      var target_i = skip ? Math.min(Math.max(0,Math.floor((this._getTranslate(skip).x - this.posX)/this.spaceH)),9999) : 9999;
      var original_i = (skip && skipView) ? this.model.get("components").indexOf(skipView.model) : 9999;

      // Iterate through views, and update positions, taking into account the dragged components old/new pos.
      for (var j in this.children.componentViews) {
        var componentView = this.children.componentViews[j];
        var i = this.model.get("components").indexOf(componentView.model);
        var base_i = (skip != null && i >= original_i) ? i - 1 : i;
        var new_i = (skip != null && base_i >= target_i) ? base_i + 1 : base_i;
        if (skip == null || componentView.el != skip.node()) {
          this._setTranslate(d3.select(componentView.el), this.posX + this.spaceH * new_i, this.posY);
        }
      }

      // Also, update the lines!
      this._generateLines(skip);
      return target_i;
    },

    // Define conditions (a bounding box) necessary to consider a component's removal
    _outOfBounds: function(item) {
      var tr = this._getTranslate(item);
      return (tr.y < this.bYMin || tr.y > this.bYMax);
    },


    _draggable : function(targ, model) {
      var circ = this;
      var list = d3.select(this.el).select(".comps");

      var drag = d3.behavior.drag();
      var event = {start_i: null, end_i: null};

      targ.select(".handle").on("mouseover", function(){
        $("body").addClass("grab");
      });
      targ.select(".handle").on("mouseout", function(){
        $("body").removeClass("grab");
      });

      drag.on("dragstart", function() {
        $("body").addClass("grabbing");

        // Remove this component from the list and put it in front.
        $(targ.node()).detach().insertAfter(".comp:last");
      })

      drag.on("drag", function () {
          // Snap the components.
          var items = list.selectAll(".comp");
          circ._snap(targ);
        
          // Simulate drag.

          var cx = parseInt(targ.select(".handle").attr("x")) + parseInt(targ.select(".handle").attr("width"))/2 - 2;
          var cy = parseInt(targ.select(".handle").attr("y")) + parseInt(targ.select(".handle").attr("height"))/2 - 8;

          var m = d3.mouse(list.node());     // FIXME    
          var tx = m[0] - cx;
          var ty = m[1] - cy;
          circ._setTranslate(targ, tx, ty)
          targ.attr("opacity", circ._outOfBounds(targ) ? circ.trashOpacity : 1.0);
        
      });
    
      drag.on("dragend", function () {
        $("body").removeClass("grabbing");

        event.end_i = circ._snap(targ);

        if (circ._outOfBounds(targ)) {
          console.log("destroying model..");
          model.destroy();
        } else {
          var componentsModel = circ.model.get("components");

          // Update the model
          componentsModel.remove(model, {silent: true});
          componentsModel.add(model, {at: event.end_i, silent:true});
          componentsModel.trigger('move', model, componentsModel,
           {start_i: event.start_i, end_i: event.end_i});
         }
         event.start_i = null;
         event.end_i = null;

         circ.render();
      });
      targ.select(".handle").call(drag);
    },

    _setModeInteraction : function(repressingAction) {
        var circ = this;
        var list = d3.select(circ.el).select(".comps");
          // Global state for the currently drawn line.
          var event = {
              line: null,
              start: null,
              end: null,
              start_i: null,
              end_i: null,
              start_m: null,
              end_m: null
          };
          // Iterate through our views, and make corresponding views arrowable.
          _(this.children.componentViews).each(function(view, i) {
            var model = view.model;
            arrowable(d3.select(view.el), i, model);
          });

          function resetFocus(){
              // Reset all elements to original state, and enlarge selected components.
              list.selectAll(".comp").each(function() {
                  var targ = d3.select(this);
                  if(event.start && targ.node() == event.start.node() || event.end && targ.node() == event.end.node()) {
                      $(targ.node()).find(".comp-label").css("font-weight","bold");
                  } else {
                      $(targ.node()).find(".comp-label").css("font-weight","normal");
                  }
              });
          }
          function arrowable(targ, i, model) {
              var drag = d3.behavior.drag();
              drag.on("dragstart", function() {
                event.start = targ;
                event.start_i = i;
                event.start_m = model;

                resetFocus();

                // Simulate drag
                var tr = circ._getTranslate(targ);
                var m = d3.mouse(list.node());

                var cx = parseInt(targ.select(".handle").attr("x")) + parseInt(targ.select(".handle").attr("width"))/2;
                var cy = parseInt(targ.select(".handle").attr("y")) + parseInt(targ.select(".handle").attr("height"))/2;

                event.line = list.append("svg:line")
                          .attr("x1", cx + tr.x)
                          .attr("y1", cy + tr.y)
                          .attr("x2", m[0])
                          .attr("y2", m[1])
                          .attr("style", "stroke:rgb(0,0,0);stroke-width:2");
              });
              drag.on("drag", function() {
                  var m = d3.mouse(list.node());
                  // FIXME: We offset the line from the mouse to prevent 
                  // mouseout from falsely triggering, on Line 230 
                  event.line.attr("x2", m[0]-5);
                  event.line.attr("y2", m[1]-5);

                  if (event.end == null ) {
                    $("body").addClass("line-invalid");
                    event.line.attr("style", "stroke:rgb(200,200,200); stroke-width:2");
                  } else {
                    $("body").removeClass("line-invalid");
                    event.line.attr("style", "stroke:rgb(0,0,0); stroke-width:2");
                  }
              });
              
              targ.select(".handle").on("mouseover", function() {
                  event.end = targ;
                  event.end_i = i;
                  event.end_m = model;
                  resetFocus();
              });
              
              targ.select(".handle").on("mouseout", function() {
                  if (event.end && event.end.node() == targ.node()) {
                      event.end = null;
                      event.end_i = null;
                      resetFocus();
                  }
              });
              
              drag.on("dragend", function() {
                  if (event.start_i != null && event.end_i != null && (event.start_i != event.end_i)) { 
                      console.log("LINE: "+[event.start_i, event.end_i]);

                      var interaction = new GenCirc.Interaction({promoter: event.start_m, sequence: event.end_m, repressingAction: repressingAction});
                      circ.model.get("interactions").push(interaction);

                      //circ.addLine(event.start_m, event.end_m, repressingAction);
                      circ._generateLines(null);
                  }
                  event.line.remove();
                  event.start = null;
                  event.start_i = null;
                  event.start_m = null;
                  event.end = null;
                  event.end_i = null;
                  event.end_m = null;         
                  resetFocus();
                  $("body").removeClass("line-invalid");
              });
              targ.select(".handle").call(drag);
          }

    },
    // Parses a d3 element's transform to return a point {x,y}
    // that represents the SVG's translation. 
    _getTranslate : function(e) {
      var t = e.attr("transform") || "transform(0 0)";
      var a = t.slice(10, -1).split(" ");
      return {
        x: parseInt(a[0]),
        y: parseInt(a[1])
      };
    },

    // Set a d3's position by specifying translation units.
    // We also use d3's data property to take advantage of element sorting.
    _setTranslate : function(e, x, y) {
      e.attr("transform", "translate(" + x + " " + y + ")");
    },
    _generateLines : function generateLines(dragged) {
      var circ = this;

      var items = d3.select(this.el).select(".comps").selectAll(".comp");
      var dist = 4; // minimum distance between parallel lines
      

      // 0. Determines indices for lines
      var lines = [];
      var directLines = [];

      var interactions = circ.model.interactions;
      _(this.children.interactionViews).each(function(interactionView, i){
        var line = processInteraction(interactionView);
        if (!line) return;
        if (line.hide) {
          directLines.push(line);
        }else {
          lines.push(line);
        }
      });

      // 1. Separate lines into two groups
      var top = [];
      var bottom = [];
      for (var i = 0; i < lines.length; i++) {
          var a = lines[i];
          if (overlapsTop(a)) {
              bottom.push(a);
          } else {
              top.push(a);
          }
      }
      
      // 2. Most of the arrows should be on top.
      if (bottom.length > top.length) {
          var temp = top;
          top = bottom;
          bottom = temp;
      }
      
      // 3. Wider intervals should be taller to avoid overlapping.
      top.sort(intervalSort);
      bottom.sort(intervalSort);
      
      // 4. Draw lines, while keeping space between lines that go to the same component.
      ranges = [];
      items.each(function(d, i) {
          ranges[i] = {left:-dist, right:dist}
      });

      for (var i = top.length - 1; i >= 0; i--) {
          var dx = determineOffset(top[i].start_i, top[i].end_i);
          if (!top[i].hide){
              refreshLine(top[i], dx[0], dx[1], true, 20 + 10*i); 
          }
      }
      for (var i = bottom.length - 1; i >= 0; i--) {
          var dx = determineOffset(top[i].start_i, top[i].end_i);
          if (!bottom[i].hide) {
              refreshLine(bottom[i], dx[0], dx[1], false, 20 + 10*i);
          }
      }
      for (var i = 0; i < directLines.length; i++) {
        directLines[i].view.$el.hide();
      }

      function refreshLine(line, dx1, dx2, above, height) {
        var s = d3.select(line.startView.el);
        var e = d3.select(line.endView.el);
        line.view.setLine(circ._getTranslate(s), circ._getTranslate(e),
                ComponentView.bbox, ComponentView.bbox,
                 dx1, dx2, above, height);
      }

      function processInteraction(lineView) {
        var start_m = lineView.model.get("promoter");
        var end_m = lineView.model.get("sequence");

        var start_i = circ.model.get("components").indexOf(start_m);
        var end_i = circ.model.get("components").indexOf(end_m);
        if (start_i == -1 || end_i == -1) {
          // This occurs when the model has removed a component
          // and tries to rerender before the line has a chance to do so.
          // It will be deleted in a second.
          lineView.$el.hide();
          return null;
        } 

        var startView = _(circ.children.componentViews).findWhere({model: start_m});
        var endView = _(circ.children.componentViews).findWhere({model: end_m});

        return {
          view: lineView,
          startView: startView, 
          endView: endView,
          start_i: start_i,
          end_i: end_i,
          hide: dragged && (startView.el == dragged.node() || endView.el == dragged.node())
        };
      }
      // Ascending interval-size comparator.
      function intervalSort(a,b) {
          return  Math.abs(a.end_i - a.start_i) - Math.abs(b.end_i - b.start_i);
      };
      
      // Only one of b's endpoints must be within the range of a for there to be an overlap.
      function overlap(a,b) {
          var aMin = Math.min(a.start_i, a.end_i);
          var aMax = Math.max(a.start_i, a.end_i);
          return (aMin < b.start_i && b.start_i < aMax) ^ (aMin < b.end_i && b.end_i < aMax);
      }

      // Returns true if a overlaps with anything on top.
     function overlapsTop(a) {
          for (var i = 0; i < top.length; i++) {
              if (overlap(a, top[i])) {
                  return true;
              }
          }
          return false;
      }

      //For largest interval... right side is the first left.
      //                        left side is first right.
                        
      function determineOffset(si, ei) {
          var dx1, dx2;
          if (si < ei) {
              dx1 = ranges[si].right;
              dx2 = ranges[ei].left;
              ranges[si].right += dist;
              ranges[ei].left -= dist;
          } else {
              dx1 = ranges[si].left;
              dx2 = ranges[ei].right;
              ranges[ei].right += dist;
              ranges[si].left -= dist;
          }
          return [dx1, dx2];
      }
  },
  _toolboxify : function(toolbox) {

    var circ = this;
    var list = d3.select(this.el).select(".comps");

    _(this.children.dragToolViews).each(function (dragToolView, i) {
      toolify(d3.select(dragToolView.el), dragToolView.model);
    });


    function toolify(targ, model) {
      // Object to keep reference to cloned component between dragstart and drag handlers.

      var event = {
          'draggedView': null,
      };
      $(targ.node()).hover(function(){
        $("body").addClass("grab");
       },
       function(){
        $("body").removeClass("grab");
      });
      // Add drag behavior
      var drag = d3.behavior.drag();
      drag.on("dragstart", function () {
        // Switch to Arrow Mode
        App.vent.trigger("request:mode:arrow");

        // Add new componentView
        var draggedView = new ComponentView({model: new GenCirc.Component({"type":model.get("name"),"label":"[abc]"})});
        event.draggedView = draggedView;
        var dragged = d3.select(event.draggedView.el);

        list.select(function() {
          return this.appendChild(draggedView.render().el);
        });

        // Initial position
        var cx = parseInt(dragged.select(".handle").attr("x")) + parseInt(dragged.select(".handle").attr("width"))/2;
        var cy = parseInt(dragged.select(".handle").attr("y")) + parseInt(dragged.select(".handle").attr("height"))/2;
        var m = d3.mouse(list.node());  
          var tx = m[0] - cx;
          var ty = m[1] - cy;
          circ._setTranslate(dragged, tx, ty);

        // Make it draggable after being added.
        d3.select(event.draggedView.el).each(function () {
          circ._draggable(d3.select(this), event.draggedView.model);
        });
      });

      drag.on("drag", function () {
        var dragged = d3.select(event.draggedView.el);

        // Snap the components
        circ._snap(dragged);

        var cx = parseInt(dragged.select(".handle").attr("x")) + parseInt(dragged.select(".handle").attr("width"))/2;
        var cy = parseInt(dragged.select(".handle").attr("y")) + parseInt(dragged.select(".handle").attr("height"))/2;

        var m = d3.mouse(list.node());  
        var tx = m[0] - cx;
        var ty = m[1] - cy;
        circ._setTranslate(dragged, tx, ty);

        // Warn if in trash-zone.
        dragged.attr("opacity", circ._outOfBounds(dragged) ? circ.trashOpacity : 1.0);
      });
      
      drag.on("dragend", function () {
        var dragged = d3.select(event.draggedView.el);
        var insert_i = circ._snap(dragged);

        // Update Model
        // Throw away if in trash-zone.
        if (circ._outOfBounds(dragged)) {
          circ.model.get("components").remove(event.draggedView.model);
          event.draggedView.model.destroy();
        } else {
          console.log("adding it...");
          circ.model.get("components").add(event.draggedView.model, {at: insert_i, view: event.draggedView});
        }
        circ.render();
      });

      targ.select(".handle").call(drag);

    }
  }



  });


  return CircuitView;
});
