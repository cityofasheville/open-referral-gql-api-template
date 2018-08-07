create table if not exists pages (
  id varchar(36) primary key,
  content text,
  location_id varchar(36) references locations,
  taxonomy_id varchar(36) references taxonomies
);
truncate table pages;
select 'OK' as result;

