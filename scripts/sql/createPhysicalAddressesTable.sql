create table if not exists physical_addresses (
  id varchar(36) primary key,
  location_id varchar(36) references locations(id),
  attention varchar(256),
  address_1 varchar(256) not null,
  city varchar(256) not null,
  region varchar(256),
  state_province varchar(256) not null,
  postal_code varchar(128) not null,
  country varchar(2) not null
);
truncate table physical_addresses;
select 'OK' as result;
