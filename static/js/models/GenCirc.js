define(['exports', 'underscore','bbloader'], function(exports, _, Backbone) {
  var store = new Backbone.LocalStorage("circuits8");
  var models = {};
  Backbone.Relational.store.addModelScope(models);

  models.BaseComponent = Backbone.Model.extend({
    defaults: {
      'name': null,
      'image': null,
      'width': 0,
      'height': 0
    }
  });

  models.BaseComponentCollection = Backbone.Collection.extend({
    localStorage: store,  
    model: models.BaseComponent
  });
  models.BaseComponents = new models.BaseComponentCollection([
    {id: 0, name:"CS", width:100, height: 100, image: '/img/cs.png'},
    {id: 1, name:"T", width:100, height: 100, image: "/img/t.png"},
    {id: 2, name:"RBS", width:100, height: 100, image: "/img/rbs.png"},
    {id: 3, name:"P", width:100, height: 100, image: "/img/p.png"}
  ]);

  models.BaseComponents.each(function(baseComponent) {
    models.BaseComponents[baseComponent.get("name")] = baseComponent;
  });
  
  models.Interaction = Backbone.RelationalModel.extend({ 
    idAttribute: "id",
    defaults: {
      'repressingAction': false
    }
  });

  models.Interactions = Backbone.Collection.extend({
    localStorage: store,
    model: models.Interaction,
    defaults: {
      label: '',
    }
  });

  models.Component = Backbone.RelationalModel.extend({
    idAttribute: "id",
    defaults: {
      label: '',
      type: ''
    },
    relations: [
      {
        type: Backbone.HasMany,
        key: "promoter_interactions",
        collectionType: models.Interactions,
        relatedModel: 'Interaction',
        reverseRelation: {
          key: 'promoter',
          includeInJSON: "id"
        }
      },
      {
        type: Backbone.HasMany,
        key: 'sequence_interactions',
        collectionType: models.Interactions,
        relatedModel: 'Interaction',
        reverseRelation: {
          key: "sequence",
          includeInJSON: "id"
        }
      }
    ],
  });    
  models.Components = Backbone.Collection.extend({
    localStorage: store,
  });
  models.GeneticCircuit = Backbone.RelationalModel.extend({
    localStorage: store, 
    print: function() {
      console.log('---BEGIN '+this.get('name')+' ------');
      this.get('interactions').each(function(i) {
        console.log(i.get('promoter').get("label")+"-"+(i.get("repressingAction") ? "R" : "A")+"->"+i.get('sequence').get("label"));
      });
      this.get('components').each(function(c) {
        console.log(c.get("label") + "("+c.get("type")+")");
      });
      console.log('-----END '+this.get('name')+' ------');
    },
    defaults: function(){
      return {
      name: 'untitled',
      timestamp: (new Date()).getTime()
      }
    },
    idAttribute: "id",
    relations: [
      {
        type: Backbone.HasMany,
        key: 'interactions',
        relatedModel: 'Interaction',
        collectionType: models.Interactions,
        reverseRelation: {
          key: "circuit",
          includeInJSON: "id"
        }
      },
      {
        type: Backbone.HasMany,
        key: 'components',
        relatedModel: 'Component',
        collectionType: models.Components,
        reverseRelation: {
          key: "circuit",
          includeInJSON: "id"
        }
      }],
  });

  models.GeneticCircuits = Backbone.Collection.extend({
    localStorage: store,
    model: models.GeneticCircuit,
    comparator: function(model){
      return -model.get('timestamp');
    }
  });

  return models;
  
});
