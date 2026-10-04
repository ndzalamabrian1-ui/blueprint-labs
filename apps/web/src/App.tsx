import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  loadBaselineConfig,
  configToBeamParams,
  runAnalyticalSolver,
  validateBeamParams,
  calculateBeamDisplacementAtX,
  exportExperimentState,
  type BeamParams,
  type SimulationResult,
} from './beam';
import './styles.css';

function formatMeters(value: number): string {
  return `${value.toFixed(6)} m`;
}

function formatMillimeters(value: number): string {
  return `${(value * 1000).toFixed(3)} mm`;
}

type SceneReference = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  experimentRoot: THREE.Group;
  support: THREE.Mesh;
  supportGeometry: THREE.BoxGeometry;
  supportMaterial: THREE.MeshStandardMaterial;
  beamGroup: THREE.Group;
  loadMarker: THREE.Mesh;
  loadMarkerGeometry: THREE.SphereGeometry;
  loadMarkerMaterial: THREE.MeshStandardMaterial;
  loadArrow: THREE.ArrowHelper;
  lights: THREE.Light[];
};

export default function App() {
  const baseline = loadBaselineConfig();
  const baselineParams = configToBeamParams(baseline);

  const [draftParams, setDraftParams] = useState<BeamParams>(baselineParams);
  const [committedParams, setCommittedParams] = useState<BeamParams>(baselineParams);
  const [committedResult, setCommittedResult] = useState<SimulationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [visualScale, setVisualScale] = useState<number>(100);
  const sceneRef = useRef<SceneReference | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const updateDraftParam = (key: keyof BeamParams, value: number) => {
    setDraftParams((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  const handleRun = () => {
    const error = validateBeamParams(draftParams);
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      const result = runAnalyticalSolver(draftParams);
      setCommittedParams({ ...draftParams });
      setCommittedResult(result);
      setValidationError(null);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleReset = () => {
    setDraftParams(baselineParams);
    setCommittedParams(baselineParams);
    setVisualScale(100);
    try {
      const result = runAnalyticalSolver(baselineParams);
      setCommittedResult(result);
      setValidationError(null);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleExport = () => {
    if (!committedResult) {
      setValidationError('No result to export. Press Run first.');
      return;
    }
    try {
      const json = exportExperimentState(baseline, committedParams, committedResult, visualScale);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cantilever-beam-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Initialize scene once on mount
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef2ff');

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.set(0, 0.25, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountRef.current.clientWidth, 480);
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(2, 4, 3);
    scene.add(directional);

    const lights = [ambient, directional];

    // Experiment coordinate system root
    const experimentRoot = new THREE.Group();
    experimentRoot.name = 'experimentRoot';
    scene.add(experimentRoot);

    // Support at x = 0 (fixed end)
    const supportGeometry = new THREE.BoxGeometry(0.28, 0.6, 0.5);
    const supportMaterial = new THREE.MeshStandardMaterial({ color: '#334155' });
    const support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(0, 0, 0);
    support.name = 'support';
    experimentRoot.add(support);

    // Beam group for segmented geometry
    const beamGroup = new THREE.Group();
    beamGroup.name = 'beamGroup';
    experimentRoot.add(beamGroup);

    // Load marker at x = L (free end)
    const loadMarkerGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const loadMarkerMaterial = new THREE.MeshStandardMaterial({ color: '#ef4444' });
    const loadMarker = new THREE.Mesh(loadMarkerGeometry, loadMarkerMaterial);
    loadMarker.position.set(committedParams.length, 0, 0);
    loadMarker.name = 'loadMarker';
    experimentRoot.add(loadMarker);

    // Load arrow at x = L (free end)
    const loadArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(committedParams.length, 0, 0),
      0.75,
      0xff0000
    );
    loadArrow.name = 'loadArrow';
    experimentRoot.add(loadArrow);

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Resize observer
    const observeResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = 480;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(() => {
      observeResize();
    });
    observer.observe(mountRef.current);
    resizeObserverRef.current = observer;

    sceneRef.current = {
      scene,
      camera,
      renderer,
      experimentRoot,
      support,
      supportGeometry,
      supportMaterial,
      beamGroup,
      loadMarker,
      loadMarkerGeometry,
      loadMarkerMaterial,
      loadArrow,
      lights,
    };

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // Update load marker and arrow positions when committed parameters change
  useEffect(() => {
    if (!sceneRef.current) return;

    const { loadMarker, loadArrow } = sceneRef.current;

    loadMarker.position.set(committedParams.length, 0, 0);
    loadArrow.position.set(committedParams.length, 0, 0);
  }, [committedParams]);

  // Update beam visualization when committed result or visualization scale changes
  useEffect(() => {
    if (!sceneRef.current || !committedResult) return;

    const { beamGroup } = sceneRef.current;

    // Clear existing beam segments
    while (beamGroup.children.length > 0) {
      const child = beamGroup.children[0];
      if (child instanceof THREE.Mesh) {
        if (child.geometry instanceof THREE.BufferGeometry) {
          child.geometry.dispose();
        }
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      beamGroup.removeChild(child);
    }

    // Create segmented bent beam from committed parameters and result
    const segments = 12;
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: '#2563eb',
      metalness: 0.2,
      roughness: 0.4,
    });

    const scaledDisplacement = committedResult.tipDisplacementM * visualScale;

    for (let i = 0; i < segments; i++) {
      const xStart = (i / segments) * committedParams.length;
      const xEnd = ((i + 1) / segments) * committedParams.length;

      const segmentLength = committedParams.length / segments;
      const yStart = calculateBeamDisplacementAtX(xStart, committedParams.length, scaledDisplacement);
      const yEnd = calculateBeamDisplacementAtX(xEnd, committedParams.length, scaledDisplacement);
      const yMid = (yStart + yEnd) / 2;

      const segmentGeometry = new THREE.BoxGeometry(segmentLength, committedParams.height, committedParams.width);
      const segment = new THREE.Mesh(segmentGeometry, beamMaterial);

      segment.position.x = (xStart + xEnd) / 2;
      segment.position.y = yMid;

      const angle = Math.atan2(yEnd - yStart, segmentLength);
      segment.rotation.z = angle;

      beamGroup.add(segment);
    }
  }, [committedResult, visualScale, committedParams]);

  // Initialize with baseline result on mount
  useEffect(() => {
    try {
      const result = runAnalyticalSolver(baselineParams);
      setCommittedResult(result);
    } catch (err) {
      console.error('Failed to initialize baseline result:', err);
    }
  }, []);

  return (
    <div className="app-shell">
      <aside className="panel">
        <h1>Blueprint Labs</h1>
        <p className="subtitle">Cantilever beam experiment</p>

        <div className="control-group">
          <label>
            Length (m)
            <input
              type="number"
              step="0.01"
              value={draftParams.length}
              onChange={(event) => updateDraftParam('length', Number(event.target.value))}
            />
          </label>

          <label>
            Width (m)
            <input
              type="number"
              step="0.01"
              value={draftParams.width}
              onChange={(event) => updateDraftParam('width', Number(event.target.value))}
            />
          </label>

          <label>
            Height (m)
            <input
              type="number"
              step="0.01"
              value={draftParams.height}
              onChange={(event) => updateDraftParam('height', Number(event.target.value))}
            />
          </label>

          <label>
            Young's modulus (Pa)
            <input
              type="number"
              step="1e9"
              value={draftParams.youngsModulus}
              onChange={(event) => updateDraftParam('youngsModulus', Number(event.target.value))}
            />
          </label>

          <label>
            Load (N)
            <input
              type="number"
              step="10"
              value={draftParams.load}
              onChange={(event) => updateDraftParam('load', Number(event.target.value))}
            />
          </label>

          <label>
            Visual deformation scale
            <input
              type="number"
              min="1"
              max="1000"
              value={visualScale}
              onChange={(event) => setVisualScale(Number(event.target.value))}
            />
          </label>
        </div>

        {validationError && (
          <div className="error-box">
            <p>{validationError}</p>
          </div>
        )}

        <div className="button-row">
          <button type="button" onClick={handleRun}>Run</button>
          <button type="button" className="secondary" onClick={handleReset}>Reset</button>
          <button type="button" className="secondary" onClick={handleExport}>Export</button>
        </div>

        {committedResult && (
          <div className="result-box">
            <h3>Analytical Reference</h3>
            <p>Tip displacement: {formatMeters(committedResult.tipDisplacementM)}</p>
            <p>Tip displacement: {formatMillimeters(committedResult.tipDisplacementMm)}</p>
            <p className="visual-note">Visual deformation scale: {visualScale}×</p>
            <p className="model-note">Model: Euler-Bernoulli cantilever</p>
            <p className="time-note">Calculated: {new Date(committedResult.calculatedAt).toLocaleTimeString()}</p>
          </div>
        )}
      </aside>

      <main className="viewport-panel">
        <div className="canvas-header">
          <span>Engineering viewport</span>
          {committedResult && (
            <span>{formatMeters(committedResult.tipDisplacementM)} actual displacement</span>
          )}
        </div>
        <div ref={mountRef} className="viewport-canvas" />
      </main>
    </div>
  );
}
