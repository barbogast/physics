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

const actionTypes = {
  stopClicked: "stopClicked",
  canvasClicked: "canvasClicked",
  simulationTick: "simulationTick",
  simulationIntervalKeyPress: "simulationIntervalKeyPress",
  increaseSimulationInterval: "increaseSimulationInterval",
  decreaseSimulationInterval: "decreaseSimulationInterval",
  addObject: "addObject",
  draw: "draw",
};

const updateStopped = (state = false, action) =>
  action.type === actionTypes.stopClicked ? !state : state;

const updateObjects = (state = [], action) => {
  switch (action.type) {
    case actionTypes.addObject:
      return state.concat(action.object);

    case actionTypes.simulationTick:
      return state.map((obj) => _.compose(obj.update, game.move)(obj));

    case actionTypes.canvasClicked:
      let found = false;
      let newState = state.map((obj) => {
        const clicked = action.ctx.isPointInPath(obj.path, action.x, action.y);
        if (clicked) {
          found = true;
        }
        return _.assoc("selected", clicked, obj);
      });
      if (!found) {
        newState = newState.concat(
          game.createBouncyBall(action.x, action.y, 0.2)
        );
      }
      return newState;

    case actionTypes.draw:
      return state.map((obj) => _.assoc("path", drawObj(action.ctx, obj), obj));

    default:
      return state;
  }
};

const updateInterval = (state = 10, action) => {
  switch (action.type) {
    case actionTypes.simulationIntervalKeyPress: {
      if (action.key.toLowerCase() === "backspace") {
        return parseInt(_.init(String(state))) || 0;
      } else {
        const newValue = parseInt(String(state) + action.key);
        return newValue && newValue > 0 ? newValue : state;
      }
    }
    case actionTypes.increaseSimulationInterval:
      return state + 1;
    case actionTypes.decreaseSimulationInterval:
      return state - 1;
    default:
      return state;
  }
};

const updateCounter = (state = 0, action) =>
  action.type === actionTypes.simulationTick ? state + 1 : state;

const updateGameState = _.applySpec({
  stopped: updateStopped,
  objects: updateObjects,
  simulationInterval: updateInterval,
  counter: updateCounter,
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

  let state = updateGameState({ objects: game.createRectangles() }, {});

  state = updateGameState(state, {
    type: actionTypes.addObject,
    object: game.createBouncyBall(20, 20, 0.1),
  });

  state = updateGameState(state, {
    type: actionTypes.addObject,
    object: game.createBouncyBall(40, 20, 0.2),
  });

  let timeSeries = chart.initState();

  intervalEl.addEventListener("keydown", (e) => {
    state = updateGameState(state, {
      type: actionTypes.simulationIntervalKeyPress,
      key: e.key,
    });
  });
  intervalIncreaseEl.addEventListener("click", () => {
    state = updateGameState(state, {
      type: actionTypes.increaseSimulationInterval,
    });
  });
  intervalDecreaseEl.addEventListener("click", () => {
    state = updateGameState(state, {
      type: actionTypes.decreaseSimulationInterval,
    });
  });
  stopBtn.addEventListener("click", () => {
    state = updateGameState(state, { type: actionTypes.stopClicked });
  });

  canvas.addEventListener("click", (e) => {
    state = updateGameState(state, {
      type: actionTypes.canvasClicked,
      x: e.offsetX,
      y: e.offsetY,
      ctx,
    });
  });

  const draw = () => {
    ctx.clearRect(0, 0, 500, 500);
    intervalEl.value = state.simulationInterval;
    chart.draw(chartCtx, timeSeries);
    state = updateGameState(state, { type: actionTypes.draw, ctx });
    debug(
      debugEl,
      state.counter,
      state.objects.find(_.prop("selected")) || _.tail(state.objects)
    );
    if (!state.stopped) {
      requestAnimationFrame(draw);
    }
  };

  const tick = () => {
    state = updateGameState(state, { type: actionTypes.simulationTick });
    timeSeries = chart.update(timeSeries, state.objects, state.counter);

    if (!state.stopped) {
      setTimeout(tick, state.simulationInterval);
    }
  };

  tick();
  draw();
};

init();
