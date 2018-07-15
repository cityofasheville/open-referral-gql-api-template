create table if not exists meta_table_descriptions (
  id varchar(36) primary key,
  name varchar(128),
  language varchar(256),
  character_set varchar(128)
);
truncate table meta_table_descriptions;
select 'OK' as result;
