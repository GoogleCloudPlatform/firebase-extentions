/**
 * Copyright 2019 Google LLC
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
import * as logs from './logs';
import config from './config';
import {TextGenerator, TextGeneratorRequestOptions} from './generator';
import {DocumentReference, FieldValue} from 'firebase-admin/firestore';
import {createErrorMessage} from './errors';

const {textField, responseField, collectionName, targetSummaryLength} = config;

const textGenerator = new TextGenerator({
  model: config.model,
  maxOutputTokens: config.maxOutputTokens,
});

logs.init(config);

export const generateSummary = functions.firestore
  .document(collectionName)
  .onWrite(async change => {
    const data = change.after.data();

    if (!data) {
      // TODO add logging
      return;
    }

    const ref: DocumentReference = change.after.ref;

    const status = data.status;
    const state = status?.state;
    const text = data[textField];
    const response = data[responseField];
    // only make an API call if text exists and is non-empty, and state is not PROCESSING or COMPLETED
    if (
      !text ||
      typeof text !== 'string' ||
      ['PROCESSING', 'COMPLETED', 'ERRORED'].includes(state) ||
      response
    ) {
      return;
    }

    await ref.update({
      status: {
        updateTime: FieldValue.serverTimestamp(),
        startTime: FieldValue.serverTimestamp(),
        state: 'PROCESSING',
      },
    });

    try {
      const t0 = performance.now();
      const requestOptions: TextGeneratorRequestOptions = {};

      const prompt = createSummaryPrompt(text, targetSummaryLength);

      const result = await textGenerator.generate(prompt, requestOptions);

      const duration = performance.now() - t0;
      logs.receivedAPIResponse(ref.path, duration);

      const metadata: Record<string, any> = {
        'status.completeTime': FieldValue.serverTimestamp(),
        'status.updateTime': FieldValue.serverTimestamp(),
      };

      if (result.safetyMetadata) {
        metadata.safetyMetadata = {};

        /** Ensure only defined data is added to the metadata */
        for (const key of Object.keys(result.safetyMetadata)) {
          if (result.safetyMetadata[key] !== undefined) {
            metadata.safetyMetadata[key] = result.safetyMetadata[key];
          }
        }
      }

      if (result.safetyMetadata?.blocked) {
        return ref.update({
          ...metadata,
          'status.state': 'ERRORED',
          'status.error':
            'The prompt or summary was blocked by the PaLM content filter.',
        });
      }

      return ref.update({
        ...metadata,
        [responseField]: result.candidates[0],
        'status.state': 'COMPLETED',
        'status.error': null,
      });
    } catch (e: any) {
      logs.errorCallingGLMAPI(ref.path, e);
      const errorMessage = createErrorMessage(e);
      return ref.update({
        'status.state': 'ERRORED',
        'status.error': errorMessage,
      });
    }
  });

const createSummaryPrompt = (text: string, targetSummaryLength?: number) => {
  const prompt = `Give a summary of the following text in ${targetSummaryLength} sentences, do not use any information that is not explicitly mentioned in the text.
  text: ${text}
`;

  return prompt;
};
