/*$AMPERSAND_VERSION*/
var extend = require('extend-object');
var AmpersandCollection = require('ampersand-collection');
var AmpersandIO = require('ampersand-io');

function AmpersandIOCollection(attrs, options){
  Base.call(this, attrs, options);
  IOMixin.call(this, options);
}

var IOMixin = AmpersandIO.extend({

  events: {
    fetch: 'collection-fetch',
    onFetch: 'on-collection-fetch',
    onUpdate: 'on-model-update',
    onNew: 'on-model-new'
  },

  listeners: {
    onUpdate:{ 
      fn: function(data, cb){
        var model = this.get(data.id);
        model.save(data, null);
        return cb();
      },
      active: false
    },
    onNew: {
      fn: function(data, cb){
        this.create(data,{});
        return cb();
      },
      active: false
    },
    onFetch: {
      fn: function(data, cb){
        this.set(data);
        return cb();
      },
      active: false
    }
  },

  // Fetch the default set of models for this collection, resetting the
  // collection when they arrive. If `reset: true` is passed, the response
  // data will be passed through the `reset` method instead of `set`.
  fetch: function(options) {
    options = options ? extend({}, options) : {};
    if (options.parse === void 0){
      options.parse = true;
    }
    var collection = this;

    options.cb = options.callback;
    options.callback = function (err, resp){
      if (err){
        this.trigger('error', this, resp, options);
      }
    };
    options.respCallback = function cb(data){
      var method = options.reset ? 'reset' : 'set';
      if (data.err){
        return callback(data.err, collection, data, options);
      }
      collection[method](data.resp, options);
      callback(data.err, collection, data, options);
      collection.removeListeners([collection.events.onFetch]);
    };

    this.addListeners({listener: this.events.onFetch, fn: options.respCallback, active: true});
    this.emit(this.events.fetch, this, options);
    return collection;
  },

  // Create a new instance of a model in this collection. Add the model to the
  // collection immediately, unless `wait: true` is passed, in which case we
  // wait for the server to agree.
  create: function(model, options) {
    options = options ? extend({}, options) : {};
    if (!(model = this._prepareModel(model, options))){
      return false;
    }
    if (!options.wait){
      this.add(model, options);
    }
    var collection = this;
    options.cb = options.callback;
    options.callback = function cb(err, model, resp){
      if (err){
        return callback(err, model, resp, options);
      }
      if (options.wait){
        collection.add(model, options);
      }
      callback(null, model, resp, options);
    };

    model.save(null, options);
    return model;
  },

  // Get or fetch a model by Id.
  getOrFetch: function (id, options, cb) {
    if (arguments.length !== 3) {
      cb = options;
      options = {};
    }
    var self = this;
    var model = this.get(id);
    if (model){
      return cb(null, model);
    }
    function done() {
      var model = self.get(id);
      if (model) {
        if (cb){
          cb(null, model);
        }
      } else {
        cb(new Error('not found'));
      }
    }
    if (options.all) {
      this.fetch({
        callback: done
      });
    } else {
      this.fetchById(id, cb);
    }
  },

  // fetchById: fetches a model and adds it to
  // collection when fetched.
  fetchById: function (id, cb) {
    var self = this;
    var idObj = {};
    idObj[this.model.prototype.idAttribute] = id;
    var model = new this.model(idObj, {collection: this});
    model.fetch({
      callback: function (err) {
        if(err){
          delete model.collection;
          if (cb){
            cb(Error('not found'));
          }
          return;
        }
        self.add(model);
        if (cb){
          return cb(null, model);
        }
      }
    });
  }

});

// Aux func used to trigger errors if they exist and use the optional
// callback function if given
var callback = function(err, model, resp, options){
  if (options.cb){
    options.cb(model, resp);
  }
  if (err){
    model.trigger('error', model, err, options);
  }
};

var Base = AmpersandCollection.extend();
AmpersandIOCollection.prototype = Object.create(Base.prototype);
AmpersandIOCollection.extend = Base.extend;

module.exports = AmpersandIOCollection;