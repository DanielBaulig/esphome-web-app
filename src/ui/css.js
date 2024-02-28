function join(a, b) {
    return `${a}${a.length > 0 ? ' ':''}${b}`;
}

export default function css(...args) {
  return args.reduce((a, v) => {
    if (v === undefined) {
      return a;
    }
    if (typeof v === 'object') {
      return Object.entries(v).reduce((a, [k, v]) => {
        if (!v) {
          return a;
        }

        return join(a, k);
      }, a);
    }

    return join(a, v);
  }, '');
}
