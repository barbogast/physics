import * as _ from "./funcUtil.js";
import * as chart from "./chart.js";
import * as game from "./game.js";

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
  let objects = game.createRectangles();

  objects = objects.concat(game.createBouncyBall(20, 20, 0.1));
  objects = objects.concat(game.createBouncyBall(40, 20, 0.2));

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
      objects = objects.concat(
        game.createBouncyBall(e.offsetX, e.offsetY, 0.2)
      );
    }
  });

  const draw = () => {
    ctx.clearRect(0, 0, 500, 500);
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
    objects = objects.map((obj) => _.compose(obj.update, game.move)(obj));
    timeSeries = chart.update(timeSeries, objects, counter);

    if (!stop) {
      setTimeout(tick, interval);
    }
  };

  tick();
  draw();
};

init();
