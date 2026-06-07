const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicitly whitelist machine learning model asset extensions
config.resolver.assetExts.push('onnx', 'onnx_data', 'json');

module.exports = config;
