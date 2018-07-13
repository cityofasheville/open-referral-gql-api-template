create table if not exists organizations (
  id varchar(36) primary key,
  name varchar(256) not null,
  alternate_name varchar(256),
  description
  email
  url
  tax_status
  tax_id
  year_incorporated
  legal_status
  value text
);
truncate table configurations;
select 'OK' as result;

