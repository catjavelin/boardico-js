//import * as wasm from "boardico-wasm";
import * as canvas from './canvas';

const $ = require('jquery');
const Hammer = require('hammerjs');

let rect = null;
let offset_x = 0;
let offset_y = 0;

let scale = 0;
let deltaX = 0;
let deltaY = 0;
let pan_pointer_id = null;
let pointers = [];

let pinching = false;
let panning = false;

export function init() {
  //attach the events
  $('#top_menu').html('hello boardico');
  let overlay = $('#event_overlay');
  let hammer = new Hammer(overlay[0]);

  hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 5 });
  let pinch = new Hammer.Pinch({
    event: 'pinch',
    pointers: 2
  });

  // PAN RECOGNIZER
  var pan = new Hammer.Pan({
    event: 'pan',
    pointers: 0
  });

  pinch.recognizeWith([pan]);
  pan.recognizeWith([pinch]);
  hammer.add(pinch);
  hammer.add(pan);

  hammer.on('pinchend pinchstart pinchcancel panend panstart pancancel tap press pressend rotate swipe', function(e) {
    let str = e.type;
    // if (e.additionalEvent) {
    //   str += ' - ' + e.additionalEvent;
    // }
    str += ' - ' + e.isFinal;
    $('#event_log').prepend('<div class="event_line">' + str + '</div>');
  });

  hammer.on("hammer.input", function(ev) {
    if (ev.isFinal) {
      // All events have stopped. Clean up.
      $('#event_log').prepend('<div class="event_line">final</div>');

      if (rect) {
        canvas.moveToClosestSquare(rect.obj);
        canvas.clearMovementSquares();
      }
      rect = null;
      deltaX = null;
      deltaY = null;
      pan_pointer_id = null;

      scale = null;

      pinching = false;
      panning = false;
    }
 });


  hammer.on('pinchstart', function(e) {
    canvas.stopAnimation();
    scale = 1;
    pinching = true;

    canvas.startPinch();
  }).on('pinch', function(e) {
    if (!e.isFinal) {
      let deltaS = e.scale - scale;
      $('#top_menu').html(deltaS);
      scale = e.scale;
      canvas.scaleView(deltaS, e.center.x, e.center.y);
    }
  }).on('pinchend', function() {

    pinching = false;
    canvas.endPinch();
  }).on('panstart', function(e) {
    canvas.stopAnimation();
    if (rect && (pan_pointer_id != e.pointers[0].pointerId && pan_pointer_id != e.pointers[0].identifier)) {
      canvas.moveToClosestSquare(rect.obj);
      canvas.clearMovementSquares();
      rect = null;
      deltaX = null;
      deltaY = null;
      pan_pointer_id = null;
      panning = true;
    }

    if (rect == null && !panning) {
      let x = e.pointers[0].clientX - e.deltaX;
      let y = e.pointers[0].clientY - e.deltaY;

      rect = canvas.checkCollision(x, y);
      if (rect) {
        offset_x = rect.point.x - x;
        offset_y = rect.point.y - y;
        if (e.pointers[0].pointerId) {
          pan_pointer_id = e.pointers[0].pointerId;
        } else {
          pan_pointer_id = e.pointers[0].identifier;
        }
        pointers = e.pointers;
        canvas.showMoveRadius(2);
      }
    }

    if (panning || rect == null) {
      deltaX = e.deltaX;
      deltaY = e.deltaY;
      panning = true;
    }
  }).on('pan', function(e) {
    if (rect != null) {
      if (pan_pointer_id == e.pointers[0].pointerId || pan_pointer_id == e.pointers[0].identifier) {
        let x = e.pointers[0].clientX + offset_x;
        let y = e.pointers[0].clientY + offset_y;
        canvas.moveRect(rect.obj, x, y);
      }
    } else if (deltaX != null) {
      let dX = e.deltaX - deltaX;
      let dY = e.deltaY - deltaY;
      deltaX = e.deltaX;
      deltaY = e.deltaY;
      $('#top_menu').html(e.distance);
      if (!pinching) {
        canvas.moveGroup(dX, dY);
      }
    }
  }).on('panend', function(e) {

  }).on('tap', function(e) {
    canvas.clearMovementSquares();
    let rect = canvas.checkCollision(e.center.x, e.center.y);
    if (rect) {
      canvas.centerRect(rect.obj);
    }
    $('#top_menu').html("tap");
  })

  overlay.on('mousewheel', function(e) {
    canvas.stopAnimation();
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.ctrlKey) {
      let scalar = (e.originalEvent.deltaY * -1 / 200);
      canvas.scaleView(scalar, e.clientX, e.clientY);
      $('#top_menu').html("pinch (wheel)");
    } else {
      $('#top_menu').html("pan (wheel)");
    }
  });
};