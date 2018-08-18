const connectionManager = require('../common/connection_manager');
const {loadOrganizations, loadServices, loadPrograms, loadTaxonomies, loadServiceTaxonomies, loadLocations, loadServicesAtLocation } = require('./open_referral_loaders');
const uuid = require('../common/uuid');

const doit = function (q, qArgs, id, action, tableName, loader) {
  const cn = connectionManager.getConnection('aws');
  return cn.query(q, qArgs)
  .then(res => {
    if (res.rowCount != 1) {
      throw new Error(`Error ${action}.`);
    }
    // Now get the record back
    return cn.query(`select * from ${tableName} where id='${id}'`)
    .then (res => {
      if (res.rows.length > 0) {
        return loader(res.rows)[0];
      }
      throw new Error(`Unable to find record with id ${id}`);
    });
  })
  .catch(err => {
    console.log(err);
    throw err;
  });

}
module.exports = {
  Mutation: {
    service: (parent, args, context) => {
      const thing = args.service;
      const cn = connectionManager.getConnection('aws');
      const id = args.id ? args.id : (thing.id || uuid());
      // You can't overwrite the ID field
      const allowed = ['name', 'alternate_name', 'description', 'url', 'email', 'status', 'organization_id', 'program_id', 'interpretation_services', 'application_process', 'wait_time', 'fees', 'accreditations', 'licenses' ];
      let q = '';
      const qArgs = [id];
      let qCount = 2;

      if (args.id) { // We are updating
        let values = '';
        let first = true;
        Object.keys(thing).forEach(key => {
          if (allowed.indexOf(key) >= 0) {
            values += first ? '' : ', ';
            first = false;
            values += `${key} = $${qCount++}`;
            qArgs.push(thing[key]);
          }
        });
        q = `update services set ${values} where id = $1`;
      } else { // Creating a new service
        if (!thing.name || !thing.organization_id || ! thing.status) {
          throw new Error('You must specify a name, organization_id and status to create a service');
        }
        let names = 'id';
        let values = '$1';

        Object.keys(thing).forEach(key => {
          if (allowed.indexOf(key) >= 0) {
            names += `, ${key}`;
            values += `, $${qCount++}`;
            qArgs.push(thing[key]);
          }
        });
        q = `insert into services (${names}) values(${values})`;
      }

      return doit(q, qArgs, id, `${args.id ? 'updating' : 'creating'} service`, 'services', loadServices);
    },
    organization: (parent, args, context) => {
      const thing = args.org;
      const cn = connectionManager.getConnection('aws');
      const id = args.id ? args.id : (thing.id || uuid());
      // You can't overwrite the ID field
      const allowed = ['name', 'alternate_name', 'description', 'url', 'email', 'tax_status', 'tax_id', 'year_incorporated', 'legal_status'];
      let q = '';
      const qArgs = [id];
      let qCount = 2;

      if (args.id) { // We are updating
        let values = '';
        let first = true;
        Object.keys(thing).forEach(key => {
          if (allowed.indexOf(key) >= 0) {
            values += first ? '' : ', ';
            first = false;
            values += `${key} = $${qCount++}`;
            qArgs.push(thing[key]);
          }
        });
        q = `update organizations set ${values} where id = $1`;
      } else { // Creating a new organization
        if (!thing.name || !thing.description) {
          throw new Error('You must specify a name and a description to create an organization');
        }
        let names = 'id';
        let values = '$1';

        Object.keys(thing).forEach(key => {
          if (allowed.indexOf(key) >= 0) {
            names += `, ${key}`;
            values += `, $${qCount++}`;
            qArgs.push(thing[key]);
          }
        });
        q = `insert into organizations (${names}) values(${values})`;
      }
      return doit(q, qArgs, id, `${args.id ? 'updating' : 'creating'} organization`, 'organizations', loadOrganizations);
    },
  },
  Query: {
    organizations: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      return cn.query('select * from organizations')
      .then (res => {
        if (res.rows.length > 0) {
          return loadOrganizations(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      let taxNames = null; // taxonomies
      let locNames = null; // locations
      if (args.taxonomies && args.taxonomies.length > 0) {
        taxNames = args.taxonomies;
      }
      if (args.locations && args.locations.length > 0) {
        locNames = args.locations;
      }

      let queryItems = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      let queryTables = 'FROM services AS s ';
      let queryWhere = (taxNames || locNames) ? 'where ' : ' ';
      if (taxNames) {
        queryTables += 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
        + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id ';
      } 
      if (locNames) {
        queryTables += 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
        + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      }

      const queryArgs = [];
      if (taxNames) {
        queryWhere += 't.name = ANY($1) '
        queryArgs.push(taxNames);
      }
      if (locNames) {
        queryWhere += (taxNames) ? 'AND l.name = ANY($2) ' : 'l.name = ANY($1)';
        queryArgs.push(locNames);
      }
      const query = queryItems + queryTables + queryWhere;
      return cn.query(query, queryArgs)
      .then (res => {
        if (res.rows.length > 0) {
          return loadServices(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    programs: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      return cn.query('select * from programs')
      .then (res => {
        if (res.rows.length > 0) {
          return loadPrograms(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    taxonomies: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      return cn.query('select * from taxonomies')
      .then (res => {
        if (res.rows.length > 0) {
          return loadTaxonomies(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    service_taxonomies: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      return cn.query('select * from service_taxonomies')
      .then (res => {
        if (res.rows.length > 0) {
          return loadServiceTaxonomies(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    locations: (parent, args, context) => {
      const query = (args.type) ? `select * from locations where type = '${args.type}'` : 'select * from locations';

      const cn = connectionManager.getConnection('aws');
      return cn.query(query)
      .then (res => {
        if (res.rows.length > 0) {
          return loadLocations(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    services_at_location: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      return cn.query('select * from services_at_location')
      .then (res => {
        if (res.rows.length > 0) {
          return loadLocations(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
  },
  Organization: {
    services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select * from services where organization_id = '${parent.id}'`;
      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadServices(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    programs: (parent, args, context) => {
      return null; // TBD
    }
  },
  Service: {
    organization: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select * from organizations where id = '${parent.organization_id}'`;
      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadOrganizations(res.rows)[0];
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    program: (parent, args, context) => {
      return null; // TBD
    },
    taxonomies: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select t.* from service_taxonomies as st `
      + 'LEFT OUTER JOIN taxonomies as t ON t.id = st.taxonomy_id '
      + `where st.service_id = '${parent.id}' `;
      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadTaxonomies(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    locations: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select l.* from services_at_location as sl `
      + 'LEFT OUTER JOIN locations as l ON l.id = sl.location_id '
      + `where sl.service_id = '${parent.id}' `;

      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadLocations(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    program: (parent, args, context) => {
      return null; // TBD
    },

  },
  Program: { // TBD
    organization: (parent, args, context) => {
      return null;
    },
    services: (parent, args, context) => {
      return null;
    },
  },
};
