/* eslint-disable */
const {Spanner} = require('@google-cloud/spanner');
const {PreciseDate} = require('@google-cloud/precise-date');

(async () => {
  const projectId = 'dev-extensions-testing';
  const instanceId = 'my-instance';
  const databaseId = 'my-database';
  const backupId = 'my-backup';
  const versionTime = Date.now() - 1000 * 60 * 60 * 24; // One day ago

  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const backup = instance.backup(backupId);

  // Creates a new backup of the database
  try {
    console.log(`Creating backup of database ${database.formattedName_}.`);
    const databasePath = database.formattedName_;
    // Expire backup 14 days in the future
    const expireTime = Date.now() + 1000 * 60 * 60 * 24 * 14;
    // Create a backup of the state of the database at the current time.
    const [, operation] = await backup.create({
      databasePath: databasePath,
      expireTime: expireTime,
      versionTime: versionTime,
    });

    console.log(`Waiting for backup ${backup.formattedName_} to complete...`);
    await operation.promise();

    // Verify backup is ready
    const [backupInfo] = await backup.getMetadata();
    if (backupInfo.state === 'READY') {
      console.log(
        `Backup ${backupInfo.name} of size ` +
          `${backupInfo.sizeBytes} bytes was created at ` +
          `${new PreciseDate(backupInfo.createTime).toISOString()} ` +
          'for version of database at ' +
          `${new PreciseDate(backupInfo.versionTime).toISOString()}`
      );
    } else {
      console.error('ERROR: Backup is not ready.');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    await database.close();
  }
})();
