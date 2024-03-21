/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {getExtensions} from 'firebase-admin/extensions';

import config from '../config';

import {initialize, bqBackupSchema} from '../common';

export async function runInitialSetupHandler() {
  // Setup runtime
  const runtime = getExtensions().runtime();

  await runtime.setProcessingState(
    'NONE',
    `Creating/updating table ${config.bqDataset}.${config.bqTable}`
  );

  // Setup sync dataset and tables
  await initialize(config.bqDataset, config.bqTable, bqBackupSchema);

  try {
    return runtime.setProcessingState(
      'PROCESSING_COMPLETE',
      `Initialized dataset and table ${config.bqDataset}.${config.bqTable}`
    );
  } catch (error) {
    return runtime.setProcessingState(
      'PROCESSING_FAILED',
      `Failed to enable scheduled backups for the Firestore database. Error: ${error}`
    );
  }
}
