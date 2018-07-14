/* eslint-disable no-console, spaced-comment */
require('dotenv').config();
const fs = require('fs');
const Logger = require('coa-node-logging');
const ConnectionManager = require('./db/connection_manager');
const connectionDefinitions = require('./connection_definitions');

const logger = new Logger('or-api', './or-api.log');

const connectionManager = new ConnectionManager(connectionDefinitions, logger);

async function runSql(sql, dbName) {
  const cn = connectionManager.getConnection(dbName);
  if (!cn) {
    console.log('No database connection');
  }
  return cn.query(sql)
  .then((res) => {
    if (res instanceof Array) {
      return res[res.length - 1];
    }
    return res;
  })
  .catch(err => Promise.reject(`Query error: ${err.message}`));
}

async function runTaskSequence(tasks) {
  let result = null;
  let hasError = false;
  let errMessage = '';

  for (let i = 0; i < tasks.length && !hasError; i += 1) {
    const task = tasks[i].name;
    console.log(`Run task ${task}`);
    try {
      result = await runSql(`drop table ${task}; select 'OK' as result;`, 'aws');
    } catch (err) {
      hasError = true;
      errMessage = err;
      logger.error(`Error running ${task} SQL job: ${err}`);
    }
  }
  if (hasError) {
    console.log('We have an error!');

    return Promise.reject(`Error running the job. ${errMessage}`);
  }
  return Promise.resolve(result.rows);
}

const jobs = require('./sql/tables').reverse();
console.log(jobs);

return runTaskSequence(jobs, 'db')
.then((status) => {
  console.log("Back from task sequence");
  if (status[0].result !== 'OK') throw new Error(`Bad result creating tables: ${status[0].result}`);
  process.exit(0);
})
.catch((err) => {
  console.log(`Error: ${err}`);
  logger.error(`Error: ${JSON.stringify(err)}`);
  process.exit(1);
});




