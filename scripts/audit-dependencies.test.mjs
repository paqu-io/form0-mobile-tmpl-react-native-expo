import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { evaluateAudit, EXCEPTION_EXPIRES } from "./audit-dependencies.mjs";

const now = Date.parse("2026-10-30T12:00:00Z");
const expiry = Date.parse("2026-11-07T00:00:00Z");
const zodUrl = "https://github.com/advisories/GHSA-mrhx-c7xc-m3w5";
const cliPath = "node_modules/expo/node_modules/@expo/cli";
const levels = ["info", "low", "moderate", "high", "critical"];
const advisory = (name, url, severity = "high", range = "<4.6.6") => ({
  name,
  dependency: name,
  url,
  severity,
  range,
});

function recount(report) {
  const counts = Object.fromEntries(levels.map((level) => [level, 0]));
  for (const entry of Object.values(report.vulnerabilities))
    counts[entry.severity]++;
  report.metadata.vulnerabilities = {
    ...counts,
    total: Object.keys(report.vulnerabilities).length,
  };
}

// Independently characterized from the 30 October installed SDK 58 report, not policy constants.
function fixture() {
  const definitions = [
    [
      "@expo/cli",
      "58.1.17",
      ["@expo/config", "@expo/metro-config", "@expo/prebuild-config", "zod"],
      "high",
      cliPath,
    ],
    ["@expo/config", "58.0.9", ["deepmerge"], "low"],
    ["@expo/local-build-cache-provider", "58.0.9", ["@expo/config"], "low"],
    [
      "@expo/metro-config",
      "58.0.19",
      ["@expo/config"],
      "low",
      "node_modules/expo/node_modules/@expo/metro-config",
    ],
    ["@expo/prebuild-config", "58.0.17", ["@expo/config"], "low"],
    [
      "deepmerge",
      "4.3.1",
      [
        advisory(
          "deepmerge",
          "https://github.com/advisories/GHSA-gcqx-w48m-w2h4",
          "low",
          "<=4.3.1",
        ),
      ],
      "low",
    ],
    [
      "expo",
      "58.0.21",
      [
        "@expo/cli",
        "@expo/config",
        "@expo/local-build-cache-provider",
        "@expo/metro-config",
      ],
      "high",
    ],
    ["zod", "3.25.76", [advisory("zod", zodUrl)], "high"],
  ];
  const report = { auditReportVersion: 2, vulnerabilities: {}, metadata: {} };
  const lock = {
    lockfileVersion: 3,
    packages: {
      "": {
        dependencies: {
          expo: "~58.0.21",
          "react-native": "0.88.1",
          "@react-native/virtualized-lists": "0.88.1",
        },
      },
    },
  };
  for (const [
    name,
    version,
    via,
    severity,
    path = `node_modules/${name}`,
  ] of definitions) {
    lock.packages[path] = { version };
    report.vulnerabilities[name] = { name, severity, via, nodes: [path] };
  }
  lock.packages["node_modules/expo"].dependencies = { "@expo/cli": "^58.1.17" };
  lock.packages[cliPath].dependencies = { zod: "^3.25.76" };
  recount(report);
  return { report, lock };
}

function withModerateFinding(input) {
  const name = "unreviewed-moderate";
  input.lock.packages[`node_modules/${name}`] = { version: "1.0.0" };
  input.report.vulnerabilities[name] = {
    name,
    severity: "moderate",
    nodes: [`node_modules/${name}`],
    via: [
      advisory(name, "https://example.test/advisory", "moderate", "<=1.0.0"),
    ],
  };
  recount(input.report);
  return input;
}
const evaluate = ({ report, lock }, options = {}) =>
  evaluateAudit(report, lock, { now, npmStatus: 1, ...options });

const accepted = ["@expo/cli", "expo", "zod"];
test("accepts only the reviewed Expo CLI Zod chain and keeps the fixed deadline", () => {
  assert.equal(EXCEPTION_EXPIRES, "2026-11-07T00:00:00Z");
  assert.deepEqual(evaluate(fixture()), {
    accepted,
    blocked: [],
    expired: false,
  });
});

test("SDK 57 and superseded SDK 58 versions reject every exception entry", () => {
  for (const [expo, cli] of [
    ["57.0.27", "57.0.28"],
    ["58.0.17", "58.1.14"],
    ["58.0.19", "58.1.15"],
  ]) {
    const input = fixture();
    input.lock.packages[""].dependencies.expo = `~${expo}`;
    input.lock.packages["node_modules/expo"].version = expo;
    input.lock.packages[cliPath].version = cli;
    assert.deepEqual(evaluate(input).blocked, accepted);
  }
});

test("a nested Zod copy is outside the reviewed topology", () => {
  const input = fixture();
  const nested = "node_modules/other/node_modules/zod";
  input.lock.packages[nested] = { version: "3.25.76" };
  input.report.vulnerabilities.zod.nodes.push(nested);
  assert.deepEqual(evaluate(input).blocked, accepted);
});

test("expiry is exclusive and blocks unresolved findings", () => {
  assert.deepEqual(evaluate(fixture(), { now: expiry - 1 }).blocked, []);
  for (const time of [expiry, expiry + 1])
    assert.deepEqual(evaluate(fixture(), { now: time }), {
      accepted: [],
      blocked: accepted,
      expired: true,
    });
});

test("a clean report passes even after expiry", () => {
  const input = fixture();
  input.report.vulnerabilities = {};
  recount(input.report);
  assert.deepEqual(evaluate(input, { npmStatus: 0, now: expiry }), {
    accepted: [],
    blocked: [],
    expired: true,
  });
});

test("unrelated high and critical findings stay blocking", () => {
  for (const severity of ["high", "critical"]) {
    const input = fixture();
    input.lock.packages["node_modules/unreviewed"] = { version: "1.0.0" };
    input.report.vulnerabilities.unreviewed = {
      name: "unreviewed",
      severity,
      nodes: ["node_modules/unreviewed"],
      via: [
        advisory(
          "unreviewed",
          "https://github.com/advisories/GHSA-unreviewed",
          severity,
        ),
      ],
    };
    recount(input.report);
    assert.deepEqual(evaluate(input).blocked, ["unreviewed"]);
  }
});

test("new advisories on Zod block every affected chain", () => {
  const input = fixture();
  input.report.vulnerabilities.zod.via.push(
    advisory("zod", "https://github.com/advisories/GHSA-new"),
  );
  assert.deepEqual(evaluate(input).blocked, accepted);
});

test("advisory identity, range and severity cannot drift", () => {
  for (const field of ["name", "dependency", "url", "range", "severity"]) {
    const input = fixture();
    input.report.vulnerabilities.zod.via[0][field] =
      field === "severity" ? "critical" : "changed";
    if (["name", "dependency", "severity"].includes(field))
      assert.throws(() => evaluate(input));
    else assert.deepEqual(evaluate(input).blocked, accepted);
  }
});

test("a reviewed advisory escalated to critical is not waived", () => {
  const input = fixture();
  input.report.vulnerabilities.zod.via[0].severity = "critical";
  for (const entry of Object.values(input.report.vulnerabilities))
    if (entry.severity === "high") entry.severity = "critical";
  recount(input.report);
  assert.deepEqual(evaluate(input).blocked, accepted);
});

test("unexpected nodes and changed installed versions are not waived", () => {
  for (const [path, version] of [
    ["node_modules/zod", "3.25.77"],
    ["node_modules/expo", "58.0.22"],
    [cliPath, "58.1.18"],
  ]) {
    const input = fixture();
    input.lock.packages[path].version = version;
    assert.deepEqual(evaluate(input).blocked, accepted);
  }
});

test("dev, peer, optional and linked copies are outside the reviewed production scope", () => {
  for (const path of ["node_modules/expo", cliPath, "node_modules/zod"])
    for (const flag of ["dev", "peer", "optional", "devOptional", "link"]) {
      const input = fixture();
      input.lock.packages[path][flag] = true;
      assert.deepEqual(evaluate(input).blocked, accepted);
    }
});

test("adding reviewed transitive Zod directly to the app requires review", () => {
  for (const kind of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const input = fixture();
    input.lock.packages[""][kind] = {
      ...input.lock.packages[""][kind],
      zod: "^3.25.76",
    };
    assert.deepEqual(evaluate(input).blocked, accepted);
  }
});

test("changing the reviewed root package range requires review", () => {
  const input = fixture();
  input.lock.packages[""].dependencies.expo = "^58.0.21";
  assert.deepEqual(evaluate(input).blocked, accepted);
});

test("new dependency edges are rejected even when the new edge is moderate", () => {
  const input = withModerateFinding(fixture());
  input.report.vulnerabilities["@expo/cli"].via.push("unreviewed-moderate");
  assert.ok(evaluate(input).blocked.includes("@expo/cli"));
  assert.ok(evaluate(input).blocked.includes("expo"));
});

test("cycles alone cannot manufacture an accepted advisory", () => {
  const input = fixture();
  input.report.vulnerabilities["@expo/cli"].via = ["expo"];
  input.report.vulnerabilities.expo.via = ["@expo/cli"];
  delete input.report.vulnerabilities.zod;
  recount(input.report);
  const result = evaluate(input);
  assert.deepEqual(result.accepted, []);
  assert.deepEqual(result.blocked, ["@expo/cli", "expo"]);
});

test("below-threshold findings are disclosed without an exception", () => {
  const input = withModerateFinding(fixture());
  input.report.vulnerabilities = Object.fromEntries(
    Object.entries(input.report.vulnerabilities).filter(
      ([, entry]) => !["high", "critical"].includes(entry.severity),
    ),
  );
  recount(input.report);
  assert.deepEqual(evaluate(input, { npmStatus: 0 }), {
    accepted: [],
    blocked: [],
    expired: false,
  });
});

test("malformed reports, errors, missing lock entries and totals fail closed", () => {
  const mutations = [
    (input) => {
      input.report.error = { message: "registry failure" };
    },
    (input) => {
      input.report.auditReportVersion = 1;
    },
    (input) => {
      input.report.metadata.vulnerabilities.high = 0;
    },
    (input) => {
      input.report.metadata.vulnerabilities.total++;
    },
    (input) => {
      input.report.vulnerabilities.zod.nodes = [];
    },
    (input) => {
      input.report.vulnerabilities.zod.nodes.push(
        input.report.vulnerabilities.zod.nodes[0],
      );
    },
    (input) => {
      input.report.vulnerabilities.zod.via = ["missing"];
    },
    (input) => {
      delete input.lock.packages["node_modules/zod"];
    },
    (input) => {
      input.lock.lockfileVersion = 2;
    },
  ];
  for (const mutate of mutations) {
    const input = fixture();
    mutate(input);
    assert.throws(() => evaluate(input));
  }
  for (const value of [null, [], {}, "invalid"])
    assert.throws(() => evaluateAudit(value, fixture().lock, { now }));
});

test("unsupported npm statuses and invalid clocks fail closed", () => {
  for (const npmStatus of [null, 0, 2, 127])
    assert.throws(() => evaluate(fixture(), { npmStatus }));
  for (const time of [NaN, Infinity, "2026-10-28"])
    assert.throws(() => evaluate(fixture(), { now: time }));
  const input = fixture();
  input.report.vulnerabilities = {};
  recount(input.report);
  assert.throws(() => evaluate(input, { npmStatus: 1 }));
});

test("the CLI offers no expiry or report override and does not leak supplied values", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("./audit-dependencies.mjs", import.meta.url)),
      "--expires",
      "PRIVATE_SENTINEL",
    ],
    { encoding: "utf8", timeout: 5000 },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /failed closed/);
  assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE_SENTINEL/);
});

test("retired braces and node-forge waivers cannot be reused", () => {
  for (const [name, version, url, range] of [
    [
      "braces",
      "3.0.3",
      "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
      "<=3.0.3",
    ],
    [
      "node-forge",
      "1.4.0",
      "https://github.com/advisories/GHSA-86w9-cpqp-85rv",
      "<=1.4.0",
    ],
  ]) {
    const input = fixture();
    input.lock.packages[`node_modules/${name}`] = { version };
    input.report.vulnerabilities[name] = {
      name,
      severity: "high",
      nodes: [`node_modules/${name}`],
      via: [advisory(name, url, "high", range)],
    };
    recount(input.report);
    assert.deepEqual(evaluate(input).blocked, [name]);
  }
});

test("even a leaf-only audit needs the complete reviewed Expo parent context", () => {
  for (const mutate of [
    (input) => {
      delete input.lock.packages["node_modules/expo"];
    },
    (input) => {
      delete input.lock.packages[cliPath];
    },
    (input) => {
      input.lock.packages[cliPath].version = "58.1.14";
    },
    (input) => {
      input.lock.packages[""].dependencies.expo = "~58.0.17";
    },
    (input) => {
      input.lock.packages["node_modules/expo"].dependencies["@expo/cli"] =
        "^58.1.14";
    },
    (input) => {
      input.lock.packages[cliPath].dependencies.zod = "^4.6.6";
    },
  ]) {
    const input = fixture();
    input.report.vulnerabilities = { zod: input.report.vulnerabilities.zod };
    recount(input.report);
    mutate(input);
    assert.deepEqual(evaluate(input).blocked, ["zod"]);
  }
});

test("escalating a below-threshold branch does not extend the exception", () => {
  for (const severity of ["high", "critical"]) {
    const input = fixture();
    input.report.vulnerabilities["@expo/config"].severity = severity;
    for (const name of [
      "@expo/cli",
      "@expo/local-build-cache-provider",
      "@expo/metro-config",
      "@expo/prebuild-config",
      "expo",
    ])
      input.report.vulnerabilities[name].severity = severity;
    recount(input.report);
    const result = evaluate(input);
    assert.ok(result.blocked.includes("@expo/config"));
    assert.ok(result.blocked.includes("@expo/cli"));
    assert.ok(result.blocked.includes("expo"));
  }
});

test("superseded Expo versions do not reuse the new exact patch allowance", () => {
  for (const [path, version] of [
    ["node_modules/expo", "58.0.20"],
    [cliPath, "58.1.16"],
  ]) {
    const input = fixture();
    input.lock.packages[path].version = version;
    assert.deepEqual(evaluate(input).blocked, accepted);
  }
});
