/* eslint-disable */
const {BigQuery} = require('@google-cloud/bigquery');

const bq = new BigQuery({projectId: 'dev-extensions-testing'});

(async () => {
  /** Get all the records from before  2023-08-22 13:23 */
  const query =
    "SELECT * FROM `dev-extensions-testing.syncData.syncData` WHERE timestamp < TIMESTAMP('2023-08-22 13:23:00')";

  /** Execute the query */
  await bq.query(query).then(data => {
    console.log(data);
  });
})();
