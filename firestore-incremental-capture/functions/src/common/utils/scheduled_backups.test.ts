jest.mock('firebase-functions/v1');

// Required when using config to make sure the mock config is used
jest.mock('../../config');

const google = require('googleapis');
import config from '../../config';
import {ScheduledBackups} from './scheduled_backups';

const databaseId = 'test-database';
const fakeBackupData = {
  database: `projects/${config.projectId}/databases/${databaseId}`,
  state: 'READY',
  snapshotTime: new Date().toISOString(),
};
const fakeBsckupScheduleData = {
  name: `projects/${config.projectId}/locations/us-east1/backupSchedules/${databaseId}`,
  state: 'READY',
  schedule: 'every 24 hours',
  createTime: '2020-03-12T14:00:00Z',
  updateTime: '2020-03-12T14:00:00Z',
  versionTime: '2020-03-12T14:00:00Z',
  retentionUnit: 'COUNT',
};

describe('ScheduledBackups', () => {
  let scheduledBackups: ScheduledBackups;

  beforeEach(() => {
    jest.resetAllMocks();
    scheduledBackups = new ScheduledBackups();
  });

  it("should throw when there're no backups", async () => {
    google.mockBackups(
      Promise.resolve({
        data: {
          backups: [],
        },
      })
    );
    // Use await with expect().rejects.toThrow
    await expect(
      scheduledBackups.checkIfBackupExists(databaseId)
    ).rejects.toThrow('BACKUP_NOT_FOUND');
  });

  it('should list backups correctly', async () => {
    google.mockBackups(
      Promise.resolve({
        data: {
          backups: [fakeBackupData],
        },
      })
    );
    const backup = await scheduledBackups.checkIfBackupExists(databaseId);
    // Check if the returned backup matches the fakeBackupData
    expect(backup).toContainEqual(fakeBackupData);
  });

  it('should throw when there are no backup schedules', async () => {
    google.mockBackupSchedules(
      Promise.resolve({
        data: {
          backupSchedules: [],
        },
      })
    );
    await expect(
      scheduledBackups.checkIfBackupScheduleExists(databaseId)
    ).rejects.toThrow('BACKUP_SCHEDULE_NOT_FOUND');
  });

  it('should list backup schedules correctly', async () => {
    google.mockBackupSchedules(
      Promise.resolve({
        data: {
          backupSchedules: [fakeBsckupScheduleData],
        },
      })
    );
    const bs = await scheduledBackups.checkIfBackupScheduleExists(databaseId);
    // Check if the returned backup schedule matches the fakeBackupScheduleData
    expect(bs).toEqual(fakeBsckupScheduleData);
  });

  it('should create a backup schedule if none exists', async () => {
    google.mockCreateBackupSchedule(
      Promise.resolve({data: fakeBsckupScheduleData})
    );

    const op = await scheduledBackups.setupScheduledBackups(databaseId);
    // Check if the backup schedule was created
    expect(op).toEqual(fakeBsckupScheduleData);
  });

  it('should restore a backup', async () => {
    const backupName = `projects/${config.projectId}/databases/${databaseId}/backups/test-backup`;
    google.mockRestoreBackup(Promise.resolve({data: {name: backupName}}));

    const op = await scheduledBackups.restoreBackup(databaseId, 'test-backup');
    // Check if the backup was restored
    expect(op.name).toEqual(backupName);
  });
});
