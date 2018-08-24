const connectionManager = require('../common/connection_manager');
const {loadServices} = require('../open_referral_api/open_referral_loaders');

function loadPages (rows) {
  return rows.map(itm => {
    return {
      id: itm.id,
      content: itm.content,
      location_id: itm.location_id,
      taxonomy_id: itm.taxonomy_id,
    }
  });
}


module.exports = {
  Query: {
    page: (parent, args, context) => {
      const taxonomyName = args.taxonomy;
      const locationName = args.location;
      const page = {
        common_content: '',
        local_content: '',
        common_services: [],
        local_services: [],
        localized_services: [],
        location: null,
        taxonomy: null,
        location_id: null,
        taxonomy_id: null,
        common_location_id: null,
        localized_location_id: null,
      };
      const locations = {};
      let taxonomy = null;
      const cn = connectionManager.getConnection('aws');
      return cn.query(`select * from locations where name = '${locationName}'  OR name = 'nc' OR name = 'localized'`)
      .then(loc => {
        loc.rows.forEach(r => {
          locations[r.name] = r;
        });
        return cn.query(`select * from taxonomies where name = '${taxonomyName}'`);
      })
      .then(tax => {
        taxonomy = tax.rows[0];
        page.taxonomy = taxonomy.alternate_name;
        page.taxonomy_id = taxonomy.id;
        page.location = locations[locationName].alternate_name;
        page.location_id = locations[locationName].id;
        page.location_tag = locationName;
        page.common_location_id = locations.nc.id;
        page.localized_location_id = locations.localized.id;
        return cn.query(`select * from pages where taxonomy_id = '${taxonomy.id}' `
        + ` AND (location_id = '${locations[locationName].id}' OR location_id = '${locations.nc.id}')`);
      })
      .then(res => {
        res.rows.forEach(p => {
          if (p.location_id == locations.nc.id) {
            page.common_content = p.content;
          } else {
            page.local_content = p.content;
          }
        });
        return page;
      });
    },
  },
  Page: {
    common_services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      let q = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      q += 'FROM services AS s '
      + 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
      + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id '
      + 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
      + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      + `WHERE t.id = '${parent.taxonomy_id}' AND l.id = '${parent.common_location_id}'`;
      return cn.query(q)
      .then(res => {
        return loadServices(res.rows);
      });
    },
    local_services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      let q = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      q += 'FROM services AS s '
      + 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
      + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id '
      + 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
      + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      + `WHERE t.id = '${parent.taxonomy_id}' AND l.id = '${parent.location_id}'`;
      return cn.query(q)
      .then(res => {
        return loadServices(res.rows);
      });
    },
    localized_services: (parent, args, context) => {
      const cn = connectionManager.getConnection('aws');
      let q = 'SELECT s.id, s.organization_id, s.program_id, s.name, s.alternate_name,  s.url, s.description ';
      q += 'FROM services AS s '
      + 'LEFT OUTER JOIN service_taxonomies AS st ON s.id = st.service_id '
      + 'LEFT OUTER JOIN taxonomies AS t ON t.id = st.taxonomy_id '
      + 'LEFT OUTER JOIN services_at_location AS sl ON s.id = sl.service_id '
      + 'LEFT OUTER JOIN locations AS l ON l.id = sl.location_id '
      + `WHERE t.id = '${parent.taxonomy_id}' AND l.id = '${parent.localized_location_id}'`;
      return cn.query(q)
      .then(res => {
        return loadServices(res.rows)
        .map(s => {
          return Object.assign({}, s, { url: s.url.replace(/{{common_jurisdiction}}/g, 'nc').replace(/{{local_jurisdiction}}/g, parent.location_tag)});
        });
      });
    },
  },
};
