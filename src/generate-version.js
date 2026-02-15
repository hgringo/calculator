const fs = require('fs');
const packageJson = require('../package.json');

const versionInfo = {
  version: packageJson.version,
  date: new Date().toISOString()
};

fs.writeFileSync('./src/assets/version.json', JSON.stringify(versionInfo, null, 2));