const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async () => {
  const serverProcess = spawn('yarn', ['dev'], {
    cwd: path.resolve(__dirname, '../tknz-launchpad'),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  const pidFile = path.resolve(__dirname, 'server-pid.txt');
  fs.writeFileSync(pidFile, serverProcess.pid.toString(), 'utf-8');
  serverProcess.stdout.on('data', data => process.stdout.write(`[SERVER stdout] ${data.toString()}`));
  serverProcess.stderr.on('data', data => process.stderr.write(`[SERVER stderr] ${data.toString()}`));
  await sleep(5000);
};