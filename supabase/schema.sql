-- ResidenceScan real-data schema.
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
--
-- Each property's rooms/equipment/maintenance history are kept as a single JSONB
-- document (matching the app's existing Property shape) rather than fully
-- normalized tables — this app runs at a handful of properties, and it keeps the
-- app code close to what it already does today while moving storage off the
-- browser and onto a real, shared database.

create table if not exists clients (
  email text primary key,
  name text not null,
  plan text not null
);

create table if not exists suppliers (
  id text primary key,
  initials text not null,
  name text not null,
  category text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default ''
);

create table if not exists properties (
  id text primary key,
  client_email text references clients(email) on delete set null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists properties_client_email_idx on properties (client_email);

-- Row Level Security is enabled with no policies: the anon/public API key can
-- read and write nothing. The app talks to these tables only through Next.js
-- API routes using the service_role key, which bypasses RLS — so this data is
-- never reachable directly from a browser.
alter table clients enable row level security;
alter table suppliers enable row level security;
alter table properties enable row level security;
