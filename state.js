class State {
  #state;
  #updateState;

  constructor(updateState, inititalState) {
    this.#state = updateState(inititalState, {});
    this.#updateState = updateState;
  }

  dispatch(actionType, properties) {
    this.#state = this.#updateState(this.#state, {
      ...properties,
      type: actionType,
    });
  }

  getState() {
    return this.#state;
  }
}

export default State;
