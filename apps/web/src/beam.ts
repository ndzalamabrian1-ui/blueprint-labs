import baselineConfig from '../../experiments/cantilever-beam/baseline.json';

export type BeamParams = {
  length: number;
  width: number;
  height: number;
  youngsModulus: number;
  load: number;
};

export type SimulationResult = {
  tipDisplacementM: number;
  tipDisplacementMm: number;
  calculatedAt: string;
};

/**
 * Load the baseline experiment configuration from JSON.
 * This is the single source of truth for default parameters.
 */
export function loadBaselineConfig() {
  return baselineConfig;
}

/**
 * Convert experiment configuration to beam parameters.
 */
export function configToBeamParams(config: typeof baselineConfig): BeamParams {
  return {
    length: config.geometry.length,
    width: config.geometry.width,
    height: config.geometry.height,
    youngsModulus: config.material.youngsModulus,
    load: config.loading.value,
  };
}

/**
 * Validate beam parameters.
 * Returns null if valid, error message if invalid.
 */
export function validateBeamParams(params: BeamParams): string | null {
  // Check for NaN and Infinity
  if (!Number.isFinite(params.length)) {
    return 'Length must be a finite number';
  }
  if (!Number.isFinite(params.width)) {
    return 'Width must be a finite number';
  }
  if (!Number.isFinite(params.height)) {
    return 'Height must be a finite number';
  }
  if (!Number.isFinite(params.youngsModulus)) {
    return "Young's modulus must be a finite number";
  }
  if (!Number.isFinite(params.load)) {
    return 'Load must be a finite number';
  }

  // Check for positive geometry and material properties
  if (params.length <= 0) {
    return 'Length must be positive';
  }
  if (params.width <= 0) {
    return 'Width must be positive';
  }
  if (params.height <= 0) {
    return 'Height must be positive';
  }
  if (params.youngsModulus <= 0) {
    return "Young's modulus must be positive";
  }

  // Load can be zero or negative (opposite direction)
  // No restriction on load sign

  return null;
}

/**
 * Calculate second moment of inertia for a rectangular cross-section.
 * I = b*h³/12
 */
export function beamMomentOfInertia(width: number, height: number): number {
  return (width * Math.pow(height, 3)) / 12;
}

/**
 * Euler-Bernoulli analytical solution for cantilever tip displacement.
 * δ = F*L³/(3*E*I)
 *
 * Throws error if parameters are invalid.
 */
export function cantileverTipDisplacement(params: BeamParams): number {
  const validationError = validateBeamParams(params);
  if (validationError) {
    throw new Error(validationError);
  }

  const momentOfInertia = beamMomentOfInertia(params.width, params.height);
  const displacement = (params.load * Math.pow(params.length, 3)) / 
    (3 * params.youngsModulus * momentOfInertia);

  if (!Number.isFinite(displacement)) {
    throw new Error('Calculation resulted in non-finite value');
  }

  return displacement;
}

/**
 * Euler-Bernoulli deflection shape along the cantilever beam.
 * For a point load at the free end:
 * y(x) = δ_tip * (3*ξ - 3*ξ² + ξ³)
 * where ξ = x/L
 *
 * At x=0 (fixed end): y = 0
 * At x=L (free end): y = δ_tip
 */
export function calculateBeamDisplacementAtX(
  x: number,
  beamLength: number,
  tipDisplacement: number
): number {
  if (beamLength <= 0) return 0;

  const xi = x / beamLength;
  // Cubic polynomial: 3ξ - 3ξ² + ξ³
  const deflectionShape = 3 * xi - 3 * xi * xi + xi * xi * xi;

  return tipDisplacement * deflectionShape;
}

/**
 * Run the analytical solver with given parameters.
 * Returns a committed simulation result with timestamp.
 */
export function runAnalyticalSolver(params: BeamParams): SimulationResult {
  const displacement = cantileverTipDisplacement(params);
  return {
    tipDisplacementM: displacement,
    tipDisplacementMm: displacement * 1000,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Export experiment state as JSON.
 * Clearly distinguishes inputs from results from visualization settings.
 */
export function exportExperimentState(
  config: typeof baselineConfig,
  params: BeamParams,
  result: SimulationResult | null,
  visualScale: number
): string {
  const exportData = {
    experiment: {
      name: config.name,
      description: config.description,
      version: config.version,
      model: config.model,
    },
    units: config.units,
    inputs: {
      geometry: config.geometry,
      material: config.material,
      loading: config.loading,
      boundaryConditions: config.boundaryConditions,
    },
    result: result ? {
      tipDisplacementM: result.tipDisplacementM,
      tipDisplacementMm: result.tipDisplacementMm,
      calculatedAt: result.calculatedAt,
      model: config.model,
    } : null,
    visualization: {
      deformationScale: visualScale,
      note: 'Visual deformation is exaggerated for visibility. Actual displacement is in result.tipDisplacementM',
    },
  };

  return JSON.stringify(exportData, null, 2);
}
