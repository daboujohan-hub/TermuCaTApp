const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('pem');
config.resolver.assetExts.push('html');
config.resolver.assetExts.push('html');

module.exports = config;
