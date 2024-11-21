import {exec} from 'child_process';
import * as util from 'util';
import {CliConfig, StatusResponse} from '../utils';

const execPromise = util.promisify(exec);

export default async function setupFirestoreDatabase({
  projectId,
  databaseId,
  databaseLocation,
}: CliConfig): Promise<StatusResponse> {
  console.log('\x1b[33mStep 2: Setting up Firestore database\x1b[0m');

  try {
    // Check if the Firestore database exists
    const checkCommand = `gcloud alpha firestore databases list --project=${projectId} --format="value(name)"`;
    const {stdout: dbExists} = await execPromise(checkCommand);

    if (
      dbExists &&
      dbExists.includes(`projects/${projectId}/databases/${databaseId}`)
    ) {
      console.log(
        '\x1b[32mFirestore database already exists, skipping creation.\x1b[0m'
      );
    } else {
      // Create the Firestore database
      console.log('\x1b[32mCreating secondary Firestore database...\x1b[0m');
      const createCommand = `gcloud alpha firestore databases create --database=${databaseId} --location=${databaseLocation} --type=firestore-native --project=${projectId}`;
      await execPromise(createCommand);

      console.log('\x1b[32mFirestore database created successfully.\x1b[0m');
      return {message: '\x1b[32m✔ Database setup successfully.\x1b[0m'};
    }

    // Append to success tasks or similar logic
    return {message: '\x1b[32m✔ Database setup successfully.\x1b[0m'};
  } catch (error) {
    console.error(`Error occurred: ${error}`);
    throw error;
  }
}
