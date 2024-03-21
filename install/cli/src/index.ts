#!/usr/bin/env node

import { configureArtifactRegistry } from './configure_artifact_registry.js';
import { downloadJarFile } from './download_jar_file.js';
import { getMissingOptions } from './parse_options.js';
import chalk from 'chalk';
import { setupServiceAccount } from './setup_service_account.js';
import { buildDataflowFlexTemplate } from './build_dataflow_template.js';
// URL of the JAR file
// Local path to save the JAR file

// Call the function to start the download

async function main() {
  const completeOptions = await getMissingOptions();

  console.log(
    chalk.yellow('Beginning Incremental Firestore Stream CLI with options:'),
    completeOptions
  );
  const JAR_URL =
    'https://github.com/GoogleCloudPlatform/firebase-extensions/blob/%40invertase/ic-scheduled-backups/firestore-incremental-capture-pipeline/target/restore-firestore.jar?raw=true';
  // STEP 1: Download the JAR file
  await downloadJarFile(JAR_URL, completeOptions);
  // STEP 2: Configure Artifact Registry
  await configureArtifactRegistry(
    completeOptions.location,
    completeOptions.projectId,
    completeOptions.extInstanceId
  );
  // STEP 3: Setup Service Account
  await setupServiceAccount(completeOptions);
  // STEP 4: Build Dataflow Flex Template
  await buildDataflowFlexTemplate(completeOptions);
}

main().catch(console.error);
