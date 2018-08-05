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
  let locations = [];

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
  

  let fd = fs.openSync('./scripts/sample/locations.json', 'r');
  const nlocations = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' })).data.map(itm => {
    return {
      id: uuid(),
      name: itm.tag,
      alternate_name: itm.display_name,
    };
  });
  fs.closeSync(fd);
  fd = fs.openSync('./scripts/sample/taxonomies.json', 'r');
  const ntaxonomies = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' })).data.map(itm => {
    return {
      id: uuid(),
      name: itm.tag,
      alternate_name: itm.display_name,
    };
  });
  fs.closeSync(fd);

  let qq = 'insert into locations (id, name, alternate_name) values ';
  nlocations.forEach((loc, icnt) => {
    qq += `('${loc.id}', '${loc.name}', '${loc.alternate_name}')`
    if (icnt < nlocations.length - 1) qq += ', ';
  });
  
  return cn.query(qq)
  .then(() => {
    qq = 'insert into taxonomies (id, name, alternate_name) values ';
    ntaxonomies.forEach((loc, icnt) => {
      qq += `('${loc.id}', '${loc.name}', '${loc.alternate_name}')`
      if (icnt < ntaxonomies.length - 1) qq += ', ';
    });
    console.log(qq);
    return cn.query(qq)
    
  })
  .then (() => {
    return cn.query(query, args)
    .then(res => {
      return cn.query('select * from taxonomies')
    });
  })
  .then(res => {
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
  .then(res => {
    return cn.query('select * from locations')
  })
  .then(res => {
    // Add locations
    if(res.rows.length > 0) {
      locations = res.rows.map(itm => {
        return { name: itm.name, alternate_name: itm.alternate_name, id: itm.id };
      });
      return Promise.resolve(null);
    }
    locations = [
      { name: 'nc', alternate_name: 'North Carolina', id: uuid() },
      { name: 'alamance', alternate_name: 'Alamance', id: uuid() },
      { name: 'alexander', alternate_name: 'Alexander', id: uuid() },
      { name: 'alleghany', alternate_name: 'Alleghany', id: uuid() },
      { name: 'anson', alternate_name: 'Anson', id: uuid() },
      { name: 'ashe', alternate_name: 'Ashe', id: uuid() },
      { name: 'beaufort', alternate_name: 'Beaufort', id: uuid() },
      { name: 'bertie', alternate_name: 'Bertie', id: uuid() },
      { name: 'bladen', alternate_name: 'Bladen', id: uuid() },
      { name: 'brunswick', alternate_name: 'Brunswick', id: uuid() },
      { name: 'buncombe', alternate_name: 'Buncombe', id: uuid() },
      { name: 'burke', alternate_name: 'Burke', id: uuid() },
      { name: 'cabarrus', alternate_name: 'Cabarrus', id: uuid() },
      { name: 'caldwell', alternate_name: 'Caldwell', id: uuid() },
      { name: 'camden', alternate_name: 'Camden', id: uuid() },
      { name: 'cartere', alternate_name: 'Cartere', id: uuid() },
      { name: 'caswell', alternate_name: 'Caswell', id: uuid() },
      { name: 'catawba', alternate_name: 'Catawba', id: uuid() },
      { name: 'chatham', alternate_name: 'Chatham', id: uuid() },
      { name: 'cherokee', alternate_name: 'Cherokee', id: uuid() },
      { name: 'chowan', alternate_name: 'Chowan', id: uuid() },
      { name: 'clay', alternate_name: 'Clay', id: uuid() },
      { name: 'cleveland', alternate_name: 'Cleveland', id: uuid() },
      { name: 'columbus', alternate_name: 'Columbus', id: uuid() },
      { name: 'craven', alternate_name: 'Craven', id: uuid() },
      { name: 'cumberland', alternate_name: 'Cumberland', id: uuid() },
      { name: 'currituck', alternate_name: 'Currituck', id: uuid() },
      { name: 'dare', alternate_name: 'Dare', id: uuid() },
      { name: 'davidson', alternate_name: 'Davidson', id: uuid() },
      { name: 'davie', alternate_name: 'Davie', id: uuid() },
      { name: 'duplin', alternate_name: 'Duplin', id: uuid() },
      { name: 'durham', alternate_name: 'Durham', id: uuid() },
      { name: 'edgecombe', alternate_name: 'Edgecombe', id: uuid() },
      { name: 'forsyth', alternate_name: 'Forsyth', id: uuid() },
      { name: 'franklin', alternate_name: 'Franklin', id: uuid() },
      { name: 'gaston', alternate_name: 'Gaston', id: uuid() },
      { name: 'gates', alternate_name: 'gates', id: uuid() },
      { name: 'graham', alternate_name: 'Graham', id: uuid() },
      { name: 'granville', alternate_name: 'Granville', id: uuid() },
      { name: 'greene', alternate_name: 'Greene', id: uuid() },
      { name: 'guilford', alternate_name: 'Guilford', id: uuid() },
      { name: 'halifax', alternate_name: 'Halifax', id: uuid() },
      { name: 'harnett', alternate_name: 'Harnett', id: uuid() },
      { name: 'haywood', alternate_name: 'Haywood', id: uuid() },
      { name: 'henderson', alternate_name: 'Henderson', id: uuid() },
      { name: 'hertford', alternate_name: 'Hertford', id: uuid() },
      { name: 'hoke', alternate_name: 'Hoke', id: uuid() },
      { name: 'hyde', alternate_name: 'Hyde', id: uuid() },
      { name: 'iredell', alternate_name: 'Iredell', id: uuid() },
      { name: 'jackson', alternate_name: 'Jackson', id: uuid() },
      { name: 'johnston', alternate_name: 'Johnston', id: uuid() },
      { name: 'jones', alternate_name: 'Jones', id: uuid() },
      { name: 'lee', alternate_name: 'Lee', id: uuid() },
      { name: 'lenoir', alternate_name: 'Lenoir', id: uuid() },
      { name: 'lincoln', alternate_name: 'Lincoln', id: uuid() },
      { name: 'macon', alternate_name: 'Macon', id: uuid() },
      { name: 'madison', alternate_name: 'Madison', id: uuid() },
      { name: 'martin', alternate_name: 'Martin', id: uuid() },
      { name: 'mcdowell', alternate_name: 'Mcdowell', id: uuid() },
      { name: 'mecklenburg', alternate_name: 'Mecklenburg', id: uuid() },
      { name: 'mitchell', alternate_name: 'Mitchell', id: uuid() },
      { name: 'montgomery', alternate_name: 'Montgomery', id: uuid() },
      { name: 'moore', alternate_name: 'Moore', id: uuid() },
      { name: 'nash', alternate_name: 'Nash', id: uuid() },
      { name: 'newhanover', alternate_name: 'New Hanover', id: uuid() },
      { name: 'northampton', alternate_name: 'Northampton', id: uuid() },
      { name: 'onslow', alternate_name: 'Onslow', id: uuid() },
      { name: 'orange', alternate_name: 'Orange', id: uuid() },
      { name: 'pamlico', alternate_name: 'Pamlico', id: uuid() },
      { name: 'pasquotank', alternate_name: 'Pasquotank', id: uuid() },
      { name: 'pender', alternate_name: 'Pender', id: uuid() },
      { name: 'perquimans', alternate_name: 'Perquimans', id: uuid() },
      { name: 'person', alternate_name: 'Person', id: uuid() },
      { name: 'pitt', alternate_name: 'Pitt', id: uuid() },
      { name: 'polk', alternate_name: 'Polk', id: uuid() },
      { name: 'randolph', alternate_name: 'Randolph', id: uuid() },
      { name: 'richmond', alternate_name: 'Richmond', id: uuid() },
      { name: 'robeson', alternate_name: 'Robeson', id: uuid() },
      { name: 'rockingham', alternate_name: 'Rockingham', id: uuid() },
      { name: 'rowan', alternate_name: 'Rowan', id: uuid() },
      { name: 'rutherford', alternate_name: 'Rutherford', id: uuid() },
      { name: 'sampson', alternate_name: 'Sampson', id: uuid() },
      { name: 'scotland', alternate_name: 'Scotland', id: uuid() },
      { name: 'stanly', alternate_name: 'Stanly', id: uuid() },
      { name: 'stokes', alternate_name: 'Stokes', id: uuid() },
      { name: 'surry', alternate_name: 'Surry', id: uuid() },
      { name: 'swain', alternate_name: 'Swain', id: uuid() },
      { name: 'transylvania', alternate_name: 'Transylvania', id: uuid() },
      { name: 'tyrrell', alternate_name: 'Tyrrell', id: uuid() },
      { name: 'union', alternate_name: 'Union', id: uuid() },
      { name: 'vance', alternate_name: 'Vance', id: uuid() },
      { name: 'wake', alternate_name: 'Wake', id: uuid() },
      { name: 'warren', alternate_name: 'Warren', id: uuid() },
      { name: 'washington', alternate_name: 'Washington', id: uuid() },
      { name: 'watauga', alternate_name: 'Watauga', id: uuid() },
      { name: 'wayne', alternate_name: 'Wayne', id: uuid() },
      { name: 'wilkes', alternate_name: 'Wilkes', id: uuid() },
      { name: 'wilson', alternate_name: 'Wilson', id: uuid() },
      { name: 'yadkin', alternate_name: 'Yadkin', id: uuid() },
      { name: 'yancey', alternate_name: 'Yancey', id: uuid() },
    ];
    query = `insert into locations (id, name, alternate_name)
    values `;
    locations.forEach((t, icnt) => {
      query += `('${t.id}', '${t.name}', '${t.alternate_name}' )`
      if (icnt < locations.length - 1) query += ', ';
    });
    return cn.query(query);
  })
  .then(res => {
    const tindex = fk.random.number({min: 0, max: 100});
    return cn.query(
      `insert into services_at_location (id, service_id, location_id)
       values ('${uuid()}', '${serviceId}', '${locations[tindex].id}')`
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




