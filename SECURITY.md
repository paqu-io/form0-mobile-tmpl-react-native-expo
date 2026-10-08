# Security Policy

Security reports are taken seriously. Please report vulnerabilities privately so they can be
investigated and fixed before public disclosure.

## Reporting a vulnerability

Use the
[form0-mobile-tmpl-react-native-expo private vulnerability report](https://github.com/paqu-io/form0-mobile-tmpl-react-native-expo/security/advisories/new).
Do not open a public issue for a suspected vulnerability.

Include:

- the affected version and runtime;
- a minimal reproduction or proof of concept;
- the impact you believe is possible;
- any mitigations you have already identified; and
- whether the issue has been disclosed anywhere else.

Reports affecting any version are welcome. When possible, reproduce the issue with the latest
release, or the latest default branch for repositories that are not published as packages.
Security fixes are normally released for the latest version; older versions are assessed case by
case.

Maintainers will review the report, may ask for more information, and will coordinate disclosure
after a fix or mitigation is available. Please keep the report private during that process.

For ordinary usage questions, see [SUPPORT.md](./SUPPORT.md).

## Temporary starter dependency exceptions

Approved on 8 October 2026; expires **2026-11-07T00:00:00Z**. This is accepted
temporary risk, not a patched dependency, clean audit, or non-exploitability claim.
It is separate from the form0-react-native library's narrower peer-only exception.

`npm run security:audit:prod` audits with the existing `--omit=dev --omit=peer`
and high threshold, then applies the fail-closed policy in
`scripts/audit-dependencies.mjs`. Only these reviewed high advisories and their
exact versioned production dependency chains may pass before the deadline:

- [braces 3.0.3: GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
  through micromatch 4.0.8, React Native 0.86.3's Metro 0.84.6 graph and
  @expo/metro 56.0.2's nested Metro 0.84.5 graph. Deeply nested patterns can exhaust
  the Node stack. Default watcher globs are generated from fixed patterns and
  developer configuration, but customized inputs remain a risk.
- [node-forge 1.4.0: GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
  through @expo/code-signing-certificates 0.0.6 and Expo 57.0.27's nested CLI
  57.0.28. Malformed RSA signatures may be accepted with low-exponent keys.
  These inspected callers are Node development/signing tools. The default app
  has no EAS project ID or custom update-signing configuration; enabling these
  features or accepting certificate/key inputs requires reassessing exposure.
  No Expo Go binary, complete reachability proof or signature exploit was tested.

The 8 October raw production audit reports **15 high / 8 moderate / 0 critical**
dependency entries. The high entries propagate the two advisories above; the
moderate entries propagate uuid through xcode. Moderate findings are disclosed,
not excepted, and remain below the unchanged high threshold. Compatible leaf
repairs removed source-map-js, shell-quote and brace-expansion findings.

The policy pins the reviewed affected paths, versions and allowed audit edges;
additional copies, new direct uses of transitive packages, new advisories,
changed versions/paths/edges or escalated severities are not silently accepted.
All other high/critical findings block. Audit errors, malformed/inconsistent
reports or exit statuses and unsupported lock formats fail closed. There is no
command/environment expiry override. After expiry, unresolved exceptions block;
a clean report can still pass. CI runs the focused policy tests on both Node
versions before the policy audit.

`npm run security:audit:prod:raw` keeps the original unwaived audit available and
currently exits nonzero. The policy reports counts and explicitly labels any
accepted findings as **NOT patched**. Do not use forced framework downgrades,
remove affected paths from reports, or widen this policy to make CI green.
Review upstream fixes and remove/update the exceptions before 7 November; if
still unresolved, keep delivery blocked until maintainers make a new decision.
