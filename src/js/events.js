import * as wasm from "boardico-wasm";
import * as canvas from './canvas';

const $ = require('jquery');
const Hammer = require('hammerjs');

let rect = null;
let offset_x = 0;
let offset_y = 0;

let scale = 0;
let position = null;

export function init() {
  //attach the events
  $('#top_menu').html(wasm.greet());
  let overlay = $('#event_overlay');
  let hammer = new Hammer(overlay[0]);

  hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 5 });
  let pinch = new Hammer.Pinch({
    pointers: 2
  });
  hammer.add(pinch);

  hammer.on('pinchstart', function(e) {
    scale = canvas.getCurrentScale();
    canvas.startPinch();
  }).on('pinch', function(e) {
    if (e.type != 'pinchstart') {
      $('#top_menu').html(e.scale);
      canvas.scaleViewPinch(scale * e.scale, true);
    }
  }).on('pinchend', function() {
    canvas.endPinch();
  }).on('panstart panend pan', function(e) {
    if ('panstart' == e.type) {
      if (rect == null) {
        let x = e.center.x - e.deltaX;
        let y = e.center.y - e.deltaY;
        rect = canvas.checkCollision(x, y);
        if (rect) {
          offset_x = rect.point.x - x;
          offset_y = rect.point.y - y;
        } else {

          position = canvas.getGroupPosition();
        }
      } else {
      }
    } else if ('panend' == e.type) {
      rect = null;
      position = null;
    } else {
      if (rect != null) {
        let x = e.center.x + offset_x;
        let y = e.center.y + offset_y;
        canvas.moveRect(rect.obj, x, y);
      } else if (position != null) {
        let x = e.center.x;
        let y = e.center.y;
        console.log(e);
        $('#top_menu').html(e.distance);
        canvas.moveGroup(position, e.deltaX, e.deltaY);
      }
    }
  }).on('tap', function(e) {
    console.log(canvas.checkCollision(e.center.x, e.center.y) != null);
    $('#top_menu').html("tap");
  })

  overlay.on('mousewheel', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.ctrlKey) {
      let scalar = (e.originalEvent.deltaY * -1 / 200);
      canvas.scaleViewScroll(scalar, false);
      $('#top_menu').html("pinch (wheel)");
    } else {
      $('#top_menu').html("pan (wheel)");
    }
  });

  window.addEventListener('gesturestart', e => e.preventDefault());
  window.addEventListener('gesturechange', e => e.preventDefault());
  window.addEventListener('gestureend', e => e.preventDefault());
};