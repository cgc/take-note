
export function groupby(list, prop) {
  const grouped = {};
  for (const item of list) {
    const key = prop(item);
    if (!(key in grouped)) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }
  return grouped;
}

export function ensureEndsNewline(content) {
  if (content[content.length - 1] !== '\n') {
    content += '\n';
  }
  return content;
}

export function iso8601CurrTZ(dt) {
  let date = new Date(dt);
  date = new Date(dt - date.getTimezoneOffset() * 60 * 1000);
  const str = date.toISOString();
  // Removes 'Z' from tz...
  return str.slice(0, str.length - 1);
}

export function iso8601DayCurrTZ(dt) {
  return iso8601CurrTZ(dt).slice(0, 10);
}
