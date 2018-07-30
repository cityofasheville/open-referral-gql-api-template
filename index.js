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
Tasks:
  - Create services
  - Add organization id as argument to both services and programs
  - Add program id as argument to services
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
    return {
      id: itm.id,
      organization_id: itm.organization_id,
      program_id: itm.program_id,
      name: itm.name,
      alternate_name: itm.alternate_name,
      description: itm.description,
      email: itm.email,
      url: itm.url,
      status: itm.status,
      interpretation_services: itm.interpretation_services,
      application_process: itm.application_process,
      wait_time: itm.wait_time,
      fees: itm.fees,
      accreditations: itm.accreditations,
      licenses: itm.licenses,
      program: null,
      organization: null
    };
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
      return cn.query('select * from services')
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
