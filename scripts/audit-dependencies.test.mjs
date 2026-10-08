import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluateAudit } from './audit-dependencies.mjs';

const now = Date.parse('2026-10-08T18:00:00Z');
const expiry = Date.parse('2026-11-07T00:00:00Z');
const bracesUrl = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const forgeUrl = 'https://github.com/advisories/GHSA-86w9-cpqp-85rv';
const levels = ['info', 'low', 'moderate', 'high', 'critical'];
const advisory = (name, url, severity = 'high') => ({
  name,
  dependency: name,
  url,
  severity,
  range: name === 'braces' ? '<=3.0.3' : '<=1.4.0',
});

function recount(report) {
  const counts = Object.fromEntries(levels.map((level) => [level, 0]));
  for (const entry of Object.values(report.vulnerabilities)) counts[entry.severity]++;
  report.metadata.vulnerabilities = {
    ...counts,
    total: Object.keys(report.vulnerabilities).length,
  };
}

// Independently characterized from the 8 October real production report, not policy constants.
function fixture() {
  const definitions = [
    [
      '@expo/cli',
      '57.0.28',
      [
        '@expo/code-signing-certificates',
        '@expo/config',
        '@expo/config-plugins',
        '@expo/inline-modules',
        '@expo/metro',
        '@expo/metro-config',
        '@expo/prebuild-config',
        'node-forge',
      ],
      ['node_modules/expo/node_modules/@expo/cli'],
    ],
    ['@expo/code-signing-certificates', '0.0.6', ['node-forge']],
    [
      '@expo/metro',
      '56.0.2',
      ['metro', 'metro-config', 'metro-file-map', 'metro-transform-worker'],
    ],
    [
      '@expo/metro-config',
      '57.0.13',
      ['@expo/config', '@expo/metro'],
      ['node_modules/expo/node_modules/@expo/metro-config'],
    ],
    ['@react-native/community-cli-plugin', '0.86.3', ['metro', 'metro-config']],
    ['@react-native/virtualized-lists', '0.86.3', ['react-native']],
    ['braces', '3.0.3', [advisory('braces', bracesUrl)]],
    [
      'expo',
      '57.0.27',
      [
        '@expo/cli',
        '@expo/config',
        '@expo/config-plugins',
        '@expo/local-build-cache-provider',
        '@expo/metro',
        '@expo/metro-config',
      ],
    ],
    ['metro', '0.84.6', ['metro-config', 'metro-file-map', 'metro-transform-worker']],
    ['metro-config', '0.84.6', ['metro']],
    ['metro-file-map', '0.84.6', ['micromatch']],
    ['metro-transform-worker', '0.84.6', ['metro']],
    ['micromatch', '4.0.8', ['braces']],
    ['node-forge', '1.4.0', [advisory('node-forge', forgeUrl)]],
    [
      'react-native',
      '0.86.3',
      ['@react-native/community-cli-plugin', '@react-native/virtualized-lists'],
    ],
    ['@expo/config', '57.0.10', ['@expo/config-plugins'], undefined, 'moderate'],
    ['@expo/config-plugins', '57.0.10', ['xcode'], undefined, 'moderate'],
    ['@expo/inline-modules', '0.1.7', ['@expo/config-plugins'], undefined, 'moderate'],
    ['@expo/local-build-cache-provider', '57.0.8', ['@expo/config'], undefined, 'moderate'],
    [
      '@expo/prebuild-config',
      '57.0.17',
      ['@expo/config', '@expo/config-plugins'],
      undefined,
      'moderate',
    ],
    ['expo-splash-screen', '57.0.9', ['@expo/config-plugins'], undefined, 'moderate'],
    [
      'uuid',
      '7.0.3',
      [advisory('uuid', 'https://github.com/advisories/GHSA-w5hq-g745-h8pq', 'moderate')],
      undefined,
      'moderate',
    ],
    ['xcode', '3.0.1', ['uuid'], undefined, 'moderate'],
  ];
  const report = { auditReportVersion: 2, vulnerabilities: {}, metadata: {} };
  const lock = {
    lockfileVersion: 3,
    packages: {
      '': {
        dependencies: {
          expo: '~57.0.27',
          'react-native': '0.86.3',
          '@react-native/virtualized-lists': '0.86.3',
        },
      },
    },
  };
  for (const [name, version, via, locations, severity = 'high'] of definitions) {
    const nodes = locations ?? [`node_modules/${name}`];
    if (['metro', 'metro-config', 'metro-file-map', 'metro-transform-worker'].includes(name)) {
      nodes.push(`node_modules/@expo/metro/node_modules/${name}`);
    }
    for (const path of nodes)
      lock.packages[path] = {
        version: path.startsWith('node_modules/@expo/metro/node_modules/') ? '0.84.5' : version,
      };
    report.vulnerabilities[name] = { name, severity, via, nodes };
  }
  recount(report);
  return { report, lock };
}

const evaluate = ({ report, lock }, options = {}) =>
  evaluateAudit(report, lock, {
    now,
    npmStatus: 1,
    ...options,
  });

test('accepts the reviewed production graph, including both Metro paths and cycles', () => {
  const result = evaluate(fixture());
  assert.equal(result.accepted.length, 15);
  assert.deepEqual(result.blocked, []);
  assert.equal(result.expired, false);
});

test('expiry is exclusive, cannot be extended, and blocks unresolved findings', () => {
  assert.equal(evaluate(fixture(), { now: expiry - 1 }).blocked.length, 0);
  for (const time of [expiry, expiry + 1]) {
    const result = evaluate(fixture(), { now: time });
    assert.equal(result.expired, true);
    assert.equal(result.accepted.length, 0);
    assert.equal(result.blocked.length, 15);
  }
});

test('a clean report passes even after expiry; exceptions are not required findings', () => {
  const input = fixture();
  input.report.vulnerabilities = {};
  recount(input.report);
  assert.deepEqual(evaluate(input, { npmStatus: 0, now: expiry }), {
    accepted: [],
    blocked: [],
    expired: true,
  });
});

test('unrelated high and critical findings stay blocking', () => {
  for (const severity of ['high', 'critical']) {
    const input = fixture();
    input.lock.packages['node_modules/unreviewed'] = { version: '1.0.0' };
    input.report.vulnerabilities.unreviewed = {
      name: 'unreviewed',
      severity,
      nodes: ['node_modules/unreviewed'],
      via: [advisory('unreviewed', 'https://github.com/advisories/GHSA-unreviewed', severity)],
    };
    recount(input.report);
    assert.deepEqual(evaluate(input).blocked, ['unreviewed']);
  }
});

test('new advisories on either accepted leaf block every affected chain', () => {
  for (const leaf of ['braces', 'node-forge']) {
    const input = fixture();
    input.report.vulnerabilities[leaf].via.push(
      advisory(leaf, 'https://github.com/advisories/GHSA-new')
    );
    const result = evaluate(input);
    assert.ok(result.blocked.includes(leaf));
    assert.ok(result.blocked.includes('expo'));
  }
});

test('advisory identity, range and severity cannot drift', () => {
  for (const field of ['name', 'dependency', 'url', 'range', 'severity']) {
    const input = fixture();
    input.report.vulnerabilities.braces.via[0][field] =
      field === 'severity' ? 'critical' : 'changed';
    if (['name', 'dependency', 'severity'].includes(field)) assert.throws(() => evaluate(input));
    else assert.ok(evaluate(input).blocked.includes('braces'));
  }
});

test('a reviewed advisory escalated to critical is not waived', () => {
  const input = fixture();
  input.report.vulnerabilities.braces.severity = 'critical';
  input.report.vulnerabilities.braces.via[0].severity = 'critical';
  // Propagated severities must be internally consistent too.
  for (const entry of Object.values(input.report.vulnerabilities)) {
    if (entry.severity === 'high') entry.severity = 'critical';
  }
  recount(input.report);
  assert.ok(evaluate(input).blocked.includes('braces'));
});

test('unexpected nodes, nested copies and changed versions are not waived', () => {
  for (const mutate of [
    (input) => {
      input.report.vulnerabilities.braces.nodes.push('node_modules/new-parent/node_modules/braces');
      input.lock.packages['node_modules/new-parent/node_modules/braces'] = { version: '3.0.3' };
    },
    (input) => {
      input.lock.packages['node_modules/braces'].version = '3.0.4';
    },
    (input) => {
      input.lock.packages['node_modules/expo'].version = '57.0.28';
    },
  ]) {
    const input = fixture();
    mutate(input);
    assert.ok(evaluate(input).blocked.length > 0);
  }
});

test('dev, peer, optional and linked copies are outside the reviewed production scope', () => {
  for (const flag of ['dev', 'peer', 'optional', 'link']) {
    const input = fixture();
    input.lock.packages['node_modules/braces'][flag] = true;
    assert.ok(evaluate(input).blocked.includes('braces'));
  }
});

test('adding a reviewed transitive leaf directly to the application requires review', () => {
  for (const kind of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    const input = fixture();
    input.lock.packages[''][kind] = { ...input.lock.packages[''][kind], braces: '^3.0.3' };
    assert.ok(evaluate(input).blocked.includes('braces'));
  }
});

test('changing the reviewed root package range requires review', () => {
  const input = fixture();
  input.lock.packages[''].dependencies.expo = '^57.0.27';
  assert.ok(evaluate(input).blocked.includes('expo'));
});

test('new dependency edges are rejected even when the new edge is moderate', () => {
  const input = fixture();
  input.report.vulnerabilities.metro.via.push('uuid');
  assert.ok(evaluate(input).blocked.includes('metro'));
});

test('cycles alone cannot manufacture an accepted advisory', () => {
  const input = fixture();
  input.report.vulnerabilities.metro['via'] = ['metro-config'];
  assert.ok(evaluate(input).blocked.includes('metro'));
});

test('below-threshold findings are disclosed but do not need an exception', () => {
  const input = fixture();
  input.report.vulnerabilities = Object.fromEntries(
    Object.entries(input.report.vulnerabilities).filter(([name]) =>
      ['uuid', 'xcode'].includes(name)
    )
  );
  recount(input.report);
  assert.deepEqual(evaluate(input, { npmStatus: 0 }), {
    accepted: [],
    blocked: [],
    expired: false,
  });
});

test('malformed reports, errors, missing lock entries and totals fail closed', () => {
  const mutations = [
    (input) => {
      input.report.error = { message: 'private registry failure' };
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
      input.report.vulnerabilities.braces.nodes = [];
    },
    (input) => {
      input.report.vulnerabilities.braces.nodes.push(input.report.vulnerabilities.braces.nodes[0]);
    },
    (input) => {
      input.report.vulnerabilities.braces.via = ['missing'];
    },
    (input) => {
      delete input.lock.packages['node_modules/braces'];
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
  for (const value of [null, [], {}, 'invalid'])
    assert.throws(() => evaluateAudit(value, fixture().lock, { now }));
});

test('unsupported or inconsistent npm statuses and invalid clocks fail closed', () => {
  for (const npmStatus of [null, 0, 2, 127])
    assert.throws(() => evaluate(fixture(), { npmStatus }));
  for (const time of [NaN, Infinity, '2026-10-08'])
    assert.throws(() => evaluate(fixture(), { now: time }));
  const input = fixture();
  input.report.vulnerabilities = {};
  recount(input.report);
  assert.throws(() => evaluate(input, { npmStatus: 1 }));
});

test('the CLI offers no expiry or report override and does not leak supplied values', () => {
  const path = new URL('./audit-dependencies.mjs', import.meta.url);
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(path), '--expires', 'PRIVATE_SENTINEL'],
    {
      encoding: 'utf8',
      timeout: 5000,
    }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /failed closed/);
  assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE_SENTINEL/);
});
