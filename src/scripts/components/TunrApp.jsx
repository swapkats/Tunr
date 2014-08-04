/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react/addons');
var ReactTransitionGroup = React.addons.TransitionGroup;
var count = 0;
// Export React so the devtools can find it
(window !== window.top ? window.top : window).React = React;

// CSS
require('../../styles/reset.css');
require('../../styles/main.css');

var imageURL = '../../images/yeoman.png';
var h1;
var TunrApp = React.createClass({
  audioContext:  new window.AudioContext(),
  buflen: 2048,
  buf: new Uint8Array(2048),
  notes: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  getInitialState: function(){
    this.getUserMedia();
    return {note: "",changes: 0}
  },
  error: function error() {
      console.log('Stream generation failed.');
  },
  noteFromPitch: function noteFromPitch(frequency) {
    var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
    return Math.round( noteNum ) + 69;
  },
  frequencyFromNoteNumber: function frequencyFromNoteNumber(note) {
    return 440 * Math.pow(2,(note-69)/12);
  },
  centsOffFromPitch: function centsOffFromPitch(frequency, note) {
    return Math.floor( 1200 * Math.log( frequency / this.frequencyFromNoteNumber( note ))/Math.log(2) );
  },
  shouldComponentUpdate: function(){
    return true;
  },
  updatePitch: function updatePitch(time) {
    var cycles = new Array;
    this.analyser.getByteTimeDomainData(this.buf);
    var ac = this.autoCorrelate(this.buf, this.audioContext.sampleRate);
    //console.log(ac);
    if (ac != -1) {
      var pitch = ac;
      var note =  this.noteFromPitch( pitch );

      //this.h1.innerText = this.notes[note%12];
      this.setState({note: this.notes[note%12]});
      this.setState({changes: this.state.changes + 1});
      this.h1.innerHTML = ++count;
      this.forceUpdate();
      var detune = this.centsOffFromPitch( pitch, note );
      this.detuneMessage = "";
      if (detune > 0 ) {
        //this.needle.animate({transform: "r" + [-detune, [166.716, 178.486]]}, 20)
        this.detuneMessage = "Tune down idiot!";
      } else {
        //this.needle.animate({transform: "r" + [-detune, [166.716, 178.486]]}, 20)
        this.detuneMessage = "Tune up bro!";
      }
    }
    window.requestAnimationFrame( this.updatePitch );
  },
  autoCorrelate: function autoCorrelate(buf, sampleRate) {
    var MIN_SAMPLES = 4;  // corresponds to an 11kHz signal
    var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
    var SIZE = 1000;
    var best_offset = -1;
    var best_correlation = 0;
    var rms = 0;
    var foundGoodCorrelation = false;
    if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
      return -1;  // Not enough data

    for (var i=0;i<SIZE;i++) {
      var val = (buf[i] - 128)/128;
      rms += val*val;
    }
    rms = Math.sqrt(rms/SIZE);
    if (rms<0.01)
      return -1;

    var lastCorrelation=1;
    for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
      var correlation = 0;

      for (var i=0; i<SIZE; i++) {
        correlation += Math.abs(((buf[i] - 128)/128)-((buf[i+offset] - 128)/128));
      }
      correlation = 1 - (correlation/SIZE);
      if ((correlation>0.9) && (correlation > lastCorrelation))
        foundGoodCorrelation = true;
      else if (foundGoodCorrelation) {
        return sampleRate/best_offset;
      }
      lastCorrelation = correlation;
      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    }
    if (best_correlation > 0.01) {
      return sampleRate/best_offset;
    }
    return -1;
  },
  getUserMedia: function getUserMedia(dictionary, callback) {
    var that = this;
    try {
      navigator.getUserMedia = 
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
      navigator.getUserMedia({audio:true}, function(stream){
        that.gotStream(stream);
      }, this.error);
    } catch (e) {
      console.log('getUserMedia threw exception :' + e);
    }
  },
  gotStream: function gotStream(stream) {
    // Create an AudioNode from the stream.
    this.h1 = document.getElementById('js');
    var mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

    // Connect it to the destination.
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    mediaStreamSource.connect(this.analyser);
    this.updatePitch();
  },
  render: function() {
    return (
      <h1 className='main'>
        {this.state.note} <br /> {this.state.changes}
        <h1 id="js"></h1>
      </h1>
      
    );
  }
});

React.renderComponent(<TunrApp />, document.getElementById('content')); // jshint ignore:line

module.exports = TunrApp;