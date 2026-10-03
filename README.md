# Blueprint Labs

A screen-based engineering experimentation environment focused on the cantilever beam workflow.

## IMPLEMENTED
- Euler-Bernoulli analytical reference model for a cantilever beam
- React + Vite web application shell
- Three.js viewport integration
- Parameter controls for beam geometry and load
- Beam deformation visualization with a clear visual exaggeration scale
- Numerical displacement output
- Machine-readable experiment configuration
- Automated validation tests

## EXPERIMENTAL
- Deformation display as a scaled visualization for clarity
- Parameter reset workflow
- JSON-driven default experiment state

## PLANNED
- SOFA numeric backend integration
- Additional beam and structure experiments
- Comparison between analytical and numerical results
- More advanced visualization and inspector tools

## NOT IMPLEMENTED
- Multi-physics simulation
- CAD or generic editing environment
- Generic 3D editor
- Real-time multiphysics solver
- Collaboration features
- AI-assisted experiment workflow

## Current Experiment

The current working experiment is a **cantilever beam under a point load**.

Default values are:
- Length: 2.0 m
- Width: 0.1 m
- Height: 0.1 m
- Young's modulus: 200 GPa
- Load: 1000 N

The analytical reference uses Euler-Bernoulli beam theory:

δ = F L³ / (3 E I)

with:

I = b h³ / 12

This yields an expected tip displacement of approximately 0.0016 m (1.6 mm).

## Web App

To run the app locally:

```bash
pnpm install
pnpm dev
```

Open the local Vite URL in your browser.

## Validation

Run tests with:

```bash
pnpm test
```

Tests cover:
- default result near 1.6 mm
- load doubling behavior
- length scaling behavior
- modulus sensitivity
- reset behavior

## Important Discipline

This repository intentionally starts with a single working experiment instead of a broad platform architecture.

The first success criterion is:

A user can change beam parameters, press Run, get a real analytical physical response, see the deformation in the viewport, and verify it through automated tests.
