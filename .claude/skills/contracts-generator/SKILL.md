---
name: contracts-generator
description: "Create or amend the machine-readable contract package. In v8, generate only the contracts that downstream code/tests/hooks/reviews consume; full package generation is reserved for standard/full paths."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Contracts Generator

Contracts are the hard center of the pipeline. They prevent parallel agents from inventing incompatible APIs, auth checks, states, errors, dependencies, or NFR assumptions.

v8 rule:

```text
Generate or amend only contracts that matter for this path.
```

## Modes

| Mode | Use when | Output |
|---|---|---|
| `amend` | Light/standard path touching existing contracts | Only changed contract entries |
| `slice` | Standard path with several FRs | Contracts needed for touched FRs |
| `full` | Full path / greenfield / major module | Full contract package |

## Contract files

Under `docs/spec/` or the project's configured contract directory:

- `api.openapi.yaml`
- `auth-matrix.yaml`
- `state-machines.yaml`
- `integration-map.yaml`
- `error-taxonomy.yaml`
- `testing-contract.yaml`
- `env-contract.yaml`
- `shared-utilities.yaml`
- `dependency-register.yaml`
- `nfr-thresholds.yaml`

## Validation

Validate what applies (the pipeline CLI and test generators are not part of this distribution):

- Parse every generated contract file (`python3 -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" <file>`) and confirm the required per-entry fields below are present.
- Derive auth-matrix and state-machine test cases manually from `auth-matrix.yaml` and `state-machines.yaml` (one case per role×endpoint cell and per allowed/forbidden transition), or via the `acceptance-test-generator` skill.

Every contract entry must carry:

```yaml
id: <stable id>
version: <n>
source_requirement: []
depends_on: []
status: active | deprecated | proposed
```

## Closure rules

- Every API endpoint must have auth/public status.
- Every protected operation must map to an auth-matrix row.
- Every state transition used by an LLD must exist in `state-machines.yaml`.
- Every error code used by LLD/code/tests must exist in `error-taxonomy.yaml`.
- Every dependency used by code must exist in `dependency-register.yaml`.
- Every env var used by code/deploy/test must exist in `env-contract.yaml`.

## Error-code closure

After LLD/code generation, grep failure handling and implementation for error-code-like tokens. Each token must appear in the taxonomy or the run must stop for amendment.

Missing code = contract defect, not an implementation detail.

## State-machine closure

Every state transition that any LLD or implementation prescribes must already be listed for the named entity. If implementation reveals a missing transition, amend the contract and re-run Gate C.

## Do not over-generate

For a light path, do not create a full ten-file contract package if only one auth row or one error code is needed. Amend the minimum contract entry and record the reason in `docs/spec/process-classification.md`.
