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
  }

  type Query {
    "This is documentation"
    organizations: [Organization]
  }
`;

const resolvers = {
  Query: {
    organizations: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      return cn.query('select * from organizations')
      .then (res => {
        if (res.rows.length > 0) {
          return res.rows.map(itm => {
            let year = null;
            if (itm.year_incorporated){
              year = JSON.stringify(itm.year_incorporated).slice(1,5);
            } 
            console.log(year);
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
            };
          });
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
