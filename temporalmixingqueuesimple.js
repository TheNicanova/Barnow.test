/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var reelib = require('reelib');
var events = require('events');
var Datastore = require('nedb');
var util = require('util');

var DEFAULT_DELAY = 25;


/**
 * TemporalMixingQueue Class
 * Groups, based on time, objects which share a common string.
 * @param {Object} options The options as a JSON object.
 * @constructor
 * @extends {events.EventEmitter}
 */


function TemporalMixingQueue(options) {

  var self = this;
  var options = options || {};
  self.delayms = options.mixingDelayMilliseconds || DEFAULT_DELAY;
  self.binded = false;
  self.emitters = [];
  self.signatures = [];
  self.db = new Datastore();

  events.EventEmitter.call(self);
}
util.inherits(TemporalMixingQueue, events.EventEmitter);


TemporalMixingQueue.prototype.handleDecodedRadioSignalPacket = function() {

  var self = this;
  setInterval(self.handleTimeOut.bind(self), DEFAULT_DELAY); // WARNING : Needs to watch .bind(self)
  
}

TemporalMixingQueue.prototype.handleTimeOut = function() {

  var self = this;
  var signature;
  
  while(signature = self.signatures.pop()) { 
    self.db.find({"identifier.value": signature}, function (err, packetArray) { 
      for(i = 0; i < packetArray.length; i++) {delete packetArray[i]._id;} // Cleaning the _id away from 
      self.emit('decodedRadioSignalPacketArray', packetArray);
    });
  self.db.remove({"identifier.value": signature},{multi: true},function () {});
  }
  //self.db.remove({},{multi:true},function () {}); // Optional way of dealing with removes
}


TemporalMixingQueue.prototype.bind = function(emitter) {
  var self = this;
  
  self.emitters.push(emitter);

  emitter.on('decodedRadioSignalPacket', function(packet) {
    var packetSignature = packet.identifier.value;
    if(self.signatures.indexOf(packetSignature) === -1) {
      self.signatures.push(packetSignature);
    }

    self.db.insert(packet);

    if(self.binded == false) {
    self.handleDecodedRadioSignalPacket(); 
    self.binded = true;
    } 
  });

}
 
module.exports = TemporalMixingQueue;


