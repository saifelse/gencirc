/*

NavView is responsible for the file menu and all dialogs.

NavView communicates with CircuitView through events triggered on App.vent.

The two are highly decoupled.
For example, when you click File > Save:
   1. NavView asks if the CircuitView's model is unsaved.
   2. If it isn't, CircuitView asks NavView to show a save dialog.
   3. If the user doesn't cancel, NavView will proceed with the next question.

*/
define([
    'namespace', 'models/GenCirc', 'd3', 'backbone','jquery','text!templates/navigation.html','bootstrap',
  ], function(App, GenCirc, d3, Backbone, $, navigationTemplate) {
  var View = Backbone.View.extend({
    id: 'navigation',
    initialize: function(){
      var compiledTemplate = _.template(navigationTemplate,{});
      this.$el.hide();;
      this.$el.append(compiledTemplate);

      // Register listeners for Modals
      App.vent.on("component:edit", this.editComponent, this);
      App.vent.on("circuit:edit:name", this.editCircuitName, this);
      App.vent.on("open", this.openCircuitDialog, this);

      // Register listeners for trying to save.
      App.vent.on("warn:unsaved", this.promptSave, this);
    },


    model: null,
    events: {
      // Menu
      "click #nav-open" : "tryOpenCircuitDialog",
      "click #nav-save" : "saveCircuit",
      "click #nav-new" : "tryNewCircuit",
      "click #nav-export" : "exportCircuit",

      // Modal focusing/closing
      "shown #renameModal" : "highlightComponentField",
      "submit #renameModal" : "submitRenameComponent",
      "shown #renameCircuitModal" : "highlightCircuitField",
      "submit #renameCircuitModal" : "submitRenameCircuit"
    },

    // We had previously asked if we needed to save first,
    // but it seems like we need to save, before we try again.
    promptSave : function(action) {
      var saveModal = this.$el.find("#saveModal");
      var saveBtn = saveModal.find("#saveBtn");
      var noSaveBtn = saveModal.find("#noSaveBtn");
      var that = this;
      saveModal.modal("show");

      noSaveBtn.click(function() {
        App.vent.trigger("circuit:discard");
      });

      saveBtn.click(function(){
        that.saveCircuit();
      });

      saveModal.submit(function(){
        App.vent.trigger(action);
        saveModal.modal("hide");
        return false;
      });
    },



    highlightComponentField: function() {
      var renameField = this.$el.find("#renameField");
      renameField.select();
    },
    highlightCircuitField: function() {
      var renameField = this.$el.find("#renameCircuitField");
      renameField.select();
    },
    editComponent: function(model) {
      this.model = model;
      var renameModal = this.$el.find("#renameModal");
      var renameField = this.$el.find("#renameField");
      renameField.val(model.get("label"));
      renameModal.modal("show");
    },
    submitRenameComponent: function() {
      var renameModal = this.$el.find("#renameModal");
      var renameField = this.$el.find("#renameField");
      var newName = renameField.val();
      if (newName.length == 0) return false;
      this.model.set("label", newName);
      renameModal.modal("hide");
      return false;
    },      
    editCircuitName : function(model) {
      this.model = model;
      var renameModal = this.$el.find("#renameCircuitModal");
      var renameField = this.$el.find("#renameCircuitField");
      renameField.val(model.get("name"));
      renameModal.modal("show");
    },
    submitRenameCircuit: function() {
      var renameModal = this.$el.find("#renameCircuitModal");
      var renameField = this.$el.find("#renameCircuitField");
      var newName = renameField.val();
      if (newName.length == 0) return false;
      this.model.set("name", newName);
      renameModal.modal("hide");

      this.saveCircuit();
      return false;
    },

    saveCircuit : function() {
      App.vent.trigger("circuit:save");
    },

    tryNewCircuit : function() {
      App.vent.trigger("circuit:tryclose","circuit:new");
    },

    exportCircuit : function() {
      //TODO
    }, 

    tryOpenCircuitDialog : function() {
      // Before we display, we need to see if they are unsaved changes.
      App.vent.trigger("circuit:tryclose","open");
    },

    openCircuitDialog : function() {
      var openModal = this.$el.find("#openCircuitModal");
      var tbody = openModal.find("#filetable > tbody");
      tbody.children().remove();
      var openBtn = openModal.find("#openCircuitBtn");
      openBtn.attr("disabled","disabled");
      openModal.modal("show");

      // Populate table
      var circs = new GenCirc.GeneticCircuits();
      circs.fetch({success: function(circs){
          circs.each(function(circ) {
            var row = $("<tr></tr>").append("<td>"+circ.get("name")+"</td>")
                                    .append("<td>"+formatDate(new Date(circ.get("timestamp")))+"</td>");
            tbody.append(row);
            row.click(function(){
              row.addClass("highlight").siblings().removeClass("highlight");
              openBtn.removeAttr("disabled");
              //circ.print();

              openModal.submit(function(){
                row.removeClass("highlight");
                App.vent.trigger("circuit:open", circ);
                App.vent.trigger("request:mode:arrow");
                openModal.modal("hide");
                return false;
              });
            })
          });
      }});
      function formatDate(d) {
        var ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var date = ms[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear() + " " + 
          ((d.getHours() > 12 ? -12 : 0) + d.getHours()) + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes() + 
          ((d.getHours() >= 12 ? "pm" : "am"));
        return date;
      }


    },

    render: function(){
      this.$el.show();
      return this;
    }
  });
  return View;
});
