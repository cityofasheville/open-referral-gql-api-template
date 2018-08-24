const { gql } = require('apollo-server-express');

module.exports = gql`

  type Page {
    common_content: String
    local_content: String
    common_services: [Service]
    local_services: [Service]
    localized_services: [Service]
    location_id: String
    location_tag: String
    location: String
    taxonomy_id: String
    taxonomy: String
  }

  extend type Query {
    "This is also documentation"
    page(taxonomy: String!, location: String!): Page
  }
`;
