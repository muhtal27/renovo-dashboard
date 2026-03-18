-- Polish seeded Scotland demo data so the product reads like a live portfolio rather than a fixture dump.

with source_data as (
  select
    array['Ailsa','Calum','Eilidh','Gregor','Iona','Lewis','Mairi','Finlay','Catriona','Rory','Skye','Hamish','Erin','Struan','Morven','Fraser','Isla','Ruairidh','Niamh','Arran']::text[] as first_names,
    array['Fraser','Mackay','Stewart','Campbell','Robertson','Morrison','Paterson','Douglas','MacLeod','Graham','Bell','Grant','Boyd','Kerr','McLean','Reid','Burns','Henderson','Sutherland','Murray']::text[] as last_names,
    array['Edinburgh','Glasgow','Aberdeen','Dundee','Perth','Stirling','Inverness','Paisley','Ayr','Dunfermline']::text[] as cities,
    array['Northfield','Caledonian','Thistle','Harbour','Braemar','Lomond','Kingsway','Morningside','Clyde','Elmwood']::text[] as landlord_prefixes,
    array['Residential','Portfolio','Property','Homes','Lettings']::text[] as landlord_suffixes,
    array['Harbour','Clyde','Northgate','Cairn','Brae','Summit','Anchor','Cedar','Union','Prime']::text[] as contractor_prefixes,
    array['Heating','Electrical','Property Services','Building Response','Maintenance Group','Draincare','Gas & Plumbing','Repairs','Access Services','Joinery']::text[] as contractor_suffixes,
    array['first viewing booked','relocating for work','family move planned','pet request disclosed','remote viewing requested','deposit ready','follow-up call requested','awaiting evening slot']::text[] as applicant_notes,
    array['active tenancy with routine communication history','reported issue through portal','rent record active and in regular contact','prefers written updates by email']::text[] as tenant_notes,
    array['portfolio owner with active management instructions','reviews quote approvals promptly','prefers consolidated weekly updates','tracks maintenance spend closely']::text[] as landlord_notes,
    array['trade partner used for responsive maintenance coverage','handles out-of-hours callouts when needed','prefers site access windows confirmed in advance','sends quote and completion updates through portal']::text[] as contractor_notes
), target_contacts as (
  select c.id,
         coalesce(nullif(c.role, ''), nullif(c.contact_type, ''), 'contact') as role_key,
         row_number() over (
           partition by coalesce(nullif(c.role, ''), nullif(c.contact_type, ''), 'contact')
           order by coalesce(c.email, c.full_name, c.id::text)
         ) as idx
  from public.contacts c
  where c.email like '%@fixtures.renovoai.co.uk'
     or c.full_name ilike 'Fixture %'
     or c.company_name ilike '%Fixture%'
     or c.email like '%@prospectmail.co.uk'
     or c.email like '%@residentmail.co.uk'
     or c.email like '%@portfolio-mail.co.uk'
     or c.email like '%@trade-mail.co.uk'
), role_offsets as (
  select * from (values
    ('applicant', 0),
    ('tenant', 5),
    ('landlord', 10),
    ('contractor', 15),
    ('contact', 2)
  ) as t(role_key, role_offset)
), contact_updates as (
  select
    tc.id,
    tc.role_key,
    tc.idx,
    initcap(
      sd.first_names[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.first_names, 1))] || ' ' ||
      sd.last_names[1 + (((tc.idx - 1) * 3 + ro.role_offset * 2) % array_length(sd.last_names, 1))]
    ) as full_name,
    sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))] as city,
    case
      when tc.role_key = 'landlord' then initcap(
        sd.landlord_prefixes[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.landlord_prefixes, 1))] || ' ' ||
        sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))] || ' ' ||
        sd.landlord_suffixes[1 + ((tc.idx - 1) % array_length(sd.landlord_suffixes, 1))]
      )
      when tc.role_key = 'contractor' then initcap(
        sd.contractor_prefixes[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.contractor_prefixes, 1))] || ' ' ||
        sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))] || ' ' ||
        sd.contractor_suffixes[1 + ((tc.idx - 1) % array_length(sd.contractor_suffixes, 1))]
      )
      else null
    end as company_name,
    case
      when tc.role_key = 'applicant' then format('%s.%s+%s@prospectmail.co.uk', lower(sd.first_names[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.first_names, 1))]), lower(sd.last_names[1 + (((tc.idx - 1) * 3 + ro.role_offset * 2) % array_length(sd.last_names, 1))]), lpad(tc.idx::text, 2, '0'))
      when tc.role_key = 'tenant' then format('%s.%s+%s@residentmail.co.uk', lower(sd.first_names[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.first_names, 1))]), lower(sd.last_names[1 + (((tc.idx - 1) * 3 + ro.role_offset * 2) % array_length(sd.last_names, 1))]), lpad(tc.idx::text, 2, '0'))
      when tc.role_key = 'landlord' then format('%s.%s+%s@portfolio-mail.co.uk', lower(sd.first_names[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.first_names, 1))]), lower(sd.last_names[1 + (((tc.idx - 1) * 3 + ro.role_offset * 2) % array_length(sd.last_names, 1))]), lpad(tc.idx::text, 2, '0'))
      when tc.role_key = 'contractor' then format('%s.%s+%s@trade-mail.co.uk', lower(sd.first_names[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.first_names, 1))]), lower(sd.last_names[1 + (((tc.idx - 1) * 3 + ro.role_offset * 2) % array_length(sd.last_names, 1))]), lpad(tc.idx::text, 2, '0'))
      else format('%s.%s+%s@live-mail.co.uk', lower(sd.first_names[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.first_names, 1))]), lower(sd.last_names[1 + (((tc.idx - 1) * 3 + ro.role_offset * 2) % array_length(sd.last_names, 1))]), lpad(tc.idx::text, 2, '0'))
    end as email,
    case
      when tc.role_key = 'applicant' then format('Applicant record for %s. %s.', sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))], sd.applicant_notes[1 + ((tc.idx - 1) % array_length(sd.applicant_notes, 1))])
      when tc.role_key = 'tenant' then format('Tenant contact in %s portfolio. %s.', sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))], sd.tenant_notes[1 + ((tc.idx - 1) % array_length(sd.tenant_notes, 1))])
      when tc.role_key = 'landlord' then format('Landlord contact based around %s. %s.', sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))], sd.landlord_notes[1 + ((tc.idx - 1) % array_length(sd.landlord_notes, 1))])
      when tc.role_key = 'contractor' then format('Contractor contact covering %s. %s.', sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))], sd.contractor_notes[1 + ((tc.idx - 1) % array_length(sd.contractor_notes, 1))])
      else format('Operational contact record in %s.', sd.cities[1 + ((tc.idx - 1 + ro.role_offset) % array_length(sd.cities, 1))])
    end as notes
  from target_contacts tc
  join role_offsets ro on ro.role_key = tc.role_key
  cross join source_data sd
)
update public.contacts c
set full_name = cu.full_name,
    email = cu.email,
    company_name = cu.company_name,
    notes = cu.notes,
    updated_at = now()
from contact_updates cu
where c.id = cu.id;

with contractor_cities as (
  select
    contractor.contact_id,
    p.city,
    row_number() over (partition by contractor.contact_id order by mr.created_at desc) as rn
  from public.contractors contractor
  join public.maintenance_requests mr on mr.contractor_id = contractor.id
  join public.properties p on p.id = mr.property_id
)
update public.contractors contractor
set company_name = coalesce(contact.company_name, contractor.company_name),
    coverage_area = coalesce(concat_ws(', ', contractor_cities.city, 'Scotland'), contractor.coverage_area, 'Scotland'),
    updated_at = now()
from public.contacts contact
left join contractor_cities on contractor_cities.contact_id = contact.id and contractor_cities.rn = 1
where contractor.contact_id = contact.id
  and contact.email like '%@trade-mail.co.uk';

with source_data as (
  select
    array['Morningside Road','Roseburn Terrace','Byres Road','Hutcheson Street','Union Grove','Broughton Street','Kirklee Road','Queen Margaret Drive','Atholl Crescent','Comely Bank Avenue','Miller Street','Polwarth Gardens','Claremont Street','Melville Street','Tay Street','North Castle Street','Lynedoch Street','Victoria Park Drive','Marchmont Road','Crown Street']::text[] as streets,
    array['Edinburgh','Glasgow','Aberdeen','Dundee','Perth','Stirling','Inverness','Paisley','Ayr','Dunfermline']::text[] as cities,
    array['EH10 4AZ','G12 8QQ','AB10 1TF','DD1 4ER','PH2 8BW','FK8 1AA','IV2 3BG','PA1 2BE','KA7 1BX','KY11 4DW']::text[] as postcodes
), fixture_properties as (
  select p.id, row_number() over (order by p.address_line_1, p.id) as idx
  from public.properties p
  where p.address_line_1 like 'Fixture %'
     or p.country = 'Scotland'
), property_updates as (
  select
    fp.id,
    format('%s %s', 8 + ((fp.idx * 3) % 84), sd.streets[1 + ((fp.idx - 1) % array_length(sd.streets, 1))]) as address_line_1,
    sd.cities[1 + ((fp.idx - 1) % array_length(sd.cities, 1))] as city,
    sd.postcodes[1 + ((fp.idx - 1) % array_length(sd.postcodes, 1))] as postcode
  from fixture_properties fp
  cross join source_data sd
)
update public.properties p
set address_line_1 = pu.address_line_1,
    city = pu.city,
    postcode = pu.postcode,
    country = 'Scotland',
    updated_at = now()
from property_updates pu
where p.id = pu.id;

with target_cases as (
  select c.id, c.case_type, c.category, c.contact_id, c.property_id,
         row_number() over (partition by c.case_type order by c.created_at, c.id) as idx
  from public.cases c
  where c.case_number like 'FX-%'
     or c.case_number ~ '^[A-Z]{2}-2026-'
     or c.summary ilike '%fixture%'
     or c.subject ilike '%fixture%'
     or c.description ilike '%fixture%'
), prefixes as (
  select * from (values
    ('viewing', 'VW'),
    ('maintenance', 'MT'),
    ('rent', 'RN'),
    ('deposit', 'DP'),
    ('complaint', 'CP'),
    ('compliance', 'CM'),
    ('general_enquiry', 'GE'),
    ('tenancy_admin', 'TA')
  ) as t(case_type, prefix)
)
update public.cases c
set case_number = coalesce(prefixes.prefix, 'CS') || '-2026-' || lpad(target_cases.idx::text, 3, '0'),
    summary = case
      when target_cases.case_type = 'viewing' then format(
        'Viewing request from %s for %s, %s.',
        coalesce(contact.full_name, 'Prospective tenant'),
        coalesce(property.address_line_1, 'the listed property'),
        coalesce(property.city, 'Scotland')
      )
      when target_cases.case_type = 'rent' then format(
        'Rent follow-up for %s at %s, %s.',
        coalesce(contact.full_name, 'tenant'),
        coalesce(property.address_line_1, 'the property'),
        coalesce(property.city, 'Scotland')
      )
      when target_cases.case_type = 'maintenance' then format(
        '%s reported a %s issue at %s, %s.',
        coalesce(contact.full_name, 'resident'),
        replace(coalesce(target_cases.category, 'maintenance'), '_', ' '),
        coalesce(property.address_line_1, 'the property'),
        coalesce(property.city, 'Scotland')
      )
      else format(
        '%s case for %s at %s, %s.',
        initcap(replace(coalesce(target_cases.case_type, 'general_enquiry'), '_', ' ')),
        coalesce(contact.full_name, 'contact'),
        coalesce(property.address_line_1, 'the property'),
        coalesce(property.city, 'Scotland')
      )
    end,
    subject = case
      when target_cases.case_type = 'viewing' then format('Viewing enquiry for %s', coalesce(property.address_line_1, 'listed property'))
      when target_cases.case_type = 'rent' then format('Rent review for %s', coalesce(property.address_line_1, 'tenancy account'))
      else format('%s update for %s', initcap(replace(coalesce(target_cases.case_type, 'case'), '_', ' ')), coalesce(property.address_line_1, 'property'))
    end,
    description = case
      when target_cases.case_type = 'viewing' then format(
        '%s has requested a viewing slot for %s, %s. The enquiry remains in the live demo pipeline for scheduling and follow-up workflows.',
        coalesce(contact.full_name, 'The applicant'),
        coalesce(property.address_line_1, 'the property'),
        coalesce(property.city, 'Scotland')
      )
      else format(
        'Operational case linked to %s, %s. Contact: %s. This record is part of the live-style demo portfolio.',
        coalesce(property.address_line_1, 'the property'),
        coalesce(property.city, 'Scotland'),
        coalesce(contact.full_name, 'assigned contact')
      )
    end,
    resolution_note = case
      when c.resolution_note ilike '%fixture%' then 'Resolved during demo workflow review.'
      else c.resolution_note
    end,
    updated_at = now()
from target_cases
left join prefixes on prefixes.case_type = target_cases.case_type
left join public.contacts contact on contact.id = target_cases.contact_id
left join public.properties property on property.id = target_cases.property_id
where c.id = target_cases.id;

update public.viewing_requests vr
set notes = format(
      '%s requested a viewing for %s, %s. Current status: %s.',
      coalesce(contact.full_name, 'Applicant'),
      coalesce(property.address_line_1, 'listed property'),
      coalesce(property.city, 'Scotland'),
      coalesce(vr.status, 'requested')
    ),
    updated_at = now()
from public.contacts contact,
     public.properties property
where vr.applicant_contact_id = contact.id
  and vr.property_id = property.id
  and exists (
    select 1
    from public.cases c
    where c.id = vr.case_id
      and c.case_number like 'VW-2026-%'
  );

with target_entries as (
  select id, entry_type, row_number() over (order by coalesce(due_date, period_start, posted_at::date), id) as idx
  from public.rent_ledger_entries
  where reference like 'FX-%'
     or notes ilike '%fixture%'
     or automation_source = 'fixture_seed'
)
update public.rent_ledger_entries rle
set reference = case
      when target_entries.entry_type = 'payment' then format('PAY-202603-%03s', target_entries.idx)
      else format('RNT-202603-%03s', target_entries.idx)
    end,
    notes = case
      when target_entries.entry_type = 'payment' then 'Rent payment recorded against the active demo tenancy ledger.'
      else 'Rent ledger entry aligned to the live-style demo tenancy ledger.'
    end,
    automation_source = case when rle.automation_source = 'fixture_seed' then 'demo_dataset' else rle.automation_source end,
    updated_at = now()
from target_entries
where rle.id = target_entries.id;

update public.lease_lifecycle_events
set note = 'Lifecycle milestone scheduled from the active demo tenancy portfolio.',
    updated_at = now()
where note ilike '%fixture%';
