const CHART_WITDH = 500;
const CHART_HEIGHT = 100;

function curry(f) {
  return function currify() {
    const args = Array.prototype.slice.call(arguments);
    return args.length >= f.length
      ? f.apply(null, args)
      : currify.bind(null, ...args);
  };
}

const assoc = (k, v, obj) => ({ ...obj, [k]: v });

const merge = (...args) =>
  args.reduceRight((prev, current) => ({ ...prev, ...current }));

const mapValues = (func, obj) =>
  Object.entries(obj).reduce((o, [k, v]) => assoc(k, func(v), o), {});

const range = (from, to) => {
  const result = [];
  let n = from;
  while (n < to) {
    result.push(n);
    n += 1;
  }
  return result;
};

const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

const append = (v, a) => a.concat(v);

const update = curry((idx, val, a) => a.map((v, i) => (idx === i ? val : v)));

const repeat = (len, v) => {
  const r = [];
  for (let i = 0; i < len; i++) {
    r.push(v);
  }
  return r;
};

const prop = curry((k, o) => o[k]);

const tail = (a) => a[a.length - 1];

const debug = (el, tick, obj) => {
  el.innerHTML = JSON.stringify(
    merge(
      mapValues((v) => (typeof v === "number" ? v.toFixed(2) : v), obj),
      { tick }
    ),
    null,
    2
  );
};

const drawObj = curry((ctx, obj) => {
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

const drawChart = (ctx, series) => {
  const height = 100;
  ctx.clearRect(0, 0, CHART_WITDH, CHART_HEIGHT);
  Object.entries(series).forEach(([color, values]) => {
    values.forEach((v, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i, height - v, 1, 1);
    });
  });
};

const accelerate = (speed) => speed + speed * 0.06;
const break_ = (speed) => speed - speed * 0.06;
const topSpeed = 5;

const move = (obj) => {
  switch (obj.direction) {
    case "right":
      return assoc("x", obj.x + obj.speed, obj);

    case "left":
      return assoc("x", obj.x - obj.speed, obj);

    case "up":
      return assoc("y", obj.y - obj.speed, obj);

    case "down":
      return assoc("y", obj.y + obj.speed, obj);
  }
};

const leftRightMovement = (obj) => {
  if (
    (obj.direction === "right" && obj.x < 400) ||
    (obj.direction === "left" && obj.x > 100)
  ) {
    return assoc("speed", Math.min(accelerate(obj.speed), topSpeed), obj);
  } else {
    const speed = break_(obj.speed);
    let direction = obj.direction;
    if (speed <= 0.1) {
      direction = direction === "right" ? "left" : "right";
    }
    return merge({ direction, speed }, obj);
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
  return merge({ speed, direction }, obj);
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

function draw() {
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
  let objects = range(0, 25).map((i) => ({
    speed: 1,
    x: 15 + 15 * i,
    y: 15 + 15 * i,
    direction: "right",
    update: leftRightMovement,
    shape: "rect",
  }));

  objects = objects.concat(createBouncyBall(20, 20, 0.1));
  objects = objects.concat(createBouncyBall(40, 20, 0.2));

  let speedSeries = repeat(CHART_WITDH, 0);
  let xSeries = repeat(CHART_WITDH, 0);
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
    const found = false;
    objects = objects.map((obj) => {
      const clicked = ctx.isPointInPath(obj.path, e.offsetX, e.offsetY);
      if (clicked) {
        found = true;
      }
      return assoc("selected", clicked, obj);
    });
    if (!found) {
      objects = objects.concat(createBouncyBall(e.offsetX, e.offsetY, 0.2));
    }
  });

  const draw = () => {
    drawChart(chartCtx, { green: xSeries, blue: speedSeries });
    objects = objects.map((obj) => assoc("path", drawObj(ctx, obj), obj));
    debug(debugEl, counter, objects.find(prop("selected")) || tail(objects));
    if (!stop) {
      requestAnimationFrame(draw);
    }
  };

  const tick = () => {
    counter += 1;
    ctx.clearRect(0, 0, 500, 500);
    objects = objects.map((obj) => compose(obj.update, move)(obj));

    speedSeries = update(
      counter % CHART_WITDH,
      tail(objects).speed * 10,
      speedSeries
    );
    xSeries = compose(
      update(counter % CHART_WITDH, tail(objects).y / 10),
      update((counter % CHART_WITDH) + 1, 0),
      update((counter % CHART_WITDH) + 2, 0)
    )(xSeries);
    if (!stop) {
      setTimeout(tick, interval);
    }
  };

  tick();
  draw();
}
