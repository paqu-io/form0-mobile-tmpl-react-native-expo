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

## Temporary starter tooling exception

Originally approved on **28 October 2026**, with the exact Expo patch context below
explicitly carried forward on **30 October 2026**. The expiry remains
**2026-11-07T00:00:00Z**. This is accepted temporary risk, not a patched dependency,
clean audit or non-exploitability claim.
It is separate from the form0 CLI and Native binding exceptions. The former
braces/node-forge allowances are retired; this policy now permits only the Zod
advisory below in the exact reviewed Expo tooling context.

`npm run security:audit:prod` keeps `--omit=dev --omit=peer` and the high threshold,
then applies the fail-closed policy in `scripts/audit-dependencies.mjs`.
[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) concerns
memory exhaustion while validating oversized collections. The installed Zod
3.25.76 is within the advisory's `<4.6.6` affected range. At review time the latest
Expo CLI 58.1.17 still requires `zod: ^3.25.76`; the published fixed range starts
at Zod 4.6.6, outside that supported dependency range.

Only these installed packages and their reviewed audit edges are accepted:

| Package   | Version | Installed path                           |
| --------- | ------- | ---------------------------------------- |
| expo      | 58.0.21 | node_modules/expo                        |
| @expo/cli | 58.1.17 | node_modules/expo/node_modules/@expo/cli |
| zod       | 3.25.76 | node_modules/zod                         |

The root must declare `expo: ~58.0.21`, Expo must require CLI `^58.1.17`, and that
CLI must require Zod `^3.25.76`. Even an audit reporting only the Zod leaf requires
this complete installed parent context. Direct application Zod/CLI declarations,
extra affected paths, changed versions/dependency edges and non-production copies
are outside the exception. A high/critical escalation on a lower-severity branch
must pass the same checks; those additional packages are not waived.

The inspected imports are Expo's development-tools plugin metadata/output
validation and MCP extension schema construction. These are Node tooling paths,
not core form validation or saved-record transformation. This is not an exploit
reproduction or a proof that untrusted inputs cannot reach those parsers. Treat
untrusted plugins, plugin output and exposed development services as inputs that
can require reassessment. See the [detailed review](./analyses/SDK_58_PATCH_COMPATIBILITY.md).

The current raw production audit reports **3 high / 5 low / 0 critical** entries.
The three high entries propagate the single approved Zod advisory; lower-severity
findings remain visible and below the unchanged high threshold. Node-forge is now
1.4.2 and needs no former advisory waiver; braces has no high finding in this report.
If either retired advisory reappears as high/critical, it blocks again.

All other high/critical findings, new advisory identities and critical escalation
remain blocking. Unsupported reports/statuses, audit failures and invalid
lockfiles fail closed. There is no expiry/report override. After the deadline,
unresolved findings block; clean reports can still pass. CI runs the safeguard
tests on Node 22 and 24 before auditing. Accepted results explicitly say **NOT
patched** and print the deadline; they do not hide the raw findings.

`npm run security:audit:prod:raw` retains the unwaived report and currently exits
nonzero. Review upstream support before **7 November** and remove the exception
when compatible fixes are available. Do not force an SDK downgrade, a Zod major
override or a further policy expansion to make CI pass. An unresolved finding at
expiry requires another explicit maintainer decision.
