create table if not exists service_taxonomies (
  id varchar(36) primary key,
  service_id varchar(36) references services(id) not null,
  taxonomy_id varchar(36) references taxonomies(id) not null,
  taxonomy_detail text
);
truncate table service_taxonomies;
select 'OK' as result;

