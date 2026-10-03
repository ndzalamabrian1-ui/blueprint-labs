import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { cantileverTipDisplacement, defaultBeamParams, type BeamParams } from './beam';
import './styles.css';

const DEFAULTS = defaultBeamParams();

function formatMeters(value: number): string {
  return `${value.toFixed(6)} m`;
}

function formatMillimeters(value: number): string {
  return `${(value * 1000).toFixed(3)} mm`;
}

export default function App() {
  const [params, setParams] = useState<BeamParams>(DEFAULTS);
  const [visualScale, setVisualScale] = useState<number>(100);
  const [result, setResult] = useState<number>(() => cantileverTipDisplacement(DEFAULTS));
  const mountRef = useRef<HTMLDivElement | null>(null);

  const displacement = useMemo(() => cantileverTipDisplacement(params), [params]);

  const updateParam = (key: keyof BeamParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleRun = () => {
    setResult(cantileverTipDisplacement(params));
  };

  const handleReset = () => {
    setParams(DEFAULTS);
    setResult(cantileverTipDisplacement(DEFAULTS));
  };

  useMemo(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef2ff');

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.set(0, 0.25, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountRef.current.clientWidth, 480);
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(2, 4, 3);
    scene.add(directional);

    const supportMaterial = new THREE.MeshStandardMaterial({ color: '#334155' });
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.6, 0.5), supportMaterial);
    support.position.set(-params.length / 2 - 0.18, 0, 0);
    scene.add(support);

    const beamGeometry = new THREE.BoxGeometry(params.length, params.height, params.width);
    const beamMaterial = new THREE.MeshStandardMaterial({ color: '#2563eb', metalness: 0.2, roughness: 0.4 });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(params.length / 2, 0, 0);
    beam.rotation.z = 0;
    scene.add(beam);

    const deformation = displacement * visualScale;
    beam.position.x = (params.length / 2) + deformation * 0.75;
    beam.position.y = deformation * 0.2;

    const loadSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#ef4444' })
    );
    loadSphere.position.set(params.length, 0, 0);
    scene.add(loadSphere);

    const arrowDirection = new THREE.Vector3(0, -1, 0);
    const arrow = new THREE.ArrowHelper(
      arrowDirection,
      new THREE.Vector3(params.length, 0, 0),
      0.75,
      0xef4444
    );
    scene.add(arrow);

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [params.length, params.height, params.width, displacement, visualScale]);

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
              value={params.length}
              onChange={(event) => updateParam('length', Number(event.target.value))}
            />
          </label>

          <label>
            Width (m)
            <input
              type="number"
              step="0.01"
              value={params.width}
              onChange={(event) => updateParam('width', Number(event.target.value))}
            />
          </label>

          <label>
            Height (m)
            <input
              type="number"
              step="0.01"
              value={params.height}
              onChange={(event) => updateParam('height', Number(event.target.value))}
            />
          </label>

          <label>
            Young's modulus (Pa)
            <input
              type="number"
              step="1e9"
              value={params.youngsModulus}
              onChange={(event) => updateParam('youngsModulus', Number(event.target.value))}
            />
          </label>

          <label>
            Load (N)
            <input
              type="number"
              step="10"
              value={params.load}
              onChange={(event) => updateParam('load', Number(event.target.value))}
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

        <div className="button-row">
          <button type="button" onClick={handleRun}>Run</button>
          <button type="button" className="secondary" onClick={handleReset}>Reset</button>
        </div>

        <div className="result-box">
          <h3>Analytical Reference</h3>
          <p>Tip displacement: {formatMeters(result)}</p>
          <p>Tip displacement: {formatMillimeters(result)}</p>
          <p>Visual deformation: {visualScale}×</p>
        </div>
      </aside>

      <main className="viewport-panel">
        <div className="canvas-header">
          <span>Engineering viewport</span>
          <span>{formatMeters(displacement)} actual displacement</span>
        </div>
        <div ref={mountRef} className="viewport-canvas" />
      </main>
    </div>
  );
}
