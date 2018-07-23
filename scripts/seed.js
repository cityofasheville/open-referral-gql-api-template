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
  const j = fk.random.number({min: 1, max: 100000});
  const orgId = uuid();
  const programId = uuid();
  const serviceId = uuid();
  let taxonomies = [];
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
    return cn.query('select * from taxonomies')
  })
  .then(res => {
    console.log(res.rows);
    console.log(res.rows.length);
    // Add taxonomies
    if(res.rows.length > 0) {
      taxonomies = res.rows.map(itm => {
        return {name: itm.name, id: itm.id};
      });
      return Promise.resolve(null);
    }
    taxonomies = [
      { name: 'housing', id: uuid() },
      { name: 'benefits', id: uuid() },
      { name: 'education', id: uuid() },
      { name: 'health', id: uuid() },
      { name: 'jobs', id: uuid() },
      { name: 'legal', id: uuid() },
      { name: 'support', id: uuid() },
    ];
    query = `insert into taxonomies (id, name)
    values `;
    taxonomies.forEach((t, icnt) => {
      query += `('${t.id}', '${t.name}' )`
      if (icnt < taxonomies.length - 1) query += ', ';
    });
    return cn.query(query);
  })
  .then(res => {
    // Now set up a program
    return cn.query(
      `insert into programs (id, name, alternate_name, organization_id) values ('${programId}', $1, $2, '${orgId}')`,
      [
        fk.commerce.productName(),
        (j % 2 == 0) ? fk.commerce.productName() : null,
      ]
    );
  })
  .then(res => {
    // Now set up service
    return cn.query(
      `insert into services (id, organization_id, program_id, name,
        alternate_name, description, url, status)
        values (
          '${serviceId}', '${orgId}', '${programId}', $1, $2, $3, $4, 'active'
        )`,
        [
          fk.commerce.productName(),
          ((i%j)%2 == 0) ? fk.commerce.productName() : null,
          fk.lorem.paragraph(), // description
          fk.internet.url(), // url
        ]
    );
  })
  .then(res => {
    const tindex = fk.random.number({min: 0, max: 6});
    return cn.query(
      `insert into service_taxonomies (id, service_id, taxonomy_id)
       values ('${uuid()}', '${serviceId}', '${taxonomies[tindex].id}')`
    );
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




