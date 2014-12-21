var extend = require('extend-object');
var io = require('socket.io-client');

module.exports = {

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
    options.callback = function cb(err, result){
      var method = options.reset ? 'reset' : 'set';
      if (err){
        return callback(err, collection, result, options);
      }
      collection[method](result, options);
      callback(null, collection, result, options);
    };

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
    options.callback = function cb(err, model, result){
      if (err){
        return callback(err, model, result, options);
      }
      if (options.wait){
        collection.add(model, options);
      }
      callback(null, model, result, options);
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
  },

  socket: io('http://localhost:3000'),

  // The name of the events to be used in each operation
  events: {
    onNew: 'on-model-new',
    onUpdate: 'on-model-update',
    fetch: 'collection-fetch'
  },

  listeners: {
    onUpdate: function(data, cb){
      var model = this.get(data.id);
      model.save(data, null);
      return cb();
    },
    onNew: function(data, cb){
      this.create(data,{});
      return cb();
    }
  },

  // setListener: function (listeners){
    // if(!listeners){
      // listeners = this.listeners;
    // }
    // for()
    // var self = this;
    // this.socket.on(this.events.onUpdate, 
    // this.socket.on(this.events.onNew, )
  // },
// 
  // removeListener: function (){
// 
  // },
  // Overridable function responsible for emitting the events
  emit: function (event, model, options){
    this.socket.emit(event, model, options.callback);
  }

};

// Aux func used to trigger errors if they exist and use the optional
// callback function if given
var callback = function(err, model, result, options){
  if (options.cb){
    options.cb(err, model, result);
  }
  if (err){
    model.trigger('error', model, err, options);
  }
};