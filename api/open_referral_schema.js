const { gql } = require('apollo-server-express');
module.exports = gql`
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

  type Query {
    "This is documentation"
    organizations: [Organization]
    services(taxonomies: [String], locations: [String]): [Service]
    programs: [Program]
    taxonomies: [Taxonomy]
    service_taxonomies: [ServiceTaxonomy]
    locations(type: String): [Location]
    services_at_location: [ServiceAtLocation]
  }
`;
