// Hoisted mocks
const {mockGenerate, mockGoogleAI} = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
  mockGoogleAI: vi.fn(() => ({})),
}));

// Mock setup using hoisted mocks
vi.mock('genkit', () => ({
  genkit: vi.fn(() => ({
    generate: mockGenerate,
  })),
}));

vi.mock('@genkit-ai/google', () => ({
  default: mockGoogleAI,
}));

// Type imports
import {Change} from 'firebase-functions/v1';
import type {WrappedFunction} from 'firebase-functions-test/lib/v1';
import type {QuerySnapshot} from 'firebase-admin/firestore';

// Regular imports
import * as admin from 'firebase-admin';
const firebaseFunctionsTest = require('firebase-functions-test');

import {describe, beforeEach, afterEach, test, expect, vi} from 'vitest';
import {expectToProcessCorrectly} from '../util';

// Mock configuration
vi.mock('../../src/config', () => ({
  default: {
    googleAi: {
      model: 'gemini-1.5-flash',
      apiKey: 'test-api-key',
    },
    vertex: {
      model: 'gemini-1.5-flash',
    },
    collectionName: 'discussionsTestGenerative/{discussionId}/messages',
    location: 'us-central1',
    orderField: 'createTime',
    promptField: 'prompt',
    responseField: 'response',
    enableDiscussionOptionOverrides: true,
    candidatesField: 'candidates',
    provider: 'google-ai',
    model: 'gemini-1.5-flash',
    apiKey: 'test-api-key',
  },
}));

// Import modules that depend on mocks
import config from '../../src/config';
import {generateMessage} from '../../src/index';

process.env.GCLOUD_PROJECT = 'demo-gcp';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const fft = firebaseFunctionsTest({
  projectId: 'demo-gcp',
});

admin.initializeApp({
  projectId: 'demo-gcp',
});

type DocumentReference = admin.firestore.DocumentReference;
type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot<DocumentData>;
const Timestamp = admin.firestore.Timestamp;

type WrappedFirebaseFunction = WrappedFunction<
  Change<DocumentSnapshot | undefined>,
  void
>;

const wrappedGenerateMessage = fft.wrap(
  generateMessage
) as WrappedFirebaseFunction;

const firestoreObserver = vi.fn((_x: any) => {});
let collectionName: string;

describe('generateMessage Google AI', () => {
  let unsubscribe: (() => void) | undefined;

  beforeEach(async () => {
    await fetch(
      `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-gcp/databases/(default)/documents`,
      {method: 'DELETE'}
    );
    vi.clearAllMocks();
    const randomInteger = Math.floor(Math.random() * 1000000);
    collectionName = config.collectionName.replace(
      '{discussionId}',
      randomInteger.toString()
    );

    unsubscribe = admin
      .firestore()
      .collection(collectionName)
      .onSnapshot((snap: QuerySnapshot) => {
        if (snap.docs.length) firestoreObserver(snap);
      });

    // Setup mock response
    mockGenerate.mockResolvedValue({
      text: 'test response',
      candidates: [],
      history: [],
    });
  });

  afterEach(() => {
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
    }
    vi.clearAllMocks();
  });

  test('should not run if the prompt field is not set', async () => {
    const notMessage = {
      notPrompt: 'hello chat bison',
    };
    const ref = await admin
      .firestore()
      .collection(collectionName)
      .add(notMessage);

    await simulateFunctionTriggered(wrappedGenerateMessage)(ref);

    await expectNoOp();
  });

  test('should not run if the prompt field is empty', async () => {
    const notMessage = {
      prompt: '',
    };

    const ref = await admin
      .firestore()
      .collection(collectionName)
      .add(notMessage);

    await simulateFunctionTriggered(wrappedGenerateMessage)(ref);

    await expectNoOp();
  });

  test('should not run if the prompt field is not a string', async () => {
    const notMessage = {
      prompt: 123,
    };

    const ref = await admin
      .firestore()
      .collection(collectionName)
      .add(notMessage);

    await simulateFunctionTriggered(wrappedGenerateMessage)(ref);

    await expectNoOp();
  });

  test('should run when given createTime', async () => {
    const message = {
      prompt: 'hello chat bison',
      createTime: Timestamp.now(),
    };
    const ref = await admin.firestore().collection(collectionName).add(message);

    await simulateFunctionTriggered(wrappedGenerateMessage)(ref);

    expect(firestoreObserver).toHaveBeenCalledTimes(3);

    const firestoreCallData = firestoreObserver.mock.calls.map(call =>
      call[0].docs[0].data()
    );

    expectToProcessCorrectly(
      firestoreCallData,
      message,
      false,
      'test response'
    );

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      prompt: [{text: 'hello chat bison'}],
      messages: [],
      model: 'googleai/gemini-1.5-flash',
      config: {
        topP: undefined,
        topK: undefined,
        temperature: undefined,
        maxOutputTokens: undefined,
      },
    });
  });

  test('should run when not given createTime', async () => {
    const message = {
      prompt: 'hello world',
    };

    const ref = await admin.firestore().collection(collectionName).add(message);

    const beforeOrderField = await simulateFunctionTriggered(
      wrappedGenerateMessage
    )(ref);

    await simulateFunctionTriggered(wrappedGenerateMessage)(
      ref,
      beforeOrderField
    );

    expect(firestoreObserver).toHaveBeenCalledTimes(3);

    const firestoreCallData = firestoreObserver.mock.calls.map(call =>
      call[0].docs[0].data()
    );

    expectToProcessCorrectly(firestoreCallData, message, true, 'test response');

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      prompt: [{text: 'hello world'}],
      messages: [],
      model: 'googleai/gemini-1.5-flash',
      config: {
        topP: undefined,
        topK: undefined,
        temperature: undefined,
        maxOutputTokens: undefined,
      },
    });
  });

  test('should handle errors from genkit', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('API Error'));

    const message = {
      prompt: 'hello world',
      createTime: Timestamp.now(),
    };

    const ref = await admin.firestore().collection(collectionName).add(message);
    await simulateFunctionTriggered(wrappedGenerateMessage)(ref);
    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedDoc = await ref.get();
    const data = updatedDoc.data();

    expect(data).toMatchObject({
      prompt: 'hello world',
      status: {
        state: 'ERROR',
        error:
          'An error occurred while processing the provided message, API Error',
        updateTime: expect.any(Timestamp),
      },
    });

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(firestoreObserver).toHaveBeenCalled();
  });
});

const simulateFunctionTriggered =
  (wrappedFunction: WrappedFirebaseFunction) =>
  async (ref: DocumentReference, before?: DocumentSnapshot) => {
    const data = (await ref.get()).data() as {[key: string]: unknown};
    const beforeFunctionExecution = fft.firestore.makeDocumentSnapshot(
      data,
      `${collectionName}/${ref.id}`
    ) as DocumentSnapshot;
    const change = fft.makeChange(before, beforeFunctionExecution);
    try {
      await wrappedFunction(change);
      return beforeFunctionExecution;
    } catch (error) {
      throw error;
    }
  };

const expectNoOp = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(firestoreObserver).toHaveBeenCalledTimes(1);
  expect(mockGenerate).toHaveBeenCalledTimes(0);
};
