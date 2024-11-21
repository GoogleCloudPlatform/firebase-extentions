const mockExec = jest.fn();

import buildDataflowFlexTemplate from '../src/functions/buildDataFlowTemplate';
import {CliConfig} from '../src/utils';

jest.mock('child_process', () => ({
  exec: mockExec,
}));

describe('buildDataflowFlexTemplate', () => {
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

    await expect(buildDataflowFlexTemplate(config)).resolves.toEqual({
      message: '\x1b[32m✔ Dataflow Flex Template built successfully.\x1b[0m',
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

    await expect(buildDataflowFlexTemplate(config)).rejects.toThrow(
      errorMessage
    );
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

    await buildDataflowFlexTemplate(config);

    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `   echo -e "\x1b[33mStep 6: Building Dataflow Flex Template...\x1b[0m"
            gcloud dataflow flex-template build gs://${config.projectId}.appspot.com/ext-${config.extInstanceId}-dataflow-restore \
              --image-gcr-path ${config.location}-docker.pkg.dev/${config.projectId}/ext-${config.extInstanceId}/dataflow/restore:latest \
              --sdk-language JAVA \
              --flex-template-base-image JAVA11 \
              --jar ${config.jarPath} \
              --env FLEX_TEMPLATE_JAVA_MAIN_CLASS="com.pipeline.RestorationPipeline" \
              --project ${config.projectId}
            echo -e "\x1b[32mDataflow Flex Template built successfully.\x1b[0m"
        `
      ),

      expect.any(Function)
    );
  });
});
