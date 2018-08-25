module.exports = {
  loadMetadataTableDescriptions: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        name: itm.name,
        language: itm.language,
        character_set: itm.character_set
      }
    })
  },
  loadMetadata: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        resource_id: itm.resource_id,
        last_action_date: itm.last_action_date,
        last_action_type: itm.last_action_type,
        field_name: itm.field_name,
        previous_value: itm.previous_value,
        replacement_value: itm.replacement_value,
        updated_by: itm.updated_by,
      }
    });
  },
  loadAccessibilityForDisabilities: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        location_id: itm.location_id,
        accessibility: itm.accessibility,
        details: itm.details,
      }
    });
  },
  loadLanguages: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        service_id: itm.service_id,
        location_id: itm.location_id,
        language: itm.language,
      }
    });
  },
  loadPaymentsAccepted: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        service_id: itm.service_id,
        payment: itm.payment,
      }
    });
  },
  loadRequiredDocuments: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        service_id: itm.service_id,
        document: itm.document,
      }
    });
  },
  loadServiceAreas: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        service_id: itm.service_id,
        service_area: itm.service_area,
        description: itm.description,
      }
    });
  },
  loadEligibility: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        service_id: itm.service_id,
        eligibility: itm.source,
      }
    });
  },
  loadFunding: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        organization_id: itm.organization_id,
        service_id: itm.service_id,
        source: itm.source,
      }
    });
  },
  loadRegularSchedules: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        location_id: itm.location_id,
        service_id: itm.service_id,
        service_at_location_id: itm.service_at_location_id,
        opens_at: itm.opens_at,
        closes_at: itm.closes_at,
        weekday: itm.weekday,
      };
    });
  },
  loadHolidaySchedules: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        location_id: itm.location_id,
        service_id: itm.service_id,
        service_at_location_id: itm.service_at_location_id,
        opens_at: itm.opens_at,
        closes_at: itm.closes_at,
        closed: itm.closed,
        start_date: itm.start_date,
        end_date: itm.end_date,
      };
    });
  },
  loadAddresses: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        location_id: itm.location_id,
        attention: itm.attention,
        address_1: itm.address_1,
        city: itm.city,
        region: itm.region,
        state_province: itm.state_province,
        postal_code: itm.postal_code,
        country: itm.country,
      };
    });
  },
  loadPhones: function(rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        organization_id: itm.organization_id,
        service_id: itm.service_id,
        location_id: itm.location_id,
        contact_id: itm.contact_id,
        service_at_location_id: itm.service_at_location_id,
        phone_number: itm.phone_number,
        extension: itm.extension,
        type: itm.type,
        language: itm.language,
        description: itm.description,
      };
    });
  },
  loadContacts: function (rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        organization_id: itm.organization_id,
        service_id: itm.service_id,
        service_at_location_id: itm.service_at_location_id,
        name: itm.name,
        title: itm.title,
        department: itm.department,
        email: itm.email,
      }
    });
  },
  loadServicesAtLocation: function (rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        service_id: itm.service_id,
        location_id: itm.location_id,
        description: itm.description,
      };
    });
  },
  loadLocations: function (rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        organization_id: itm.organization_id,
        name: itm.name,
        alternate_name: itm.alternate_name,
        description: itm.description,
        transportation: itm.transportation,
        latitude: itm.latitude,
        longitude: itm.longitude,
      };
    });
  },
  loadServiceTaxonomies: function (rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        service_id: itm.service_id,
        taxonomy_id: itm.taxonomy_id,
        taxonomy_detail: itm.taxonomy_detail,
      };
    });
  },
  loadTaxonomies: function (rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        name: itm.name,
        parent_id: itm.parent_id,
        parent_name: itm.parent_name,
        vocabulary: itm.vocabulary,
      };
    });
  },
  loadPrograms: function (rows) {
    return rows.map(itm => {
      return {
        id: itm.id,
        name: itm.name,
        alternate_name: itm.alternate_name,
        organization: null,
        services: [],
      };
    });
  },
  loadServices: function (rows) {
    return rows.map(itm => {
      const service = {
        id: itm.id,
        organization_id: itm.organization_id,
        program_id: itm.program_id,
        name: itm.name,
        alternate_name: itm.alternate_name,
        description: itm.description,
        email: itm.email || null,
        url: itm.url || null,
        status: itm.status || null,
        interpretation_services: itm.interpretation_services || null,
        application_process: itm.application_process || null,
        wait_time: itm.wait_time || null,
        fees: itm.fees || null,
        accreditations: itm.accreditations || null,
        licenses: itm.licenses || null,
        program: null,
        organization: null
      };
      return service;
    });
  },
  loadOrganizations: function (rows) {
    return rows.map(itm => {
      let year = null;
      if (itm.year_incorporated){
        year = JSON.stringify(itm.year_incorporated).slice(1,5);
      } 
      return {
        id: itm.id,
        name: itm.name,
        alternate_name: itm.alternate_name,
        description: itm.description,
        email: itm.email,
        url: itm.url,
        tax_status: itm.tax_status,
        tax_id: itm.tax_id,
        year_incorporated: year,
        legal_status: itm.legal_status,
        services: null,
        programs: null
      };
    });
  },

};
