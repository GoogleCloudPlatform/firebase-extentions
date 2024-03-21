import { exec } from 'child_process';
import util from 'util';
import chalk from 'chalk';
import { Options } from './types';
import path from 'path';

// Convert exec to promise to use with async/await
const execP = util.promisify(exec);

export async function buildDataflowFlexTemplate(options: Options) {
  const { projectId, location, extInstanceId } = options;

  const jarPath = path.join(options.jarLocalDir, 'restore-firestore.jar');

  console.log(chalk.yellow('Step 6: Building Dataflow Flex Template...'));
  try {
    await execP(`gcloud dataflow flex-template build gs://${projectId}.appspot.com/${extInstanceId}-dataflow-restore \
    --image-gcr-path ${location}-docker.pkg.dev/${projectId}/${extInstanceId}/dataflow/restore:latest \
    --sdk-language JAVA \
    --flex-template-base-image JAVA11 \
    --jar ${jarPath} \
    --env FLEX_TEMPLATE_JAVA_MAIN_CLASS="com.pipeline.RestorationPipeline" \
    --project ${projectId}`);
    console.log(chalk.green('Dataflow Flex Template built successfully.'));
  } catch (error) {
    console.error(chalk.red('Failed to build Dataflow Flex Template:', error));
    // Consider handling the error based on your application's needs
  }
}
