import {
  gemini10Pro as gemini10ProGoogleAI,
  gemini15Flash as gemini15FlashGoogleAI,
  gemini15Pro as gemini15ProGoogleAI,
  googleAI,
  PluginOptions as PluginOptionsGoogleAI,
} from '@genkit-ai/googleai';

import vertexAI, {
  gemini10Pro as gemini10ProVertexAI,
  gemini15Flash as gemini15FlashVertexAI,
  gemini15Pro as gemini15ProVertexAI,
  PluginOptions as PluginOptionsVertexAI,
} from '@genkit-ai/vertexai';
import {Config} from '../../config';
import {GenerateOptions} from 'genkit';

export const toGenkitModelReferenceGoogleAI = (model: string) => {
  for (const modelReference of [
    gemini10ProGoogleAI,
    gemini15FlashGoogleAI,
    gemini15ProGoogleAI,
  ]) {
    if (modelReference.name === model) {
      return modelReference;
    }
    if (modelReference.info?.versions?.includes(model)) {
      return modelReference.withVersion(model);
    }
  }
  return null;
};

export const toGenkitModelReferenceVertexAI = (model: string) => {
  for (const modelReference of [
    gemini10ProVertexAI,
    gemini15FlashVertexAI,
    gemini15ProVertexAI,
  ]) {
    if (modelReference.name === model) {
      return modelReference;
    }
    if (modelReference.info?.versions?.includes(model)) {
      return modelReference.withVersion(model);
    }
  }
  return null;
};

export const toGenkitModelReference = (
  model: string,
  provider: 'google-ai' | 'vertex-ai'
) => {
  if (provider === 'google-ai') {
    return toGenkitModelReferenceGoogleAI(model);
  }
  if (provider === 'vertex-ai') {
    return toGenkitModelReferenceVertexAI(model);
  }
  return null;
};

export const toGenkitPlugin = (provider: 'google-ai' | 'vertex-ai') => {
  if (provider === 'google-ai') {
    return googleAI;
  }
  if (provider === 'vertex-ai') {
    return vertexAI;
  }
  return null;
};

export const shouldUseGenkit = (config: Config): boolean => {
  const shouldReturnMultipleCandidates =
    config.candidateCount && config.candidateCount > 1;

  const genkitPlugin = toGenkitPlugin(config.provider);

  const genkitModelReference = toGenkitModelReference(
    config.model,
    config.provider
  );

  return (
    !!shouldReturnMultipleCandidates && !!genkitPlugin && !!genkitModelReference
  );
};

export const toGenkitGenerateOptions = (config: Config) => {
  const model = toGenkitModelReference(config.model, config.provider);
  if (!model) {
    throw new Error('Model not found.');
  }

  const options: GenerateOptions = {
    model,
    config: {
      topP: config.topP,
      topK: config.topK,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      safetySettings: config.safetySettings,
    },
  };

  return options;
};
