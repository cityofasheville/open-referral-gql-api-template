create table if not exists programs (
  id varchar(36) primary key,
  name varchar(256) not null,
  alternate_name varchar(256),
  organization_id varchar(36) references organizations(id)
);
truncate table programs;
select 'OK' as result;
