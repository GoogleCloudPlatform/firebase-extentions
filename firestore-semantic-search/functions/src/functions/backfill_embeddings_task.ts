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

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {getFunctions} from 'firebase-admin/functions';

import {BackfillStatus} from '../types/backfill_status';
import {getDatapointsList} from '../common/datapoints';
import * as utils from '../common/utils';
import config from '../config';
import {DocumentData} from 'firebase-admin/firestore';

export async function backfillEmbeddingsTaskHandler(data: any) {
  const {id, collectionName, documentIds} = data;

  if (!documentIds || documentIds.length === 0) {
    functions.logger.info('No document ids found, skipping...');
    return;
  }

  const taskRef = admin.firestore().doc(`${config.tasksDoc}/enqueues/${id}`);

  const documents: {
    id: string;
    data: any;
  }[] = [];

  await taskRef.update({
    status: 'PROCESSING',
  });

  await admin.firestore().runTransaction(async transaction => {
    const refs = documentIds.map((id: string) =>
      admin.firestore().collection(collectionName).doc(id)
    );
    const docs = await transaction.getAll<DocumentData, DocumentData>(...refs);

    docs.map(doc => {
      const data = doc.data();
      if (!data) {
        functions.logger.error(`Document ${doc.ref.path} has no data`);
        return;
      }

      documents.push({
        id: doc.ref.id,
        data,
      });
    });
  });

  const datapoints = await getDatapointsList(documents);

  if (datapoints.length === 0) {
    functions.logger.info('No datapoints found, skipping...');
    return;
  }

  const localFilePath = await utils.saveEmbeddingsToTmpFile(datapoints);

  const destinationPath = `datapoints/${id}.json`;

  functions.logger.info(
    `Embeddings will be saved to ${destinationPath} 📝, uploading to the bucket...`
  );

  await utils.uploadToCloudStorage(localFilePath, destinationPath);

  functions.logger.info(
    `Embeddings uploaded to the bucket ${config.bucketName} in ${destinationPath} 🚀`
  );

  await taskRef.update({
    status: 'DONE',
    filePath: `gs://${config.bucketName}/${destinationPath}`,
  });

  await utils.deleteTempFiles();

  const tasksDoc = await admin.firestore().doc(config.tasksDoc).get();
  const {totalLength} = tasksDoc.data() as any;
  let {processedLength} = tasksDoc.data() as any;

  processedLength += documentIds.length;
  await admin
    .firestore()
    .doc(config.tasksDoc)
    .update({
      processedLength: admin.firestore.FieldValue.increment(documentIds.length),
    });

  if (processedLength === totalLength) {
    await admin.firestore().doc(config.tasksDoc).update({
      status: BackfillStatus.DONE,
    });
  } else {
    await _createNextTask(id);
  }
}

async function _createNextTask(prevId: string) {
  const taskNum = prevId.split('task')[1];
  const nextId = `ext-${config.instanceId}-task${parseInt(taskNum) + 1}`;

  functions.logger.info(`Enqueuing the next task ${nextId}`);

  const nextTask = await admin
    .firestore()
    .doc(`${config.tasksDoc}/enqueues/${nextId}`)
    .get();

  const queue = getFunctions().taskQueue(
    `locations/${config.location}/functions/backfillTask`,
    config.instanceId
  );

  await queue.enqueue({
    id: nextId,
    collectionName: config.collectionName,
    documentIds: nextTask.data()?.documentIds,
  });
}
