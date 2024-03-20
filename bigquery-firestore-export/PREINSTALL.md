This extension helps you set up automated, scheduled jobs that run BigQuery queries and subsequently export the query results to Firestore. A common use case for this extension is to present application-driven analytics, like product engagement metrics or election results, from Firestore, using batch data originally stored and aggregated by BigQuery.

To use the extension, configure a BigQuery query to execute along with a schedule to execute the query. Each scheduled BigQuery query run will result in:

- A summary of each BigQuery query run, stored in a “runId” document.
- Actual rows from BigQuery query results, stored as individual Firestore documents in an “output” subcollection under the “runId” document (i.e. transferConfigs/<configId>/runs/<runId>/output).

```
COLLECTION: transferConfigs/<configId>/runs/<runId>
DOCUMENT: {
  runMetadata: { },
  totalRowCount: 779,
  failedRowCount: 0
}
```

To determine what the latest run is for a scheduled BigQuery query, read the metadata from the “latest” document in Firestore. Frontend applications using Firestore real-time listeners can subscribe to the “latest” document to listen for changes, in order to query and render the latest scheduled run results.

```
COLLECTION: transferConfigs/<configId>/runs/latest
DOCUMENT: {
  runMetadata: { },
  totalRowCount: 779,
  failedRowCount: 0,
  latestRunId: 648762e0-0000-28ef-9109-001a11446b2a
}
```

Underneath the covers, schedules are managed by BigQuery Transfer Configs using the [Data Transfer Service](https://cloud.google.com/bigquery/docs/scheduling-queries). Once a scheduled BigQuery query completes, the extension will export the results back to a configurable Firestore collection. To facilitate the export, the extension creates a Pub/Sub trigger to capture notification events for BigQuery scheduled query (transfer run) completions and subsequently conduct a BigQuery to Firestore data export job using a Cloud Function.

If you would like to specify multiple BigQuery queries at different intervals, you can create multiple instances of the extension.

**Additional Setup**

Make sure that you've set up a [Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

You will also need a BigQuery instance with a dataset that contains at least one table.

**Billing**

To install an extension, your project must be on the Blaze (pay as you go) plan.

You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).

This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:

- Cloud Pub/Sub
- Cloud Firestore
- BigQuery
- Cloud Functions (See FAQs)

> ⚠️ _Note: The extension does not automatically delete the BigQuery Transfer Config (scheduled query) when you uninstall the extension._

> _BigQuery charges by data processed, so your project will continue to incur costs until you manually delete the scheduled query. You can manage your scheduled queries directly in Cloud Console._
