create table if not exists languages (
  id varchar(36) primary key,
  service_id varchar(36) references services(id),
  location_id varchar(36) references locations(id),
  language varchar(256)
);
truncate table languages;
select 'OK' as result;
