const fs = require('fs');
const path = require('path');
const process = require('process');

module.exports = async () => {
  const pidFile = path.resolve(__dirname, 'server-pid.txt');
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'), 10);
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`Killed server process ${pid}`);
    } catch (e) {
      console.warn(`Failed to kill server process ${pid}:`, e);
    }
  }
};