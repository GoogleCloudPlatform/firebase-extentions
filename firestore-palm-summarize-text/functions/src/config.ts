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

import {GLHarmBlockThreshold, GLHarmCategory} from './types';

export interface Config {
  location: string;
  projectId: string;
  instanceId: string;
  collectionName: string;
  textField: string;
  responseField: string;
  targetSummaryLength?: number;
  model: string;
  maxOutputTokens?: number;
}

function getModel() {
  switch (process.env.PALM_API_PROVIDER) {
    case 'generative':
      switch (process.env.MODEL) {
        default:
          return 'text-bison';
      }
    default:
      switch (process.env.MODEL) {
        default:
          return 'text-bison';
      }
  }
}

const config: Config = {
  location: process.env.LOCATION!,
  projectId: process.env.PROJECT_ID!,
  instanceId: process.env.EXT_INSTANCE_ID!,
  collectionName:
    process.env.COLLECTION_NAME || 'summaries/{summaryId}/messages',
  textField: process.env.TEXT_FIELD || 'text',
  responseField: process.env.RESPONSE_FIELD || 'output',
  targetSummaryLength: process.env.TARGET_SUMMARY_LENGTH
    ? parseInt(process.env.TARGET_SUMMARY_LENGTH)
    : 3,
  model: getModel(),
  maxOutputTokens: process.env.MAX_OUTPUT_TOKENS
    ? parseInt(process.env.MAX_OUTPUT_TOKENS)
    : 1024,
};

export default config;
