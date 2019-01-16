import paper, {view, Path, Point, Rectangle, Size} from 'paper/dist/paper-full';
import { Group } from 'paper';

let selected = null;
let selected_x = 0;
let selected_y = 0;

const $ = require('jquery');

let circle = null;
let circle_point = null;

let pinching = false;

let scale_group = null;
let scale_timestamp = $.now();
let max_scale_abs = 2.2;
let max_scale = 2;
let min_scale_abs = 0.2;
let min_scale = 0.25;

let rects = [
{
  x: 500,
  y: 200,
  length: 100,
  selected: false,
  selected_x: 0,
  selected_y: 0,
  color: 'blue',
  obj: null
},
{
  x: 300,
  y: 300,
  length: 75,
  selected: false,
  selected_x: 0,
  selected_y: 0,
  color: 'red',
  obj: null
},
{
  x: 300,
  y: 100,
  length: 50,
  selected: false,
  selected_x: 0,
  selected_y: 0,
  color: 'green',
  obj: null
}];

export function init() {
  //$(window).resize(resizeCanvas);
  resizeCanvas();

  let board = $('#board')[0];
  paper.setup(board);

  scale_group = new Group({
    applyMatrix: false
  });
  scale_group.addChild(new Path(view.bounds.topLeft));
  drawRects();

  view.draw();
  view.onFrame = function() {
    if ($.now() > scale_timestamp && pinching == false) {
      let scaling = scale_group.scaling;
      if (scaling.x > max_scale) {
        let scalar = scaling.x - (max_scale / 100);
        scale_group.setScaling(scalar);
      } else if (scaling.x < min_scale) {
        let scalar = scaling.x + (min_scale / 100);
        scale_group.setScaling(scalar);
      }
    }
  };

  makeCollisionCircle(0, 0);
}

function resizeCanvas() {
  let board = $('#board');
  board.attr({
    height: $(window).height(),
    width: $(window).width()
  });
}

function drawRects() {
  for (var i in rects) {
    let rect = rects[i];
    if (rect.obj != null) {
      continue;
    }

    rect.point = new Point(rect.x, rect.y);
    let path = new Path.RegularPolygon(rect.point, 4, rect.length);
    path.fillColor = rect.color;
    path.strokeColor = "#000";
    rect.obj = path;
    scale_group.addChild(path);
  }
}

function makeCollisionCircle(x, y) {
  circle_point = new Point(x, y);
  circle = new Path.Circle({
    center: circle_point,
    radius: 1,
    fillColor: 'black',
    strokeColor: 'black'
  });
}

export function checkCollision(x, y) {
  circle.setPosition(x, y);
  let scalar = scale_group.scaling.x;
  for (var i in rects) {
    let rect = rects[i].obj;
    if (rect.contains(getNormalizedPoint(x, y))) {
      return {
        obj: rect,
        point: getScaledPoint(rect.position.x, rect.position.y),
        topLeft: scale_group.bounds.topLeft
      };
    }
  }
  return null;
}

export function moveRect(obj, x, y) {
  console.log(scale_group.bounds.topLeft.x);
  let point = getNormalizedPoint(x, y);

  obj.setPosition(point);
}

// Only works if no object is outside of topLeft bounds
export function getScaledPoint(x, y) {
  let scalar = scale_group.scaling.x;
  let x_offset = scale_group.bounds.topLeft.x;
  let y_offset = scale_group.bounds.topLeft.y;

  return new Point((x * scalar) + x_offset, (y * scalar) + y_offset);
}

export function getNormalizedPoint(x, y) {
  let scalar = scale_group.scaling.x;
  let x_offset = scale_group.bounds.topLeft.x;
  let y_offset = scale_group.bounds.topLeft.y;

  return new Point((x - x_offset) / scalar, (y - y_offset) / scalar);
}

export function getCurrentScale() {
  return scale_group.scaling.x;
}

export function startPinch() {
  pinching = true;
}

export function endPinch() {
  pinching = false;
}

export function scaleViewPinch(val) {
  let scalar = val;
  if (val < min_scale_abs) {
    scalar = min_scale_abs;
  } else if (val > max_scale_abs) {
    scalar = max_scale_abs
  }
  scale_group.setScaling(scalar);

  let now = new Date();
  now.setMilliseconds(now.getMilliseconds() + 100);
  scale_timestamp = now.getTime();
}

export function scaleViewScroll(val) {
  let scaling = scale_group.scaling;
  let scalar = val;
  if (scaling.x <= min_scale_abs && val < 0) {
    scale_group.setScaling(min_scale_abs);
  } else if (scaling.x >= max_scale_abs && val > 0) {
    scale_group.setScaling(max_scale_abs);
  } else {
    if (scaling.x < min_scale || scaling.x > max_scale) {
      scalar /= 10;
    }
    scale_group.scale(scalar + 1);
  }
  let now = new Date();
  now.setMilliseconds(now.getMilliseconds() + 100);
  scale_timestamp = now.getTime();
}

export function moveGroup(position, x, y) {
  console.log(scale_group.position);
  let point = new Point(position.x + x, position.y + y);
  scale_group.position = point;
  console.log(scale_group.position);
}

export function getGroupPosition() {
  return scale_group.position;
}
