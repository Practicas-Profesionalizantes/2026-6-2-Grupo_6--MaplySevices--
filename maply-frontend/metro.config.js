const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem 16: sin esto NativeWind usa 14 en el celular y text-base, h-12, etc. quedan chicos.
module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
