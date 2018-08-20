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
  organization_id: String
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

const taxonomyFields = `
  id: String
  name: String
  parent_id: String
  parent_name: String
  vocabulary: String
`;

const serviceTaxonomyFields = `
  id: String
  service_id: String
  taxonomy_id: String
  taxonomy_detail: String
`;

const locationFields = `
  id: String
  name: String
  alternate_name: String
  description: String
  type: String
  parent_location_id: String
  organization_id: String
  transportation: String
  latitude: Float
  longitude: Float
`;

const serviceAtLocationFields = `
  id: String
  service_id: String
  location_id: String
  description: String
`;

const contactFields = `
  id: String
  organization_id: String
  service_id: String
  service_at_location_id: String
  name: String
  title: String
  department: String
  email: String
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
    ${taxonomyFields}
    parent: Taxonomy
  }

  input TaxonomyInput {
    ${taxonomyFields}
  }

  type ServiceTaxonomy {
    ${serviceTaxonomyFields}
  }

  input ServiceTaxonomyInput {
    ${serviceTaxonomyFields}
  }

  type Location {
    ${locationFields}
    organization: Organization
  }

  input LocationInput {
    ${locationFields}
  }

  type ServiceAtLocation {
    ${serviceAtLocationFields}
  }

  input ServiceAtLocationInput {
    ${serviceAtLocationFields}
  }

  type Contact {
    ${contactFields}
  }

  input ContactInput {
    # No required fields
    ${contactFields}
  }

  type Query {
    "This is documentation"
    organizations(ids: [String]): [Organization]
    services(ids: [String], taxonomies: [String], locations: [String]): [Service]
    programs(ids: [String]): [Program]
    taxonomies(ids: [String]): [Taxonomy]
    service_taxonomies(ids: [String]): [ServiceTaxonomy]
    locations(ids: [String], type: String): [Location]
    services_at_location(ids: [String]): [ServiceAtLocation]
    contacts(ids: [String]): [Contact]
  }

  type Mutation {
    organization(id: String, organization: OrganizationInput!): Organization
    program(id: String, program: ProgramInput!): Program
    service(id: String, service: ServiceInput!): Service
    taxonomy(id: String, taxonomy: TaxonomyInput!): Taxonomy
    service_taxonomy(id: String, service_taxonomy: ServiceTaxonomyInput!): ServiceTaxonomy
    location(id: String, location: LocationInput!): Location
    service_at_location(id: String, service_at_location: ServiceAtLocationInput!): ServiceAtLocation
    contact(id: String, contact: ContactInput!): Contact
  }
`;
/*
Queries+mutations to do:
    phones
    physical_addresses
    postal_addresses
    regular_schedules
    holiday_schedules
    funding
    eligibility
    service_areas
    required_documents
    payments_accepted
    languages
    accessibility_for_disabilities
    metadata
    meta_table_descriptions

Just mutations to do:
    pages

*/
