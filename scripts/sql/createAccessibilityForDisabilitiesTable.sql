create table if not exists accessibility_for_disabilities (
  id varchar(36) primary key,
  location_id varchar(36) references locations(id),
  accessibility text,
  details text
);
truncate table accessibility_for_disabilities;
select 'OK' as result;
