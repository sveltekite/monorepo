export function hash(...args: any[]) {
  const str = JSON.stringify(args);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash >>> 0
  }
  return hash.toString();
}
