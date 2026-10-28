# Expo SDK 58 migration — 23 October 2026

28 October checkpoint: [SDK 58 patch compatibility](./SDK_58_PATCH_COMPATIBILITY.md)
records the subsequent compatible patch updates and the separate pending Zod audit
decision. The migration evidence below remains the historical 23 October snapshot.

The form0 mobile starter and independent Plan 3 Android acceptance harness now target Expo SDK
58.0.17, React Native 0.88.0 and React 19.3.0. Dependency versions come from that Expo package's
`bundledNativeModules.json`; `@react-native/virtualized-lists` matches React Native exactly. The Node
engine range follows Expo's supported release lines. No dependency overrides were introduced.

The acceptance harness remains at
`.local-test-harnesses/form0-plan3-20261022/device`. It retains the exact previously recorded core
and Native candidate tarballs. Those files deliberately retain published version labels; their
unpublished Plan 3 contents are identified by SHA-256 in core's verification report. Updating this
host app's SDK does not introduce a new Expo requirement into the form0 libraries.

The starter still uses its existing published form0 dependency ranges. Updating those to the
coordinated Plan 3 releases, fixing its save-wrapper acknowledgement/ID behavior and enabling
freshness companion persistence remain separate adoption tasks. Production Reform was not changed.

## Automated evidence

All checks ran sequentially with Node 24.22.1 and independent installed dependency trees. Maintained
`node_modules` directories were not replaced. The SDK 58 fixtures, command driver, manifests and logs
are under `.local-test-harnesses/form0-plan3-20261022/sdk58/`. SDK 57 evidence was retained.
`checks.json` retains the initial results; `followup-checks.json` and `final-checks.json` record the
config/audit-policy corrections and final Android export. Node 22.23.4 also passes the 19 policy
tests and the lockfile CI dry-run.

| Check                                                                                 | Result                                               |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Expo dependency compatibility, starter and device harness                             | Up to date                                           |
| Expo Doctor, starter and device harness                                               | 20/20 each                                           |
| Generated supporting-image registry                                                   | Pass                                                 |
| Starter Android and iOS Hermes bundle exports                                         | Pass                                                 |
| Plan 3 Android Hermes bundle export                                                   | Pass; 4.6 MB bundle                                  |
| Disposable native generation, Android and iOS, no native install                      | Pass                                                 |
| Native public declaration consumption                                                 | Pass                                                 |
| Native Node tests                                                                     | 54/54                                                |
| Starter temporary audit policy tests                                                  | 19/19                                                |
| Starter production audit policy                                                       | Pass with existing temporary risk, not a clean audit |
| Local Metro Android manifest                                                          | HTTP 200; SDK 58.0.0, runtime exposdk:58.0.0         |
| EN/ES/FR/IT docs source, formatting, localization, navigation, parity, tests and lint | Pass; 23 tests                                       |

The device config and generator no longer set `jsEngine`, which SDK 58's config schema rejects.
The runnable device harness remains JavaScript; declaration checks remain outside its project root.
The sandboxed Metro smoke used its fallback DevTools build when the global dotslash cache was not
writable; Metro and the Android manifest were available. This is not a phone or DevTools acceptance
claim. No local docs production build was run.

## Existing temporary dependency risk

The new installed graph still reports 15 high entries for the same two advisories: braces
GHSA-vfj7-8cjw-p6xm and node-forge GHSA-86w9-cpqp-85rv. Both upstream advisories report no patched
release at inspection time. The actual Metro watcher-glob and Expo certificate/signing callers were
re-inspected. See [the security policy](../SECURITY.md) for exposure and the exact acceptance boundary.

The guard now pins SDK 58's exact versions and paths. SDK 57 versions and the previous nested Metro
copies are rejected. Advisory identities, critical-severity rejection, other high/critical blocking,
fail-closed behavior and the **7 November 2026** deadline are unchanged. This does not remediate or
extend the exception; targeted remediation remains separate.

## Remaining acceptance

Run the three walkthroughs in
`form0-react-native/analyses/PLAN_3_ANDROID_ACCEPTANCE.md` using Android Expo Go for SDK 58. Record the
actual model, Android/Expo/RN versions, Hermes flag and measured large-form behavior. iOS device
acceptance remains deferred; an iOS export does not substitute for it.

The default SDK 58 tunnel requires local Expo login. Existing ngrok users can use
`npm start -- --tunnel ngrok --max-workers 2`. Credentials stay local; tunnel connectivity and actual
phone acceptance are not established by the local manifest check.

Before installing, Linux had 197 GiB available and the Windows WSL backing drive D: had 4.56 GiB.
The isolated starter, device update and npm cache added about 0.77 GiB of logical files. Keep the
active SDK 58 trees until acceptance; further cleanup is a separate, explicit action.

References: [SDK 58 release notes](https://expo.dev/changelog/sdk-58),
[upgrade guidance](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/),
[Expo Go](https://expo.dev/go).
