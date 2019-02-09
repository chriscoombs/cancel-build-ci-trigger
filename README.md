# Cancel Build for CI Trigger

This Azure DevOps build task augments the continuous integration (CI) trigger path filters feature.

This task prevents a build when a branch is pushed but contains no changes in path.

The task compares the files in the triggering commit, with the CI path filters. If the CI path filters do not include (or exclude) the files in the triggering commit, the build is cancelled.

## Build Instructions

Navigate to the function directory

```
cd function
```

and run the build command

```
npm run build
```

(after the initial build, please remember to increase the version number in vss-extension.json, task.json and package.json).

## Azure DevOps Installation Instructions/Requirements

For Azure DevOps installation instructions/requirements please see [marketplace.md](marketplace.md).

## License

MIT

## Acknowledgments

* Icon by Smashicons licensed under CC 3.0 BY
* Daniel Midler for the idea!