const buildInterface = require('azure-devops-node-api/interfaces/BuildInterfaces');
const api = require('azure-devops-node-api');
const task = require('azure-pipelines-task-lib/task');

const getConnection = () => {
  const url = task.getVariable('System.TeamFoundationCollectionUri');
  const token = task.getVariable('System.AccessToken');
  if (!token) {
    throw new Error('Agent unable to access System.AccessToken, please enable "Allow scripts to access the OAuth token" to proceed.');
  }
  const handler = api.getBearerHandler(token);
  return new api.WebApi(url, handler);
};

const getPathFilters = trigger => ((trigger.pathFilters)
  ? trigger.pathFilters.map((pathFilter) => {
    let updatedPathFilter = pathFilter;
    updatedPathFilter = (pathFilter.startsWith('+'))
      ? pathFilter.substring(1)
      : `!${pathFilter.substring(1)}`;
    if (updatedPathFilter.startsWith('/')) {
      updatedPathFilter = updatedPathFilter.substring(1);
    }
    return `${updatedPathFilter}/**/*`;
  })
  : ['**/*']);

const match = (files, pathFilters) => task.match(files, pathFilters);

const isInPathFilters = (files, definition) => {
  const trigger = definition.triggers.find(t => (t.triggerType === buildInterface.DefinitionTriggerType.ContinuousIntegration)); // eslint-disable-line max-len
  const pathFilters = getPathFilters(trigger);
  console.log(`Matching commit files ${files.toString()} against CI path filters ${pathFilters.toString()}...`);
  const matched = match(files, pathFilters);
  return (matched.length > 0);
};

const run = async () => {
  try {
    console.log('Getting environemnt variables...');
    const commitId = task.getVariable('Build.SourceVersion');
    const sourcesDirectory = task.getVariable('Build.SourcesDirectory');
    const buildId = parseInt(task.getVariable('Build.BuildId'), 10);
    const project = task.getVariable('System.TeamProject');
    const reason = task.getVariable('Build.Reason');
    if (reason === 'IndividualCI' || reason === 'BatchedCI') {
      console.log('Connecting to Build API...');
      const buildApi = await getConnection().getBuildApi();
      console.log('Getting build...');
      const build = await buildApi.getBuild(buildId, project);
      if (build.status === buildInterface.BuildStatus.NotStarted
        || build.status === buildInterface.BuildStatus.InProgress) {
        console.log(`Build ${buildInterface.BuildStatus.NotStarted ? 'not started' : 'in progress'}...`);
        const options = {
          cwd: sourcesDirectory,
        };
        console.log('Getting log for branch...');
        const result = task.execSync('git', `diff-tree --no-commit-id --name-only -r ${commitId}`, options);
        // check for errors
        const files = result.stdout.toString().split('\n').filter(file => (file !== ''));
        console.log('Getting definition for build...');
        const definition = await buildApi.getDefinition(build.definition.id, project);
        if (isInPathFilters(files, definition)) {
          console.log('Files match! Continuing with build...');
        } else {
          console.log('Cancelling build...');
          build.status = buildInterface.BuildStatus.Cancelling;
          await buildApi.updateBuild(build, buildId);
          console.log('Waiting for build to cancel...');
          setTimeout(() => {
            console.log('Wait timeout reached');
            task.setResult(task.TaskResult.Failed, 'Timeout');
          }, 10000);
        }
      }
    }
    task.setResult(task.TaskResult.Succeeded, 'Success');
  } catch (err) {
    task.setResult(task.TaskResult.Failed, err.message);
  }
};

module.exports = {
  isInPathFilters,
  getPathFilters,
  match,
  run,
};
