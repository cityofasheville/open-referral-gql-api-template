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

const logger = new Logger('or-api', './or-api.log');
const connectionManager = new ConnectionManager(connectionDefinitions, logger);
/*
  TASKS:

    XXX 1. Fix locations insert in seed.js to insert type and parent_id
    2. Add location and taxonomy information to service GraphQL type
        Note that this currently works:
          query {
            services(locations: ["nc", "buncombe"], taxonomies: ["jobs"]) {
              id
              name
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

  type Query {
    "This is documentation"
    organizations: [Organization]
    services(taxonomies: [String], locations: [String]): [Service]
    programs: [Program]
    taxonomies: [Taxonomy]
    service_taxonomies: [ServiceTaxonomy]
    locations: [Location]
    services_at_location: [ServiceAtLocation]
  }
`;

function loadServicesAtLocation (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      service_id: itm.service_id,
      location_id: itm.location_id,
      description: itm.description,
    };
  });
}

function loadLocations (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      organization_id: itm.organization_id,
      name: itm.name,
      alternate_name: itm.alternate_name,
      description: itm.description,
      transportation: itm.transportation,
      latitude: itm.latitude,
      longitude: itm.longitude,
    };
  });
}

function loadServiceTaxonomies (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      service_id: itm.service_id,
      taxonomy_id: itm.taxonomy_id,
      taxonomy_detail: itm.taxonomy_detail,
    };
  });
}

function loadTaxonomies (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      name: itm.name,
      parent_id: itm.parent_id,
      parent_name: itm.parent_name,
      vocabulary: itm.vocabulary,
    };
  });
}

function loadPrograms (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      name: itm.name,
      alternate_name: itm.alternate_name,
      organization_id: itm.organization_id,
      organization: null,
      services: [],
    };
  });
}

function loadServices (rows) {
  return rows.map(itm => {
    const service = {
      id: itm.id,
      organization_id: itm.organization_id,
      program_id: itm.program_id,
      name: itm.name,
      alternate_name: itm.alternate_name,
      description: itm.description,
      email: itm.email || null,
      url: itm.url || null,
      status: itm.status || null,
      interpretation_services: itm.interpretation_services || null,
      application_process: itm.application_process || null,
      wait_time: itm.wait_time || null,
      fees: itm.fees || null,
      accreditations: itm.accreditations || null,
      licenses: itm.licenses || null,
      program: null,
      organization: null
    };
    return service;
  });
}

function loadOrganizations (rows) {
  return rows.map(itm => {
    let year = null;
    if (itm.year_incorporated){
      year = JSON.stringify(itm.year_incorporated).slice(1,5);
    } 
    return {
      id: itm.id,
      name: itm.name,
      alternate_name: itm.alternate_name,
      description: itm.description,
      email: itm.email,
      url: itm.url,
      tax_status: itm.tax_status,
      tax_id: itm.tax_id,
      year_incorporated: year,
      legal_status: itm.legal_status,
      services: null,
      programs: null
    };
  });
}

const resolvers = {
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
        // queryItems += ', t.name AS taxonomy_name ';
      } 
      if (locNames) {
        queryTables += 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
        + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
        // queryItems += ', l.name AS location_name ';
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
      const cn = connectionManager.getConnection('aws');
      return cn.query('select * from locations')
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
