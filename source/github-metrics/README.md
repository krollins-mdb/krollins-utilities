This should be a Node.js and TypeScript project that uses the MonogDB Node.js Driver to interact with an Atlas cluster.

The goal is to aggregate data across 3 collections in the `github_metrics` database. Those collections are:

- mongodb_sample-app-java-mflix
- mongodb_sample-app-python-mflix
- mongodb_sample-app-nodejs-mflix

The output should sum the numeric fields of every document in each collection and create a report in the console that breaks down the totals.
