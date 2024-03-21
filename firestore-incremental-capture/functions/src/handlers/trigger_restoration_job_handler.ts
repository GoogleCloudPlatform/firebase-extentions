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

import * as google from 'googleapis';
import {firestore} from 'firebase-admin';
import {logger} from 'firebase-functions/v1';
import {GaxiosError} from 'googleapis-common';
import {QueryDocumentSnapshot} from 'firebase-admin/firestore';

import {
  ScheduledBackups,
  RestoreJobData,
  RestoreError,
  RestoreStatus,
} from '../common';
import {LogMessage} from '../logs';
import config from '../config';

const scheduledBackups = new ScheduledBackups();

export const triggerRestorationJobHandler = async (
  snapshot: QueryDocumentSnapshot
) => {
  const ref = snapshot.ref;
  const data = snapshot.data() as RestoreJobData | undefined;
  const timestamp = data?.timestamp as firestore.Timestamp | undefined;

  if (!timestamp || !isValidTimestamp(timestamp)) {
    logger.error(LogMessage.INVALID_TIMESTAMP);

    await scheduledBackups.updateRestoreJobDoc(ref, {
      status: {
        message: RestoreStatus.FAILED,
        error: RestoreError.INVALID_TIMESTAMP,
      },
    });

    return;
  }

  if (!data?.destinationDatabaseId) {
    logger.error(LogMessage.INVALID_DEST_ID);

    await scheduledBackups.updateRestoreJobDoc(ref, {
      status: {
        message: RestoreStatus.FAILED,
        error: RestoreError.MISSING_DESTINATION_DATABASE_ID,
      },
    });

    return;
  }

  let backups: google.firestore_v1.Schema$GoogleFirestoreAdminV1Backup[];

  // Check if there's a valid backup
  try {
    backups = await scheduledBackups.checkIfBackupExists(
      config.firstoreInstanceId
    );
  } catch (ex: any) {
    if (ex.message === RestoreError.BACKUP_SCHEDULE_NOT_FOUND) {
      logger.info(
        'No backup schedule found for the Firestore database, creating a new one'
      );

      // Setup scheduled backups for the Firestore database
      await scheduledBackups.setupScheduledBackups(config.firstoreInstanceId);

      // Terminate the function and wait for the next trigger
      return scheduledBackups.updateRestoreJobDoc(ref, {
        status: {
          message: RestoreStatus.FAILED,
          error: `${RestoreError.BACKUP_SCHEDULE_NOT_FOUND}`,
        },
      });
    }

    logger.error(ex);
    return scheduledBackups.updateRestoreJobDoc(ref, {
      status: {
        message: RestoreStatus.FAILED,
        error: `${ex.message}`,
      },
    });
  }

  // Pick the closest backup to the requested timestamp
  const backup = pickClosestBackup(backups, timestamp!);

  // Call restore function to build the baseline DB
  try {
    const operation = await scheduledBackups.restoreBackup(
      data?.destinationDatabaseId,
      backup.name as string
    );

    await scheduledBackups.updateRestoreJobDoc(ref, {
      status: {
        message: RestoreStatus.RUNNING_RESTORE,
      },
      operation: operation,
    });

    // Finally enqueue a task to check the operation status in 4 mins
    return scheduledBackups.enqueueCheckOperationStatus(ref.id);
  } catch (ex: any) {
    logger.error('Error restoring backup', (ex as GaxiosError).message);
    return scheduledBackups.updateRestoreJobDoc(ref, {
      status: {
        message: RestoreStatus.FAILED,
        error: `${RestoreError.EXCEPTION}: ${(ex as GaxiosError).message}`,
      },
    });
  }
};

/**
 * Checks if a long integer is a valid UNIX timestamp in seconds.
 *
 * @param timestamp The timestamp to check.
 * @returns Whether the timestamp is valid.
 */
function isValidTimestamp(timestamp: firestore.Timestamp): boolean {
  // Get the current UNIX timestamp
  const currentTimestamp = firestore.Timestamp.now().toMillis();

  // Ensure the timestamp isn't in the future
  if (timestamp.toMillis() > currentTimestamp) {
    return false;
  }

  return true;
}

/**
 * Takes a list of backups and returns the closest backup to the timestamp.
 *
 * @param backups The list of backups to search.
 * @param timestamp The timestamp to compare against.
 * @returns The closest backup to the timestamp.
 */
export function pickClosestBackup(
  backups: google.firestore_v1.Schema$GoogleFirestoreAdminV1Backup[],
  timestamp: firestore.Timestamp
) {
  return backups.reduce((prev, curr) => {
    const prevDiff = Math.abs(
      timestamp.toMillis() - new Date(prev.snapshotTime as string).getTime()
    );
    const currDiff = Math.abs(
      timestamp.toMillis() - new Date(curr.snapshotTime as string).getTime()
    );

    return prevDiff < currDiff ? prev : curr;
  });
}
