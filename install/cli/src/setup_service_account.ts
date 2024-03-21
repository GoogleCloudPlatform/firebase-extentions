import { exec } from 'child_process';
import util from 'util';
import chalk from 'chalk';
import { Options } from './types';

// Convert exec to promise to use with async/await
const execP = util.promisify(exec);

const SUCCESS_TASKS: string[] = [];

async function findServiceAccountEmail(options: Options) {
  console.log(chalk.green("Finding extension's service account email..."));

  try {
    const { stdout } = await execP(
      `gcloud iam service-accounts list --format="value(EMAIL)" --filter="displayName='Firebase Extensions ${options.extInstanceId} service account' AND DISABLED=False" --project="${options.projectId}"`
    );
    const SA_EMAIL = stdout.trim();
    console.log(chalk.green(`Service account email found: ${SA_EMAIL}`));
    return SA_EMAIL;
  } catch (error) {
    console.error(chalk.red('Failed to find service account email:', error));
    throw error; // Rethrow to handle the error in the caller function
  }
}

async function addIamPolicyBindingForArtifactRegistry(
  serviceAccountEmail: string,
  { projectId, location, extInstanceId }: Options
) {
  console.log(
    chalk.yellow('Step 4: Adding IAM policy binding for Artifact Registry...')
  );
  await execP(
    `gcloud artifacts repositories add-iam-policy-binding ${extInstanceId} --location=${location} --project=${projectId} --member="serviceAccount:${serviceAccountEmail}" --role=roles/artifactregistry.writer`
  );
  SUCCESS_TASKS.push(chalk.green('Policy binding added successfully.'));
  console.log(chalk.green('Policy binding added successfully.'));
}

async function addRolesForServiceAccount(
  serviceAccountEmail: string,
  options: Options
) {
  console.log(
    chalk.yellow(
      'Step 5: Adding roles for service account to trigger Dataflow...'
    )
  );
  await execP(
    `gcloud projects add-iam-policy-binding ${options.projectId} --project ${options.projectId} --member="serviceAccount:${serviceAccountEmail}" --role=roles/artifactregistry.writer`
  );
  await execP(
    `gcloud projects add-iam-policy-binding ${options.projectId} --project ${options.projectId} --member="serviceAccount:${serviceAccountEmail}" --role=roles/iam.serviceAccountUser`
  );
  await execP(
    `gcloud projects add-iam-policy-binding ${options.projectId} --project ${options.projectId} --member="serviceAccount:${serviceAccountEmail}" --role=roles/cloudtasks.tasks.create`
  );
  SUCCESS_TASKS.push(chalk.green('Roles added successfully'));
  console.log(chalk.green('Roles added successfully.'));
}

export async function setupServiceAccount(options: Options) {
  try {
    const serviceAccountEmail = await findServiceAccountEmail(options);
    await addIamPolicyBindingForArtifactRegistry(serviceAccountEmail, options);
    await addRolesForServiceAccount(serviceAccountEmail, options);
    console.log(
      chalk.green('Success ✓ Service account setup completed successfully.')
    );
  } catch (error) {
    console.error(chalk.red('An error occurred during the process.', error));
  }
}
