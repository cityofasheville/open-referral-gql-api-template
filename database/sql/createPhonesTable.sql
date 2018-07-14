create table if not exists phones (
  id varchar(36) primary key,
  location_id varchar(36) references locations(id),
  service_id varchar(36) references services(id),
  organization_id varchar(36) references organizations(id),
  contact_id varchar(36) references contacts(id),
  service_at_location_id varchar(36) references services_at_location,
  phone_number varchar(128) not null, -- Spec uses 'number', but that conflicts with PostgreSQL. API should use 'number'
  extension integer,
  type varchar(128),
  language text,
  description text
);
truncate table phones;
select 'OK' as result;
