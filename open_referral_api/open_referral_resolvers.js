const connectionManager = require('../common/connection_manager');
const { loadOrganizations, loadServices, loadPrograms, loadTaxonomies, 
        loadServiceTaxonomies, loadLocations, loadServicesAtLocation, loadContacts, 
        loadPhones, loadAddresses, loadRegularSchedules, loadHolidaySchedules,
        loadFunding, loadEligibility, loadServiceAreas, loadRequiredDocuments,
        loadPaymentsAccepted, loadLanguages, loadAccessibilityForDisabilities,
        loadMetadata, loadMetadataTableDescriptions
} = require('./open_referral_loaders');
const uuid = require('../common/uuid');

const updateOrCreate = function(args, type, tableName, allowed, required, loader) {
  const thing = args[type];
  const id = args.id ? args.id : (thing.id || uuid());
  // You can't overwrite the ID field
  let q = '';
  const qArgs = [id];
  let qCount = 2;

  if (args.id) { // We are updating
    let values = '';
    let first = true;
    Object.keys(thing).forEach(key => {
      if (allowed.indexOf(key) >= 0) {
        values += first ? '' : ', ';
        first = false;
        values += `${key} = $${qCount++}`;
        qArgs.push(thing[key]);
      }
    });
    q = `update ${tableName} set ${values} where id = $1`;
  } else { // Creating a new object
    required.forEach(itm => {
      if (!thing[itm])
        throw new Error(`You must specify ${itm} to create a ${type}`);
    });
    let names = 'id';
    let values = '$1';

    Object.keys(thing).forEach(key => {
      if (allowed.indexOf(key) >= 0) {
        names += `, ${key}`;
        values += `, $${qCount++}`;
        qArgs.push(thing[key]);
      }
    });
    q = `insert into ${tableName} (${names}) values(${values})`;
  }
  const cn = connectionManager.getConnection('aws');
  return cn.query(q, qArgs)
  .then(res => {
    if (res.rowCount != 1) {
      throw new Error(`Error ${args.id ? 'updating' : 'creating'} ${type}.`);
    }
    // Now get the record back
    return cn.query(`select * from ${tableName} where id='${id}'`)
    .then (res => {
      if (res.rows.length > 0) {
        return loader(res.rows)[0];
      }
      throw new Error(`Unable to find record with id ${id}`);
    });
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
}

const simpleObjectsEndpoint = function(args, tableName, loader) {
      const cn = connectionManager.getConnection('aws');
      let q = `select * from ${tableName}`;
      const qArgs = [];
      if (args.ids && args.ids.length > 0) {
        q += ' where id = ANY($1)';
        qArgs.push(args.ids);
      }
      return cn.query(q, qArgs)
      .then (res => {
        if (res.rows.length > 0) {
          return loader(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));

};

module.exports = {
  Mutation: {
    metadata_table_description: (parent, args, context) => {
      const allowed = ['id', 'name', 'language', 'character_set'];
      const required = [];
      return updateOrCreate(args, 'metadata_table_description', 'metadata_table_descriptions', allowed, required, loadMetadataTableDescriptions);
    },
    metadata: (parent, args, context) => {
      const allowed = ['id', 'resource_id', 'last_action_date', 'last_action_type', 'field_name', 'previous_value', 'replacement_value', 'updated_by'];
      const required = ['resource_id', 'last_action_date', 'last_action_type', 'field_name', 'previous_value', 'replacement_value', 'updated_by'];
      return updateOrCreate(args, 'metadata', 'metadata', allowed, required, loadMetadata);
    },
    accessibility_for_disabilities: (parent, args, context) => {
      const allowed = ['id', 'location_id', 'accessibility', 'details'];
      const required = [];
      return updateOrCreate(args, 'accessibility_for_disabilities', 'accessibility_for_disabilities', allowed, required, loadAccessibilityForDisabilities);
    },
    language: (parent, args, context) => {
      const allowed = ['id', 'service_id', 'location_id', 'language'];
      const required = [];
      return updateOrCreate(args, 'language', 'languages', allowed, required, loadLanguages);
    },
    payment_accepted: (parent, args, context) => {
      const allowed = ['id', 'service_id', 'payment'];
      const required = [];
      return updateOrCreate(args, 'payment_accepted', 'payments_accepted', allowed, required, loadRequiredDocuments);
    },
    required_document: (parent, args, context) => {
      const allowed = ['id', 'service_id', 'document'];
      const required = [];
      return updateOrCreate(args, 'required_document', 'required_documents', allowed, required, loadRequiredDocuments);
    },
    service_area: (parent, args, context) => {
      const allowed = ['id', 'service_id', 'service_area', 'description'];
      const required = [];
      return updateOrCreate(args, 'service_area', 'service_areas', allowed, required, loadServiceAreas);
    },
    eligibility: (parent, args, context) => {
      const allowed = ['id', 'service_id', 'eligibility'];
      const required = [];
      return updateOrCreate(args, 'eligibility', 'eligibility', allowed, required, loadEligibilty);
    },
    funding: (parent, args, context) => {
      const allowed = ['id', 'organization_id', 'service_id', 'source'];
      const required = [];
      return updateOrCreate(args, 'funding', 'funding', allowed, required, loadFunding);
    },
    regular_schedule: (parent, args, context) => {
      const allowed = ['id', 'location_id', 'service_id', 'service_at_location_id', 'opens_at', 'closes_at', 'weekday'];
      const required = ['weekday'];
      return updateOrCreate(args, 'regular_schedule', 'regular_schedules', allowed, required, loadAddresses);
    },
    holiday_schedule: (parent, args, context) => {
      const allowed = ['id', 'location_id', 'service_id', 'service_at_location_id', 'opens_at', 'closes_at', 'closed', 'start_date', 'end_date'];
      const required = ['closed', 'start_date', 'end_date'];
      return updateOrCreate(args, 'holiday_schedule', 'holiday_schedules', allowed, required, loadAddresses);
    },
    physical_address: (parent, args, context) => {
      const allowed = ['id', 'location_id', 'attention', 'address_1', 'city', 'region', 'state_province', 'postal_code', 'country'];
      const required = ['address_1', 'city', 'state_province', 'postal_code', 'country'];
      return updateOrCreate(args, 'physical_address', 'physical_addresses', allowed, required, loadAddresses);
    },
    postal_address: (parent, args, context) => {
      const allowed = ['id', 'location_id', 'attention', 'address_1', 'city', 'region', 'state_province', 'postal_code', 'country'];
      const required = ['address_1', 'city', 'state_province', 'postal_code', 'country'];
      return updateOrCreate(args, 'postal_address', 'postal_addresses', allowed, required, loadAddresses);
    },
    phone: (parent, args, context) => {
      const allowed = ['location_id', 'organization_id', 'service_id', 'contact_id', 'service_at_location_id', 'phone_number', 'extension', 'type', 'language', 'description'];
      const required = ['phone_number'];
      return updateOrCreate(args, 'phone', 'phones', allowed, required, loadPhones);
    },
    contact: (parent, args, context) => {
      const allowed = ['organization_id', 'service_id', 'service_at_location_id', 'name', 'title', 'department', 'email'];
      const required = [];
      return updateOrCreate(args, 'contact', 'contacts', allowed, required, loadContacts);
    },
    service_at_location: (parent, args, context) => {
      const allowed = ['service_id', 'location_id', 'description'];
      const required = ['service_id', 'location_id'];
      return updateOrCreate(args, 'service_at_location', 'services_at_location', allowed, required, loadServicesAtLocation);
    },
    location: (parent, args, context) => {
      const allowed = ['name', 'alternate_name', 'organization_id', 'description', 'transportation', 'latitude', 'longitude', 'type', 'parent_location_id'];
      const required = [];
      return updateOrCreate (args,'location', 'locations', allowed, required,loadLocations);
    },
    service_taxonomy: (parent, args, context) => {
      const allowed = ['service_id', 'taxonomy_id', 'taxonomy_detail'];
      const required = ['service_id', 'taxonomy_id'];
      return updateOrCreate(args, 'service_taxonomy', 'service_taxonomies', allowed, required, loadServiceTaxonomies);
    },
    taxonomy: (parent, args, context) => {
      const allowed = ['name', 'alternate_name', 'parent_name', 'parent_id', 'vocabulary'];
      const required = ['name'];
      // TODO: validate parent_name or load based on parent_name
      return updateOrCreate (args,'taxonomy', 'taxonomies', allowed, required,loadTaxonomies);
    },
    service: (parent, args, context) => {
      const allowed = ['name', 'alternate_name', 'description', 'url', 'email', 'status', 'organization_id', 'program_id', 'interpretation_services', 'application_process', 'wait_time', 'fees', 'accreditations', 'licenses' ];
      const required = ['name', 'organization_id', 'status'];
      return updateOrCreate (args,'service', 'services', allowed, required,loadServices);
    },
    program: (parent, args, context) => {
      const allowed = ['name', 'alternate_name', 'organization_id'];
      const required = ['name', 'organization_id'];
      return updateOrCreate (args,'program', 'programs', allowed, required, loadPrograms);
    },
    organization: (parent, args, context) => {
      const allowed = ['name', 'alternate_name', 'description', 'url', 'email', 'tax_status', 'tax_id', 'year_incorporated', 'legal_status'];
      const required = ['name', 'description'];
      return updateOrCreate(args, 'organization', 'organizations', allowed, required, loadOrganizations);
    },
  },
  Query: {
    organizations: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'organizations', loadOrganizations);
    },
    services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      if (args.ids && args.ids.length > 0) {
        return simpleObjectsEndpoint(args, 'services', loadServices);   
      }
      let taxNames = null; // taxonomies
      let locNames = null; // locations
      if (args.taxonomies && args.taxonomies.length > 0) {
        taxNames = args.taxonomies;
      }
      if (args.locations && args.locations.length > 0) {
        locNames = args.locations;
      }

      let queryItems = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      let queryTables = 'FROM services AS s ';
      let queryWhere = (taxNames || locNames) ? 'where ' : ' ';
      if (taxNames) {
        queryTables += 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
        + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id ';
      } 
      if (locNames) {
        queryTables += 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
        + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      }

      const queryArgs = [];
      if (taxNames) {
        queryWhere += 't.name = ANY($1) '
        queryArgs.push(taxNames);
      }
      if (locNames) {
        queryWhere += (taxNames) ? 'AND l.name = ANY($2) ' : 'l.name = ANY($1)';
        queryArgs.push(locNames);
      }
      const query = queryItems + queryTables + queryWhere;
      return cn.query(query, queryArgs)
      .then (res => {
        if (res.rows.length > 0) {
          return loadServices(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    programs: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'programs', loadPrograms);
    },
    taxonomies: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'taxonomies', loadTaxonomies);
    },
    service_taxonomies: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'service_taxonomies', loadServiceTaxonomies);
    },
    locations: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      if (args.ids && args.ids.length > 0) {
        return simpleObjectsEndpoint(args, 'locations', loadLocations);     
      }

      const query = (args.type) ? `select * from locations where type = '${args.type}'` : 'select * from locations';
      return cn.query(query)
      .then (res => {
        if (res.rows.length > 0) {
          return loadLocations(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    services_at_location: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'services_at_location', loadServicesAtLocation);
    },
    contacts: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'contacts', loadContacts);
    },
    phones: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'phones', loadPhones);
    },
    physical_addresses: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'physical_addresses', loadAddresses);
    },
    postal_addresses: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'postal_addresses', loadAddresses);
    },
    regular_schedules: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'regular_schedules', loadRegularSchedules);
    },
    holiday_schedules: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'holiday_schedules', loadHolidaySchedules);
    },
    fundings: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'funding', loadFunding);
    },
    eligibility: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'eligibility', loadEligibilty);
    },
    service_areas: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'service_areas', loadServiceAreas);
    },
    required_documents: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'required_documents', loadRequiredDocuments);
    },
    payments_accepted: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'payments_accepted', loadPaymentsAccepted);
    },
    languages: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'languages', loadLanguages);
    },
    accessibility_for_disabilities: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'accessibility_for_disabilities', loadAccessibilityForDisabilities);
    },
    metadata: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'metadata', loadMetadata);
    },
    metadata_table_descriptions: (parent, args, context) => {
      return simpleObjectsEndpoint(args, 'metadata_table_descriptions', loadMetadataTableDescriptions);
    },
  },
  Organization: {
    services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select * from services where organization_id = '${parent.id}'`;
      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadServices(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    programs: (parent, args, context) => {
      return null; // TBD
    }
  },
  Service: {
    organization: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select * from organizations where id = '${parent.organization_id}'`;
      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadOrganizations(res.rows)[0];
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    program: (parent, args, context) => {
      return null; // TBD
    },
    taxonomies: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select t.* from service_taxonomies as st `
      + 'LEFT OUTER JOIN taxonomies as t ON t.id = st.taxonomy_id '
      + `where st.service_id = '${parent.id}' `;
      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadTaxonomies(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    locations: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select l.* from services_at_location as sl `
      + 'LEFT OUTER JOIN locations as l ON l.id = sl.location_id '
      + `where sl.service_id = '${parent.id}' `;

      return cn.query(q)
      .then (res => {
        if (res.rows.length > 0) {
          return loadLocations(res.rows);
        }
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
    program: (parent, args, context) => {
      return null; // TBD
    },

  },
  Taxonomy: {
    parent: (parent, args, context) => {
      if (parent.parent_id) {
        const cn = connectionManager.getConnection('aws');
        const q = `select * from taxonomies where id = ${parent.parent_id} limit 1`;
        return cn.query(q)
        .then(rows => {
          if (res.rows.length === 1) return loadTaxonomies(res.rows);
          return Promise.resolve(null);
        })
        .catch(error => Promise.reject(`Query error: ${error.message}`));
      }
      return null;
    }
  },
  Program: { // TBD
    organization: (parent, args, context) => {
      if (parent.organization_id) {
        const cn = connectionManager.getConnection('aws');
        const q = `select * from organizations where id = ${parent.organization_id} limit 1`;
        return cn.query(q)
        .then(rows => {
          if (res.rows.length === 1) return loadOrganizations(res.rows);
          return Promise.resolve(null);
        })
        .catch(error => Promise.reject(`Query error: ${error.message}`));
      }
      return null;
    },
    services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      const q = `select * from services where organization_id = ${parent.id}`;
      return cn.query(q)
      .then(rows => {
        if (res.rows.length >= 1) return loadServices(res.rows);
        return Promise.resolve(null);
      })
      .catch(error => Promise.reject(`Query error: ${error.message}`));
    },
  },
};
