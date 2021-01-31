import * as _ from "./funcUtil.js";
import * as chart from "./chart.js";
import * as game from "./game.js";
import { actionTypes, State } from "./state.js";

const renderDebugArea = (el, tick, obj) => {
  el.innerHTML = JSON.stringify(
    _.merge(
      _.mapValues((v) => (typeof v === "number" ? v.toFixed(2) : v), obj),
      { tick }
    ),
    null,
    2
  );
};

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

  const state = new State({
    objects: game.createRectangles(),
  });

  state.dispatch(actionTypes.addObject, {
    object: game.createBouncyBall(20, 20, 0.1),
  });

  state.dispatch(actionTypes.addObject, {
    object: game.createBouncyBall(40, 20, 0.2),
  });

  let timeSeries = chart.initState();

  intervalEl.addEventListener("keydown", (e) => {
    state.dispatch(actionTypes.simulationIntervalKeyPress, { key: e.key });
  });
  intervalIncreaseEl.addEventListener("click", () => {
    state.dispatch(actionTypes.increaseSimulationInterval);
  });
  intervalDecreaseEl.addEventListener("click", () => {
    state.dispatch(actionTypes.decreaseSimulationInterval);
  });
  stopBtn.addEventListener("click", () => {
    state.dispatch(actionTypes.stopClicked);
  });

  canvas.addEventListener("click", (e) => {
    state.dispatch(actionTypes.canvasClicked, {
      x: e.offsetX,
      y: e.offsetY,
      ctx,
    });
  });

  const draw = () => {
    ctx.clearRect(0, 0, 500, 500);
    state.dispatch(actionTypes.draw, { ctx });
    const s = state.getState();
    intervalEl.value = s.simulationInterval;
    chart.draw(chartCtx, timeSeries);
    renderDebugArea(
      debugEl,
      s.counter,
      s.objects.find(_.prop("selected")) || _.tail(s.objects)
    );
    if (!state.stopped) {
      requestAnimationFrame(draw);
    }
  };

  const tick = () => {
    state.dispatch(actionTypes.simulationTick);
    const s = state.getState();
    timeSeries = chart.update(timeSeries, s.objects, s.counter);

    if (!s.stopped) {
      setTimeout(tick, s.simulationInterval);
    }
  };

  tick();
  draw();
};

init();
