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

export enum GenerativeAIProvider {
  GOOGLE_AI = 'google-ai',
  VERTEX_AI = 'vertex-ai',
}

export interface Config {
  vertex: {
    model: string;
  };
  googleAi: {
    model: string;
    apiKey?: string;
  };
  model: string;
  context?: string;
  location: string;
  projectId: string;
  instanceId: string;
  promptField: string;
  responseField: string;
  orderField: string;
  enableDiscussionOptionOverrides: boolean;
  collectionName: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  candidateCount?: number;
  candidatesField?: string;
  safetySettings?: any;
  provider: GenerativeAIProvider;
  maxOutputTokens?: number;
}

import {
  HarmBlockThreshold as HarmBlockThresholdVertexAI,
  HarmCategory as HarmCategoryVertexAI,
} from '@google-cloud/vertexai';
import {
  HarmBlockThreshold as HarmBlockThresholdGoogleAI,
  HarmCategory as HarmCategoryGoogleAI,
} from '@google/generative-ai';

function getSafetySettings(): any {
  const categoriesVertexAI = {
    HARM_CATEGORY_HATE_SPEECH: HarmCategoryVertexAI.HARM_CATEGORY_HATE_SPEECH,
    HARM_CATEGORY_DANGEROUS_CONTENT:
      HarmCategoryVertexAI.HARM_CATEGORY_DANGEROUS_CONTENT,
    HARM_CATEGORY_HARASSMENT: HarmCategoryVertexAI.HARM_CATEGORY_HARASSMENT,
    HARM_CATEGORY_SEXUALLY_EXPLICIT:
      HarmCategoryVertexAI.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  };

  const categoriesGoogleAI = {
    HARM_CATEGORY_HATE_SPEECH: HarmCategoryGoogleAI.HARM_CATEGORY_HATE_SPEECH,
    HARM_CATEGORY_DANGEROUS_CONTENT:
      HarmCategoryGoogleAI.HARM_CATEGORY_DANGEROUS_CONTENT,
    HARM_CATEGORY_HARASSMENT: HarmCategoryGoogleAI.HARM_CATEGORY_HARASSMENT,
    HARM_CATEGORY_SEXUALLY_EXPLICIT:
      HarmCategoryGoogleAI.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  };

  const settings = [];

  const provider = process.env.GENERATIVE_AI_PROVIDER;
  if (!provider || (provider !== 'vertex-ai' && provider !== 'google-ai')) {
    throw new Error('Invalid Provider');
  }

  const categories =
    provider === 'vertex-ai' ? categoriesVertexAI : categoriesGoogleAI;

  const thresholdEnum =
    provider === 'vertex-ai'
      ? HarmBlockThresholdVertexAI
      : HarmBlockThresholdGoogleAI;

  for (const [envCategory, category] of Object.entries(categories)) {
    const thresholdEnv = process.env[envCategory];
    if (thresholdEnv && thresholdEnv in thresholdEnum) {
      settings.push({
        category,
        threshold: thresholdEnum[thresholdEnv as keyof typeof thresholdEnum],
      });
    } else if (thresholdEnv) {
      throw new Error(
        `Invalid threshold value for ${envCategory}: ${thresholdEnv}`
      );
    }
  }

  return provider === 'vertex-ai'
    ? (settings as {
        category: HarmCategoryVertexAI;
        threshold: HarmBlockThresholdVertexAI;
      }[])
    : (settings as {
        category: HarmCategoryGoogleAI;
        threshold: HarmBlockThresholdGoogleAI;
      }[]);
}

const model = process.env.MODEL!;

const config: Config = {
  vertex: {
    model,
  },
  googleAi: {
    model,
    apiKey: process.env.API_KEY,
  },
  model,
  context: process.env.CONTEXT,
  location: process.env.LOCATION!,
  projectId: process.env.PROJECT_ID!,
  instanceId: process.env.EXT_INSTANCE_ID!,
  // user defined
  collectionName:
    process.env.COLLECTION_NAME ||
    'users/{uid}/discussions/{discussionId}/messages',
  promptField: process.env.PROMPT_FIELD || 'prompt',
  responseField: process.env.RESPONSE_FIELD || 'response',
  orderField: process.env.ORDER_FIELD || 'createTime',
  enableDiscussionOptionOverrides:
    process.env.ENABLE_DISCUSSION_OPTION_OVERRIDES === 'yes',
  temperature: process.env.TEMPERATURE
    ? parseFloat(process.env.TEMPERATURE)
    : undefined,
  topP: process.env.TOP_P ? parseFloat(process.env.TOP_P) : undefined,
  topK: process.env.TOP_K ? parseInt(process.env.TOP_K) : undefined,
  candidateCount: process.env.CANDIDATE_COUNT
    ? parseInt(process.env.CANDIDATE_COUNT)
    : 1,
  candidatesField: process.env.CANDIDATES_FIELD || 'candidates',
  safetySettings: getSafetySettings(),
  provider:
    (process.env.GENERATIVE_AI_PROVIDER as GenerativeAIProvider) ||
    GenerativeAIProvider.GOOGLE_AI,
  maxOutputTokens: process.env.MAX_OUTPUT_TOKENS
    ? parseInt(process.env.MAX_OUTPUT_TOKENS)
    : undefined,
};

export default config;
