#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  const fileNodes = data.fileNodes || [];
  const importEdges = data.importEdges || [];
  const allEdges = data.allEdges || [];

  const nodeById = new Map();
  for (const n of fileNodes) nodeById.set(n.id, n);

  // ---- A. Directory Grouping ----
  const paths = fileNodes.map(n => n.filePath || '').filter(Boolean);

  function commonPrefix(strs) {
    if (strs.length === 0) return '';
    let prefix = strs[0];
    for (const s of strs.slice(1)) {
      let i = 0;
      while (i < prefix.length && i < s.length && prefix[i] === s[i]) i++;
      prefix = prefix.slice(0, i);
    }
    // trim to last '/'
    const idx = prefix.lastIndexOf('/');
    return idx >= 0 ? prefix.slice(0, idx + 1) : '';
  }

  const prefix = commonPrefix(paths);

  function groupForPath(p) {
    if (!p) return 'root';
    let rest = p.startsWith(prefix) ? p.slice(prefix.length) : p;
    const parts = rest.split('/').filter(Boolean);
    if (parts.length <= 1) {
      // flat / root-level file: check extension pattern
      const base = parts[0] || rest;
      if (/\.test\.|\.spec\./.test(base)) return 'test';
      if (/\.config\./.test(base)) return 'config';
      // fall back to root
      return 'root';
    }
    return parts[0];
  }

  const directoryGroups = {};
  for (const n of fileNodes) {
    const g = groupForPath(n.filePath);
    if (!directoryGroups[g]) directoryGroups[g] = [];
    directoryGroups[g].push(n.id);
  }

  // ---- B. Node Type Grouping ----
  const nodeTypeGroups = {};
  for (const n of fileNodes) {
    const t = n.type || 'unknown';
    if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
    nodeTypeGroups[t].push(n.id);
  }

  // ---- C. Import Adjacency Matrix ----
  const fileFanOut = {};
  const fileFanIn = {};
  const adjacency = {}; // source -> [targets]
  for (const n of fileNodes) {
    fileFanOut[n.id] = 0;
    fileFanIn[n.id] = 0;
  }
  for (const e of importEdges) {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    fileFanOut[e.source] = (fileFanOut[e.source] || 0) + 1;
    fileFanIn[e.target] = (fileFanIn[e.target] || 0) + 1;
    if (!adjacency[e.source]) adjacency[e.source] = [];
    adjacency[e.source].push(e.target);
  }

  // remove zero entries is not required; keep only nonzero for output brevity? Keep all for completeness but filter zero to reduce noise
  const fileFanInOut = {};
  for (const id of Object.keys(fileFanIn)) {
    if (fileFanIn[id] > 0) fileFanInOut[id] = fileFanIn[id];
  }
  const fileFanOutOut = {};
  for (const id of Object.keys(fileFanOut)) {
    if (fileFanOut[id] > 0) fileFanOutOut[id] = fileFanOut[id];
  }

  function idToGroup(id) {
    const n = nodeById.get(id);
    if (!n) return null;
    return groupForPath(n.filePath);
  }

  // ---- D. Cross-Category Dependency Analysis ----
  const crossCategoryMap = new Map();
  for (const e of allEdges) {
    const s = nodeById.get(e.source);
    const t = nodeById.get(e.target);
    if (!s || !t) continue;
    if (s.type === t.type && e.type === 'imports') continue; // handled separately, but keep other same-type edges out too if desired
    if (e.type === 'imports') continue; // imports handled in inter-group section
    const key = `${s.type}|${t.type}|${e.type}`;
    crossCategoryMap.set(key, (crossCategoryMap.get(key) || 0) + 1);
  }
  const crossCategoryEdges = [];
  for (const [key, count] of crossCategoryMap.entries()) {
    const [fromType, toType, edgeType] = key.split('|');
    crossCategoryEdges.push({ fromType, toType, edgeType, count });
  }

  // ---- E. Inter-Group Import Frequency ----
  const interGroupMap = new Map();
  for (const e of importEdges) {
    const sg = idToGroup(e.source);
    const tg = idToGroup(e.target);
    if (!sg || !tg) continue;
    const key = `${sg}|${tg}`;
    interGroupMap.set(key, (interGroupMap.get(key) || 0) + 1);
  }
  const interGroupImports = [];
  for (const [key, count] of interGroupMap.entries()) {
    const [from, to] = key.split('|');
    interGroupImports.push({ from, to, count });
  }

  // ---- F. Intra-Group Import Density ----
  const intraGroupDensity = {};
  for (const g of Object.keys(directoryGroups)) {
    let internalEdges = 0;
    let totalEdges = 0;
    for (const e of importEdges) {
      const sg = idToGroup(e.source);
      const tg = idToGroup(e.target);
      if (sg !== g && tg !== g) continue;
      totalEdges++;
      if (sg === g && tg === g) internalEdges++;
    }
    const density = totalEdges > 0 ? internalEdges / totalEdges : 0;
    intraGroupDensity[g] = { internalEdges, totalEdges, density: Number(density.toFixed(3)) };
  }

  // ---- G. Directory Pattern Matching ----
  const dirPatternRules = [
    [['routes', 'api', 'controllers', 'endpoints', 'handlers'], 'api'],
    [['services', 'core', 'lib', 'domain', 'logic'], 'service'],
    [['models', 'db', 'data', 'persistence', 'repository', 'entities'], 'data'],
    [['components', 'views', 'pages', 'ui', 'layouts', 'screens'], 'ui'],
    [['middleware', 'plugins', 'interceptors', 'guards'], 'middleware'],
    [['utils', 'helpers', 'common', 'shared', 'tools'], 'utility'],
    [['config', 'constants', 'env', 'settings'], 'config'],
    [['__tests__', 'test', 'tests', 'spec', 'specs'], 'test'],
    [['types', 'interfaces', 'schemas', 'contracts', 'dtos'], 'types'],
    [['hooks'], 'hooks'],
    [['store', 'state', 'reducers', 'actions', 'slices'], 'state'],
    [['assets', 'static', 'public'], 'assets'],
    [['migrations'], 'data'],
    [['management', 'commands'], 'config'],
    [['templatetags'], 'utility'],
    [['signals'], 'service'],
    [['serializers'], 'api'],
    [['cmd'], 'entry'],
    [['internal'], 'service'],
    [['pkg'], 'utility'],
    [['dto', 'request', 'response'], 'types'],
    [['entity'], 'data'],
    [['controller'], 'api'],
    [['routers'], 'api'],
    [['composables'], 'service'],
    [['blueprints'], 'api'],
    [['mailers', 'jobs', 'channels'], 'service'],
    [['bin'], 'entry'],
    [['docs', 'documentation', 'wiki'], 'documentation'],
    [['deploy', 'deployment', 'infra', 'infrastructure'], 'infrastructure'],
    [['.github', '.gitlab', '.circleci'], 'ci-cd'],
    [['k8s', 'kubernetes', 'helm', 'charts'], 'infrastructure'],
    [['terraform', 'tf'], 'infrastructure'],
    [['docker'], 'infrastructure'],
    [['sql', 'database', 'schema'], 'data'],
    [['cron'], 'service']
  ];

  function matchDirPattern(dirName) {
    const lower = dirName.toLowerCase();
    for (const [names, label] of dirPatternRules) {
      if (names.includes(lower)) return label;
    }
    return null;
  }

  const patternMatches = {};
  for (const g of Object.keys(directoryGroups)) {
    const m = matchDirPattern(g);
    if (m) patternMatches[g] = m;
  }

  // ---- H. Deployment Topology Detection ----
  const infraFiles = [];
  let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;
  for (const n of fileNodes) {
    const p = (n.filePath || '');
    const base = path.basename(p);
    if (/^Dockerfile/i.test(base)) { hasDockerfile = true; if (!infraFiles.includes(p)) infraFiles.push(p); }
    if (/docker-compose/i.test(base)) { hasCompose = true; if (!infraFiles.includes(p)) infraFiles.push(p); }
    if (/\.ya?ml$/.test(base) && /k8s|kubernetes/i.test(p)) { hasK8s = true; if (!infraFiles.includes(p)) infraFiles.push(p); }
    if (/\.tf$|\.tfvars$/.test(base)) { hasTerraform = true; if (!infraFiles.includes(p)) infraFiles.push(p); }
    if (/^\.github\/workflows\//.test(p) || /\.gitlab-ci\.yml$/.test(base) || /^Jenkinsfile$/.test(base)) {
      hasCI = true; if (!infraFiles.includes(p)) infraFiles.push(p);
    }
  }
  const deploymentTopology = { hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI, infraFiles };

  // ---- I. Data Pipeline Detection ----
  const schemaFiles = [];
  const migrationFiles = [];
  const dataModelFiles = [];
  const apiHandlerFiles = [];
  for (const n of fileNodes) {
    const p = n.filePath || '';
    const base = path.basename(p).toLowerCase();
    if (/\.sql$/.test(base) || /\.graphql$/.test(base) || /\.gql$/.test(base) || /\.proto$/.test(base)) {
      schemaFiles.push(p);
    }
    if (/migrations\//.test(p) || /^migrate_/.test(base)) {
      migrationFiles.push(p);
    }
    if (/\/models\//.test(p) || /model\.js$/.test(base) || /Model\.js$/.test(base)) {
      dataModelFiles.push(p);
    }
    if (/\/routes\//.test(p) || /\/controllers\//.test(p)) {
      apiHandlerFiles.push(p);
    }
  }
  const dataPipeline = {
    schemaFiles: Array.from(new Set(schemaFiles)),
    migrationFiles: Array.from(new Set(migrationFiles)),
    dataModelFiles: Array.from(new Set(dataModelFiles)),
    apiHandlerFiles: Array.from(new Set(apiHandlerFiles))
  };

  // ---- J. Documentation Coverage ----
  const docFilePaths = fileNodes.filter(n => n.type === 'document').map(n => n.filePath || '');
  const groupsWithDocsSet = new Set();
  for (const g of Object.keys(directoryGroups)) {
    const hasReadme = docFilePaths.some(p => {
      const dir = path.dirname(p);
      return groupForPath(p) === g && /readme/i.test(path.basename(p));
    });
    const hasRelatedDoc = docFilePaths.some(p => groupForPath(p) === g);
    if (hasReadme || hasRelatedDoc) groupsWithDocsSet.add(g);
  }
  const totalGroups = Object.keys(directoryGroups).length;
  const groupsWithDocs = groupsWithDocsSet.size;
  const coverageRatio = totalGroups > 0 ? Number((groupsWithDocs / totalGroups).toFixed(3)) : 0;
  const undocumentedGroups = Object.keys(directoryGroups).filter(g => !groupsWithDocsSet.has(g));
  const docCoverage = { groupsWithDocs, totalGroups, coverageRatio, undocumentedGroups };

  // ---- K. Dependency Direction ----
  const dependencyDirection = [];
  const seenPairs = new Set();
  for (const { from, to, count } of interGroupImports) {
    if (from === to) continue;
    const pairKey = [from, to].sort().join('|');
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    const reverse = interGroupImports.find(x => x.from === to && x.to === from);
    const reverseCount = reverse ? reverse.count : 0;
    if (count > reverseCount) {
      dependencyDirection.push({ dependent: from, dependsOn: to });
    } else if (reverseCount > count) {
      dependencyDirection.push({ dependent: to, dependsOn: from });
    }
  }

  // ---- fileStats ----
  const filesPerGroup = {};
  for (const g of Object.keys(directoryGroups)) filesPerGroup[g] = directoryGroups[g].length;
  const nodeTypeCounts = {};
  for (const t of Object.keys(nodeTypeGroups)) nodeTypeCounts[t] = nodeTypeGroups[t].length;

  const result = {
    scriptCompleted: true,
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    fileStats: {
      totalFileNodes: fileNodes.length,
      filesPerGroup,
      nodeTypeCounts
    },
    fileFanIn: fileFanInOut,
    fileFanOut: fileFanOutOut
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Analysis complete. Written to', outputPath);
}

try {
  main();
  process.exit(0);
} catch (err) {
  console.error('Fatal error:', err && err.stack ? err.stack : err);
  process.exit(1);
}
