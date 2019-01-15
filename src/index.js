import * as wasm from "boardico-wasm";

let selected = null;
let selected_x = 0;
let selected_y = 0;

let rects = [
{
  x: 0,
  y: 0,
  length: 100,
  selected: false,
  selected_x: 0,
  selected_y: 0,
  color: 'rgba(200, 0, 0, .7)'
},
{
  x: 300,
  y: 300,
  length: 75,
  selected: false,
  selected_x: 0,
  selected_y: 0,
  color: 'rgba(0, 200, 0, .7)'
},
{
  x: 300,
  y: 100,
  length: 50,
  selected: false,
  selected_x: 0,
  selected_y: 0,
  color: 'rgba(0, 0, 200, .7)'
}]

$(function() {
  $('#top_menu').html(wasm.greet());
  resizeCanvas();
  attachEvents($);
  $('#event_overlay').tapmove(function(event, info) {
    event.preventDefault();

    if (selected != null) {
      selected.x = info.offset.x + selected_x;
      selected.y = info.offset.y + selected_y;
      drawRects();
    }

    $('#top_menu').html("tap move");
  }).tapstart(function(event, info) {
    $('#top_menu').html("tapstart");
    checkSelected(info.offset);
  }).tapend(function(event, info) {
    $('#top_menu').html("tapend");
    selected = null;
  });
});

$(window).resize(resizeCanvas);

function resizeCanvas() {
  let board = $('#board');
  board.attr({
    height: $(window).height(),
    width: $(window).width()
  });

  drawRects();
}

function drawRects() {
  let board = $('#board')[0];
  let ctx = board.getContext('2d');
  ctx.clearRect(0, 0, board.width, board.height);

  for (var i in rects) {
    let rect = rects[i];
    if (rect.selected) {
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(rect.x, rect.y, rect.length, rect.length);

      ctx.fillStyle = rect.color;
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.length - 4, rect.length - 4);
    } else {
      ctx.fillStyle = rect.color;
      ctx.fillRect(rect.x, rect.y, rect.length, rect.length);
    }
  }
}

function checkSelected(offset) {
  for (var i in rects) {
    let rect = rects[i];
    if (selected == null && offset.x > rect.x && offset.x < rect.x + rect.length && offset.y > rect.y && offset.y < rect.y + rect.length) {
      selected = rect;
      selected_x = rect.x - offset.x;
      selected_y = rect.y - offset.y;
    }
  }
}
