import {program} from 'commander';
import * as inquirer from 'inquirer';
import questions from './questions';

export enum ConsoleColors {
  ERROR = '\\033[0;31m', // Red for errors
  SUCCESS = '\\033[0;32m', // Green for successful operations
  WARNING = '\\033[1;33m', // Yellow for warnings
  RESET = '\\033[0m', // Reset to default color
  TICK = '✓', // Symbol for success indication
}

export interface StatusResponse {
  message: string;
}

export interface CliConfig {
  nonInteractive?: boolean;
  projectId: string;
  databaseId: string;
  location: string;
  databaseLocation: string;
  extInstanceId: string;
  jarPath: string;
}

export async function parseConfig(): Promise<CliConfig> {
  program.parse(process.argv);

  if (program.nonInteractive) {
    if (
      program.project === undefined ||
      program.database === undefined ||
      program.location === undefined ||
      program.databaseLocation === undefined
    ) {
      program.outputHelp();
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
    return {
      projectId: program.project,
      databaseId: program.dataset,
      location: program.location,
      databaseLocation: program.databaseLocation,
      extInstanceId: program.extInstanceId,
      jarPath: program.jarPath,
    };
  }

  console.log('Here >>>>>');

  const opts = await inquirer.prompt(questions);
  return {
    projectId: opts.project,
    databaseId: opts.dataset,
    location: opts.tableNamePrefix,
    databaseLocation: opts.tableNamePrefix,
    extInstanceId: opts.extInstanceId,
    jarPath: opts.jarPath,
  };
}
