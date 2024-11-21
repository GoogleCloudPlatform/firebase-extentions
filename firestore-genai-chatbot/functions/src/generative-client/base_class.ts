import {MessageData, Part} from 'genkit';

export interface Message {
  path?: string;
  prompt?: string;
  response?: string;
}

export interface ChatResponse {
  response: string;
  candidates?: string[];
  safetyMetadata?: any;
  history: MessageData[];
}

export abstract class DiscussionClient<
  Genkit,
  ChatOptions extends {
    history?: Message[];
    context?: string;
  },
> {
  client: Genkit;
  constructor(client: Genkit) {
    this.client = client;
  }

  private getHistory(options: ChatOptions) {
    const history: MessageData[] = [];
    if (options.context) {
      history.push({content: [{text: options.context}], role: 'system'});
    }

    if (options.history) {
      options.history.forEach(message => {
        if (!message.response) return;
        history.push({content: [{text: message.prompt ?? ''}], role: 'user'});
        history.push({
          content: [{text: message.response ?? ''}],
          role: 'model',
        });
      });
    }

    return history;
  }

  async send(
    messageContent: string,
    options: ChatOptions
  ): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('Client not initialized.');
    }
    const history = this.getHistory(options);
    const latestApiMessage = this.createApiMessage(messageContent);
    const res = await this.generateResponse(history, latestApiMessage, options);

    console.log('RES', res);
    return res;
  }

  createApiMessage(_messageContent: string): Part[] {
    return [{text: _messageContent}];
  }

  async generateResponse(
    _history: MessageData[],
    _latestApiMessage: Part[],
    _options: ChatOptions
  ): Promise<ChatResponse> {
    throw new Error('Not implemented');
  }
}
