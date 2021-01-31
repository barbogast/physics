import * as _ from "./funcUtil.js";

const accelerate = (speed) => speed + speed * 0.06;
const break_ = (speed) => speed - speed * 0.06;
const topSpeed = 5;

export const move = (obj) => {
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

export const createBouncyBall = (x, y, bounceReduction) => ({
  speed: 0,
  x,
  y,
  direction: "down",
  update: bounce,
  shape: "circle",
  bounceReduction,
});

export const createRectangles = () =>
  _.range(0, 25).map((i) => ({
    speed: 1,
    x: 15 + 15 * i,
    y: 15 + 15 * i,
    direction: "right",
    update: leftRightMovement,
    shape: "rect",
  }));
