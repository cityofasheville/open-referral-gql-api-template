module.exports = [
  {
    name: 'organizations',
    create: 'createOrganizationsTable',
  },
  {
    name: 'programs',
    create: 'createProgramsTable',
  },
  {
    name: 'services',
    create: 'createServicesTable',
  },
  {
    name: 'taxonomies',
    create: 'createTaxonomiesTable',
  },
  {
    name: 'service_taxonomies',
    create: 'createServiceTaxonomiesTable',
  },
  {
    name: 'locations',
    create: 'createLocationsTable',
  },
  {
    name: 'services_at_location',
    create: 'createServicesAtLocationTable',
  },
  {
    name: 'contacts',
    create: 'createContactsTable',
  },
  {
    name: 'phones',
    create: 'createPhonesTable',
  },
];
