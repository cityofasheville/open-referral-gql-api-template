create table if not exists locations (
  id varchar(36) primary key,
  organization_id varchar(36) references organizations(id),
  name varchar(256),
  alternate_name varchar(256),
  description text,
  transportation text,
  latitude numeric,
  longitude numeric,
  type varchar(256),
  parent_location_id varchar(36) references locations(id)
);
truncate table locations;
select 'OK' as result;
