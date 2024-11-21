import {program} from 'commander';

import buildDataflowFlexTemplate from './functions/buildDataFlowTemplate';
import configureArtifactRegistry from './functions/setupArtifactRegistry';
import enablePITR from './functions/enablePitr';
import setupFirestoreDatabase from './functions/setupFirestore';
import setupServiceAccount from './functions/setupServiceAccount';

import {parseConfig, CliConfig, StatusResponse} from './utils';
import downloadJarFile from './functions/downloadRestoreFirestore';

// const jarPath = 'restore-firestore.jar';

program
  .option(
    '--non-interactive',
    'Parse all input from command line flags instead of prompting the caller.',
    false
  )
  .option('-p, --project <project>', 'Project ID')
  .option('-d, --database <database>', 'Database ID')
  .option('-l, --location <location>', 'Location')
  .option('-dl --databaseLocation <databaseLocation>', 'Database location')
  .option('-e, --extInstanceId <extInstanceId>', 'Extension instance ID')
  .option('-e, --jarPath <jarPath>', 'Jar path', 'restore-firestore.jar')
  .parse(process.argv);

// Assuming these functions are async and require arguments
async function run() {
  try {
    const statuses: StatusResponse[] = [];
    const config: CliConfig = await parseConfig();

    // Set project ID so it can be used in the cli
    process.env.PROJECT_ID = config.projectId;
    // Set google cloud project ID so it can be used in the cli
    process.env.GOOGLE_CLOUD_PROJECT = config.projectId;

    // Collect the promises
    const promises = [
      downloadJarFile(config),
      enablePITR(config),
      setupFirestoreDatabase(config),
      configureArtifactRegistry(config),
      setupServiceAccount(config),
      buildDataflowFlexTemplate(config),
    ];

    // Wait for all promises to resolve
    for (const promise of promises) {
      const response = await promise;
      statuses.push(response);
    }

    // Print all statuses at the end
    statuses.forEach(status => console.log(status.message));

    /** Return an empty promise */
    return Promise.resolve();
  } catch (error) {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit();
  }
}

run()
  .then(() => {
    console.log('done.');
    // eslint-disable-next-line no-process-exit
    process.exit();
  })
  .catch(error => {
    console.log(JSON.stringify(error));
    console.error(error.message);
    // eslint-disable-next-line no-process-exit
    process.exit();
  });
