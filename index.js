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
  }

  type Query {
    "This is documentation"
    organizations: [Organization]
    services: [Service]
  }
`;

function loadServices (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      organization_id: itm.organization_id,
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
