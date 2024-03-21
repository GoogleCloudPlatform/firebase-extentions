import chalk from 'chalk';
import ProgressBar from 'progress';
import { createWriteStream } from 'fs';
import { Options } from './types';
import path from 'path';

export async function downloadJarFile(url: string, { jarLocalDir }: Options) {
  console.log(chalk.yellow('Step 1: Downloading the JAR file...'));
  const response = await fetch(url);
  if (!response.body || !response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const totalBytes = parseInt(response.headers.get('content-length') || '0');
  const progressBar = new ProgressBar(
    chalk.yellow('progress: [:bar] :percent :etas'),
    {
      complete: '=',
      incomplete: ' ',
      width: 40,
      total: totalBytes,
    }
  );

  const jarPath = path.join(jarLocalDir, 'restore-firestore.jar');

  const fileStream = createWriteStream(jarPath);
  const reader = response.body.getReader();

  // Function to process the stream
  async function processStream() {
    const { done, value } = await reader.read();
    if (done) {
      console.log(chalk.green('JAR file downloaded successfully.'));
      console.log(chalk.green('Success ✓ Successfully downloaded assets.'));
      fileStream.close();
      return;
    }
    if (value) {
      fileStream.write(value);
      progressBar.tick(value.length);
    }
    // Read the next chunk
    await processStream();
  }

  await processStream().catch((error) => {
    console.error(
      chalk.red(`Error during the download or file writing process: ${error}`)
    );
    fileStream.close();
    throw error;
  });
}
