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

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as functionsv2 from 'firebase-functions/v2';

import config from './config';

import {syncDataHandler} from './handlers/sync_data_handler';
import {triggerRestorationJobHandler} from './handlers/trigger_restoration_job_handler';
import {runInitialSetupHandler} from './handlers/run_initial_setup_handler';
import {checkDataflowJobStateHandler} from './handlers/update_dataflow_status_handler';
import {checkScheduledBackupStateHandler} from './handlers/check_scheduled_backups_state_handler';

admin.initializeApp();

/**
 * Backup the entire database on initial deployment
 * */
export const runInitialSetup = functions.tasks
  .taskQueue()
  .onDispatch(runInitialSetupHandler);

/**
 * Sync data to BigQuery, triggered by any change to a Firestore document
 * */
export const syncData = functions.firestore
  .document(config.syncCollectionPath)
  .onWrite(syncDataHandler);

/**
 * Run a backup restoration.
 * */
export const triggerRestorationJob = functions.firestore
  .document(config.jobsCollection)
  .onCreate(triggerRestorationJobHandler);

/**
 * Triggered once the restore is complete.
 *
 * Uses the event log method `google.firestore.admin.v1.FirestoreAdmin.RestoreDatabase`.
 */
export const checkScheduledBackupState = functions.tasks
  .taskQueue()
  .onDispatch(checkScheduledBackupStateHandler);

/**
 * Triggered once the DataFlow job starts.
 */
export const checkDataflowJobState = functions.tasks
  .taskQueue()
  .onDispatch(checkDataflowJobStateHandler);
