
var assert = require('assert');
var events = require('events');
var temporalmixingqueue = require('./temporalmixingqueuesimple');
var DEFAULT_DELAY = 25;

/* Mock input */
var packet_1 = {identifier: {value: 1}, data: 'data_1'};
var packet_2 = {identifier: {value: 1}, data: 'data_2'};
var packet_3 = {identifier: {value: 2}, data: 'data_3'};
var packet_4 = {identifier: {value: 2}, data: 'data_4'};

/* Mock output */
var packet_1_copy = {identifier: {value: 1}, data: 'data_1'};
var packet_2_copy = {identifier: {value: 1}, data: 'data_2'};
var packet_3_copy = {identifier: {value: 2}, data: 'data_3'};
var packet_4_copy = {identifier: {value: 2}, data: 'data_4'};

describe('temporalmixingqueue', function() {

  before(function() {
    var self = this;
    self.tmq = new temporalmixingqueue();
  });

  beforeEach(function(){
    var self = this;
    self.tmq = new temporalmixingqueue();
  });

  it('should return an Object when instantiated', function() {
    var self = this;
    assert.equal(typeof self.tmq, 'object');
  })
  

  it('should have working bindings', function(done) {
    var self = this;
    var emitter = new events.EventEmitter();
    var emittedPacketArray= {};

    self.tmq.on('decodedRadioSignalPacketArray', function(packetArray) {
      emittedPacketArray = packetArray;
    }); 

    self.tmq.bind(emitter);

    emitter.emit('decodedRadioSignalPacket', packet_1);
   
    setTimeout(function(){
      assert.deepEqual(emittedPacketArray,[packet_1_copy]);
      done();
    },DEFAULT_DELAY *3/2);    
  });


  it('should touch the database soon after emitting', function(done) {
    var self = this;
    var emitter = new events.EventEmitter();
  
    self.tmq.bind(emitter);

    emitter.emit('decodedRadioSignalPacket', packet_1);
    emitter.emit('decodedRadioSignalPacket', packet_2);
    emitter.emit('decodedRadioSignalPacket', packet_3);
    emitter.emit('decodedRadioSignalPacket', packet_4);

    setTimeout(function() {

      self.tmq.db.find({},function (err, packetArray) {
        assert.equal(packetArray.length,4);
        assert.notDeepEqual(packetArray,[]);
        done();
      });
      

    },DEFAULT_DELAY * 1/2);
  }); 


  it('should clear the database entirely after delayms', function(done) {
    var self = this;
    var emitter = new events.EventEmitter();
  
    self.tmq.bind(emitter);

    emitter.emit('decodedRadioSignalPacket', packet_1);
    emitter.emit('decodedRadioSignalPacket', packet_3);
    emitter.emit('decodedRadioSignalPacket', packet_2);
    emitter.emit('decodedRadioSignalPacket', packet_4);



    setTimeout(function() {

      self.tmq.db.find({},function (err, packetArray) {

        assert.deepEqual(packetArray,[]);
        done();
      });
      

    },DEFAULT_DELAY * 3/2);
  });  


  it('should clear the database between each emit', function(done) {
    
    var self = this;
    var emitter = new events.EventEmitter();
    var emittedPacketArray= {};

    self.tmq.on('decodedRadioSignalPacketArray', function(packetArray) {
      emittedPacketArray = packetArray;
    }); 

    self.tmq.bind(emitter);

    emitter.emit('decodedRadioSignalPacket', packet_1);
   
    setTimeout(function() {

      emitter.emit('decodedRadioSignalPacket', packet_2)

      setTimeout(function() {
        assert.deepEqual(emittedPacketArray,[packet_2_copy]);
        assert.notDeepEqual(emittedPacketArray,[packet_1_copy]);
        assert.notDeepEqual(emittedPacketArray,[packet_2_copy,packet_1_copy]);
        assert.notDeepEqual(emittedPacketArray,[packet_1_copy,packet_2_copy]);
        done();
      }, DEFAULT_DELAY * 5/4);

    }, DEFAULT_DELAY *3/2);

  });


  it('should not clear the database before delayms', function(done) {
    var self = this;
    var emitter = new events.EventEmitter();
  
    self.tmq.bind(emitter);

    emitter.emit('decodedRadioSignalPacket', packet_1);
    emitter.emit('decodedRadioSignalPacket', packet_2);
    emitter.emit('decodedRadioSignalPacket', packet_3);
    emitter.emit('decodedRadioSignalPacket', packet_4);

    setTimeout(function() {

      self.tmq.db.find({},function (err, packetArray) {
        assert.equal(packetArray.length,4);
        assert.notDeepEqual(packetArray,[]);
        done();
      });
      

    },DEFAULT_DELAY * 1/2);
  });  

  
  it('should merge two packets with same origin (simple)', function(done) {
    var self = this;
    var emitter = new events.EventEmitter();
    var emittedPacketArray= {};

    self.tmq.on('decodedRadioSignalPacketArray', function(packetArray) {
      emittedPacketArray = packetArray;
    }); 

    self.tmq.bind(emitter);

    emitter.emit('decodedRadioSignalPacket', packet_1);
    emitter.emit('decodedRadioSignalPacket', packet_2);

    setTimeout(function() {

      try { assert.deepEqual(emittedPacketArray,[packet_1_copy,packet_2_copy]);}
      catch (e) { assert.deepEqual(emittedPacketArray,[packet_2_copy,packet_1_copy]);}
      done();

    },DEFAULT_DELAY * 3/2);
     


  });
  

  it('should merge two packets with same origin (multiple emits)', function(done) {
    var self = this;
    var emitter = new events.EventEmitter();
    var emittedPacketArray= [];
    

    self.tmq.on('decodedRadioSignalPacketArray', function(packetArray) {
       emittedPacketArray.push(packetArray); 
    }); 

    self.tmq.bind(emitter);

    emitter.emit('decodedRadioSignalPacket', packet_1);
    emitter.emit('decodedRadioSignalPacket', packet_3);
    emitter.emit('decodedRadioSignalPacket', packet_2);
    emitter.emit('decodedRadioSignalPacket', packet_4);

    setTimeout(function() {

      try { assert.deepEqual(emittedPacketArray[0],[packet_3_copy,packet_4_copy]);}
      catch (e) { assert.deepEqual(emittedPacketArray[0],[packet_4_copy,packet_3_copy]);}


      try { assert.deepEqual(emittedPacketArray[1],[packet_1_copy,packet_2_copy]);}
      catch (e) { assert.deepEqual(emittedPacketArray[1],[packet_2_copy,packet_1_copy]);}
      done();

    },DEFAULT_DELAY * 3/2);
  });


  it('should have each of its iteration behave the same way as the first iteration', function(done) {
    var self = this;
    var emitter = new events.EventEmitter();
    var emittedPacketArray= {};

    self.tmq.on('decodedRadioSignalPacketArray', function(packetArray) {
      emittedPacketArray = packetArray;
    }); 


    self.tmq.bind(emitter); // Bind and wait for 10 * DEFAULT_DELAY

    setTimeout(function() {
      emitter.emit('decodedRadioSignalPacket', packet_1);
      emitter.emit('decodedRadioSignalPacket', packet_2);


      setTimeout(function() {
        try { assert.deepEqual(emittedPacketArray,[packet_1_copy,packet_2_copy]);}
        catch (e) { assert.deepEqual(emittedPacketArray,[packet_2_copy,packet_1_copy]);}

        done();
        },DEFAULT_DELAY * 3/2);
     },DEFAULT_DELAY * 10);


    });


})
