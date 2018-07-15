create table if not exists funding (
  id varchar(36) primary key,
  organization_id varchar(36) references organizations(id),
  service_id varchar(36) references services(id),
  source text
);
truncate table funding;
select 'OK' as result;
