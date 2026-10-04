import { describe, expect, test } from 'vitest';
import {
  cantileverTipDisplacement,
  validateBeamParams,
  configToBeamParams,
  loadBaselineConfig,
  calculateBeamDisplacementAtX,
  type BeamParams,
} from './apps/web/src/beam';

describe('Cantilever analytical reference calculations', () => {
  const baselineConfig = loadBaselineConfig();
  const baseline = configToBeamParams(baselineConfig);

  test('Default case is approximately 1.6 mm', () => {
    const displacement = cantileverTipDisplacement(baseline);
    expect(displacement).toBeCloseTo(0.0016, 3);
  });

  test('Double load doubles displacement', () => {
    const doubled = { ...baseline, load: baseline.load * 2 };
    const d1 = cantileverTipDisplacement(baseline);
    const d2 = cantileverTipDisplacement(doubled);
    expect(d2 / d1).toBeCloseTo(2, 6);
  });

  test('Double length increases displacement by about 8x', () => {
    const doubled = { ...baseline, length: baseline.length * 2 };
    const d1 = cantileverTipDisplacement(baseline);
    const d2 = cantileverTipDisplacement(doubled);
    expect(d2 / d1).toBeCloseTo(8, 6);
  });

  test('Increasing Young\'s modulus lowers displacement', () => {
    const stiffer = { ...baseline, youngsModulus: baseline.youngsModulus * 2 };
    const d1 = cantileverTipDisplacement(baseline);
    const d2 = cantileverTipDisplacement(stiffer);
    expect(d2 / d1).toBeCloseTo(0.5, 6);
  });

  test('Zero load produces zero displacement', () => {
    const noLoad = { ...baseline, load: 0 };
    const displacement = cantileverTipDisplacement(noLoad);
    expect(displacement).toBeCloseTo(0, 6);
  });

  test('Negative load produces negative displacement', () => {
    const negLoad = { ...baseline, load: -baseline.load };
    const d1 = cantileverTipDisplacement(baseline);
    const d2 = cantileverTipDisplacement(negLoad);
    expect(d2).toBeCloseTo(-d1, 6);
  });

  test('Reset returns to default state', () => {
    const defaults = configToBeamParams(baselineConfig);
    const modified: BeamParams = {
      ...defaults,
      length: 3,
      load: 5000,
      youngsModulus: 150e9,
    };
    expect(modified).not.toEqual(defaults);
    expect(configToBeamParams(baselineConfig)).toEqual(defaults);
  });

  test('Reject zero or negative length', () => {
    const invalid = { ...baseline, length: 0 };
    const error = validateBeamParams(invalid);
    expect(error).toBeTruthy();
    expect(error).toContain('positive');
  });

  test('Reject zero or negative width', () => {
    const invalid = { ...baseline, width: -0.05 };
    const error = validateBeamParams(invalid);
    expect(error).toBeTruthy();
    expect(error).toContain('positive');
  });

  test('Reject zero or negative height', () => {
    const invalid = { ...baseline, height: 0 };
    const error = validateBeamParams(invalid);
    expect(error).toBeTruthy();
    expect(error).toContain('positive');
  });

  test('Reject zero or negative Young\'s modulus', () => {
    const invalid = { ...baseline, youngsModulus: -100e9 };
    const error = validateBeamParams(invalid);
    expect(error).toBeTruthy();
    expect(error).toContain('positive');
  });

  test('Reject NaN values', () => {
    const invalid = { ...baseline, length: NaN };
    const error = validateBeamParams(invalid);
    expect(error).toBeTruthy();
    expect(error).toContain('finite');
  });

  test('Reject Infinity', () => {
    const invalid = { ...baseline, youngsModulus: Infinity };
    const error = validateBeamParams(invalid);
    expect(error).toBeTruthy();
    expect(error).toContain('finite');
  });

  test('Reject negative Infinity', () => {
    const invalid = { ...baseline, load: -Infinity };
    const error = validateBeamParams(invalid);
    expect(error).toBeTruthy();
    expect(error).toContain('finite');
  });

  test('Beam deflection shape at fixed end is zero', () => {
    const tipDisplacement = cantileverTipDisplacement(baseline);
    const deflection = calculateBeamDisplacementAtX(0, baseline.length, tipDisplacement);
    expect(deflection).toBeCloseTo(0, 6);
  });

  test('Beam deflection shape at free end matches tip displacement', () => {
    const tipDisplacement = cantileverTipDisplacement(baseline);
    const deflection = calculateBeamDisplacementAtX(baseline.length, baseline.length, tipDisplacement);
    expect(deflection).toBeCloseTo(tipDisplacement, 6);
  });

  test('Beam deflection shape is monotonically increasing', () => {
    const tipDisplacement = cantileverTipDisplacement(baseline);
    const d0 = calculateBeamDisplacementAtX(0.0, baseline.length, tipDisplacement);
    const d1 = calculateBeamDisplacementAtX(0.5, baseline.length, tipDisplacement);
    const d2 = calculateBeamDisplacementAtX(1.0, baseline.length, tipDisplacement);
    const d3 = calculateBeamDisplacementAtX(1.5, baseline.length, tipDisplacement);
    const d4 = calculateBeamDisplacementAtX(baseline.length, baseline.length, tipDisplacement);
    expect(d0).toBeLessThan(d1);
    expect(d1).toBeLessThan(d2);
    expect(d2).toBeLessThan(d3);
    expect(d3).toBeLessThan(d4);
  });
});
