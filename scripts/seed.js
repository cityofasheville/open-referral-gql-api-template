/* eslint-disable no-console, spaced-comment */
require('dotenv').config();
const fs = require('fs');
const Logger = require('coa-node-logging');
const ConnectionManager = require('../common/db/connection_manager');
const connectionDefinitions = require('../common/connection_definitions');
const fk = require('faker')
const uuid = require('../common/uuid');

const logger = new Logger('or-api', './or-api.log');

const connectionManager = new ConnectionManager(connectionDefinitions, logger);

async function runSql(filePath, dbName) {
  const fdSql = fs.openSync(filePath, 'r');
  const sql = fs.readFileSync(fdSql, { encoding: 'utf8' });
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

async function runTaskSequence(tables) {
  let result = null;
  let hasError = false;
  let errMessage = '';
  const cn = connectionManager.getConnection('aws');


  // Set up the organization
  const i = fk.random.number({min: 1, max: 100000});
  const orgId = uuid();
  
  let args = [
    orgId, // orgId
    `${fk.company.companyName()}, ${fk.company.companySuffix()}`, // name
    fk.company.catchPhrase(), // alternateName
    fk.lorem.paragraph(), // description
    fk.internet.email(), // email
    fk.internet.url(), // url
    (i % 2 == 0) ? '501(c)3' : null, // tax_status
    fk.random.number({min: 100000, max: 10000000}), // tax_id
    fk.date.between('1951-01-01', '2015-12-31'), // year_incorporated
    (i % 2 == 0) ? 'Non-profit' : 'Corporation', // legal_status
  ];

  let query = `insert into organizations
    (id, name, alternate_name, description, email, url,
      tax_status, tax_id, year_incorporated, legal_status)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
  
  return cn.query(query, args)
  .then(res => {
    console.log('Back from query')
  })
  .catch(err => Promise.reject(`Query error: ${err.message}`));
}

const jobs = require('./sql/tables');

return runTaskSequence(jobs, 'db')
.then((status) => {
  process.exit(0);
})
.catch((err) => {
  console.log(`Error: ${err}`);
  logger.error(`Error: ${JSON.stringify(err)}`);
  process.exit(1);
});




