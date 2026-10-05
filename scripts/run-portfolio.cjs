// Load demo settings without passing --env-file through Next.js worker flags.
const { loadEnvFile } = require('node:process');
const { spawn } = require('node:child_process');
const { resolve } = require('node:path');

loadEnvFile(resolve(process.cwd(), 'portfolio.env.example'));
const child = spawn(process.execPath, process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  windowsHide: true,
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
