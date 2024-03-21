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

package com.pipeline;

import java.util.Map;

import org.apache.avro.generic.GenericRecord;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.bigquery.SchemaAndRecord;
import org.apache.beam.sdk.io.gcp.firestore.FirestoreIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.SerializableFunction;
import org.apache.beam.sdk.values.KV;
import org.joda.time.DateTime;
import org.joda.time.Instant;
import org.slf4j.LoggerFactory;

import com.google.firestore.v1.Document;
import com.google.firestore.v1.Value;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

public class RestorationPipeline {
  private static final org.slf4j.Logger LOG = LoggerFactory.getLogger(RestorationPipeline.class);

  public interface MyOptions extends DataflowPipelineOptions,
      org.apache.beam.sdk.io.gcp.firestore.FirestoreOptions {

    @Description("The timestamp to read from Firestore")
    Long getTimestamp();

    void setTimestamp(Long value);

    @Description("The Firestore database to read from")
    String getFirestorePrimaryDb();

    void setFirestorePrimaryDb(String value);

    @Description("The Firestore database to write to")
    String getFirestoreSecondaryDb();

    void setFirestoreSecondaryDb(String value);

    @Description("The Firestore collection to read from, or '*' to read from all collections")
    String getFirestoreCollectionId();

    void setFirestoreCollectionId(String value);

    @Description("The BigQuery dataset Id to export the data from")
    String getBigQueryDataset();

    void setBigQueryDataset(String value);

    @Description("The BigQuery table Id to export the data from")
    String getBigQueryTable();

    void setBigQueryTable(String value);

  }

  public static void main(String[] args) {

    MyOptions options = PipelineOptionsFactory.fromArgs(args).withValidation().as(MyOptions.class);

    Pipeline pipeline = Pipeline.create(options);

    String project = options.getProject();
    String secondaryDatabase = options.getFirestoreSecondaryDb();
    String datasetId = options.getBigQueryDataset();
    String tableId = options.getBigQueryTable();

    options.setFirestoreDb(secondaryDatabase);

    LOG.info("Restoring to Firestore database: " + secondaryDatabase);

    // BigQuery read and subsequent Firestore write
    pipeline
        .apply("Read from BigQuery with Dynamic Query",
            BigQueryIO.read(new SerializableFunction<SchemaAndRecord, KV<String, Document>>() {
              public KV<String, Document> apply(SchemaAndRecord schemaAndRecord) {
                return convertToFirestoreValue(schemaAndRecord, project, secondaryDatabase);
              }
            }).fromQuery(constructQuery(options.getTimestamp(), project, datasetId, tableId)).usingStandardSql()
                .withTemplateCompatibility())
        .apply("Prepare write operations",
            new FirestoreHelpers.DocumentToWrite())
        .apply("Write to the Firestore database instance (From BigQuery)",
            FirestoreIO.v1().write().batchWrite().build());

    PipelineResult result = pipeline.run();

    // We try to identify if the pipeline is being run or a template is being
    // created
    if (options.as(DataflowPipelineOptions.class).getTemplateLocation() == null) {
      // If template location is null, then, pipeline is being run, so we can wait
      // until finish
      result.waitUntilFinish();
    }
  }

  private static String constructQuery(Long timestamp, String projectId, String datasetId, String tableId) {
    LOG.info("Querying BigQuery for changes " + timestamp);
    String query = "WITH RankedChanges AS (" +
        "    SELECT " +
        "        documentId," +
        "        documentPath," +
        "        changeType," +
        "        beforeData," +
        "        afterData," +
        "        timestamp," +
        "        ROW_NUMBER() OVER(PARTITION BY documentId ORDER BY timestamp DESC) as rank" +
        "    FROM `" + projectId + "." + datasetId + "." + tableId + "`" +
        "    WHERE timestamp < TIMESTAMP_SECONDS(" + (timestamp) + ") " +
        ") " +
        "SELECT " +
        "    documentId," +
        "    documentPath," +
        "    changeType," +
        "    beforeData," +
        "    afterData," +
        "    timestamp " +
        "FROM RankedChanges " +
        "WHERE rank = 1 " +
        "ORDER BY documentId, timestamp DESC";

    return query;

  }

  private static KV<String, Document> convertToFirestoreValue(SchemaAndRecord schemaAndRecord, String projectId,
      String databaseId) {

    GenericRecord record = schemaAndRecord.getRecord();

    String data = record.get("afterData").toString();
    String documentPath = createDocumentName(record.get("documentPath").toString(), projectId, databaseId);
    String changeType = record.get("changeType").toString();

    // this JsonElement has serialized data, e.g a string would be represented on
    // the json tree as {type: "STRING", value: "some string"}
    JsonElement dataJson = JsonParser.parseString(data);

    Map<String, Value> firestoreMap = FirestoreReconstructor.buildFirestoreMap(dataJson, projectId, databaseId);

    // using static methods as beam seems to error when passing an instance version
    // of FirestoreReconstructor to the transform
    Document doc = Document.newBuilder().putAllFields((Map<String, Value>) firestoreMap).setName(documentPath).build();

    KV<String, Document> kv = KV.of(changeType, doc);

    return kv;
  }

  private static String createDocumentName(String path, String projectId, String databaseId) {
    String documentPath = String.format(
        "projects/%s/databases/%s/documents",
        projectId,
        databaseId);

    return documentPath + "/" + path;
  }
}
