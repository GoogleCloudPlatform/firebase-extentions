const mockExec = jest.fn();

import setupFirestore from '../src/functions/setupFirestore';
import {CliConfig} from '../src/utils';

jest.mock('child_process', () => ({
  exec: mockExec,
}));

describe('setupFirestore', () => {
  it('should resolve successfully when exec executes without error', async () => {
    mockExec.mockImplementation((cmd, callback) => {
      // Simulate a successful execution
      callback(null, 'success message', '');
    });

    const config: CliConfig = {
      projectId: 'test-project',
      extInstanceId: 'test-instance',
      location: 'test-location',
      jarPath: 'test.jar',
      databaseId: '',
      databaseLocation: '',
    };

    await expect(setupFirestore(config)).resolves.toEqual({
      message: '\x1b[32m✔ Database setup successfully.\x1b[0m',
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

    await expect(setupFirestore(config)).rejects.toThrow(errorMessage);
  });

  it('should construct the command string correctly', async () => {
    const execMock = mockExec.mockImplementation((cmd, callback) => {
      // Simulate a successful execution
      callback(null, 'success message', '');
    });

    const config: CliConfig = {
      projectId: 'test-project',
      extInstanceId: 'test-instance',
      location: 'test-location',
      jarPath: 'test.jar',
      databaseId: '',
      databaseLocation: 'test-location',
    };

    await setupFirestore(config);

    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'gcloud alpha firestore databases list --project=test-project --format="value(name)'
      ),

      expect.any(Function)
    );
  });
});
