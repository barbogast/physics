import * as _ from "./funcUtil.js";
import * as chart from "./chart.js";

const debug = (el, tick, obj) => {
  el.innerHTML = JSON.stringify(
    _.merge(
      _.mapValues((v) => (typeof v === "number" ? v.toFixed(2) : v), obj),
      { tick }
    ),
    null,
    2
  );
};

const drawObj = _.curry((ctx, obj) => {
  const path = new Path2D();
  if (obj.shape === "rect") {
    path.rect(obj.x, obj.y, 10, 10);
  } else {
    path.arc(obj.x, obj.y - 7, 7, 0, 2 * Math.PI, false);
  }
  ctx.fillStyle = obj.selected ? "green" : "black";
  ctx.fill(path);
  return path;
});

const accelerate = (speed) => speed + speed * 0.06;
const break_ = (speed) => speed - speed * 0.06;
const topSpeed = 5;

const move = (obj) => {
  switch (obj.direction) {
    case "right":
      return _.assoc("x", obj.x + obj.speed, obj);

    case "left":
      return _.assoc("x", obj.x - obj.speed, obj);

    case "up":
      return _.assoc("y", obj.y - obj.speed, obj);

    case "down":
      return _.assoc("y", obj.y + obj.speed, obj);
  }
};

const leftRightMovement = (obj) => {
  if (
    (obj.direction === "right" && obj.x < 400) ||
    (obj.direction === "left" && obj.x > 100)
  ) {
    return _.assoc("speed", Math.min(accelerate(obj.speed), topSpeed), obj);
  } else {
    const speed = break_(obj.speed);
    let direction = obj.direction;
    if (speed <= 0.1) {
      direction = direction === "right" ? "left" : "right";
    }
    return _.merge({ direction, speed }, obj);
  }
};

const bounce = (obj) => {
  let { speed, direction } = obj;
  if (obj.y >= 500) {
    direction = "up";
    speed -= speed * obj.bounceReduction;
  } else if (direction === "up" && speed < 0.1) {
    direction = "down";
  } else {
    const defaultInterval = 10;
    const timeInMs = defaultInterval / 1000;
    const diff = 9.8 * timeInMs;
    speed = direction === "down" ? speed + diff : speed - diff;
  }
  return _.merge({ speed, direction }, obj);
};

const createBouncyBall = (x, y, bounceReduction) => ({
  speed: 0,
  x,
  y,
  direction: "down",
  update: bounce,
  shape: "circle",
  bounceReduction,
});

export const init = () => {
  const canvas = document.getElementById("tutorial");
  const chartEl = document.getElementById("chart");
  const debugEl = document.getElementById("debug");
  const stopBtn = document.getElementById("stop");
  const intervalEl = document.getElementById("interval");
  const intervalIncreaseEl = document.getElementById("interval-increase");
  const intervalDecreaseEl = document.getElementById("interval-decrease");
  const ctx = canvas.getContext("2d");
  const chartCtx = chartEl.getContext("2d");

  let stop = false;
  let interval;
  let canvasPaths;
  let objects = _.range(0, 25).map((i) => ({
    speed: 1,
    x: 15 + 15 * i,
    y: 15 + 15 * i,
    direction: "right",
    update: leftRightMovement,
    shape: "rect",
  }));

  objects = objects.concat(createBouncyBall(20, 20, 0.1));
  objects = objects.concat(createBouncyBall(40, 20, 0.2));

  let timeSeries = chart.initState();
  let counter = 0;

  const setIntervalLength = (v) => {
    interval = v;
    intervalEl.value = interval;
  };
  setIntervalLength(10);

  intervalEl.addEventListener("input", (e) => {
    interval = e.target.value;
  });
  intervalIncreaseEl.addEventListener("click", () => {
    setIntervalLength(interval + 1);
  });
  intervalDecreaseEl.addEventListener("click", () => {
    setIntervalLength(interval - 1);
  });
  stopBtn.addEventListener("click", () => {
    stop = true;
  });

  canvas.addEventListener("click", (e) => {
    let found = false;
    objects = objects.map((obj) => {
      const clicked = ctx.isPointInPath(obj.path, e.offsetX, e.offsetY);
      if (clicked) {
        found = true;
      }
      return _.assoc("selected", clicked, obj);
    });
    if (!found) {
      objects = objects.concat(createBouncyBall(e.offsetX, e.offsetY, 0.2));
    }
  });

  const draw = () => {
    chart.draw(chartCtx, timeSeries);
    objects = objects.map((obj) => _.assoc("path", drawObj(ctx, obj), obj));
    debug(
      debugEl,
      counter,
      objects.find(_.prop("selected")) || _.tail(objects)
    );
    if (!stop) {
      requestAnimationFrame(draw);
    }
  };

  const tick = () => {
    counter += 1;
    ctx.clearRect(0, 0, 500, 500);
    objects = objects.map((obj) => _.compose(obj.update, move)(obj));
    timeSeries = chart.update(timeSeries, objects, counter);

    if (!stop) {
      setTimeout(tick, interval);
    }
  };

  tick();
  draw();
};

init();
