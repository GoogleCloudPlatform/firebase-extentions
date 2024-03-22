## Building the Dataflow Flex Template

Before this extension can run restoration jobs from BigQuery to Firestore, you must build the Dataflow Flex Template. This is a one-time process that you must perform before you can use the extension.

We have detailed the steps below, or there is a single script you can run which will perform all the steps for you [here](https://github.com/GoogleCloudPlatform/firebase-extensions/blob/main/firestore-incremental-capture/install/run.sh), you can run it with the following command:

```bash
sh run.sh PROJECT_ID DATABASE_ID LOCATION EXT_INSTANCE_ID
```

1. Find your extensions's service account email:

   ```bash
   gcloud iam service-accounts list --format="value(EMAIL)" --filter="displayName='Firebase Extensions ${param:EXT_INSTANCE_ID} service account' AND DISABLED=False" --project="${param:PROJECT_ID}"
   ```

   You can also do this through the console, by navigating to https://console.cloud.google.com/iam-admin/serviceaccounts?authuser=0&project=${param:PROJECT_ID}

2. [Configure the Artificat Registery](https://cloud.google.com/dataflow/docs/guides/templates/using-flex-templates?hl=en#configure):

```bash
  gcloud artifacts repositories create ${param:EXT_INSTANCE_ID} \
  --repository-format=docker \
  --location=${param:LOCATION} \
  --project=${param:PROJECT_ID} \
  --async
```

3. Configure Docker to authenticate requests for Artifact Registry:

   ```bash
   gcloud auth configure-docker ${param:LOCATION}-docker.pkg.dev
   ```

4. Add required policy binding for the repository:

```bash
  gcloud artifacts repositories add-iam-policy-binding ${param:EXT_INSTANCE_ID} \
  --location=${param:LOCATION} \
  --project=${param:PROJECT_ID} \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/artifactregistry.writer
```

5. Add the required role for the extension service account to trigger Dataflow:

   ```bash
    gcloud projects add-iam-policy-binding ${param:PROJECT_ID} \
    --project=${param:PROJECT_ID} \
    --member=serviceAccount:SA_EMAIL \
    --role=roles/iam.serviceAccountUser

    gcloud projects add-iam-policy-binding ${param:PROJECT_ID} \
    --project=${param:PROJECT_ID} \
    --member=serviceAccount:SA_EMAIL \
    --role=roles/artifactregistry.writer
   ```

6. Download the JAR file for the Dataflow Flex Template [here](https://github.com/GoogleCloudPlatform/firebase-extensions/tree/main/firestore-incremental-capture-pipeline/target/restore-firestore.jar).

7. Run the following command to build the Dataflow Flex Template:

```bash
  gcloud dataflow flex-template build gs://${param:PROJECT_ID}.appspot.com/${param:EXT_INSTANCE_ID}-dataflow-restore \
    --image-gcr-path ${param:LOCATION}-docker.pkg.dev/${param:PROJECT_ID}/${param:EXT_INSTANCE_ID}/dataflow/restore:latest \
    --sdk-language JAVA \
    --flex-template-base-image JAVA11 \
    --jar /path/to/restore-firestore.jar \
    --env FLEX_TEMPLATE_JAVA_MAIN_CLASS="com.pipeline.RestorationPipeline" \
    --project ${param:PROJECT_ID}
```

## Triggering a restoration job

You can trigger a restoration job by adding a new document to `_ext-${param:EXT_INSTANCE_ID}/restore/jobs` in your Firestore database. The document should have the following structure:

```json
{
  "timestamp": "2021-01-01T00:00:00Z", // A valid Firestore timestamp in the past
  "destinationDatabaseId": "test" // The destination Firestore database to restore to
}
```
