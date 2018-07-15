create table if not exists eligibility (
  id varchar(36) primary key,
  service_id varchar(36) references services(id),
  eligibility text
);
truncate table eligibility;
select 'OK' as result;
