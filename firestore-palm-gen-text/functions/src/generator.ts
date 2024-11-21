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

import {helpers, v1} from '@google-cloud/aiplatform';

import {GLGenerateTextRequest, VertexPredictResponse} from './types';
import config from './config';

export interface TextGeneratorOptions {
  model?: string;
  temperature?: number;
  candidateCount?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  instruction?: string;
  generativeSafetySettings?: GLGenerateTextRequest['safetySettings'];
}

export type TextGeneratorRequestOptions = Omit<
  GLGenerateTextRequest,
  'prompt' | 'model'
>;

export class TextGenerator {
  private vertexClient?: v1.PredictionServiceClient;
  private endpoint: string;
  instruction?: string;
  context?: string;
  model = config.model;
  temperature?: number;
  candidateCount?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  generativeSafetySettings: TextGeneratorRequestOptions['safetySettings'];

  constructor(options: TextGeneratorOptions = {}) {
    this.temperature = options.temperature;
    this.topP = options.topP;
    this.topK = options.topK;
    this.instruction = options.instruction;
    if (options.model) this.model = options.model;

    this.endpoint = `projects/${config.projectId}/locations/${config.location}/publishers/google/models/${this.model}`;

    this.initVertexClient();
  }

  private initVertexClient() {
    // here location is hard-coded, following https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings#generative-ai-get-text-embedding-nodejs
    const clientOptions = {
      apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    };

    this.vertexClient = new v1.PredictionServiceClient(clientOptions);
  }

  async generate(
    promptText: string,
    options: TextGeneratorRequestOptions = {}
  ): Promise<TextGeneratorResponse> {
    if (!this.vertexClient) {
      throw new Error('Vertex client not initialized.');
    }
    const request = this.createVertexRequest(promptText, options);
    const [result] = await this.vertexClient.predict(request);

    return this.extractVertexCandidateResponse(result);
  }

  private createVertexRequest(
    promptText: string,
    options: TextGeneratorRequestOptions = {}
  ) {
    const prompt = {
      prompt: promptText,
    };
    const instanceValue = helpers.toValue(prompt);
    const instances = [instanceValue!];

    const temperature = options.temperature || this.temperature;
    const topP = options.topP || this.topP;
    const topK = options.topK || this.topK;

    const parameter: Record<string, string | number> = {};
    // We have to set these conditionally or they get nullified and the request fails with a serialization error.
    if (temperature) {
      parameter.temperature = temperature;
    }
    if (topP) {
      parameter.top_p = topP;
    }
    if (topK) {
      parameter.top_k = topK;
    }
    if (config.maxOutputTokensVertex) {
      parameter.maxOutputTokens = config.maxOutputTokensVertex;
    }

    const parameters = helpers.toValue(parameter);

    const request = {
      endpoint: this.endpoint,
      instances,
      parameters,
    };
    return request;
  }

  private extractVertexCandidateResponse(result: VertexPredictResponse) {
    if (!result.predictions || !result.predictions.length) {
      throw new Error('No predictions returned from Vertex AI.');
    }

    const predictionValue = result.predictions[0] as protobuf.common.IValue;

    const vertexPrediction = helpers.fromValue(predictionValue);

    return convertToTextGeneratorResponse(vertexPrediction as VertexPrediction);
  }
}

type VertexPrediction = {
  safetyAttributes?: {
    blocked: boolean;
    categories: string[];
    scores: number[];
  };
  content?: string;
};

type TextGeneratorResponse = {
  candidates: string[];
  safetyMetadata?: {
    blocked: boolean;
    [key: string]: any;
  };
};

function convertToTextGeneratorResponse(
  prediction: VertexPrediction
): TextGeneratorResponse {
  // provider will be vertex
  const {content, safetyAttributes} = prediction;
  const blocked = !!safetyAttributes && !!safetyAttributes.blocked;
  const safetyMetadata = {
    blocked,
    safetyAttributes,
  };
  if (!content && !blocked) {
    throw new Error('No content returned from the Vertex PaLM API.');
  }
  return {
    candidates: blocked ? [] : [content!],
    safetyMetadata,
  };
}
