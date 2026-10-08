import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const EXCEPTION_EXPIRES = '2026-11-07T00:00:00Z';
const advisories = {
  braces: { url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm', range: '<=3.0.3' },
  'node-forge': { url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv', range: '<=1.4.0' },
};
const levels = ['info', 'low', 'moderate', 'high', 'critical'];
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isBlocking = (severity) => ['high', 'critical'].includes(severity);
const rootRanges = {
  expo: '~57.0.27',
  'react-native': '0.86.3',
  '@react-native/virtualized-lists': '0.86.3',
};

function reviewed(name, version, via, locations = [`node_modules/${name}`]) {
  const nodes = Object.fromEntries(locations.map((path) => [path, version]));
  if (['metro', 'metro-config', 'metro-file-map', 'metro-transform-worker'].includes(name)) {
    nodes[`node_modules/@expo/metro/node_modules/${name}`] = '0.84.5';
  }
  return { nodes, via };
}

// Application-owned Node tooling graph reviewed on 8 October. This is NOT the
// binding library's peer-only waiver. New paths, edges or versions require review.
const graph = new Map([
  [
    '@expo/cli',
    reviewed(
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
      ['node_modules/expo/node_modules/@expo/cli']
    ),
  ],
  [
    '@expo/code-signing-certificates',
    reviewed('@expo/code-signing-certificates', '0.0.6', ['node-forge']),
  ],
  [
    '@expo/metro',
    reviewed('@expo/metro', '56.0.2', [
      'metro',
      'metro-config',
      'metro-file-map',
      'metro-transform-worker',
    ]),
  ],
  [
    '@expo/metro-config',
    reviewed(
      '@expo/metro-config',
      '57.0.13',
      ['@expo/config', '@expo/metro'],
      ['node_modules/expo/node_modules/@expo/metro-config']
    ),
  ],
  [
    '@react-native/community-cli-plugin',
    reviewed('@react-native/community-cli-plugin', '0.86.3', ['metro', 'metro-config']),
  ],
  [
    '@react-native/virtualized-lists',
    reviewed('@react-native/virtualized-lists', '0.86.3', ['react-native']),
  ],
  ['braces', reviewed('braces', '3.0.3', [])],
  [
    'expo',
    reviewed('expo', '57.0.27', [
      '@expo/cli',
      '@expo/config',
      '@expo/config-plugins',
      '@expo/local-build-cache-provider',
      '@expo/metro',
      '@expo/metro-config',
    ]),
  ],
  [
    'metro',
    reviewed('metro', '0.84.6', ['metro-config', 'metro-file-map', 'metro-transform-worker']),
  ],
  ['metro-config', reviewed('metro-config', '0.84.6', ['metro'])],
  ['metro-file-map', reviewed('metro-file-map', '0.84.6', ['micromatch'])],
  ['metro-transform-worker', reviewed('metro-transform-worker', '0.84.6', ['metro'])],
  ['micromatch', reviewed('micromatch', '4.0.8', ['braces'])],
  ['node-forge', reviewed('node-forge', '1.4.0', [])],
  [
    'react-native',
    reviewed('react-native', '0.86.3', [
      '@react-native/community-cli-plugin',
      '@react-native/virtualized-lists',
    ]),
  ],
]);

function validateReport(report, lock, npmStatus, now) {
  if (
    ![0, 1].includes(npmStatus) ||
    !Number.isFinite(now) ||
    !isObject(report) ||
    Object.hasOwn(report, 'error') ||
    report.auditReportVersion !== 2 ||
    !isObject(report.vulnerabilities) ||
    !isObject(report.metadata?.vulnerabilities) ||
    lock?.lockfileVersion !== 3 ||
    !isObject(lock.packages) ||
    !isObject(lock.packages[''])
  ) {
    throw new Error('Unsupported audit report, lockfile, exit status or clock.');
  }
  const counts = Object.fromEntries(levels.map((severity) => [severity, 0]));
  for (const [name, entry] of Object.entries(report.vulnerabilities)) {
    if (
      !isObject(entry) ||
      !/^[a-zA-Z0-9@/._-]+$/.test(name) ||
      entry.name !== name ||
      !levels.includes(entry.severity) ||
      !Array.isArray(entry.nodes) ||
      !entry.nodes.length ||
      new Set(entry.nodes).size !== entry.nodes.length ||
      !entry.nodes.every(
        (node) => typeof node === 'string' && typeof lock.packages[node]?.version === 'string'
      ) ||
      !Array.isArray(entry.via) ||
      !entry.via.length ||
      !entry.via.every((via) => {
        const source = typeof via === 'string' ? report.vulnerabilities[via] : via;
        if (
          !isObject(source) ||
          !levels.includes(source.severity) ||
          levels.indexOf(source.severity) > levels.indexOf(entry.severity)
        )
          return false;
        return typeof via === 'string'
          ? Object.hasOwn(report.vulnerabilities, via)
          : source.name === name &&
              source.dependency === name &&
              typeof source.url === 'string' &&
              source.url.length > 0 &&
              typeof source.range === 'string' &&
              source.range.length > 0;
      })
    )
      throw new Error('Malformed or inconsistent audit finding.');
    counts[entry.severity]++;
  }
  const metadata = report.metadata.vulnerabilities;
  if (
    levels.some((severity) => metadata[severity] !== counts[severity]) ||
    metadata.total !== Object.keys(report.vulnerabilities).length ||
    (npmStatus === 0 && counts.high + counts.critical > 0) ||
    (npmStatus === 1 && counts.high + counts.critical === 0)
  ) {
    throw new Error('Inconsistent audit totals or exit status.');
  }
}

function isReviewedChain(start, vulnerabilities, packages) {
  const pending = [start];
  const visited = new Set();
  const root = packages[''];
  const rootGroups = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ];
  let reachesAdvisory = false;
  // npm reports cycles across Metro / React Native. A cycle alone is not a waiver.
  while (pending.length) {
    const name = pending.pop();
    if (visited.has(name)) continue;
    visited.add(name);
    const entry = vulnerabilities[name];
    const spec = graph.get(name);
    if (!spec || entry.severity !== 'high') return false;
    if (Object.hasOwn(rootRanges, name)) {
      if (
        root.dependencies?.[name] !== rootRanges[name] ||
        rootGroups.slice(1).some((group) => root[group]?.[name])
      )
        return false;
    } else if (rootGroups.some((group) => root[group]?.[name])) return false;
    if (
      !entry.nodes.every((node) => {
        const pkg = packages[node];
        return (
          Object.hasOwn(spec.nodes, node) &&
          pkg.version === spec.nodes[node] &&
          ['dev', 'peer', 'optional', 'devOptional', 'link'].every(
            (flag) => pkg[flag] === undefined || pkg[flag] === false
          )
        );
      })
    )
      return false;
    for (const via of entry.via) {
      if (typeof via === 'string') {
        if (!spec.via.includes(via)) return false;
        // Moderate branches remain below the unchanged threshold; an escalation
        // sends them through the reviewed high-chain checks instead of ignoring it.
        if (isBlocking(vulnerabilities[via].severity)) pending.push(via);
      } else {
        const approved = advisories[name];
        if (
          !approved ||
          via.url !== approved.url ||
          via.range !== approved.range ||
          via.name !== name ||
          via.dependency !== name ||
          via.severity !== 'high'
        )
          return false;
        reachesAdvisory = true;
      }
    }
  }
  return reachesAdvisory;
}

// Internal tooling API only. Tests inject time; the CLI uses the real clock and
// offers no flag/environment setting to override the deadline or audit report.
export function evaluateAudit(report, lock, { npmStatus = 1, now = Date.now() } = {}) {
  validateReport(report, lock, npmStatus, now);
  const accepted = [];
  const blocked = [];
  const expired = now >= Date.parse(EXCEPTION_EXPIRES);
  for (const [name, entry] of Object.entries(report.vulnerabilities)) {
    if (!isBlocking(entry.severity)) continue;
    if (!expired && isReviewedChain(name, report.vulnerabilities, lock.packages))
      accepted.push(name);
    else blocked.push(name);
  }
  return { accepted, blocked, expired };
}

function runAudit() {
  try {
    if (process.argv.length !== 2) throw new Error('Audit policy accepts no override arguments.');
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = spawnSync(
      npmCommand,
      ['audit', '--json', '--omit=dev', '--omit=peer', '--audit-level=high'],
      { encoding: 'utf8', timeout: 45_000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (result.error || result.signal) throw new Error('npm audit could not complete.');
    const report = JSON.parse(result.stdout);
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const { accepted, blocked, expired } = evaluateAudit(report, lock, {
      npmStatus: result.status,
    });
    console.log(`Production audit counts: ${JSON.stringify(report.metadata.vulnerabilities)}`);
    if (accepted.length) {
      console.log(
        `Accepted temporary risk, NOT patched: ${Object.values(advisories)
          .map((item) => item.url)
          .join(
            ', '
          )}; ${accepted.length} reviewed high dependency-chain findings; expires ${EXCEPTION_EXPIRES}.`
      );
    }
    if (blocked.length) {
      console.error(`Blocking high/critical findings: ${blocked.join(', ')}.`);
      if (expired) console.error(`The starter audit exception expired at ${EXCEPTION_EXPIRES}.`);
      process.exitCode = 1;
    } else console.log('Audit policy passed; all other high/critical findings remain blocking.');
  } catch {
    // Never print raw npm errors/output, which may include private registry configuration.
    console.error(
      'Production audit failed closed: npm could not complete, the report/lockfile/status is invalid, or unsupported arguments were supplied. Check registry connectivity and report/lockfile format.'
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) runAudit();
