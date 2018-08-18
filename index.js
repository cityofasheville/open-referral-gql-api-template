const { ApolloServer, gql } = require('apollo-server-express');
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const parseurl = require('parseurl');
const cors = require('cors');

/*
  TASKS:
    5. Decide how to deal with ordinals
    6. Add configurations??
*/

const { merge } = require('lodash');

const server = new ApolloServer({ 
  typeDefs: [
    require('./api/app_schema'),
    require('./api/open_referral_schema'),
  ],
  resolvers: merge(
    require('./api/app_resolvers'),
    require('./api/open_referral_resolvers'),
  ),
  context: ({ req }) => ({
    session: req.session,
  })
});

const app = express().use(cors());
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
