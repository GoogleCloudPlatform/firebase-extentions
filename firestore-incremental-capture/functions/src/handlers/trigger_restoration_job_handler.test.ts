jest.mock('firebase-functions/v1');

const google = require('googleapis');

import {logger} from 'firebase-functions/v1';
import {Timestamp} from 'firebase-admin/firestore';

import {RestoreError, RestoreStatus} from '../common';
import {
  pickClosestBackup,
  triggerRestorationJobHandler,
} from './trigger_restoration_job_handler';
import {LogMessage} from '../logs';
import config from '../config';

const databaseId = 'test-database';
const fakeBsckupScheduleData = {
  name: `projects/${config.projectId}/locations/us-east1/backupSchedules/${databaseId}`,
  state: 'READY',
  snapshotTime: '2024-01-01T20:00:00Z',
};

// Valid Firestore document snapshot
const mockSnapshot = {
  data: () => ({
    timestamp: Timestamp.now(),
    destinationDatabaseId: databaseId,
  }),
  ref: {
    update: jest.fn(),
  },
};

describe('triggerRestorationJobHandler Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles invalid timestamp', async () => {
    // Setup a mock Firestore document snapshot
    const mockSnapshot = {
      data: () => ({}),
      ref: {
        update: jest.fn(),
      },
    };

    // Call the function with the mock snapshot
    await triggerRestorationJobHandler(mockSnapshot as any);

    // Assertions to verify behavior when timestamp is invalid
    expect(logger.error).toHaveBeenCalledWith(LogMessage.INVALID_TIMESTAMP);

    expect(mockSnapshot.ref.update).toHaveBeenCalledWith({
      status: {
        message: RestoreStatus.FAILED,
        error: RestoreError.INVALID_TIMESTAMP,
      },
      updated: expect.anything(),
    });
  });

  it('handles a timestamp in the future', async () => {
    const mockSnapshot = {
      data: () => ({timestamp: Timestamp.fromMillis(Date.now() + 1000)}),
      ref: {
        update: jest.fn(),
      },
    };
    // Call the function with the mock snapshot
    await triggerRestorationJobHandler(mockSnapshot as any);

    // Assertions to verify behavior when timestamp is in the future
    expect(logger.error).toHaveBeenCalledWith(LogMessage.INVALID_TIMESTAMP);

    // Verify the status field was updated with the correct error message
    expect(mockSnapshot.ref.update).toHaveBeenCalledWith({
      status: {
        message: RestoreStatus.FAILED,
        error: RestoreError.INVALID_TIMESTAMP,
      },
      updated: expect.anything(),
    });
  });

  it('handles missing destinationDatabaseId', async () => {
    // Setup a mock Firestore document snapshot
    const mockSnapshot = {
      data: () => ({
        timestamp: Timestamp.now(),
      }),
      ref: {
        update: jest.fn(),
      },
    };

    // Call the function with the mock snapshot
    await triggerRestorationJobHandler(mockSnapshot as any);

    // Assertions to verify behavior when destinationDatabaseId is missing
    expect(logger.error).toHaveBeenCalledWith(LogMessage.INVALID_DEST_ID);

    expect(mockSnapshot.ref.update).toHaveBeenCalledWith({
      status: {
        message: RestoreStatus.FAILED,
        error: RestoreError.MISSING_DESTINATION_DATABASE_ID,
      },
      updated: expect.anything(),
    });
  });

  it('handles failed scheduled backups setup', async () => {
    google.mockCreateBackupSchedule(
      Promise.reject('error creating backup schedule')
    );

    // Call the function with the mock snapshot
    await triggerRestorationJobHandler(mockSnapshot as any);

    expect(mockSnapshot.ref.update).toHaveBeenCalledWith({
      status: {
        message: RestoreStatus.FAILED,
        error: `${RestoreError.EXCEPTION}: error creating backup schedule`,
      },
      updated: expect.anything(),
    });
  });

  it('handles no backups found', async () => {
    google.mockCreateBackupSchedule(
      Promise.resolve({data: fakeBsckupScheduleData})
    );

    google.mockBackups(
      Promise.resolve({
        data: {
          // Mock a response with no backups
          backups: [],
        },
      })
    );

    // Call the function with the mock snapshot
    await triggerRestorationJobHandler(mockSnapshot as any);

    expect(mockSnapshot.ref.update).toHaveBeenCalledWith({
      status: {
        message: RestoreStatus.FAILED,
        error: RestoreError.BACKUP_NOT_FOUND,
      },
      updated: expect.anything(),
    });
  });

  it('picks most recent backup', async () => {
    const backups = [
      {
        database: `projects/${config.projectId}/databases/${databaseId}/`,
        state: 'READY',
        snapshotTime: '2023-03-23T22:00:00Z',
      },
      // This backup should be picked
      {
        database: `projects/${config.projectId}/databases/${databaseId}`,
        state: 'READY',
        snapshotTime: '2024-01-04T21:00:00Z',
      },
      {
        database: `projects/${config.projectId}/databases/${databaseId}`,
        state: 'READY',
        snapshotTime: '2024-01-01T20:00:00Z',
      },
    ];

    const backup = pickClosestBackup(backups, Timestamp.now());

    expect(backup).toEqual(backups[1]);
  });
});
