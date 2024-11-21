import {exec} from 'child_process';
import {CliConfig, StatusResponse} from '../utils';

export default async function buildDataflowFlexTemplate({
  projectId,
  extInstanceId,
  location,
  jarPath,
}: CliConfig): Promise<StatusResponse> {
  return new Promise((resolve, reject) => {
    const command = `
            echo -e "\x1b[33mStep 6: Building Dataflow Flex Template...\x1b[0m"
            gcloud dataflow flex-template build gs://${projectId}.appspot.com/ext-${extInstanceId}-dataflow-restore \
              --image-gcr-path ${location}-docker.pkg.dev/${projectId}/ext-${extInstanceId}/dataflow/restore:latest \
              --sdk-language JAVA \
              --flex-template-base-image JAVA11 \
              --jar ${jarPath} \
              --env FLEX_TEMPLATE_JAVA_MAIN_CLASS="com.pipeline.RestorationPipeline" \
              --project ${projectId}
            echo -e "\x1b[32mDataflow Flex Template built successfully.\x1b[0m"
        `;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        reject(error);
      } else {
        console.log(stdout);
        resolve({
          message:
            '\x1b[32m✔ Dataflow Flex Template built successfully.\x1b[0m',
        });
      }
    });
  });
}
