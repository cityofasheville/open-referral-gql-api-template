create table if not exists contacts (
  id varchar(36) primary key,
  organization_id varchar(36) references organizations(id),
  service_id varchar(36) references services(id),
  service_at_location_id varchar(36) references services_at_location,
  name varchar(256),
  title varchar(256),
  department varchar(256),
  email varchar(256)
);
truncate table contacts;
select 'OK' as result;
