create table if not exists taxonomies (
  id varchar(36) primary key,
  name varchar(256) not null,
  parent_id varchar(36) references taxonomies(id),
  parent_name varchar(256),
  vocabulary varchar(256)
);
truncate table taxonomies;
select 'OK' as result;

