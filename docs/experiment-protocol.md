# Experiment Protocol

The experiment is reproducible from a machine-readable JSON configuration.

## Required fields

- geometry
- material
- boundary conditions
- load
- model
- reference result
- units
- assumptions

## Current experiment

The current supported experiment is:

- Cantilever beam
- Point load at the free end
- Euler-Bernoulli analytical model

This protocol intentionally defines one concrete experiment before broader abstractions are introduced.
