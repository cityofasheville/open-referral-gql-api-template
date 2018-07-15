create table if not exists regular_schedules (
  id varchar(36) primary key,
  service_id varchar(36) references services(id),
  location_id varchar(36) references locations(id),
  service_at_location_id varchar(36) references services_at_location(id),
  weekday integer not null,
  opens_at varchar(128),
  closes_at varchar(128)
);
truncate table regular_schedules;
select 'OK' as result;
