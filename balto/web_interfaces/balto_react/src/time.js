export function convert(duration_in_seconds) {
  let duration_in_ns = duration_in_seconds * 1e9;
  console.log("Duration", duration_in_seconds, duration_in_ns);
  if (duration_in_ns > 1e9) {
    return { value: duration_in_ns / 1e9, unit: "s", precision: 2 };
  }
  if (duration_in_ns > 1e6) {
    return { value: duration_in_ns / 1e6, unit: "ms", precision: 0 };
  }
  if (duration_in_ns > 1e3) {
    return { value: duration_in_ns / 1e3, unit: "μs", precision: 0 };
  }
  return { value: duration_in_ns, unit: "ns", precision: 0 };
}
