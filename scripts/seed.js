/* eslint-disable no-console, spaced-comment */
require('dotenv').config();
const fs = require('fs');
const Logger = require('coa-node-logging');
const ConnectionManager = require('../common/db/connection_manager');
const connectionDefinitions = require('../common/connection_definitions');
const uuid = require('../common/uuid');

const logger = new Logger('or-api', './or-api.log');

const connectionManager = new ConnectionManager(connectionDefinitions, logger);

async function runTaskSequence(tables) {
  let result = null;
  let hasError = false;
  let errMessage = '';
  const cn = connectionManager.getConnection('aws');

  const locationMapping = {};
  const taxonomyMapping = {};
  
  // Read taxonomies
  let fd = fs.openSync('./scripts/sample/taxonomies.json', 'r');
  let taxonomies = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' })).data.map(itm => {
    let taxonomy = {
      id: uuid(),
      name: itm.tag,
      alternate_name: itm.display_name,
    };
    taxonomyMapping[taxonomy.name] = taxonomy;
    return taxonomy;
  });
  fs.closeSync(fd);

  // Read locations
  fd = fs.openSync('./scripts/sample/locations.json', 'r');
  let locations = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' })).data.map(itm => {
    const loc = {
      id: uuid(),
      name: itm.tag,
      alternate_name: itm.display_name,
      type: itm.jurisdiction_type,
      parent_location_id: itm.parent_jurisdiction,
    };
    locationMapping[loc.name] = loc;
    return loc;
  });
  fs.closeSync(fd);
  let localizedNC = {
    id: uuid(),
    name: 'localized',
    alternate_name: null,
    type: 'special',
    parent_location_id: 'nc',
  };
  locations.push(localizedNC);
  locationMapping['localized'] = localizedNC;

  // And map parent jurisdiction tags to IDs
  locations.forEach(itm => {
    if (itm.parent_location_id !== null) {
      const parentId = locationMapping[itm.parent_location_id].id;
      itm.parent_location_id = parentId;
    }
  });
console.log(locations);
  // Insert taxonomies into table
  query = 'insert into taxonomies (id, name, alternate_name) values ';
  taxonomies.forEach((loc, icnt) => {
    query += `('${loc.id}', '${loc.name}', '${loc.alternate_name}')`
    if (icnt < taxonomies.length - 1) query += ', ';
  });
  return cn.query(query)
  .then(() => {
    // Insert locations into table
    query = 'insert into locations (id, name, alternate_name, type, parent_location_id) values ';
    locations.forEach((loc, icnt) => {
      const p = loc.parent_location_id ? `'${loc.parent_location_id}'` : null;
      query += `('${loc.id}', '${loc.name}', '${loc.alternate_name}', '${loc.type}', ${p})`
      if (icnt < locations.length - 1) query += ', ';
    });
    return cn.query(query)
  })
  .then(() => {
    console.log('Loading the resources!');
    // Now let's load all the resources
    fd = fs.openSync('./scripts/sample/resources.json', 'r');
    let resources = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' })).data.map(itm => {
      return {
        id: uuid(),
        name: itm.name,
        alternate_name: null,
        description: itm.description,
        url: itm.url,
        location: (itm.localized) ? localizedNC.id : locationMapping[itm.jurisdiction].id,
        taxonomy: taxonomyMapping[itm.topic].id,
        ordinal: itm.ordinal,
      };
    });
    fs.closeSync(fd);
    console.log('Create an org, a service, and two connectors');
    // For each resource, we'll create an organization, a service,
    // a services_at_location and a service_taxonomy
    let organizations = [];
    let services = [];
    let serviceTaxonomies = [];
    let servicesAtLocations = [];
    resources.forEach(r => {
      let organizationId = uuid();
      let serviceId = uuid();
      organizations.push({
        id: organizationId,
        name: r.name,
        description: r.description,
        url: r.url,
      });
      services.push({
        id: serviceId,
        organization_id: organizationId,
        name: r.name,
        description: r.description,
        url: r.url,
      });
      serviceTaxonomies.push({
        id: uuid(),
        service_id: serviceId,
        taxonomy_id: r.taxonomy,
      });

      servicesAtLocations.push({
        id: uuid(),
        service_id: serviceId,
        location_id: r.location,
      });
    });
    console.log('DB load orgs');
    // Set up organizations
    let current = organizations;
    query = 'insert into organizations (id, name, description, url) values ';
    current.forEach((itm, icnt) => {
      query += `('${itm.id}', '${itm.name}', '${itm.description}', '${itm.url}')`
      if (icnt < current.length - 1) query += ', ';
    });
    return cn.query(query)
    .then(() => {
      // Set up services
      console.log('DB load services');
      current = services;
      query = 'insert into services (id, organization_id, name, description, url, status) values ';
      current.forEach((itm, icnt) => {
        query += `('${itm.id}', '${itm.organization_id}', '${itm.name}', '${itm.description}', '${itm.url}', 'active')`
        if (icnt < current.length - 1) query += ', ';
      });
      return cn.query(query);
    })
    .then(() => {
      // Set up service_taxonomies
      console.log('DB load service taxonomies');
      current = serviceTaxonomies;
      query = 'insert into service_taxonomies (id, service_id, taxonomy_id) values ';
      current.forEach((itm, icnt) => {
        query += `('${itm.id}', '${itm.service_id}', '${itm.taxonomy_id}')`
        if (icnt < current.length - 1) query += ', ';
      });
      return cn.query(query);
    })
    .then(() => {
      // Set up services_at_location
      console.log('DB load service locations');
      current = servicesAtLocations;
      query = 'insert into services_at_location (id, service_id, location_id) values ';
      current.forEach((itm, icnt) => {
        query += `('${itm.id}', '${itm.service_id}', '${itm.location_id}')`
        if (icnt < current.length - 1) query += ', ';
      });
      return cn.query(query);
    })
    .then(() => {
      console.log('All done');
    });
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




