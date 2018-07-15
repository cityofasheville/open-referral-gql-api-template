create table if not exists metadata (
  id varchar(36) primary key,
  resource_id varchar(36) not null,
  last_action_date timestamp with time zone not null,
  last_action_type varchar(128) not null,
  field_name varchar(256) not null,
  previous_value text not null,
  replacement_value text not null,
  updated_by varchar(256) not null
);
truncate table metadata;
select 'OK' as result;
