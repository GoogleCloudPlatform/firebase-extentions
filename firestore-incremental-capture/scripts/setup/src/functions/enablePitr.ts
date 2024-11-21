import {exec} from 'child_process';
import * as util from 'util';
import {CliConfig, StatusResponse} from '../utils';

const execPromise = util.promisify(exec);

const runCmd = async (command: string, message) => {
  try {
    const {stdout} = await execPromise(command);

    console.log(stdout);
    return {
      message,
    };
  } catch (e) {
    return null;
  }
};

/***
 * Enable PITR for a Firestore database
 * Will attempt to create a new database with PITR enabled on a (default) database.
 */
export default async function enablePITR({
  projectId,
  databaseLocation,
}: CliConfig): Promise<StatusResponse> {
  console.log(
    '\x1b[33mStep 1: Enabling PITR as per Google Cloud Console guide\x1b[0m'
  );

  /** Attempt to create a new database with PiTR enabled */
  const addPiTRCmd = `gcloud alpha firestore databases create --location=${databaseLocation} --project=${projectId} --enable-pitr`;
  const addPiTRMessage = '\x1b[32m✔ PITR enabled successfully.\x1b[0m';
  const createMessage = await runCmd(addPiTRCmd, addPiTRMessage);

  if (createMessage) return createMessage;

  /** creation failed, try updating an existing table */
  const updateiTRCmd = `gcloud alpha firestore databases update --project=${projectId} --enable-pitr`;
  const updatePiTRMessage = '\x1b[32m✔ PITR enabled successfully.\x1b[0m';
  const updateMessage = await runCmd(updateiTRCmd, updatePiTRMessage);

  if (updateMessage) return updateMessage;

  /** Could not create or update, throw an error */
  throw new Error('Failed to enable PITR');
}
