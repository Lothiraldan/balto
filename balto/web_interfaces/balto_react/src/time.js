// Copyright 2018-2021 by Boris Feld

export function convert(duration_in_seconds) {
  let duration_in_ns = duration_in_seconds * 1e9;
  if (duration_in_ns > 1e9) {
    return { value: duration_in_ns / 1e9, unit: "s", precision: 2, power: 1e9 };
  }
  if (duration_in_ns > 1e6) {
    return { value: duration_in_ns / 1e6, unit: "ms", precision: 0, power: 1e6 };
  }
  if (duration_in_ns > 1e3) {
    return { value: duration_in_ns / 1e3, unit: "μs", precision: 0, power: 1e3 };
  }
  return { value: duration_in_ns, unit: "ns", precision: 0, power: 1 };
}

export function convert_at_power(duration_in_seconds, power) {
  let duration_in_ns = duration_in_seconds * 1e9;
  return duration_in_ns / power;
}