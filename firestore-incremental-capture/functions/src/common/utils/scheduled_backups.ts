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

import {firestore} from 'firebase-admin';
import {getFunctions} from 'firebase-admin/functions';

import {logger} from 'firebase-functions/v1';

import {google, firestore_v1} from 'googleapis';

import config from '../../config';
import {RestoreJobInfo} from '../models/restore_job_info';

export class ScheduledBackups {
  firestore_api = new firestore_v1.Firestore({
    rootUrl: 'https://firestore.googleapis.com',
  });

  updateRestoreJobDoc(
    ref: FirebaseFirestore.DocumentReference,
    data: RestoreJobInfo
  ): Promise<firestore.WriteResult> {
    return ref.update({...data, updated: firestore.Timestamp.now()});
  }

  /**
   * Checks if a backup exists for the given source database ID.
   *
   * @param databaseId The source database ID.
   * @returns {firestore_v1.Schema$GoogleFirestoreAdminV1Backup} The most recent backup for the database.
   */
  async checkIfBackupExists(
    databaseId: string
  ): Promise<firestore_v1.Schema$GoogleFirestoreAdminV1Backup[]> {
    // Using `-` as location to list backups across all locations.
    // Ref: https://cloud.google.com/firestore/docs/reference/rest/v1/projects.locations.backups/list#path-parameters
    const backups = await this.firestore_api.projects.locations.backups.list({
      parent: `projects/${config.projectId}/locations/-`,
      auth: await this.getAuthClient(),
    });

    if (!backups.data?.backups || backups.data?.backups?.length === 0)
      throw new Error('BACKUP_NOT_FOUND');

    // Sort to get the most recent backup
    const sortedBackups = backups.data.backups.sort((a, b) => {
      return (
        new Date(b.snapshotTime as string).getTime() -
        new Date(a.snapshotTime as string).getTime()
      );
    });

    logger.debug(`Found ${sortedBackups.length} backups`, sortedBackups);

    // Filter by databaseId and state
    const filteredBackups = sortedBackups.filter(backup => {
      return (
        backup.database ===
          `projects/${config.projectId}/databases/${databaseId}` &&
        backup.state === 'READY'
      );
    });

    logger.debug(`Found ${filteredBackups.length} backups`, filteredBackups);

    if (filteredBackups.length === 0) throw new Error('BACKUP_NOT_FOUND');

    return Promise.resolve(filteredBackups);
  }

  async checkIfBackupScheduleExists(
    databaseId: string
  ): Promise<firestore_v1.Schema$GoogleFirestoreAdminV1BackupSchedule> {
    try {
      const bs =
        await this.firestore_api.projects.databases.backupSchedules.list({
          parent: `projects/${config.projectId}/databases/${databaseId}`,
          auth: await this.getAuthClient(),
        });

      if (!bs.data?.backupSchedules || bs.data?.backupSchedules?.length === 0)
        throw new Error('BACKUP_SCHEDULE_NOT_FOUND');

      // Filter by databaseId and state
      const filteredBackups = bs.data.backupSchedules.filter(backup => {
        return backup.name?.includes(databaseId);
      });

      if (filteredBackups.length === 0)
        throw new Error('BACKUP_SCHEDULE_NOT_FOUND');

      return filteredBackups[0];
    } catch (error) {
      logger.error(`Failed to get backup schedule: ${error}`);
      throw error;
    }
  }

  /**
   * Setup scheduled backups for the Firestore database.
   * Could be the default database or any other database in the project.
   * */
  async setupScheduledBackups(
    databaseId: string
  ): Promise<firestore_v1.Schema$GoogleFirestoreAdminV1BackupSchedule> {
    try {
      const newBs =
        await this.firestore_api.projects.databases.backupSchedules.create({
          requestBody: {
            retention: '604800s',
            dailyRecurrence: {},
          },
          parent: `projects/${config.projectId}/databases/${databaseId}`,
          auth: await this.getAuthClient(),
        });

      return newBs.data;
    } catch (error) {
      logger.error(`Failed to setup scheduled backups: ${error}`);
      throw error;
    }
  }

  /**
   *
   * Run a backup restoration.
   */
  async restoreBackup(
    databaseId: string,
    backupId: string
  ): Promise<firestore_v1.Schema$GoogleLongrunningOperation> {
    try {
      const operation = await this.firestore_api.projects.databases.restore({
        auth: await this.getAuthClient(),
        parent: `projects/${config.projectId}`,
        requestBody: {
          databaseId: databaseId,
          backup: backupId,
        },
      });

      logger.info(`Restoring backup ${backupId} to the database ${databaseId}`);

      return operation.data;
    } catch (error) {
      logger.warn(`Failed to restore backup: ${error}`);
      throw error;
    }
  }

  async describeBackupOperation(
    operationName: string
  ): Promise<firestore_v1.Schema$GoogleLongrunningOperation> {
    const operation =
      await this.firestore_api.projects.databases.operations.get({
        name: operationName,
        auth: await this.getAuthClient(),
      });

    return operation.data;
  }

  async enqueueCheckOperationStatus(jobId: string) {
    logger.info('Scheduling task to check operation again in 4 mins');

    await getFunctions()
      .taskQueue(
        `locations/${config.location}/functions/checkScheduledBackupState`,
        config.instanceId
      )
      .enqueue(
        {
          jobId: jobId,
        },
        {scheduleDelaySeconds: 240}
      );
  }

  async enqueueCheckDataflowStatus(jobId: string) {
    logger.info('Scheduling task to check dataflow again in 4 mins');

    await getFunctions()
      .taskQueue(
        `locations/${config.location}/functions/checkDataflowJobState`,
        config.instanceId
      )
      .enqueue(
        {
          jobId: jobId,
        },
        {scheduleDelaySeconds: 240}
      );
  }

  getAuthClient() {
    return google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }
}
