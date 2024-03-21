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

import config from '../config';
import {launchJob, RestoreStatus, ScheduledBackups} from '../common';

const scheduledBackups = new ScheduledBackups();

export const checkScheduledBackupStateHandler = async (data: any) => {
  const jobId = data?.jobId;
  functions.logger.info('An event has been recieved', data);

  const restoreRef = admin.firestore().doc(`${config.jobsCollection}/${jobId}`);
  const restore = await restoreRef.get();
  const restoreData = restore.data();

  if (!restoreData) {
    functions.logger.error('No restore data found');
    return;
  }

  const operation = restoreData?.operation;
  if (!operation) return;

  try {
    const newOperation = await scheduledBackups.describeBackupOperation(
      operation.name
    );

    if (!newOperation) {
      functions.logger.error('No operation found');
      return;
    }

    if (newOperation.error) {
      throw new Error(newOperation.error.message || 'Unknown error');
    }

    if (newOperation.done) {
      // Once the operation is complete, update the restore doc to trigger the next step
      await scheduledBackups.updateRestoreJobDoc(restoreRef, {
        status: {message: RestoreStatus.RUNNING_DATAFLOW},
      });

      await launchJob(
        (restoreData.timestamp as admin.firestore.Timestamp).seconds,
        restoreRef,
        restoreData?.destinationDatabaseId
      );
    } else {
      functions.logger.info('Operation still running');
      await scheduledBackups.enqueueCheckOperationStatus(jobId);
    }
  } catch (error: any) {
    functions.logger.error('Error processing operation', error);
    await scheduledBackups.updateRestoreJobDoc(restoreRef, {
      status: {message: RestoreStatus.FAILED, error: error.message},
    });
  }
};
