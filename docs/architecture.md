# Blueprint Labs Architecture

## Current design

This repository currently implements one working experiment: a cantilever beam with an analytical reference calculation.

## Flow

Browser UI
↓
Experiment parameter state
↓
Analytical reference solver
↓
Results display
↓
Visualization layer

## Scope

This is intentionally narrow and not a generic CAD or multi-physics platform.

The current purpose is to:
- capture engineering parameters,
- run the physical model,
- display the deformation,
- validate the analytical result,
- preserve the experiment configuration.

## Not yet implemented

- SOFA integration
- numerical solver backend
- generic simulation abstraction
- multiple experiment types
- editing and scene graph beyond the single beam case
