import {exec} from 'child_process';
import * as util from 'util';
import {CliConfig, StatusResponse} from '../utils';

const execPromise = util.promisify(exec);

export default async function configureServiceAccountAndIAM({
  projectId,
  extInstanceId,
  location,
}: CliConfig): Promise<StatusResponse> {
  // Find extension's service account email
  console.log("\x1b[32mFinding extension's service account email...\x1b[0m");

  const serviceAccountCommand = `gcloud iam service-accounts list --format="value(EMAIL)" --filter="displayName='Firebase Extensions ${extInstanceId} service account' AND DISABLED=False" --project="${projectId}" | head -n 1`;

  const {stdout: saEmail} = await execPromise(serviceAccountCommand);

  console.log('\x1b[32mService account email found: ' + saEmail + '\x1b[0m');

  // Add required policy binding for Artifact Registry
  console.log(
    '\x1b[33mStep 4: Adding IAM policy binding for Artifact Registry...\x1b[0m'
  );
  const addPolicyBindingCommand = `gcloud artifacts repositories add-iam-policy-binding ext-${extInstanceId} --location=${location} --project=${projectId} --member=serviceAccount:${saEmail.trim()} --role=roles/artifactregistry.writer`;

  await execPromise(addPolicyBindingCommand);
  console.log('\x1b[32mPolicy binding added successfully.\x1b[0m');
  // SUCCESS_TASKS.push("\x1b[32m✔ Policy binding added successfully.\x1b[0m");

  // Add roles for extension service account to trigger Dataflow
  console.log(
    '\x1b[33mStep 5: Adding roles for service account to trigger Dataflow...\x1b[0m'
  );
  const roles = [
    'roles/dataflow.developer',
    'roles/iam.serviceAccountUser',
    'roles/artifactregistry.writer',
  ];

  for (const role of roles) {
    const addRoleCommand = `gcloud projects add-iam-policy-binding ${projectId} --project ${projectId} --member=serviceAccount:${saEmail.trim()} --role=${role}`;
    await execPromise(addRoleCommand);
  }
  console.log('\x1b[32mRoles added successfully.\x1b[0m');
  return {message: '\x1b[32m✔ Roles added successfully.\x1b[0m'};
}
