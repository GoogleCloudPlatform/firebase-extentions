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
import * as logs from './logs';
import config from './config';
import {TextGenerator, TextGeneratorRequestOptions} from './generator';
import {DocumentReference, FieldValue} from 'firebase-admin/firestore';
import * as Mustache from 'mustache';
import {
  createErrorMessage,
  missingVariableError,
  variableTypeError,
} from './errors';

const {
  model,
  prompt,
  responseField,
  collectionName,
  temperature,
  topP,
  topK,
  maxOutputTokens,
  variableFields,
} = config;

const textGenerator = new TextGenerator({
  model: model,
  temperature,
  topP,
  topK,
  maxOutputTokens,
});

logs.init(config);

export const generateText = functions.firestore
  .document(collectionName)
  .onWrite(async change => {
    if (!change.after) {
      return; // do nothing on delete
    }

    const ref: DocumentReference = change.after.ref;

    const data = change.after.data();

    if (!data) {
      // TODO add logging
      return;
    }

    const status = data.status || {};

    const state = status.state;
    const response = data[responseField];

    // only make an API call if prompt exists and is non-empty, response is missing, and there's no in-process status
    if (
      !prompt ||
      response ||
      ['PROCESSING', 'COMPLETED', 'ERRORED'].includes(state)
    ) {
      // TODO add logging
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
      const view: Record<string, string> = {};

      for (const field of variableFields || []) {
        if (!data[field]) {
          throw missingVariableError(field);
        }
        if (typeof data[field] !== 'string') {
          throw variableTypeError(field);
        }
        view[field] = data[field];
      }

      // if prompt contains handlebars for variable substitution, do it:
      const substitutedPrompt = Mustache.render(prompt, view);

      const t0 = performance.now();
      const requestOptions: TextGeneratorRequestOptions = {};

      const result = await textGenerator.generate(
        substitutedPrompt,
        requestOptions
      );

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
            'The generated text was blocked by the safety filter.',
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
        'status.completeTime': FieldValue.serverTimestamp(),
        'status.updateTime': FieldValue.serverTimestamp(),
        'status.error': errorMessage,
      });
    }
  });
