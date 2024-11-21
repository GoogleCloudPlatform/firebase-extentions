import axios from 'axios';
import downloadRestoreFirestore from '../src/functions/downloadRestoreFirestore';
import {CliConfig} from '../src/utils';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('downloadRestoreFirestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve successfully when exec executes without error', async () => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: {
          pipe: jest.fn().mockImplementation(writer => {
            process.nextTick(() => {
              writer.emit('finish');
            });
            return writer;
          }),
        },
      })
    );

    const config: CliConfig = {
      projectId: 'test-project',
      extInstanceId: 'test-instance',
      location: 'test-location',
      jarPath: 'test.jar',
      databaseId: '',
      databaseLocation: '',
    };

    await expect(downloadRestoreFirestore(config)).resolves.toEqual({
      message: '\x1b[32m✔ Successfully downloaded assets.\x1b[0m',
    });
  });
});
