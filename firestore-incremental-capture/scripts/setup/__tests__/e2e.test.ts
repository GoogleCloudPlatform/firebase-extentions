const {exec} = require('child_process');
const path = require('path');

describe('e2e', () => {
  it('should work as expected', done => {
    const cliPath = path.join(__dirname, '../lib/index.js');

    /** Setup vars */
    const projectId = 'dev-extensions-testing';
    const database = 'sample_database';
    const location = 'us-central1';
    const databaseLocation = 'nam5';
    const extInstanceId = 'firestore-incremental-capture';
    const nonInteractive = '--non-interactive';

    /** Generate command */
    const command = `node ${cliPath} --project ${projectId} --database ${database} --location ${location} --databaseLocation ${databaseLocation} --extInstanceId ${extInstanceId} ${nonInteractive}`;

    exec(command, (error, stdout) => {
      console.log(stdout);
      if (error) {
        done(error);
        return;
      }

      // Here you can make assertions based on stdout or stderr
      expect(stdout).toContain('JAR file downloaded successfully.');
      expect(stdout).toContain('✔ Successfully downloaded assets.');
      expect(stdout).toContain('✔ PITR enabled successfully.');
      expect(stdout).toContain('✔ Database setup successfully.');
      expect(stdout).toContain('✔ Artifact Registry configured successfully.');
      expect(stdout).toContain('✔ Roles added successfully.');
      expect(stdout).toContain('✔ Dataflow Flex Template built successfully.');
      done();
    });
  }, 720000);
});
