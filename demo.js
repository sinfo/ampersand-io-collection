var io = require('socket.io')();
var IOModel = require('ampersand-io-model');
var IOCollection = require('./ampersand-io-collection');
var AmpersandCollection = require('ampersand-collection');

io.on('connection', function(socket){
	
	console.log('Test client connected!');

	socket.on('model-create', function(data, cb){
		console.log(data);
		cb();
	});

	socket.on('model-update', function(data, cb){
		console.log(data);
		cb();
	});

	socket.on('model-fetch', function(data, cb){
		console.log(data);
		cb();
	});

	socket.on('model-remove', function(data, cb){
		console.log(data);
		cb();
	});

	socket.on('collection-fetch', function(data, cb){
		console.log(data);
		socket.emit('fetch-response', {test: 'test'}, function(){console.log('done');});
		cb();
	});
});
io.listen(3000);

var mymodel =  IOModel.extend({props: {
  id: ['string'],
  thread: ['string'],
  source: ['string'],
  member: ['string']
}});
var mycollection = new ((AmpersandCollection.extend(new IOCollection())).extend({model: mymodel}))();
console.log(mycollection);
mycollection.setListeners();
mycollection.fetch({wait: true});
mycollection.fetch({reset: true});
mycollection.fetch();