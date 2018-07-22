create table if not exists payments_accepted (
  id varchar(36) primary key,
  service_id varchar(36) references services(id),
  payment varchar(256)
);
truncate table payments_accepted;
select 'OK' as result;
