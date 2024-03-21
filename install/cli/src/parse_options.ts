import { program } from 'commander';
import inquirer from 'inquirer';
program
  .version('0.1.0')
  .description(
    'An interactive script to demonstrate argument parsing, colored output, and running shell commands in TypeScript.'
  )
  .option('-p, --projectId <projectId>', 'Project ID')
  .option('-l, --location <location>', 'Location')
  .option('-e, --extInstanceId <extInstanceId>', 'Extension Instance ID')
  .option(
    '-j --jarLocalDir <jarLocalDir>',
    'Path to local directory to save the JAR file'
  );

export async function getMissingOptions() {
  program.parse(process.argv);
  const options = program.opts();
  const questions = [];
  if (!options.projectId) {
    questions.push({
      type: 'input',
      name: 'projectId',
      message: 'What is your Project ID?',
    });
  }
  if (!options.location) {
    questions.push({
      type: 'input',
      name: 'location',
      message: 'What is your Location?',
    });
  }
  if (!options.extInstanceId) {
    questions.push({
      type: 'input',
      name: 'extInstanceId',
      message: 'What is your Extension Instance ID?',
    });
  }
  if (!options.jarLocalPath) {
    questions.push({
      type: 'input',
      name: 'jarLocalDir',
      message:
        'Where do you want to store the jar file for the Dataflow template locally? (Defaults to cwd)',
      default: process.cwd(),
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    ...answers,
  };
}
