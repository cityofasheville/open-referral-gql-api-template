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

let schema = `
  type Organization {
    ${organizationFields}
    services: [Service]
    programs: [Program]
  }

  input OrganizationInput {
    # Name and description are required to create
    ${organizationFields}
  }
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

schema += `
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
`;

const programFields = `
  id: String
  name: String
  alternate_name: String
`;

schema += `
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
`;

const taxonomyFields = `
  id: String
  name: String
  parent_id: String
  parent_name: String
  vocabulary: String
`;

schema += `
  type Taxonomy {
    ${taxonomyFields}
    parent: Taxonomy
  }

  input TaxonomyInput {
    ${taxonomyFields}
  }
`;

const serviceTaxonomyFields = `
  id: String
  service_id: String
  taxonomy_id: String
  taxonomy_detail: String
`;

schema += `
  type ServiceTaxonomy {
    ${serviceTaxonomyFields}
  }

  input ServiceTaxonomyInput {
    ${serviceTaxonomyFields}
  }
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

schema += `
  type Location {
    ${locationFields}
    organization: Organization
  }

  input LocationInput {
    ${locationFields}
  }
`;

const serviceAtLocationFields = `
  id: String
  service_id: String
  location_id: String
  description: String
`;

schema += `
  type ServiceAtLocation {
    ${serviceAtLocationFields}
  }

  input ServiceAtLocationInput {
    ${serviceAtLocationFields}
  }
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

schema += `
  type Contact {
    ${contactFields}
  }

  input ContactInput {
    # No required fields
    ${contactFields}
  }
`;

const phoneFields = `
  id: String
  location_id: String
  service_id: String
  organization_id: String
  contact_id: String
  service_at_location_id: String
  phone_number: Int
  extension: Int
  type: String
  language:  String
  description: String
`;

schema += `
  type Phone {
    ${phoneFields}
  }

  input PhoneInput {
    # phone_number is required to create
    ${phoneFields}
  }
`;

const physicalAddressFields = `
  id: String
  location_id: String
  attention: String
  address_1: String
  city: String
  region: String
  state_province: String
  postal_code: String
  country: String
`;

schema += `
  type PhysicalAddress {
    ${physicalAddressFields}
  }

  input PhysicalAddressInput {
    # address_1, city, state_province, postal_code and country all required to create
    ${physicalAddressFields}
  }
`;

schema += `

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
    phones(ids: [String]): [Phone]
    physical_addresses(ids: [String]): [PhysicalAddress]
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
    phone(id: String, phone: PhoneInput!): Phone
    physical_address(id: String, physical_address: PhysicalAddressInput!): PhysicalAddress
  }
`;
module.exports = gql`${schema}`;

/*
Queries+mutations to do:
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
