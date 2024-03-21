## Debug the pipeline locally

To debug this pipeline locally, use the `DirectRunner`:

```bash
mvn compile exec:java \
    -Dexec.mainClass=com.pipeline.RestorationPipeline \
    -Dexec.args='--timestamp=1707436800 --firestoreCollectionId="*" --firestoreDb="test" --tempLocation="gs://PROJECT_ID.appspot.com" --project="PROJECT_ID" --bigQueryTable=changelog --bigQueryDataset=sync --firestoreSecondaryDb=test --firestorePrimaryDb=(default)'
```

### Arguments

- `timestamp`: The timestamp to restore the data to from a PITR, if it's further than 7 days in the past, it will be set to 7 days in the past. The timestamp is in UNIX seconds.
- `firestoreCollectionId`: The collection to restore, use `*` if you want the full database.

## Compile JAR to run on Dataflow

```bash
mvn clean package -DskipTests -Dexec.mainClass=com.pipeline.RestorationPipeline
```