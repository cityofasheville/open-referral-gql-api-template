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

const addressFields = `
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
    ${addressFields}
  }

  input PhysicalAddressInput {
    # address_1, city, state_province, postal_code and country all required to create
    ${addressFields}
  }

  type PostalAddress {
    ${addressFields}
  }

  input PostalAddressInput {
    # address_1, city, state_province, postal_code and country all required to create
    ${addressFields}
  }
`;

const scheduleFields = `
  id: String
  service_id: String
  location_id: String
  service_at_location_id: String
  opens_at: String
  closes_at: String
`;

schema += `
  type RegularSchedule {
    ${scheduleFields}
    weekday: Int
  }

  input RegularScheduleInput {
    # weekday required to create
    ${scheduleFields}
    weekday: Int
  }
`;

schema +=`
  type HolidaySchedule {
    ${scheduleFields}
    closed: Boolean
    start_date: String
    end_date: String
  }

  input HolidayScheduleInput {
    # closed, start_date and end_date are required to create
    ${scheduleFields}
    closed: Boolean
    start_date: String
    end_date: String
  }
`;

const fundingFields = `
  id: String
  organization_id: String
  service_id: String
  source: String
`;

schema += `
  type Funding {
    ${fundingFields}
  }

  input FundingInput {
    ${fundingFields}
  }
`;

schema += `
  type Eligibility {
    id: String
    service_id: String
    eligibility: String
  }

  input EligibilityInput {
    id: String
    service_id: String
    eligibility: String
  }
`;
schema += `
  type ServiceArea {
    id: String
    service_id: String
    service_area: String
    description: String
  }
  input ServiceAreaInput {
    id: String
    service_id: String
    service_area: String
    description: String
  }
`;

schema += `
  type RequiredDocument {
    id: String
    service_id: String
    document: String
  }
  input RequiredDocumentInput {
    id: String
    service_id: String
    document: String
  }
`;

schema += `
  type PaymentAccepted {
    id: String
    service_id: String
    payment: String
  }
  input PaymentAcceptedInput {
    id: String
    service_id: String
    payment: String
  }
`;

schema += `
  type Language {
    id: String
    service_id: String
    location_id: String
    language: String
  }
  input LanguageInput {
    id: String
    service_id: String
    location_id: String
    language: String
  }
`;

schema += `
  type AccessibilityForDisabilities {
    id: String
    location_id: String
    accessibility: String
    details: String
  }

  input AccessibilityForDisabilitiesInput {
    id: String
    location_id: String
    accessibility: String
    details: String
  }
`;

const metadataFields = `
  id: String
  resource_id: String
  last_action_date: String
  last_action_type: String
  field_name: String
  previous_value: String
  replacement_value: String
  updated_by: String
`;
schema += `
  type Metadata {
    ${metadataFields}
  }
  input MetadataInput {
    ${metadataFields}
  }
`;

schema += `
  type MetadataTableDescription {
    id: String
    name: String
    language: String
    character_set: String
  }
  input MetadataTableDescriptionInput {
    id: String
    name: String
    language: String
    character_set: String
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
    postal_addresses(ids: [String]): [PostalAddress]
    regular_schedules(ids: [String]): [RegularSchedule]
    holiday_schedules(ids: [String]): [HolidaySchedule]
    fundings(ids: [String]): [Funding]
    eligibility(ids: [String]): [Eligibility]
    service_areas(ids: [String]): [ServiceArea]
    required_documents(ids: [String]): [RequiredDocument]
    payments_accepted(ids: [String]): [PaymentAccepted]
    languages(ids: [String]): [Language]
    accessibility_for_disabilities(ids: [String]): [AccessibilityForDisabilities]
    metadata(ids: [String]): [Metadata]
    metadata_table_descriptions(ids: [String]): [MetadataTableDescription]
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
    postal_address(id: String, postal_address: PostalAddressInput!): PostalAddress
    regular_schedule(id: String, schedule: RegularScheduleInput!): RegularSchedule
    holiday_schedule(id: String, schedule: HolidayScheduleInput!): HolidaySchedule
    funding(id: String, funding: FundingInput!): Funding
    eligibility(id: String, eligibility: EligibilityInput!): Eligibility
    service_area(id: String, service_area: ServiceAreaInput!): ServiceArea
    required_document(id: String, required_document: RequiredDocumentInput!): RequiredDocument
    payment_accepted(id: String, payment_accepted: PaymentAcceptedInput!): PaymentAccepted
    language(id: String, language: LanguageInput!): Language
    accessibility_for_disabilities(id: String, accessibility_for_disabilities: AccessibilityForDisabilitiesInput!): AccessibilityForDisabilities
    metadata(id: String, metadata: MetadataInput!): Metadata
    metadata_table_description(id: String, metadata_table_description: MetadataTableDescriptionInput!): MetadataTableDescription
  }
`;
module.exports = gql`${schema}`;

/*
Just mutations to do:
    pages

*/
