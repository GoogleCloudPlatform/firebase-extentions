const mockExec = jest.fn();

import enablePitr from '../src/functions/enablePitr';
import {CliConfig} from '../src/utils';

jest.mock('child_process', () => ({
  exec: mockExec,
}));

describe('enablePitr', () => {
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

    await expect(enablePitr(config)).resolves.toEqual({
      message: '\x1b[32m✔ PITR enabled successfully.\x1b[0m',
    });
  });

  it('should reject when exec executes with an error', async () => {
    const errorMessage = 'Failed to enable PITR';
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

    await expect(enablePitr(config)).rejects.toThrow(errorMessage);
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
      databaseLocation: '',
    };

    await enablePitr(config);

    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'gcloud alpha firestore databases create --location=test-location --project=test-project --enable-pitr'
      ),

      expect.any(Function)
    );
  });
});
