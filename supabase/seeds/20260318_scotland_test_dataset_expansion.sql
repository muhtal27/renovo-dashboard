-- Scotland fixture expansion and cleanup delta applied on 2026-03-18.
-- This file complements 20260318_scotland_test_dataset.sql and brings the fixture set to:
-- 50 landlords, 50 tenants, 50 contractors, 50 applicants,
-- plus 50 fixture properties, 50 fixture tenancies, 50 viewing requests,
-- and a mixed rent-ledger state for testing.

-- Final cleanup for malformed placeholder records.
update public.cases
set status = 'cancelled',
    waiting_on = 'internal',
    waiting_reason = 'Legacy malformed inbound payload cleaned from queue',
    resolution_note = 'Cancelled during Scotland fixture cleanup: malformed placeholder inbound with no customer content.',
    resolved_at = coalesce(resolved_at, now()),
    updated_at = now()
where id in (
  '97222738-f60e-4223-8dc3-e11848242dd6',
  'f555a0d2-f992-4917-9163-c829e63acc63'
);

with cities as (
  select array['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Ayr','Dunfermline','Paisley','Falkirk','Livingston']::text[] as city_list
), landlord_scenarios as (
  select array['portfolio expansion','insurance renewal','licensing follow-up','rent review planning','maintenance heavy block','overseas owner support','student HMO oversight','deposit reconciliation']::text[] as scenario_list
), tenant_scenarios as (
  select array['on-time payer','benefits support','arrears follow-up','renewal due','move-out planned','new tenancy onboarding','maintenance reporter','temporary decant']::text[] as scenario_list
), contractor_scenarios as (
  select array['trusted callout partner','regional specialist','gas-safe preferred','reactive maintenance cover','void works support','planned maintenance crew','out-of-hours responder','high-volume supplier']::text[] as scenario_list
), applicant_scenarios as (
  select array['first-time renter','relocating professional','student applicant','family upsizing','pet owner','remote viewing request','urgent move request','deposit ready applicant']::text[] as scenario_list
)
insert into public.contacts (full_name, phone, email, role, company_name, contact_type, notes, is_active)
select format('Fixture Landlord %s', lpad(n::text, 2, '0')),
       format('+44770091%04s', n),
       format('scotland.landlord%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0')),
       'landlord',
       format('Fixture Landlord Portfolio %s', lpad(n::text, 2, '0')),
       'landlord',
       format('Scotland fixture landlord based around %s; scenario: %s.', city_list[1 + ((n - 1) % array_length(city_list, 1))], scenario_list[1 + ((n - 1) % array_length(scenario_list, 1))]),
       true
from generate_series(13, 50) n, cities, landlord_scenarios
where not exists (
  select 1 from public.contacts c where c.email = format('scotland.landlord%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0'))
);

with cities as (
  select array['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Ayr','Dunfermline','Paisley','Falkirk','Livingston']::text[] as city_list
), tenant_scenarios as (
  select array['on-time payer','benefits support','arrears follow-up','renewal due','move-out planned','new tenancy onboarding','maintenance reporter','temporary decant']::text[] as scenario_list
)
insert into public.contacts (full_name, phone, email, role, company_name, contact_type, notes, is_active)
select format('Fixture Tenant %s', lpad(n::text, 2, '0')),
       format('+44770092%04s', n),
       format('scotland.tenant%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0')),
       'tenant',
       null,
       'tenant',
       format('Scotland fixture tenant in %s; scenario: %s.', city_list[1 + ((n - 1) % array_length(city_list, 1))], scenario_list[1 + ((n - 1) % array_length(scenario_list, 1))]),
       true
from generate_series(17, 50) n, cities, tenant_scenarios
where not exists (
  select 1 from public.contacts c where c.email = format('scotland.tenant%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0'))
);

with cities as (
  select array['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Ayr','Dunfermline','Paisley','Falkirk','Livingston']::text[] as city_list
), contractor_scenarios as (
  select array['trusted callout partner','regional specialist','gas-safe preferred','reactive maintenance cover','void works support','planned maintenance crew','out-of-hours responder','high-volume supplier']::text[] as scenario_list
)
insert into public.contacts (full_name, phone, email, role, company_name, contact_type, notes, is_active)
select format('Fixture Contractor %s', lpad(n::text, 2, '0')),
       format('+44770093%04s', n),
       format('scotland.contractor%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0')),
       'contractor',
       format('Fixture Trade Co %s', lpad(n::text, 2, '0')),
       'contractor',
       format('Scotland fixture contractor serving %s; scenario: %s.', city_list[1 + ((n - 1) % array_length(city_list, 1))], scenario_list[1 + ((n - 1) % array_length(scenario_list, 1))]),
       true
from generate_series(13, 50) n, cities, contractor_scenarios
where not exists (
  select 1 from public.contacts c where c.email = format('scotland.contractor%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0'))
);

with cities as (
  select array['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Ayr','Dunfermline','Paisley','Falkirk','Livingston']::text[] as city_list
), applicant_scenarios as (
  select array['first-time renter','relocating professional','student applicant','family upsizing','pet owner','remote viewing request','urgent move request','deposit ready applicant']::text[] as scenario_list
)
insert into public.contacts (full_name, phone, email, role, company_name, contact_type, notes, is_active)
select format('Fixture Applicant %s', lpad(n::text, 2, '0')),
       format('+44770094%04s', n),
       format('scotland.applicant%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0')),
       'applicant',
       null,
       'applicant',
       format('Scotland fixture applicant targeting %s; scenario: %s.', city_list[1 + ((n - 1) % array_length(city_list, 1))], scenario_list[1 + ((n - 1) % array_length(scenario_list, 1))]),
       true
from generate_series(11, 50) n, cities, applicant_scenarios
where not exists (
  select 1 from public.contacts c where c.email = format('scotland.applicant%s@fixtures.renovoai.co.uk', lpad(n::text, 2, '0'))
);

with trades as (
  select array['plumbing','electrical','heating','general','roofing','joinery','locksmith','drainage']::text[] as trade_list,
         array['Lothian','Strathclyde','Grampian','Tayside','Highlands','Forth Valley','Perthshire','Ayrshire']::text[] as area_list
), fixture_contractors as (
  select row_number() over (order by email) as idx, id as contact_id
  from public.contacts
  where email like 'scotland.contractor%@fixtures.renovoai.co.uk'
)
insert into public.contractors (contact_id, company_name, primary_trade, coverage_area, emergency_callout, rating, is_active)
select fc.contact_id,
       format('Fixture Trade Co %s', lpad(fc.idx::text, 2, '0')),
       trade_list[1 + ((fc.idx - 1) % array_length(trade_list, 1))],
       area_list[1 + ((fc.idx - 1) % array_length(area_list, 1))],
       (fc.idx % 3 = 0),
       round((3.8 + ((fc.idx % 10) * 0.1))::numeric, 1),
       true
from fixture_contractors fc, trades
where fc.idx between 13 and 50
  and not exists (select 1 from public.contractors c where c.contact_id = fc.contact_id);

with cities as (
  select array['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Ayr','Dunfermline','Paisley','Falkirk','Livingston']::text[] as city_list,
         array['EH','G','AB','DD','IV','FK','PH','KA','KY','PA','FK','EH']::text[] as postcode_prefixes,
         array['Rose Street','George Square','Union Grove','Nethergate','Castle Road','Port Street','Tay Street','Wellington Square','High Street','Causeyside Street','Melville Street','Almondvale Avenue']::text[] as streets,
         array['flat','apartment','house']::text[] as property_types,
         array['furnished','part_furnished','unfurnished']::text[] as furnishing_list,
         array['fully_managed','rent_collection','let_only']::text[] as management_list
), fixture_landlords as (
  select row_number() over (order by email) as idx, id as landlord_contact_id
  from public.contacts
  where email like 'scotland.landlord%@fixtures.renovoai.co.uk'
)
insert into public.properties (
  address_line_1,
  city,
  postcode,
  landlord_contact_id,
  country,
  property_type,
  bedroom_count,
  bathroom_count,
  furnishing_status,
  management_type,
  is_active
)
select format('Fixture %s %s', fl.idx, streets[1 + ((fl.idx - 1) % array_length(streets, 1))]),
       city_list[1 + ((fl.idx - 1) % array_length(city_list, 1))],
       format('%s%s %sAA', postcode_prefixes[1 + ((fl.idx - 1) % array_length(postcode_prefixes, 1))], ((fl.idx - 1) % 9) + 1, ((fl.idx - 1) % 7) + 1),
       fl.landlord_contact_id,
       'Scotland',
       property_types[1 + ((fl.idx - 1) % array_length(property_types, 1))],
       1 + (fl.idx % 4),
       1 + (fl.idx % 2),
       furnishing_list[1 + ((fl.idx - 1) % array_length(furnishing_list, 1))],
       management_list[1 + ((fl.idx - 1) % array_length(management_list, 1))],
       true
from fixture_landlords fl, cities
where fl.idx between 13 and 50
  and not exists (select 1 from public.properties p where p.address_line_1 = format('Fixture %s %s', fl.idx, streets[1 + ((fl.idx - 1) % array_length(streets, 1))]));

with fixture_tenants as (
  select row_number() over (order by email) as idx, id as tenant_contact_id
  from public.contacts
  where email like 'scotland.tenant%@fixtures.renovoai.co.uk'
), fixture_landlords as (
  select row_number() over (order by email) as idx, id as landlord_contact_id
  from public.contacts
  where email like 'scotland.landlord%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select substring(address_line_1 from 'Fixture ([0-9]+)')::int as idx, id as property_id
  from public.properties
  where address_line_1 like 'Fixture %'
)
insert into public.tenancies (
  property_id,
  tenant_contact_id,
  landlord_contact_id,
  status,
  start_date,
  end_date,
  tenancy_status,
  rent_amount,
  deposit_amount,
  deposit_scheme_name,
  deposit_reference
)
select fp.property_id,
       ft.tenant_contact_id,
       fl.landlord_contact_id,
       case when ft.idx % 5 = 0 then 'ended' else 'active' end,
       (current_date - (((ft.idx % 24) + 4) * interval '30 day'))::date,
       case when ft.idx % 5 = 0 then (current_date - (((ft.idx % 6) + 1) * interval '14 day'))::date else ((current_date + (((ft.idx % 8) + 2) * interval '30 day'))::date) end,
       case when ft.idx % 5 = 0 then 'ended' else 'active' end,
       (900 + ((ft.idx % 8) * 75))::numeric,
       (1050 + ((ft.idx % 8) * 75))::numeric,
       'SafeDeposits Scotland',
       format('SDS-FX-%s', lpad(ft.idx::text, 3, '0'))
from fixture_tenants ft
join fixture_landlords fl on fl.idx = ft.idx
join fixture_properties fp on fp.idx = ft.idx
where ft.idx between 13 and 50
  and not exists (select 1 from public.tenancies t where t.property_id = fp.property_id);

with fixture_applicants as (
  select row_number() over (order by email) as idx, id as applicant_contact_id, full_name
  from public.contacts
  where email like 'scotland.applicant%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select substring(address_line_1 from 'Fixture ([0-9]+)')::int as idx, id as property_id, address_line_1, city
  from public.properties
  where address_line_1 like 'Fixture %'
)
insert into public.cases (
  case_number,
  contact_id,
  property_id,
  case_type,
  priority,
  status,
  source_channel,
  summary,
  tenancy_id,
  category,
  subject,
  description,
  opened_by_contact_id,
  waiting_on,
  waiting_reason,
  last_activity_at
)
select format('FX-VIEW-%s', lpad(fa.idx::text, 3, '0')),
       fa.applicant_contact_id,
       fp.property_id,
       'viewing',
       case when fa.idx % 4 = 0 then 'medium' else 'low' end,
       case
         when fa.idx % 6 = 0 then 'cancelled'
         when fa.idx % 5 = 0 then 'resolved'
         when fa.idx % 3 = 0 then 'scheduled'
         else 'open'
       end,
       'webform',
       format('Viewing request from %s for %s, %s.', fa.full_name, fp.address_line_1, fp.city),
       null,
       'viewing_booking',
       format('Viewing request for %s', fp.address_line_1),
       format('Fixture applicant scenario %s requesting a viewing in %s.', fa.idx, fp.city),
       fa.applicant_contact_id,
       'none',
       null,
       now() - make_interval(days => (fa.idx % 9)::int, hours => (fa.idx % 5)::int)
from fixture_applicants fa
join fixture_properties fp on fp.idx = 1 + ((fa.idx - 1) % 50)
where fa.idx between 11 and 50
  and not exists (
    select 1 from public.cases c where c.case_number = format('FX-VIEW-%s', lpad(fa.idx::text, 3, '0'))
  );

with target_cases as (
  select c.id, c.case_number, c.status,
         substring(c.case_number from '([0-9]+)$')::int as seq
  from public.cases c
  where c.case_number like 'FX-VIEW-%'
    and substring(c.case_number from '([0-9]+)$')::int between 11 and 50
)
update public.viewing_requests vr
set requested_date = (current_date + ((tc.seq % 12) - 4))::date,
    booked_slot = case when tc.status in ('scheduled','resolved') then now() + make_interval(days => ((tc.seq % 10) + 1)::int) else null end,
    status = case
      when tc.status = 'cancelled' then 'cancelled'
      when tc.status = 'resolved' then 'completed'
      when tc.status = 'scheduled' then 'booked'
      else 'requested'
    end,
    notes = format('Scotland fixture applicant scenario %s.', tc.seq),
    updated_at = now()
from target_cases tc
where vr.case_id = tc.id;

select public.run_rent_and_lease_automation(current_date);

with eligible_charges as (
  select rle.id as charge_id,
         rle.tenancy_id,
         rle.property_id,
         t.tenant_contact_id,
         row_number() over (order by c.email) as tenant_idx,
         rle.amount,
         rle.period_start,
         rle.period_end
  from public.rent_ledger_entries rle
  join public.tenancies t on t.id = rle.tenancy_id
  join public.contacts c on c.id = t.tenant_contact_id
  join public.properties p on p.id = rle.property_id
  where p.address_line_1 like 'Fixture %'
    and c.email like 'scotland.tenant%@fixtures.renovoai.co.uk'
    and rle.entry_type = 'charge'
    and rle.status = 'open'
    and rle.automation_source = 'rent_schedule'
    and date_trunc('month', coalesce(rle.period_start, rle.due_date)) = date_trunc('month', current_date)
    and t.tenancy_status = 'active'
), paid_tenants as (
  select * from eligible_charges where tenant_idx % 4 <> 0
)
update public.rent_ledger_entries rle
set status = 'cleared',
    updated_at = now(),
    notes = coalesce(rle.notes, '') || case when coalesce(rle.notes, '') = '' then '' else E'\n' end || 'Marked paid during Scotland fixture seeding.'
from paid_tenants pt
where rle.id = pt.charge_id;

with eligible_charges as (
  select rle.tenancy_id,
         rle.property_id,
         t.tenant_contact_id,
         row_number() over (order by c.email) as tenant_idx,
         rle.amount,
         rle.period_start,
         rle.period_end
  from public.rent_ledger_entries rle
  join public.tenancies t on t.id = rle.tenancy_id
  join public.contacts c on c.id = t.tenant_contact_id
  join public.properties p on p.id = rle.property_id
  where p.address_line_1 like 'Fixture %'
    and c.email like 'scotland.tenant%@fixtures.renovoai.co.uk'
    and rle.entry_type = 'charge'
    and rle.automation_source = 'rent_schedule'
    and date_trunc('month', coalesce(rle.period_start, rle.due_date)) = date_trunc('month', current_date)
    and t.tenancy_status = 'active'
), paid_tenants as (
  select * from eligible_charges where tenant_idx % 4 <> 0
)
insert into public.rent_ledger_entries (
  tenancy_id,
  property_id,
  contact_id,
  entry_type,
  category,
  status,
  amount,
  due_date,
  period_start,
  period_end,
  posted_at,
  reference,
  notes,
  automation_source,
  automation_key
)
select pt.tenancy_id,
       pt.property_id,
       pt.tenant_contact_id,
       'payment',
       'rent',
       'cleared',
       pt.amount,
       null,
       pt.period_start,
       pt.period_end,
       now() - interval '1 day',
       format('FX-PAY-202603-%s', lpad(pt.tenant_idx::text, 3, '0')),
       'Fixture payment generated for paid tenancy scenario.',
       'fixture_seed',
       format('fixture-payment-202603-%s', pt.tenant_idx)
from paid_tenants pt
where not exists (
  select 1 from public.rent_ledger_entries existing where existing.reference = format('FX-PAY-202603-%s', lpad(pt.tenant_idx::text, 3, '0'))
);
