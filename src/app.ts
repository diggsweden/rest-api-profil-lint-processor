import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { execCLI } from './cli-mode.ts';
import { startServer } from './api-mode.ts';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('mode', {
      alias: 'm',
      describe: 'Körläget för applikationen (cli eller api)',
      choices: ['cli', 'api'],
      demandOption: true,
    })
    .argv;

  const mode = argv.mode;

  if (mode === 'cli') {
    await execCLI(); // Starta CLI-läget
  } else if (mode === 'api') {
    startServer(); // Starta API-läget
  }
}

// Starta huvudprocessen
main().catch((err) => {
  console.error("Ett oväntat fel uppstod:", err);
});