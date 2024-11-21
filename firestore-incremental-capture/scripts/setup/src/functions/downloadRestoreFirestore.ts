import axios from 'axios';
import * as fs from 'fs';
import {CliConfig, StatusResponse} from '../utils';

export default async function downloadJarFile({
  jarPath,
}: CliConfig): Promise<StatusResponse> {
  const host = 'https://github.com';
  const org = 'GoogleCloudPlatform';
  const repository = 'firebase-extensions';
  const branch = 'blob/next';
  const project = 'firestore-incremental-capture-pipeline';
  const path = 'target/restore-firestore.jar?raw=true';

  const jarUrl = `${host}/${org}/${repository}/${branch}/${project}/${path}`;

  console.log('\x1b[33mStep1: Downloading the JAR file...\x1b[0m');
  console.log(`\x1b[33mSource: ${jarUrl}\x1b[0m`);

  try {
    const response = await axios({
      method: 'GET',
      url: jarUrl,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(jarPath);

    console.log('Writing to file: ', jarPath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('\x1b[32mJAR file downloaded successfully.\x1b[0m');

    return Promise.resolve({
      message: '\x1b[32m✔ Successfully downloaded assets.\x1b[0m',
    });
  } catch (error) {
    console.error(`Failed to download the JAR file: ${error}`);
    return Promise.reject(error);
  }
}
