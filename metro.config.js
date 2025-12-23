const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [
  path.resolve(__dirname, '../form0-react-native'), // path to your local package
  //path.resolve(__dirname, '../form0-react-native/node_modules/form0'), // path to form0 dependency
  path.resolve(__dirname, '../form0'), // path to form0 dependency
];

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../form0-react-native/node_modules'),
  ],
};

module.exports = config;