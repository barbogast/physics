export function curry(f) {
  return function currify() {
    const args = Array.prototype.slice.call(arguments);
    return args.length >= f.length
      ? f.apply(null, args)
      : currify.bind(null, ...args);
  };
}

export const assoc = (k, v, obj) => ({ ...obj, [k]: v });

export const merge = (...args) =>
  args.reduceRight((prev, current) => ({ ...prev, ...current }));

export const mapValues = (func, obj) =>
  Object.entries(obj).reduce((o, [k, v]) => assoc(k, func(v), o), {});

export const range = (from, to) => {
  const result = [];
  let n = from;
  while (n < to) {
    result.push(n);
    n += 1;
  }
  return result;
};

export const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

export const append = (v, a) => a.concat(v);

export const update = curry((idx, val, a) =>
  a.map((v, i) => (idx === i ? val : v))
);

export const repeat = (len, v) => {
  const r = [];
  for (let i = 0; i < len; i++) {
    r.push(v);
  }
  return r;
};

export const prop = curry((k, o) => o[k]);

export const tail = (a) => a[a.length - 1];

export const applySpec = (spec) => (obj, ...args) =>
  Object.entries(spec).reduce(
    (acc, [k, v]) => assoc(k, v(obj[k], ...args), acc),
    {}
  );

export const init = (v) => v.slice(0, v.length - 1);
