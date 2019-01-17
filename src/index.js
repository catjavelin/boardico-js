//import * as wasm from "boardico-wasm";
import * as events from './js/events';
import * as canvas from './js/canvas';

const $ = require('jquery');
const hammer = require('hammerjs');

window.onload = function() {
  events.init();
  canvas.init();

  $('#left_hide').click(function() {
    if ($('#left_container').hasClass('hide')) {
      $('#left_hide').html('<');
      $('#left_container').removeClass('hide');
    } else {
      $('#left_hide').html('>');
      $('#left_container').addClass('hide');
    }
  })
};
