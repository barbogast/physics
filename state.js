import * as _ from "./funcUtil.js";
import * as game from "./game.js";

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

export const actionTypes = {
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

export class State {
  #state;

  constructor(inititalState) {
    this.#state = updateGameState(inititalState, {});
  }

  dispatch(actionType, properties) {
    this.#state = updateGameState(this.#state, {
      ...properties,
      type: actionType,
    });
  }

  getState() {
    return this.#state;
  }
}
