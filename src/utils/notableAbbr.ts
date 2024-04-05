export function notableAbbr(notable: string, abbrLength = 30): string {
  // checks if length is < abbrLength and just returns it if so
  if (notable.length < abbrLength) return notable

  // if length is >= abbrLength, return the first abbrLength characters
  // wrapped in <abbr> tags with a title attribute containing the full string
  return `<abbr title="${notable}">${notable.slice(0, abbrLength)}…</abbr>`
}
