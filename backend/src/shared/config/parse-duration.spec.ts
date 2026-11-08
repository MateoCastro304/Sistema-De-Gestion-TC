import { parseDurationSeconds, parseDurationListSeconds } from './parse-duration';

describe('parseDurationSeconds', () => {
  it.each([
    ['500ms', 0.5],
    ['30s', 30],
    ['15m', 900],
    ['1h', 3600],
    ['7d', 604800],
    ['1w', 604800],
    ['1y', 31536000],
  ])('converts %s to %p seconds', (text, seconds) => {
    expect(parseDurationSeconds(text)).toBe(seconds);
  });

  it('reads a bare number as seconds, never as milliseconds', () => {
    // La librería `ms` (la de jsonwebtoken) lee "900" como 900 ms: acá es 900 s.
    expect(parseDurationSeconds('900')).toBe(900);
  });

  it.each(['', 'soon', '1 h', '-5m', '1.5h', 'm'])('rejects %p', (text) => {
    expect(() => parseDurationSeconds(text)).toThrow(/duración/);
  });
});

describe('parseDurationListSeconds', () => {
  it('parses a comma separated list in order', () => {
    expect(parseDurationListSeconds('90s,5m,15m,30m,1h')).toEqual([90, 300, 900, 1800, 3600]);
  });

  it('accepts a single item', () => {
    expect(parseDurationListSeconds('15m')).toEqual([900]);
  });

  it('rejects an empty item', () => {
    expect(() => parseDurationListSeconds('1m,,5m')).toThrow(/duración/);
  });
});
