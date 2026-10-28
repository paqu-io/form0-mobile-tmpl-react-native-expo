# SDK 58 patch compatibility and pending audit decision — 28 October 2026

PR #26 fails on both Node 22.23.4 and 24.22.1 at `expo install --check`, before
bundle export or security auditing. Expo's online compatibility metadata now
requires these patches within the existing SDK:

| Package | Previous | Selected |
| --- | --- | --- |
| expo | 58.0.17 | 58.0.20 |
| expo-font | 58.0.9 | 58.0.10 |
| expo-sqlite | 58.0.13 | 58.0.14 |

The declared ranges advance to the corresponding `~` versions. React Native
0.88.0, React 19.3.0 and the released form0 dependencies remain unchanged. The
lockfile includes the compatible Expo dependency updates, including CLI 58.1.16
and node-forge 1.4.2. No dependency overrides or SDK-major migration are involved.

## Audit decision: not approved or implemented

A fresh production audit of this candidate reports three high entries for one
advisory, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5):

| Package | Exact installed path | Version | Affected high dependency |
| --- | --- | --- | --- |
| expo | node_modules/expo | 58.0.20 | @expo/cli |
| @expo/cli | node_modules/expo/node_modules/@expo/cli | 58.1.16 | zod |
| zod | node_modules/zod | 3.25.76 | Advisory itself |

The advisory describes excessive memory allocation while validating oversized
collections, potentially terminating a Node process. The published fixed range
starts at Zod 4.6.6. At review time, even the latest published Expo CLI 58.1.16
requires `zod: ^3.25.76`; a compatible Zod 3 patch is unavailable.

The inspected Expo CLI imports are its development-tools plugin metadata/output
schemas and MCP extension schema construction. Several plugin schemas contain
arrays without upper bounds. This identifies actual tooling use; it is not an
exploit reproduction or a claim that arbitrary remote input reaches these parsers.
App records and core form validation do not use these Expo CLI schemas.

The existing template security exception covers braces and node-forge only and
expires on **7 November 2026, 00:00 UTC**. The CLI repository's separately approved
exception does not authorize an additional advisory in this template. The current
template policy correctly rejects the new Zod finding. It has not been widened,
and delivery must remain blocked until the finding is fixed or explicitly accepted.

If the maintainer approves a temporary exception, the proposed boundary is:

- Add only GHSA-mrhx-c7xc-m3w5 with its exact reported `<4.6.6` range.
- Review and pin the three installed package versions/paths above and their
  relevant dependency edges, including the authored root `expo: ~58.0.20` range.
- Keep the existing **7 November** deadline and high/critical gate unchanged.
- Reject other advisories, extra installation paths, new direct Zod use, changed
  versions/edges and critical escalation; retain fail-closed report validation.
- Keep actual accepted-risk messages distinct from a clean audit or a fixed
  vulnerability. Reassess upstream Expo support before the deadline.

This document is a review proposal, not approval or an active audit-policy change.
An incompatible Zod major override or Expo downgrade is outside this patch.

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
- All 19 existing temporary-audit-policy safeguard tests.

The unchanged live production audit policy correctly **fails** for the three high
Zod-chain entries described above. There are also five low entries below the
existing high threshold. This is not an all-green CI or clean-audit claim.

Command logs and audit JSON are retained under
`.local-test-harnesses/form0-plan3-20261022/logs/mobile-pr26-*`, including the
`mobile-pr26-checks.json` receipt. Existing SDK 58 evidence was preserved and the
checks ran sequentially. No secret files, native device acceptance, merge,
publication or alert dismissal are part of this patch review.
