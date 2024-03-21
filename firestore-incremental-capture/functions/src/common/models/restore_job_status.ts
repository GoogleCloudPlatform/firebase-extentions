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

export enum RestoreStatus {
  NOT_STARTED = 'NOT_STARTED',
  RUNNING_RESTORE = 'RUNNING_RESTORE',
  RUNNING_DATAFLOW = 'RUNNING_DATAFLOW',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum RestoreError {
  INVALID_TIMESTAMP = 'The timestamp is invalid',
  MISSING_DESTINATION_DATABASE_ID = 'The destination database ID is missing',
  EXCEPTION = 'An exception occurred',
  BACKUP_NOT_FOUND = 'Backup not found',
  BACKUP_SCHEDULE_NOT_FOUND = 'Scheduled backup not found, one has been created just now, please try again once the first backup is ready',
}
