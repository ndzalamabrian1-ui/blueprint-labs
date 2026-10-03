export type BeamParams = {
  length: number;
  width: number;
  height: number;
  youngsModulus: number;
  load: number;
};

export function beamMomentOfInertia(width: number, height: number): number {
  return (width * Math.pow(height, 3)) / 12;
}

export function cantileverTipDisplacement({
  length,
  width,
  height,
  youngsModulus,
  load,
}: BeamParams): number {
  const momentOfInertia = beamMomentOfInertia(width, height);
  return (load * Math.pow(length, 3)) / (3 * youngsModulus * momentOfInertia);
}

export function defaultBeamParams(): BeamParams {
  return {
    length: 2.0,
    width: 0.1,
    height: 0.1,
    youngsModulus: 200e9,
    load: 1000,
  };
}
