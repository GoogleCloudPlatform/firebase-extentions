const mockExec = jest.fn();

import setupArtifactRegistry from '../src/functions/setupArtifactRegistry';
import {CliConfig} from '../src/utils';

jest.mock('child_process', () => ({
  exec: mockExec,
}));

describe('setupArtifactRegistry', () => {
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

    await expect(setupArtifactRegistry(config)).resolves.toEqual({
      message: '\x1b[32m✔ Artifact Registry configured successfully.\x1b[0m',
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

    await expect(setupArtifactRegistry(config)).rejects.toThrow(errorMessage);
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

    await setupArtifactRegistry(config);

    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'gcloud artifacts repositories list --location=test-location --project=test-project --format="value(name)'
      ),

      expect.any(Function)
    );
  });
});
