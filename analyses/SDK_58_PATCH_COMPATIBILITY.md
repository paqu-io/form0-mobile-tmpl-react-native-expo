# SDK 58 patch compatibility and approved audit decision — 28 October 2026

PR #26 fails on both Node 22.23.4 and 24.22.1 at `expo install --check`, before
bundle export or security auditing. Expo's online compatibility metadata now
requires these patches within the existing SDK:

| Package     | Previous | Selected |
| ----------- | -------- | -------- |
| expo        | 58.0.17  | 58.0.20  |
| expo-font   | 58.0.9   | 58.0.10  |
| expo-sqlite | 58.0.13  | 58.0.14  |

The declared ranges advance to the corresponding `~` versions. React Native
0.88.0, React 19.3.0 and the released form0 dependencies remain unchanged. The
lockfile includes the compatible Expo dependency updates, including CLI 58.1.16
and node-forge 1.4.2. No dependency overrides or SDK-major migration are involved.

## Audit decision: approved on 28 October 2026

A fresh production audit of this candidate reports three high entries for one
advisory, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5):

| Package   | Exact installed path                     | Version | Affected high dependency |
| --------- | ---------------------------------------- | ------- | ------------------------ |
| expo      | node_modules/expo                        | 58.0.20 | @expo/cli                |
| @expo/cli | node_modules/expo/node_modules/@expo/cli | 58.1.16 | zod                      |
| zod       | node_modules/zod                         | 3.25.76 | Advisory itself          |

The advisory describes excessive memory allocation while validating oversized
collections, potentially terminating a Node process. The published fixed range
starts at Zod 4.6.6. At review time, even the latest published Expo CLI 58.1.16
requires `zod: ^3.25.76`; a compatible Zod 3 patch is unavailable.

The inspected Expo CLI imports are its development-tools plugin metadata/output
schemas and MCP extension schema construction. Several plugin schemas contain
arrays without upper bounds. This identifies actual tooling use; it is not an
exploit reproduction or a claim that arbitrary remote input reaches these parsers.
App records and core form validation do not use these Expo CLI schemas.

The maintainer explicitly approved this template's narrow Zod exception on
28 October, retaining the **7 November 2026, 00:00 UTC** deadline. The separate
CLI approval was not treated as authorization for this repository. The earlier
braces/node-forge allowances are retired because this updated report no longer
needs them. Their high/critical recurrence now blocks again.

The approved and implemented boundary is:

- Add only GHSA-mrhx-c7xc-m3w5 with its exact reported `<4.6.6` range.
- Review and pin the three installed package versions/paths above and their
  relevant dependency edges, including the authored root `expo: ~58.0.20` range.
- Keep the existing **7 November** deadline and high/critical gate unchanged.
- Reject other advisories, extra installation paths, new direct Zod use, changed
  versions/edges and critical escalation; retain fail-closed report validation.
- Keep actual accepted-risk messages distinct from a clean audit or a fixed
  vulnerability. Reassess upstream Expo support before the deadline.

The policy verifies the entire installed Expo/CLI/Zod parent context even for a
leaf-only audit, including the two parent dependency ranges. No app-level direct
Zod use is excepted. An incompatible Zod major override or Expo downgrade remains
outside this patch.

## Verification provenance

The failing compatibility check was reproduced against the existing independent
SDK 58 starter harness. Candidate dependencies are installed in that same isolated
tree, using actual registry core 0.8.1 and Native 0.6.0. The device acceptance tree
and maintained dependency trees were untouched. The earlier harness's stale npm
hidden lock was preserved before reconciling actual installed versions; installed
package manifests, rather than `npm ls` alone, confirm the final versions.

The following checks pass on **both Node 22.23.4 and Node 24.22.1**:

- Generated supporting-image registry verification.
- Online `expo install --check` with Expo's current compatibility metadata.
- Android and iOS Hermes exports (`expo export --platform all --max-workers 2`).
- All 22 updated temporary-audit-policy safeguard tests.
- The live production policy audit, reporting the three accepted Zod-chain
  entries explicitly as temporary risk, **NOT patched**, with the unchanged
  7 November expiry.

Before approval, the unchanged policy correctly **failed** for the three high
Zod-chain entries; that evidence and the initial 19-test results are retained.
There are also five low entries below the existing high threshold. Approval does
not make this a clean audit. The expanded guards cover the complete parent
context, retired waivers, new paths/versions/edges/direct uses, severity
escalation, malformed reports and the exact expiry boundary.

Command logs and audit JSON are retained under
`.local-test-harnesses/form0-plan3-20261022/logs/mobile-pr26-*`, including the
`mobile-pr26-checks.json` and `mobile-pr26-approved-checks.json` receipts. Existing
SDK 58 evidence was preserved and the checks ran sequentially. No secret files, native device acceptance, merge,
publication or alert dismissal are part of this patch review.

## 30 October 2026: PR #27 compatibility patch follow-up

Both quality jobs for PR #27 again failed at `expo install --check`: Expo's online
SDK 58 metadata now requires the following compatible patches. The same failure
was reproduced locally before changing dependencies.

| Package                         | Previous | Selected |
| ------------------------------- | -------- | -------- |
| expo                            | 58.0.20  | 58.0.21  |
| expo-asset                      | 58.0.18  | 58.0.19  |
| expo-font                       | 58.0.10  | 58.0.11  |
| expo-splash-screen              | 58.0.11  | 58.0.12  |
| expo-system-ui                  | 58.0.6   | 58.0.7   |
| react-native                    | 0.88.0   | 0.88.1   |
| @react-native/virtualized-lists | 0.88.0   | 0.88.1   |

Expo packages retain corresponding tilde ranges; React Native and the explicitly
pinned virtualized-lists peer move together. This stays on SDK 58 and React 19.3.0.
PR #27's registry core 0.9.0 and Native binding 0.7.0 remain unchanged. No overrides,
compatibility-check exclusions or force downgrade were introduced.

The updated graph installs Expo CLI 58.1.17, which still requires Zod ^3.25.76.
The fresh production report remains **3 high / 5 low / 0 critical**. The three high
entries still propagate only GHSA-mrhx-c7xc-m3w5 through Expo, its nested CLI and
Zod 3.25.76. The existing exact-version policy correctly blocked the new Expo/CLI
versions before approval.

The maintainer explicitly approved this template's exact patch carry-forward on
30 October: Expo **58.0.21**, nested CLI **58.1.17**, root `expo: ~58.0.21` and
Expo's `@expo/cli: ^58.1.17` edge. Zod version/range, advisory identity, installed
paths, accepted severity and **7 November 00:00 UTC** deadline remain unchanged.
Generic fail-closed logic is unchanged. Other versions/paths, app-level Zod use,
new advisories, retired waivers and critical escalation still block. This approval
is separate from the CLI package's exception.

Compatibility checks, generated registry checks and Android/iOS Hermes exports
pass on Node 22.23.4 and 24.22.1. Exports use the normal all-platform command with
an isolated output directory and two workers; existing dist/device evidence is
not overwritten. Updated safeguard tests also reject the superseded Expo/CLI
versions, in addition to future drift and all previous boundary checks.

Exact command results, live audit, proposal-before-approval evidence, source and
bundle hashes, and storage inventory are retained under
`.local-test-harnesses/form0-issue101-20261028/mobile-template-pr27-20261030/`.
No application form logic, schema/record format, workflow check name, native
project, device acceptance, publication or alert state is changed by this patch.
