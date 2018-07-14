create table if not exists services (
  id varchar(36) primary key,
  organization_id varchar(36) references organizations(id) not null,
  program_id varchar(36) references programs(id),
  name varchar(256) not null,
  alternate_name varchar(256),
  description text,
  url text,
  email varchar(256),
  status varchar(256) not null,
  interpretation_services text,
  application_process text,
  wait_time varchar(256),
  fees text,
  accreditations text,
  licenses text
);
truncate table services;
select 'OK' as result;

