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
import {logger} from 'firebase-functions/v1';
import {FlexTemplatesServiceClient} from '@google-cloud/dataflow';
import {Timestamp} from 'firebase-admin/firestore';

import config from '../../config';
import {ScheduledBackups} from './scheduled_backups';
import {RestoreStatus} from '../models/restore_job_status';

const dataflowClient = new FlexTemplatesServiceClient();
const scheduledBackups = new ScheduledBackups();

export async function launchJob(
  timestamp: number,
  jobRef: admin.firestore.DocumentReference,
  destinationDb: string
) {
  const projectId = config.projectId;
  const serverTimestamp = Timestamp.now().toMillis();
  const {syncCollectionPath} = config;

  const runId = `${config.instanceId}-dataflow-run-${serverTimestamp}`;

  logger.info(`Launching job ${runId}`, {
    labels: {run_id: runId},
  });

  // Extract the database name from the backup instance name
  const firestorePrimaryDb = config.firstoreInstanceId;

  // Select the correct collection Id for apache beam
  const firestoreCollectionId =
    syncCollectionPath === '{document=**}' ? '*' : syncCollectionPath;

  const [response] = await dataflowClient.launchFlexTemplate({
    projectId,
    location: config.location,
    launchParameter: {
      jobName: runId,
      parameters: {
        timestamp: timestamp.toString(),
        firestoreCollectionId,
        firestorePrimaryDb,
        firestoreSecondaryDb: destinationDb,
        bigQueryDataset: config.bqDataset,
        bigQueryTable: config.bqTable,
      },
      containerSpecGcsPath: `gs://${config.bucketName}/${config.instanceId}-dataflow-restore`,
    },
  });

  await scheduledBackups.updateRestoreJobDoc(jobRef, {
    status: {
      message: RestoreStatus.RUNNING_DATAFLOW,
    },
    dataflowJob: response.job,
  });

  logger.info(`Launched job named ${response.job?.name} successfully`, {
    job_response: response,
  });

  return response;
}
