const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const session = require('express-session');
const parseurl = require('parseurl');
const cors = require('cors');
const uuidGenerate = require('./common/uuid');

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
    organizations: (parent, args, context) => books.map(itm => {
      return {
        title: itm.title,
        author: itm.author,
        cookie: context.session.id,
      }
    }),
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
console.log(`Here is a uuid: ${uuidGenerate()}`);
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
