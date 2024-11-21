import {logger} from 'firebase-functions/v1';
import {logger as genkitLogger} from 'genkit/logging';
import {Part, MessageData, Genkit, genkit} from 'genkit';
import {z} from 'genkit';
import {DiscussionClient} from './base_class';
import {Message} from '../types';
import {vertexAI, gemini15Flash} from '@genkit-ai/vertexai';
import config from '../config';
interface GeminiChatOptions {
  history?: Message[];
  model: string;
  temperature?: number;
  candidateCount?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  projectId: string;
  location: string;
  context?: string;
}

const ai = genkit({
  plugins: [vertexAI()],
});

genkitLogger.setLogLevel('debug');

// Schema for validating `custom` field
const CustomSchema = z.object({
  candidates: z.array(
    z.object({
      safetyRatings: z.array(z.any()).optional(),
    })
  ),
});

export class VertexDiscussionClient extends DiscussionClient<
  Genkit,
  GeminiChatOptions
> {
  modelName: string;

  constructor({modelName}: {apiKey?: string; modelName: string}) {
    super(ai);
    if (!modelName) {
      throw new Error('Model name required.');
    }
    this.modelName = modelName;
  }

  async generateResponse(
    history: MessageData[],
    latestApiMessage: Part[],
    options: GeminiChatOptions
  ) {
    try {
      const llmResponse = await this.client.generate({
        prompt: latestApiMessage,
        messages: history,
        model: `vertexai/${this.modelName}` as unknown as typeof gemini15Flash,
        config: {
          topP: options.topP,
          topK: options.topK,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
          safetySettings: config.safetySettings,
        },
      });

      // Safe parsing of `custom` using CustomSchema
      const safeCustom = CustomSchema.safeParse(llmResponse.custom);

      if (safeCustom.success) {
        return {
          response: llmResponse.text,
          candidates: safeCustom.data.candidates.map(c => JSON.stringify(c)),
          safetyMetadata: safeCustom.data.candidates[0]?.safetyRatings,
          history,
        };
      } else {
        return {
          response: llmResponse.text,
          candidates: (llmResponse.custom as any).candidates.map((c: any) =>
            JSON.stringify(c)
          ),
          history,
        };
      }
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}
