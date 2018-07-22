create table if not exists locations (
  id varchar(36) primary key,
  organization_id varchar(36) references organizations(id),
  name varchar(256),
  alternate_name varchar(256),
  description text,
  transportation text,
  latitude numeric,
  longitude numeric
);
truncate table locations;
select 'OK' as result;
