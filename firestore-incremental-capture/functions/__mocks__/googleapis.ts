import {google, firestore_v1 as firestore} from 'googleapis';

// Mock implementation for getAuthClient
const mockGetClient = jest.fn().mockResolvedValue({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

// Replace google.auth.getClient with mockGetClient
google.auth.getClient = mockGetClient;

let backupData: Promise<any[]>;
function mockBackups(data: Promise<any[]>) {
  backupData = data;
}

let backupSchedulesResult: Promise<any[]>;
function mockBackupSchedules(data: Promise<any[]>) {
  backupSchedulesResult = data;
}

let createBackupScheduleResult: Promise<any>;
function mockCreateBackupSchedule(data: Promise<any>) {
  createBackupScheduleResult = data;
}

let restoreResult: Promise<any>;
function mockRestoreBackup(data: Promise<any>) {
  restoreResult = data;
}

class MockFirestore {
  // Mock implementation for projects.locations.backups.list
  projects = {
    locations: {
      backups: {
        list: jest.fn().mockImplementation(() => {
          return backupData;
        }),
      },
    },
    databases: {
      restore: jest.fn().mockImplementation(() => {
        return restoreResult;
      }),
      backupSchedules: {
        create: jest.fn().mockImplementation(() => {
          return createBackupScheduleResult;
        }),
        list: jest.fn().mockImplementation(() => {
          return backupSchedulesResult;
        }),
      },
    },
  };
}

export const firestore_v1 = {
  ...firestore,
  Firestore: MockFirestore,
};

export {google};

export {
  mockBackups,
  mockBackupSchedules,
  mockCreateBackupSchedule,
  mockRestoreBackup,
};
