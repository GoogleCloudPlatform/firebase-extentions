import chalk from 'chalk';
import { exec } from 'child_process';
import util from 'util';

const execP = util.promisify(exec);

export async function configureArtifactRegistry(
  location: string,
  projectId: string,
  extInstanceId: string
) {
  console.log(chalk.yellow(`Step 3: Configuring Artifact Registry...`));

  try {
    const { stdout: artifactExists } = await execP(
      `gcloud artifacts repositories list --location=${location} --project=${projectId} --format="value(name)"`
    );

    if (artifactExists.includes(extInstanceId)) {
      console.log(
        chalk.yellow(`Artifact Registry already exists, skipping creation.`)
      );
    } else {
      await execP(
        `gcloud artifacts repositories create ${extInstanceId} --repository-format=docker --location=${location} --project=${projectId} --async`
      );
      await execP(`gcloud auth configure-docker ${location}-docker.pkg.dev`);
      chalk.green(`Artifact Registry configured successfully.`);
    }
  } catch (error) {
    console.error('Failed to configure Artifact Registry:', error);
  }
}
