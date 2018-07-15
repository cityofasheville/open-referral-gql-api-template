create table if not exists required_documents (
  id varchar(36) primary key,
  service_id varchar(36) references services(id),
  document varchar(256)
);
truncate table required_documents;
select 'OK' as result;
