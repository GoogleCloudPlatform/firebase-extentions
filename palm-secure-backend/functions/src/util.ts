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
import {CallableContext, HttpsError} from 'firebase-functions/v1/https';
import {FunctionsErrorCode} from 'firebase-functions/v1/https';
import config from './config';

const checkAuth = (context: CallableContext) => {
  if (!context.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
};

const checkAppCheck = (context: CallableContext) => {
  if (context.app == undefined) {
    throw new HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.'
    );
  }
};

export function onAuthenticatedCall<TData, TResponse>(
  handler: (data: TData, context: functions.https.CallableContext) => TResponse
): functions.HttpsFunction & functions.Runnable<TData> {
  return functions
    .runWith({
      enforceAppCheck: config.enforceAppCheck, // Requests without valid App Check tokens will be rejected.
      consumeAppCheckToken: true,
    })
    .https.onCall(async (data, context) => {
      if (config.enforceAppCheck) {
        checkAppCheck(context);
      }
      checkAuth(context);
      return handler(data, context);
    });
}

export const fetchFromApi = async (url: string, options?: RequestInit) => {
  let response: Response;

  const urlWithKey = `${url}?key=${config.apiKey}`;

  try {
    response = await fetch(urlWithKey, options);
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpsError('internal', e.message);
    }
    throw new HttpsError('internal', 'Unknown error');
  }

  const body = await getDataFromResponse(response);

  if (!response.ok) {
    let message: string;
    let details: any;
    if (typeof body !== 'string' && body.error) {
      message = body.error.message;

      if (body.error.details && body.error.details.length > 0) {
        details = {...body.error.details[0], httpErrorCode: response.status};
      } else if (body.error.details) {
        details = {...body.error.details, httpErrorCode: response.status};
      }
    } else {
      message = response.statusText ?? 'Unknown error, see details';
      details = {
        httpErrorCode: response.status,
      };
    }
    throw new HttpsError(
      codeToFunctionsErrorCode[response.status] || 'internal',
      message,
      details
    );
  }
  return body;
};

const getDataFromResponse = async (
  response: Response
): Promise<{error: Record<string, any>} | string> => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    return response.json();
  } else {
    return await response.text();
  }
};

export const codeToFunctionsErrorCode: Record<number, FunctionsErrorCode> = {
  400: 'invalid-argument',
  401: 'unauthenticated',
  403: 'permission-denied',
  404: 'not-found',
  409: 'already-exists',
  429: 'resource-exhausted',
  499: 'cancelled',
  500: 'internal',
  501: 'unimplemented',
  503: 'unavailable',
  504: 'deadline-exceeded',
};

export function callCustomHookIfEnabled(
  fetchArgs: {url?: string; options?: Record<string, unknown>},
  responseOrError: unknown,
  uid?: string
) {
  if (config.customHookUrl) {
    fetch(config.customHookUrl, {
      method: 'POST',
      body: JSON.stringify({
        fetchArgs,
        responseOrError,
        uid,
      }),
    });
  }
}
