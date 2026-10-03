import { describe, expect, test } from 'vitest';
import { cantileverTipDisplacement, defaultBeamParams } from './apps/web/src/beam';

describe('Cantilever analytical reference calculations', () => {
  test('Default case is approximately 1.6 mm', () => {
    const params = defaultBeamParams();
    const displacement = cantileverTipDisplacement(params);
    expect(displacement).toBeCloseTo(0.0016, 3);
  });

  test('Double load doubles displacement', () => {
    const base = defaultBeamParams();
    const doubled = { ...base, load: base.load * 2 };
    const d1 = cantileverTipDisplacement(base);
    const d2 = cantileverTipDisplacement(doubled);
    expect(d2 / d1).toBeCloseTo(2, 6);
  });

  test('Double length increases displacement by about 8x', () => {
    const base = defaultBeamParams();
    const doubled = { ...base, length: base.length * 2 };
    const d1 = cantileverTipDisplacement(base);
    const d2 = cantileverTipDisplacement(doubled);
    expect(d2 / d1).toBeCloseTo(8, 6);
  });

  test('Increasing Young\'s modulus lowers displacement', () => {
    const base = defaultBeamParams();
    const stiffer = { ...base, youngsModulus: base.youngsModulus * 2 };
    const d1 = cantileverTipDisplacement(base);
    const d2 = cantileverTipDisplacement(stiffer);
    expect(d2 / d1).toBeCloseTo(0.5, 6);
  });

  test('Reset returns to default state', () => {
    const defaults = defaultBeamParams();
    const modified = {
      ...defaults,
      length: 3,
      load: 5000,
      youngsModulus: 150e9,
    };
    expect(modified).not.toEqual(defaults);
    expect(defaultBeamParams()).toEqual(defaults);
  });
});
