const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(projectRoot);

const watchFolders = [
  path.resolve(workspaceRoot, 'form0-react-native'),
  path.resolve(workspaceRoot, 'form0-core'),
].filter((folder) => fs.existsSync(folder));

if (watchFolders.length > 0) {
  config.watchFolders = watchFolders;
}

config.resolver = {
  ...config.resolver,
  // Always resolve react/react-native from the app to avoid duplicate copies.
  extraNodeModules: {
    react: path.resolve(projectRoot, 'node_modules/react'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  },
  // Prevent Metro from walking up into sibling package node_modules.
  disableHierarchicalLookup: true,
  nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
};

module.exports = config;
