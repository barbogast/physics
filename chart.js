import * as _ from "./funcUtil.js";

const CHART_WITDH = 500;
const CHART_HEIGHT = 100;

const COLORS = ["green", "blue"];

export const draw = (ctx, series) => {
  const height = 100;
  ctx.clearRect(0, 0, CHART_WITDH, CHART_HEIGHT);
  Object.entries(series).forEach(([name, values], idx) => {
    values.forEach((v, i) => {
      ctx.fillStyle = COLORS[idx];
      ctx.fillRect(i, height - v, 1, 1);
    });
  });
};

export const update = (timeSeries, objects, counter) => {
  const speedSeries = _.update(
    counter % CHART_WITDH,
    _.tail(objects).speed * 10,
    timeSeries.speedSeries
  );
  const xSeries = _.compose(
    _.update(counter % CHART_WITDH, _.tail(objects).y / 10),
    _.update((counter % CHART_WITDH) + 1, 0),
    _.update((counter % CHART_WITDH) + 2, 0)
  )(timeSeries.xSeries);
  return { xSeries, speedSeries };
};

export const initState = () => {
  return {
    speedSeries: _.repeat(CHART_WITDH, 0),
    xSeries: _.repeat(CHART_WITDH, 0),
  };
};
