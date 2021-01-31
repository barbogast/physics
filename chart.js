import * as _ from "./funcUtil.js";

const CHART_WITDH = 500;
const CHART_HEIGHT = 100;

export const draw = (ctx, series) => {
  const height = 100;
  ctx.clearRect(0, 0, CHART_WITDH, CHART_HEIGHT);
  Object.entries(series).forEach(([color, values]) => {
    values.forEach((v, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i, height - v, 1, 1);
    });
  });
};

export const update = ({ xSeries, speedSeries }, objects, counter) => {
  speedSeries = _.update(
    counter % CHART_WITDH,
    _.tail(objects).speed * 10,
    speedSeries
  );
  xSeries = _.compose(
    _.update(counter % CHART_WITDH, _.tail(objects).y / 10),
    _.update((counter % CHART_WITDH) + 1, 0),
    _.update((counter % CHART_WITDH) + 2, 0)
  )(xSeries);
  return { xSeries, speedSeries };
};
