create table if not exists service_areas (
  id varchar(36) primary key,
  service_id varchar(36) references services(id),
  service_area varchar(256),
  description text
);
truncate table service_areas;
select 'OK' as result;
