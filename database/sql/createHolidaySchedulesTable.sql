create table if not exists holiday_schedules (
  id varchar(36) primary key,
  service_id varchar(36) references services(id),
  location_id varchar(36) references locations(id),
  service_at_location_id varchar(36) references services_at_location(id),
  closed boolean not null,
  opens_at varchar(128),
  closes_at varchar(128),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null
);
truncate table holiday_schedules;
select 'OK' as result;
