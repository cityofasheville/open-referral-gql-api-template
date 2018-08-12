const { ApolloServer, gql } = require('apollo-server-express');
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const parseurl = require('parseurl');
const cors = require('cors');
const uuidGenerate = require('./common/uuid');
const Logger = require('coa-node-logging');
const ConnectionManager = require('./common/db/connection_manager');
const connectionDefinitions = require('./common/connection_definitions');
const {loadServices, loadPrograms, loadTaxonomies, loadServiceTaxonomies, loadLocations, loadServicesAtLocation } = require('./server/loaders');
const logger = new Logger('or-api', './or-api.log');
const connectionManager = new ConnectionManager(connectionDefinitions, logger);
/*
  TASKS:

    XXX 1. Fix locations insert in seed.js to insert type and parent_id
    XXX 2. Add location and taxonomy information to service GraphQL type
        Note that this currently works:
          {
            services(taxonomies: ["health"], locations:["buncombe", "nc", "localized"]) {
              name
              description
              url
              taxonomies {
                name
                parent_name
                id
              }
              locations {
                name
                alternate_name
              }
            }
          }
        We just need to be able to see the resulting locations so client can sort/deal.
    3. Figure out how to put in variable substitution for localized queries (maybe in client?)
    4. Figure out how to add pages to the DB and GraphQL
    5. Decide how to deal with ordinals
    6. Add configurations??
*/

const typeDefs = gql`
  type Organization {
    id: String
    name: String
    alternate_name: String
    description: String
    email: String
    url: String
    tax_status: String
    tax_id: String
    year_incorporated: Int
    legal_status: String
    services: [Service]
    programs: [Program]
  }

  type Service {
    id: String
    name: String
    alternate_name: String
    description: String
    email: String
    url: String
    organization: Organization
    program: Program
    status: String!
    interpretation_services: String
    application_process: String
    wait_time: String
    fees: String
    accreditations: String
    licenses: String
    taxonomies: [Taxonomy]
    locations: [Location]
  }

  type Program {
    id: String
    name: String
    alternate_name: String
    organization_id: String
    organization: Organization
    services: [Service]
  }

  type Taxonomy {
    id: String
    name: String
    parent_id: String
    parent_name: String
    vocabulary: String
  }

  type ServiceTaxonomy {
    id: String
    service_id: String
    taxonomy_id: String
    taxonomy_detail: String
  }

  type Location {
    id: String
    organization_id: String
    name: String
    alternate_name: String
    description: String
    transportation: String
    latitude: Float
    longitude: Float
  }

  type ServiceAtLocation {
    id: String
    service_id: String
    location_id: String
    description: String
  }

  type Page {
    common_content: String
    local_content: String
    common_services: [Service]
    local_services: [Service]
    localized_services: [Service]
    location_id: String
    location: String
    taxonomy_id: String
    taxonomy: String
  }

  type Query {
    "This is documentation"
    organizations: [Organization]
    services(taxonomies: [String], locations: [String]): [Service]
    page(taxonomy: String!, location: String!): Page
    programs: [Program]
    taxonomies: [Taxonomy]
    service_taxonomies: [ServiceTaxonomy]
    locations(type: String): [Location]
    services_at_location: [ServiceAtLocation]
  }
`;    

function loadPages (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      content: itm.content,
      location_id: itm.location_id,
      taxonomy_id: itm.taxonomy_id,
    }
  });
}

const resolvers = {
  Query: {
    page: (parent, args, context) => {
      const taxonomyName = args.taxonomy;
      const locationName = args.location;
      const page = {
        common_content: '',
        local_content: '',
        common_services: [],
        local_services: [],
        localized_services: [],
        location: null,
        taxonomy: null,
        location_id: null,
        taxonomy_id: null,
        common_location_id: null,
        localized_location_id: null,
      };
      const locations = {};
      let taxonomy = null;
      const cn = connectionManager.getConnection('aws');
      return cn.query(`select * from locations where name = '${locationName}'  OR name = 'nc' OR name = 'localized'`)
      .then(loc => {
        loc.rows.forEach(r => {
          locations[r.name] = r;
        });
        return cn.query(`select * from taxonomies where name = '${taxonomyName}'`);
      })
      .then(tax => {
        taxonomy = tax.rows[0];
        page.taxonomy = taxonomy.alternate_name;
        page.taxonomy_id = taxonomy.id;
        page.location = locations[locationName].alternate_name;
        page.location_id = locations[locationName].id;
        page.common_location_id = locations.nc.id;
        page.localized_location_id = locations.localized.id;
        return cn.query(`select * from pages where taxonomy_id = '${taxonomy.id}' `
        + ` AND (location_id = '${locations[locationName].id}' OR location_id = '${locations.nc.id}')`);
      })
      .then(res => {
        res.rows.forEach(p => {
          if (p.location_id == locations.nc.id) {
            page.common_content = p.content;
          } else {
            page.local_content = p.content;
          }
        });
        return page;
      });
    },
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
  Page: {
    common_services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      console.log(`Parent taxonomy id = ${parent.taxonomy_id}`);
      let q = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      q += 'FROM services AS s '
      + 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
      + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id '
      + 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
      + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      + `WHERE t.id = '${parent.taxonomy_id}' AND l.id = '${parent.common_location_id}'`;
      return cn.query(q)
      .then(res => {
        return loadServices(res.rows);
      });
    },
    local_services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      console.log(`Parent taxonomy id = ${parent.taxonomy_id}`);
      let q = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      q += 'FROM services AS s '
      + 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
      + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id '
      + 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
      + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      + `WHERE t.id = '${parent.taxonomy_id}' AND l.id = '${parent.location_id}'`;
      return cn.query(q)
      .then(res => {
        return loadServices(res.rows);
      });
    },
    localized_services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      console.log(`Parent taxonomy id = ${parent.taxonomy_id}`);
      let q = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      q += 'FROM services AS s '
      + 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
      + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id '
      + 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
      + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      + `WHERE t.id = '${parent.taxonomy_id}' AND l.id = '${parent.localized_location_id}'`;
      console.log(q);
      return cn.query(q)
      .then(res => {
        return loadServices(res.rows);
      });
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

const server = new ApolloServer({ 
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    session: req.session,
  })
});

const app = express().use(cors());
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
