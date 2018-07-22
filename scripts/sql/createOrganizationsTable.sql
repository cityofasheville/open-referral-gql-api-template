create table if not exists organizations (
  id varchar(36) primary key,
  name varchar(256) not null,
  alternate_name varchar(256),
  description text not null,
  email varchar(256),
  url text,
  tax_status varchar(256),
  tax_id varchar(128),
  year_incorporated timestamp without time zone,
  legal_status varchar(256)
);
truncate table organizations;
select 'OK' as result;

