const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution for Firebase SDK v11+
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
