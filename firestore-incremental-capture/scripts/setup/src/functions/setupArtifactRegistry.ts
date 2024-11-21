import {exec} from 'child_process';
import * as util from 'util';
import {CliConfig, StatusResponse} from '../utils';

const execPromise = util.promisify(exec);

export default async function configureArtifactRegistry({
  projectId,
  location,
  extInstanceId,
}: CliConfig): Promise<StatusResponse> {
  console.log('\x1b[33mStep 3: Configuring Artifact Registry...\x1b[0m');

  try {
    // Check if the Artifact Registry exists
    const checkCommand = `gcloud artifacts repositories list --location=${location} --project=${projectId} --format="value(name)"`;
    const {stdout: artifactExists} = await execPromise(checkCommand);

    if (artifactExists && artifactExists.includes(extInstanceId)) {
      console.log(
        '\x1b[33mArtifact Registry already exists, skipping creation.\x1b[0m'
      );
    } else {
      // Create the Artifact Registry
      const createCommand = `gcloud artifacts repositories create ${extInstanceId} --repository-format=docker --location=${location} --project=${projectId} --async`;
      await execPromise(createCommand);

      // Configure Docker
      const configureDockerCommand = `gcloud auth configure-docker ${location}-docker.pkg.dev`;
      await execPromise(configureDockerCommand);

      console.log('\x1b[32mArtifact Registry configured successfully.\x1b[0m');
      return {
        message: '\x1b[32m✔ Artifact Registry configured successfully.\x1b[0m',
      };
    }

    // Append to success tasks or similar logic
    return {
      message: '\x1b[32m✔ Artifact Registry configured successfully.\x1b[0m',
    };
  } catch (error) {
    console.error(`Error occurred: ${error}`);
    throw error;
  }
}
