/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const projectId = process.env.PROJECT_ID!;
const instanceId = process.env.EXT_INSTANCE_ID!;
const bucketName = process.env.BUCKET_NAME || `${projectId}.appspot.com`;
const location = process.env.LOCATION!;
const firestoreInstance = process.env.BACKUP_INSTANCE_ID!;

export default {
  projectId,
  instanceId,
  bucketName,
  bucketPath: 'backups',

  location,
  // The location to be used to create the BigQuery dataset
  // will match the location of the extension
  bigQueryDatabaseLocation: location,
  dataflowRegion: process.env.DATAFLOW_REGION || location,

  runInitialBackup: true,

  syncCollectionPath: process.env.SYNC_COLLECTION_PATH!,
  instanceCollection: `_ext-${process.env.EXT_INSTANCE_ID!}`,
  jobsCollection: `_ext-${process.env.EXT_INSTANCE_ID!}/restore/jobs`,

  bqDataset: process.env.SYNC_DATASET!,
  bqTable: process.env.SYNC_TABLE!,

  firstoreInstanceId: firestoreInstance,
  firestoreInstanceName: `projects/${projectId}/databases/${firestoreInstance}`,

  stagingLocation: `gs://${bucketName}/${instanceId}/staging`,
  templateLocation: `gs://${bucketName}/${instanceId}/templates/myTemplate`,
};
