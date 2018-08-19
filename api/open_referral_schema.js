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
    id: String
    name: String
    alternate_name: String
    description: String
    email: String
    url: String
    status: String
    interpretation_services: String
    application_process: String
    wait_time: String
    fees: String
    accreditations: String
    licenses: String
`;

const programFields = `
    id: String
    name: String
    alternate_name: String
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
    ${serviceFields}
    organization: Organization
    program: Program
    taxonomies: [Taxonomy]
    locations: [Location]
  }

  input ServiceInput {
    # Name, status and organization_id are required to create
    ${serviceFields}
    organization_id: String
  }

  type Program {
    ${programFields}
    organization: Organization
    services: [Service]
  }

  input ProgramInput {
    # Name and organization_id are required to create
    ${programFields}
    organization_id: String
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
    organization(id: String, organization: OrganizationInput!): Organization
    program(id: String, program: ProgramInput!): Program
    service(id: String, service: ServiceInput!): Service
  }
`;
/*
     name: 'programs',
    name: 'taxonomies',
    name: 'service_taxonomies',
    name: 'locations',
    name: 'services_at_location',
    name: 'contacts',
    name: 'phones',
    name: 'physical_addresses',
    name: 'postal_addresses',
    name: 'regular_schedules',
    name: 'holiday_schedules',
    name: 'funding',
    name: 'eligibility',
    name: 'service_areas',
    name: 'required_documents',
    name: 'payments_accepted',
    name: 'languages',
    name: 'accessibility_for_disabilities',
    name: 'metadata',
    name: 'meta_table_descriptions',
    name: 'pages',

*/
