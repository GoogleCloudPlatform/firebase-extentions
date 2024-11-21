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

import {helpers, v1} from '@google-cloud/aiplatform';
import * as logs from './logs';
import {
  APIGenerateMessageRequest,
  APIMessage,
  APIExample,
  VertexPredictRequest,
  Message,
  DiscussionOptions,
  GenerateMessageOptions,
  GenerateMessageResponse,
  PaLMPrompt,
} from './types';
import config from './config';

export class Discussion {
  private vertexClient?: v1.PredictionServiceClient;
  private endpoint?: string;
  context?: string;
  examples?: Message[] = [];
  model?: string;
  temperature?: number;
  candidateCount?: number;
  topP?: number;
  topK?: number;

  constructor(options: DiscussionOptions = {}) {
    this.context = options.context;
    this.examples = options.examples || [];
    this.temperature = options.temperature;
    this.topP = options.topP;
    this.topK = options.topK;
    this.candidateCount = options.candidateCount;
    this.model = options.model;

    this.initVertexClient();
  }

  private initVertexClient() {
    this.endpoint = `projects/${config.projectId}/locations/${config.location}/publishers/google/models/${this.model}`;

    // here location is hard-coded, following https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings#generative-ai-get-text-embedding-nodejs
    const clientOptions = {
      apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    };

    this.vertexClient = new v1.PredictionServiceClient(clientOptions);
  }

  private getHistory(options: GenerateMessageOptions) {
    let history: Message[] = [];
    if (options.continue) {
      history = [...options.continue.history];
      history[history.length - 1].response = options.continue.response;
    } else if (options.history) {
      history = options.history;
    }
    return history;
  }

  async send(
    message: string,
    options: GenerateMessageOptions = {}
  ): Promise<GenerateMessageResponse> {
    const history = this.getHistory(options);

    const messages = [
      ...this.messagesToApi(history),
      {author: '0', content: message},
    ];

    const prompt: PaLMPrompt = truncatePrompt({
      messages,
      context: options.context || this.context || '',
      examples: this.messagesToExamples(
        options.examples || this.examples || []
      ),
    });

    const request = this.createVertexRequest(prompt, options);
    return this.generateMessageVertex(request);
  }

  private createVertexRequest(
    prompt: PaLMPrompt,
    options: GenerateMessageOptions
  ) {
    const temperature = options.temperature || this.temperature;
    const topP = options.topP || this.topP;
    const topK = options.topK || this.topK;
    const context = prompt.context || options.context || this.context || '';

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

    if (context) {
      parameter.context = context;
    }

    const parameters = helpers.toValue(parameter);
    const instanceValue = helpers.toValue(prompt);
    const instances = [instanceValue!];

    const request = {
      endpoint: this.endpoint,
      instances,
      parameters,
    };
    return request;
  }

  private async generateMessageVertex(
    request: VertexPredictRequest
  ): Promise<GenerateMessageResponse> {
    if (!this.vertexClient) {
      throw new Error('Vertex client not initialized.');
    }

    const [result] = await this.vertexClient.predict(request);

    const prediction = result.predictions![0];

    const value = helpers.fromValue(prediction as protobuf.common.IValue) as {
      candidates: APIMessage[];
    };

    if (!value.candidates || !value.candidates.length) {
      throw new Error('No candidates returned from server.');
    }

    const content = value.candidates[0].content;

    if (!content && content !== '') {
      throw new Error('No content returned in candidate.');
    }

    const candidates = value.candidates.map(c => c.content!) || [];

    const messages = [] as APIMessage[];

    return {
      response: content,
      candidates,
      history: this.messagesFromApi(messages),
    };
  }

  private messagesToApi(messages: Message[]): APIMessage[] {
    const out: APIMessage[] = [];
    for (const message of messages) {
      if (!message.prompt || !message.response) {
        logs.warnMissingPromptOrResponse(message.path!);
        continue;
      }
      out.push({author: '0', content: message.prompt});
      out.push({author: '1', content: message.response});
    }
    return out;
  }

  private messagesFromApi(messages: APIMessage[]): Message[] {
    const out = [];
    for (let i = 0; i < messages.length; i += 2) {
      out.push({
        prompt: messages[i].content || '',
        response: messages[i + 1]?.content || '',
      });
    }
    return out;
  }

  private messagesToExamples(messages: Message[]): APIExample[] {
    return messages.map(m => ({
      input: {author: '0', content: m.prompt!},
      output: {author: '1', content: m.response!},
    }));
  }
}

// function to truncate payload to an upper limit of bytes (20k but leave some room for other fields and overhead)
function truncatePrompt(prompt: PaLMPrompt, bytes = 19500): PaLMPrompt {
  let payloadBytes = Buffer.byteLength(JSON.stringify(prompt), 'utf8');

  while (payloadBytes > bytes) {
    prompt.messages.shift();
    payloadBytes = Buffer.byteLength(JSON.stringify(prompt), 'utf8');
  }

  if (prompt.messages.length === 0) {
    throw new Error(
      'Payload size exceeded. This is either because the latest message is too long, or the context/examples you have provided are too long. Please try again with a shorter message, or reconfigure examples/context.'
    );
  }

  return prompt;
}
