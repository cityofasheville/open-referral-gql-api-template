const { gql } = require('apollo-server-express');
const organizationFields = `
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
`;

const serviceFields = `
    name: String
    alternate_name: String
    description: String
    email: String
    url: String
    status: String!
    interpretation_services: String
    application_process: String
    wait_time: String
    fees: String
    accreditations: String
    licenses: String
`;

module.exports = gql`
  type Organization {
    ${organizationFields}
    services: [Service]
    programs: [Program]
  }

  input OrganizationInput {
    # Name and description are required to create
    ${organizationFields}
  }

  type Service {
    id: String
    ${serviceFields}
    organization: Organization
    program: Program
    taxonomies: [Taxonomy]
    locations: [Location]
  }

  input ServiceInput {
    # Name and organization_id are required to create
    ${serviceFields}
    organization_id: String
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

  type Mutation {
    organization(id: String, org: OrganizationInput!): Organization
  }
`;
