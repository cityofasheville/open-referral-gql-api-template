create table if not exists services_at_location (
  id varchar(36) primary key,
  service_id varchar(36) references services(id) not null,
  location_id varchar(36) references locations(id) not null,
  description text
);
truncate table services_at_location;
select 'OK' as result;
