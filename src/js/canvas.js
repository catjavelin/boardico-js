import paper, {view, Path, Point, Rectangle, Size} from 'paper/dist/paper-full';
import { Group } from 'paper';

let selected = null;

const $ = require('jquery');

let pinching = false;

let scale_group = null;
let scale_timestamp = $.now();
let scale_cx = null;
let scale_cy = null;
let max_scale_abs = 2.2;
let max_scale = 2;
let min_scale_abs = 0.25;
let min_scale = 0.3;

let board_width = 25;
let board_height = 20;

let box_size = 50;

let move_boxes = [];

let rects = [
{
  x: 525,
  y: 225,
  length: 30,
  selected: false,
  color: 'blue',
  obj: null
},
{
  x: 625,
  y: 525,
  length: 30,
  selected: false,
  color: 'red',
  obj: null
},
{
  x: 325,
  y: 625,
  length: 30,
  selected: false,
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

  drawBoard();
  drawRects();
  //centerBoard();

  view.draw();
  view.onFrame = function() {
    if ($.now() > scale_timestamp && !pinching) {
      let scaling = scale_group.scaling;
      if (scaling.x - max_scale > 0.0001) {
        let scalar = (max_scale / scaling.x) - 1;

        scaleView(scalar / 10, scale_cx, scale_cy, true);
      } else if (scaling.x - min_scale < -0.0001) {
        let scalar = (min_scale / scaling.x) - 1;

        scaleView(scalar / 10, scale_cx, scale_cy, true);
      }
    }
  };
}

function resizeCanvas() {
  let board = $('#board');
  board.attr({
    height: $(window).height(),
    width: $(window).width()
  });
}

function centerBoard() {
  console.log(scale_group.bounds.width);
  console.log(view.bounds.width);
  //scale_group.position = view.center;
  scale_group.position = view.center;
  console.log(scale_group.position);
}

export function centerRect(rect) {
  let center = rect.bounds.center;

  let offset_x = (scale_group.bounds.width / 2) - center.x;
  let view_x = view.center.x + offset_x;

  let offset_y = (scale_group.bounds.height / 2) - center.y;
  let view_y = view.center.y + offset_y;

  scale_group.setPosition(new Point(view_x, view_y));
}

function drawBoard() {
  let scale_border = new Path();
  scale_border.strokeColor = '#ccc';
  scale_border.add(new Point(0, 0));
  scale_border.add(new Point(0, board_height * box_size));
  scale_border.add(new Point(board_width * box_size, board_height * box_size));
  scale_border.add(new Point(board_width * box_size, 0));
  scale_border.add(new Point(0, 0));

  for (var i = box_size; i < board_height * box_size; i += box_size) {
    drawBoardLine(0, i, board_width * box_size, i);
  }

  for (var i = box_size; i < board_width * box_size; i += box_size) {
    drawBoardLine(i, 0, i, board_height * box_size);
  }

  scale_group.addChild(scale_border);
}

function drawBoardLine(x1, y1, x2, y2) {
  let line = new Path();
  line.strokeColor = '#bcbcbc';
  line.add(new Point(x1, y1));
  line.add(new Point(x2, y2));

  scale_group.addChild(line);
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

function drawMoveSquare(obj, fill) {
  let point = obj.position;
  let square = getClosestSquare(point);

  if (!checkForMoveSquare(square)) {
    return;
  }

  point = new Point(gridToPosition(square.x) - (box_size / 2), gridToPosition(square.y) - (box_size / 2));
  let path = new Path();
  path.strokeColor = 'red';
  if (fill) {
    path.fillColor = 'red';
  }
  path.add(new Point(point.x+1, point.y+1));
  path.add(new Point(point.x+1, (point.y + box_size)-1));
  path.add(new Point((point.x + box_size)-1, (point.y + box_size)-1));
  path.add(new Point((point.x + box_size)-1, point.y+1));
  path.add(new Point(point.x+1, point.y+1));
  scale_group.addChild(path);
  scale_group.addChild(obj);

  move_boxes.push({path: path, square: square});
}

function checkForMoveSquare(square) {
  let remove = null;
  for (var i = 0; i < move_boxes.length; i++) {
    let box = move_boxes[i];
    if (remove != null) {
      box.path.remove();
    } else {
      if (square.x == box.square.x && square.y == box.square.y) {
        remove = i + 1;
      }
    }
  }
  if (remove != null) {
    move_boxes = move_boxes.slice(0, remove);
    return false;
  }
  return true;
}

export function checkCollision(x, y) {
  let scalar = scale_group.scaling.x;
  for (var i in rects) {
    let rect = rects[i].obj;
    if (rect.contains(getNormalizedPoint(x, y))) {
      drawMoveSquare(rect, false);
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
  let point = getNormalizedPoint(x, y);
  let width = obj.bounds.width/2;
  let height = obj.bounds.height/2;

  let topLeft = getNormalizedPoint(scale_group.bounds.left, scale_group.bounds.top);
  let bottomRight = getNormalizedPoint(scale_group.bounds.right, scale_group.bounds.bottom);

  if (point.x - width < topLeft.x) {
    point = new Point(topLeft.x + width, point.y);
  } else if (point.x + width > bottomRight.x) {
    point = new Point(bottomRight.x - width, point.y);
  }

  if (point.y - height < topLeft.y) {
    point = new Point(point.x, topLeft.y + height);
  } else if (point.y + height > bottomRight.y) {
    point = new Point(point.x, bottomRight.y - height);
  }

  drawMoveSquare(obj, true);

  obj.setPosition(point);
}

export function moveToClosestSquare(obj) {
  let point = obj.position;
  let square = getClosestSquare(point);
  if (square.x >= 0 && square.x < board_width &&
      square.y >= 0 && square.y < board_height) {
    obj.setPosition(gridToPosition(square.x), gridToPosition(square.y));
  }
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

export function scaleView(val, cx, cy, no_timer) {
  let move = false;
  let scaling = scale_group.scaling;
  let scalar = val;
  if (scaling.x <= min_scale_abs && val < 0) {
    scale_group.setScaling(min_scale_abs);
  } else if (scaling.x >= max_scale_abs && val > 0) {
    scale_group.setScaling(max_scale_abs);
  } else {
    if ((scaling.x < min_scale && val < 0) || (scaling.x > max_scale && val > 0)) {
      scalar /= 10;
    } else {
    }
    move = true;
    scale_group.scale(scalar + 1);
  }
  if (!no_timer) {
    let now = new Date();
    now.setMilliseconds(now.getMilliseconds() + 100);
    scale_timestamp = now.getTime();
  }

  if (move && cx && cy) {
    let dx = (scale_group.position.x - cx) * scalar;
    let dy = (scale_group.position.y - cy) * scalar;

    scale_cx = cx;
    scale_cy = cy;
    moveGroup(dx, dy);
  }
}

export function moveGroup(x, y) {
  let position = scale_group.position;
  let point = new Point(position.x + x, position.y + y);

  let b = scale_group.bounds;
  let vb = view.bounds;

  let half_width = b.width / 2;
  let half_height = b.height / 2;
  let half_view_width = vb.width / 2;
  let half_view_height = vb.height / 2;
  let bounds = {
    left: (vb.left + half_width) + half_view_width,
    right: (vb.right - half_width) - half_view_width,
    top: (vb.top + half_height) + half_view_height,
    bottom: (vb.bottom - half_height) - half_view_height
  }

  if (point.x >= bounds.left && x > 0) {
    point.x = bounds.left;
  }
  else if (point.x <= bounds.right && x < 0) {
    point.x = bounds.right;
  }

  if (point.y >= bounds.top && y > 0) {
    point.y = bounds.top;
  }
  else if (point.y <= bounds.bottom && y < 0) {
    point.y = bounds.bottom;
  }

  scale_group.position = point;
  console.log(point);
}

export function getGroupPosition() {
  return scale_group.position;
}

export function clearMovementSquares() {
  for (var i in move_boxes) {
    move_boxes[i].path.remove();
  }
  move_boxes = [];
}

// Returns center of the grid square
function getClosestSquare(point) {
  return new Point(Math.floor(point.x / box_size), Math.floor(point.y / box_size));
}

function gridToPosition(i, size) {
  return (i * box_size) + (box_size / 2);
}
