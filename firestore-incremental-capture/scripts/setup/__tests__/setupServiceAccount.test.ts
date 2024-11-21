const mockExec = jest.fn();

import setupServiceAccount from '../src/functions/setupServiceAccount';
import {CliConfig} from '../src/utils';

jest.mock('child_process', () => ({
  exec: mockExec,
}));

describe('setupServiceAccount', () => {
  it('should resolve successfully when exec executes without error', async () => {
    mockExec.mockImplementation((cmd, callback) => {
      // Simulate a successful execution
      callback(null, {stdout: 'service-account@email.com', stderr: ''}, '');
    });

    const config: CliConfig = {
      projectId: 'test-project',
      extInstanceId: 'test-instance',
      location: 'test-location',
      jarPath: 'test.jar',
      databaseId: '',
      databaseLocation: '',
    };

    await expect(setupServiceAccount(config)).resolves.toEqual({
      message: '\x1b[32m✔ Roles added successfully.\x1b[0m',
    });
  });

  it('should reject when exec executes with an error', async () => {
    const errorMessage = 'error message';
    mockExec.mockImplementation((cmd, callback) => {
      // Simulate a successful execution
      callback(new Error(errorMessage), '', errorMessage);
    });

    const config: CliConfig = {
      projectId: 'test-project',
      extInstanceId: 'test-instance',
      location: 'test-location',
      jarPath: 'test.jar',
      databaseId: '',
      databaseLocation: 'test-location',
    };

    await expect(setupServiceAccount(config)).rejects.toThrow(errorMessage);
  });

  it('should construct the command string correctly', async () => {
    const execMock = mockExec.mockImplementation((cmd, callback) => {
      // Simulate a successful execution
      callback(null, {stdout: 'service-account@email.com', stderr: ''}, '');
    });

    const config: CliConfig = {
      projectId: 'test-project',
      extInstanceId: 'test-instance',
      location: 'test-location',
      jarPath: 'test.jar',
      databaseId: '',
      databaseLocation: 'test-location',
    };

    await setupServiceAccount(config);

    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'gcloud iam service-accounts list --format="value(EMAIL)" --filter="displayName=\'Firebase Extensions test-instance service account\' AND DISABLED=False" --project="test-project'
      ),

      expect.any(Function)
    );
  });
});
