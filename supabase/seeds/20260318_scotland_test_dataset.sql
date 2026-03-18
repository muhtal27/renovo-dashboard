
-- Scotland fixture dataset and cleanup batch: fixture_seed_scotland_20260318

begin;

-- Clean obvious legacy junk from malformed or placeholder inbound data.
delete from public.contacts c
where c.id = '3d82c26a-4969-4c17-8d00-0031847644e5'
  and not exists (select 1 from public.call_sessions cs where cs.contact_id = c.id)
  and not exists (select 1 from public.cases ca where ca.contact_id = c.id)
  and not exists (select 1 from public.messages m where m.sender_contact_id = c.id)
  and not exists (select 1 from public.tenancies t where t.tenant_contact_id = c.id or t.landlord_contact_id = c.id)
  and not exists (select 1 from public.portal_profiles pp where pp.contact_id = c.id)
  and not exists (select 1 from public.contractors co where co.contact_id = c.id);

delete from public.call_sessions
where contact_id = '08acd7ba-7a2f-4d6e-892c-1c862804bcd0'
  and external_call_id is null
  and caller_phone is null
  and case_id is null
  and status = 'abandoned';

update public.contacts
set
  contact_type = coalesce(contact_type, role),
  notes = case
    when notes is null then 'Legacy contact_type normalized during Scotland fixture cleanup'
    when notes ilike '%Legacy contact_type normalized%' then notes
    else notes || ' | Legacy contact_type normalized during Scotland fixture cleanup'
  end,
  updated_at = now()
where contact_type is null
  and role in ('tenant', 'landlord', 'contractor', 'applicant');

update public.contacts
set
  full_name = 'Legacy Placeholder Contact',
  is_active = false,
  notes = case
    when notes is null then 'Archived malformed inbound placeholder during Scotland fixture cleanup'
    when notes ilike '%Archived malformed inbound placeholder%' then notes
    else notes || ' | Archived malformed inbound placeholder during Scotland fixture cleanup'
  end,
  updated_at = now()
where id = '08acd7ba-7a2f-4d6e-892c-1c862804bcd0'
  and phone is null;

update public.cases
set
  category = coalesce(
    category,
    case
      when public.normalize_case_type(case_type) = 'viewing' then 'viewing_booking'
      when public.normalize_case_type(case_type) = 'deposit' then 'deposit_dispute'
      when public.normalize_case_type(case_type) = 'rent' then 'rent_arrears'
      when public.normalize_case_type(case_type) = 'maintenance' and summary ilike '%boiler%' then 'heating'
      when public.normalize_case_type(case_type) = 'maintenance' and summary ilike '%hot water%' then 'heating'
      when public.normalize_case_type(case_type) = 'maintenance' and summary ilike '%plumb%' then 'plumbing'
      when public.normalize_case_type(case_type) = 'maintenance' and summary ilike '%leak%' then 'plumbing'
      when public.normalize_case_type(case_type) = 'maintenance' and summary ilike '%electr%' then 'electrical'
      when public.normalize_case_type(case_type) = 'maintenance' then 'general'
      else 'general'
    end
  ),
  updated_at = now()
where category is null;

update public.cases
set
  status = 'cancelled',
  category = coalesce(category, 'general'),
  subject = coalesce(nullif(subject, ''), 'Legacy malformed inbound payload'),
  summary = case
    when summary is null or btrim(summary) = '' then 'Legacy malformed inbound payload removed from active queue.'
    else summary
  end,
  waiting_on = 'internal',
  waiting_reason = 'Legacy malformed inbound payload cleaned from queue',
  next_action_at = null,
  closed_at = coalesce(closed_at, now()),
  updated_at = now(),
  last_activity_at = now()
where contact_id = '08acd7ba-7a2f-4d6e-892c-1c862804bcd0'
  and property_id is null
  and tenancy_id is null
  and (
    summary is null
    or btrim(summary) = ''
    or summary in ('No message content provided.', 'No message provided.')
    or summary ilike '%template placeholder%'
    or summary ilike '%{ $json.body%'
  );

-- Remove prior fixture batch safely before recreating it.
with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.maintenance_quotes
where maintenance_request_id in (
  select id from public.maintenance_requests
  where case_id in (select id from fixture_cases)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.maintenance_requests
where case_id in (select id from fixture_cases)
   or property_id in (select id from fixture_properties)
   or tenancy_id in (select id from fixture_tenancies);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
)
delete from public.viewing_requests
where case_id in (select id from fixture_cases)
   or property_id in (select id from fixture_properties)
   or applicant_contact_id in (select id from fixture_contacts);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.deposit_claims
where case_id in (select id from fixture_cases)
   or property_id in (select id from fixture_properties)
   or tenancy_id in (select id from fixture_tenancies);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
)
delete from public.rent_ledger_entries
where tenancy_id in (select id from fixture_tenancies)
   or property_id in (select id from fixture_properties)
   or contact_id in (select id from fixture_contacts)
   or reference like 'FX-%';

with fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
)
delete from public.lease_lifecycle_events
where tenancy_id in (select id from fixture_tenancies)
   or property_id in (select id from fixture_properties);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.case_assignments where case_id in (select id from fixture_cases);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.case_events where case_id in (select id from fixture_cases);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.case_tags where case_id in (select id from fixture_cases);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.messages where case_id in (select id from fixture_cases);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.ai_runs where case_id in (select id from fixture_cases);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
update public.call_sessions set case_id = null where case_id in (select id from fixture_cases);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
), fixture_cases as (
  select id from public.cases
  where case_number like 'FX-%'
     or contact_id in (select id from fixture_contacts)
     or property_id in (select id from fixture_properties)
     or tenancy_id in (select id from fixture_tenancies)
)
delete from public.cases where id in (select id from fixture_cases);

with fixture_contacts as (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
), fixture_properties as (
  select id from public.properties where address_line_1 like 'Fixture %'
), fixture_tenancies as (
  select id from public.tenancies
  where property_id in (select id from fixture_properties)
     or tenant_contact_id in (select id from fixture_contacts)
     or landlord_contact_id in (select id from fixture_contacts)
)
delete from public.tenancies where id in (select id from fixture_tenancies);

delete from public.properties where address_line_1 like 'Fixture %';

delete from public.contractor_trades where contractor_id in (
  select id from public.contractors where contact_id in (
    select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
  )
);

delete from public.contractors where contact_id in (
  select id from public.contacts where email like '%@fixtures.renovoai.co.uk'
);

delete from public.contacts where email like '%@fixtures.renovoai.co.uk';

-- Insert fixture contacts.
with source_contacts as (
  select *
  from jsonb_to_recordset('[{"role": "landlord", "contact_type": "landlord", "full_name": "Alasdair MacLeod", "phone": "+447700910001", "email": "alasdair.macleod.landlord01@fixtures.renovoai.co.uk", "company_name": "MacLeod Lettings", "notes": "fixture_seed_scotland_20260318 | scenario: Owns Edinburgh flat with standard active tenancy"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Fiona Campbell", "phone": "+447700910002", "email": "fiona.campbell.landlord02@fixtures.renovoai.co.uk", "company_name": "Campbell Homes", "notes": "fixture_seed_scotland_20260318 | scenario: Glasgow landlord with fully paid tenant"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Ross Stewart", "phone": "+447700910003", "email": "ross.stewart.landlord03@fixtures.renovoai.co.uk", "company_name": "Stewart Residential", "notes": "fixture_seed_scotland_20260318 | scenario: Aberdeen landlord with ending-soon tenancy"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Isla Morrison", "phone": "+447700910004", "email": "isla.morrison.landlord04@fixtures.renovoai.co.uk", "company_name": "Morrison Property Co", "notes": "fixture_seed_scotland_20260318 | scenario: Dundee landlord with partial arrears tenant"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Hamish Fraser", "phone": "+447700910005", "email": "hamish.fraser.landlord05@fixtures.renovoai.co.uk", "company_name": "Fraser Estates", "notes": "fixture_seed_scotland_20260318 | scenario: Inverness landlord with active maintenance requests"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Mairi Sinclair", "phone": "+447700910006", "email": "mairi.sinclair.landlord06@fixtures.renovoai.co.uk", "company_name": "Sinclair Lets", "notes": "fixture_seed_scotland_20260318 | scenario: Stirling landlord for premium rental test"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Ewan Douglas", "phone": "+447700910007", "email": "ewan.douglas.landlord07@fixtures.renovoai.co.uk", "company_name": "Douglas Portfolio", "notes": "fixture_seed_scotland_20260318 | scenario: Perth landlord with renewal-review scenario"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Catriona Kerr", "phone": "+447700910008", "email": "catriona.kerr.landlord08@fixtures.renovoai.co.uk", "company_name": "Kerr Living", "notes": "fixture_seed_scotland_20260318 | scenario: Ayr landlord with well-performing tenancy"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Callum Reid", "phone": "+447700910009", "email": "callum.reid.landlord09@fixtures.renovoai.co.uk", "company_name": "Reid Property Group", "notes": "fixture_seed_scotland_20260318 | scenario: Dunfermline landlord with severe arrears scenario"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Morag Paterson", "phone": "+447700910010", "email": "morag.paterson.landlord10@fixtures.renovoai.co.uk", "company_name": "Paterson Rentals", "notes": "fixture_seed_scotland_20260318 | scenario: Paisley landlord with notice-period tenant"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Graeme MacDonald", "phone": "+447700910011", "email": "graeme.macdonald.landlord11@fixtures.renovoai.co.uk", "company_name": "MacDonald Homes", "notes": "fixture_seed_scotland_20260318 | scenario: Falkirk landlord with deposit dispute history"}, {"role": "landlord", "contact_type": "landlord", "full_name": "Shona Robertson", "phone": "+447700910012", "email": "shona.robertson.landlord12@fixtures.renovoai.co.uk", "company_name": "Robertson Residential", "notes": "fixture_seed_scotland_20260318 | scenario: Livingston landlord with clean ended tenancy"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Lewis Johnston", "phone": "+447700920001", "email": "lewis.johnston.tenant01@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Steady payer in central Edinburgh"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Emma McKay", "phone": "+447700920002", "email": "emma.mckay.tenant02@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Consistent rent payer in Glasgow"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Fraser Gordon", "phone": "+447700920003", "email": "fraser.gordon.tenant03@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Ending-soon Aberdeen tenancy, no March payment"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Ailsa McLean", "phone": "+447700920004", "email": "ailsa.mclean.tenant04@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Partial payment Dundee tenant"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Rory Henderson", "phone": "+447700920005", "email": "rory.henderson.tenant05@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Maintenance-heavy Inverness household"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Sophie Hamilton", "phone": "+447700920006", "email": "sophie.hamilton.tenant06@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Premium Stirling tenancy paid on time"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Iain Davidson", "phone": "+447700920007", "email": "iain.davidson.tenant07@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Renewal-review Perth tenancy"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Orla Kennedy", "phone": "+447700920008", "email": "orla.kennedy.tenant08@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Paid Ayr tenancy with completed work order"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Connor Wallace", "phone": "+447700920009", "email": "connor.wallace.tenant09@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Severe arrears Dunfermline tenant"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Jenna Forbes", "phone": "+447700920010", "email": "jenna.forbes.tenant10@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Paisley notice-period tenant with missed payment"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Ben McAllister", "phone": "+447700920011", "email": "ben.mcallister.tenant11@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Ended Falkirk tenancy with deposit dispute"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Niamh Grant", "phone": "+447700920012", "email": "niamh.grant.tenant12@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Ended Livingston tenancy with clean checkout"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Dylan Mercer", "phone": "+447700920013", "email": "dylan.mercer.tenant13@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Former tenant profile kept for regression testing"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Kirsty Lawson", "phone": "+447700920014", "email": "kirsty.lawson.tenant14@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Incoming tenant lead awaiting onboarding"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Scott McBride", "phone": "+447700920015", "email": "scott.mcbride.tenant15@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Room-share style tenant record without tenancy yet"}, {"role": "tenant", "contact_type": "tenant", "full_name": "Erin Sutherland", "phone": "+447700920016", "email": "erin.sutherland.tenant16@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Legacy tenant profile without active unit"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Neil Baxter", "phone": "+447700930001", "email": "neil.baxter.contractor01@fixtures.renovoai.co.uk", "company_name": "Apex Heating Services", "notes": "fixture_seed_scotland_20260318 | scenario: Emergency boiler specialist"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Eilidh Ross", "phone": "+447700930002", "email": "eilidh.ross.contractor02@fixtures.renovoai.co.uk", "company_name": "Clyde Plumbing & Drainage", "notes": "fixture_seed_scotland_20260318 | scenario: Burst pipe and leak response"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Craig Munro", "phone": "+447700930003", "email": "craig.munro.contractor03@fixtures.renovoai.co.uk", "company_name": "Forth Electrical", "notes": "fixture_seed_scotland_20260318 | scenario: EICR and urgent electrical faults"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Megan Christie", "phone": "+447700930004", "email": "megan.christie.contractor04@fixtures.renovoai.co.uk", "company_name": "Highland Roofing Co", "notes": "fixture_seed_scotland_20260318 | scenario: Roof repairs and storm callouts"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Alan McDougall", "phone": "+447700930005", "email": "alan.mcdougall.contractor05@fixtures.renovoai.co.uk", "company_name": "Tayside Locksmiths", "notes": "fixture_seed_scotland_20260318 | scenario: Locks, access, and entry systems"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Lucy Rennie", "phone": "+447700930006", "email": "lucy.rennie.contractor06@fixtures.renovoai.co.uk", "company_name": "Caledonia Joinery", "notes": "fixture_seed_scotland_20260318 | scenario: Doors, frames, and joinery repairs"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Mark Nicol", "phone": "+447700930007", "email": "mark.nicol.contractor07@fixtures.renovoai.co.uk", "company_name": "Saltire Decor", "notes": "fixture_seed_scotland_20260318 | scenario: End-of-tenancy making-good and decoration"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Kara Burns", "phone": "+447700930008", "email": "kara.burns.contractor08@fixtures.renovoai.co.uk", "company_name": "Fife Draincare", "notes": "fixture_seed_scotland_20260318 | scenario: Drain and drainage maintenance"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Tom Barclay", "phone": "+447700930009", "email": "tom.barclay.contractor09@fixtures.renovoai.co.uk", "company_name": "Grampian Glazing", "notes": "fixture_seed_scotland_20260318 | scenario: Windows and glazing replacements"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Rachel Milne", "phone": "+447700930010", "email": "rachel.milne.contractor10@fixtures.renovoai.co.uk", "company_name": "Lothian Fire & Safety", "notes": "fixture_seed_scotland_20260318 | scenario: Fire alarms and electrical safety"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Jamie Kerr", "phone": "+447700930011", "email": "jamie.kerr.contractor11@fixtures.renovoai.co.uk", "company_name": "Border Cleaning Group", "notes": "fixture_seed_scotland_20260318 | scenario: Deep cleaning and reactive cleans"}, {"role": "contractor", "contact_type": "contractor", "full_name": "Molly Boyd", "phone": "+447700930012", "email": "molly.boyd.contractor12@fixtures.renovoai.co.uk", "company_name": "West Coast Grounds", "notes": "fixture_seed_scotland_20260318 | scenario: Grounds maintenance and external works"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Abbie Ferguson", "phone": "+447700940001", "email": "abbie.ferguson.applicant01@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Looking for an Edinburgh one-bed near tram links"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Jamie Patterson", "phone": "+447700940002", "email": "jamie.patterson.applicant02@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Remote worker seeking Glasgow flat with parking"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Megan Boyd", "phone": "+447700940003", "email": "megan.boyd.applicant03@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Aberdeen applicant ready to book viewing"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Rossina Ahmed", "phone": "+447700940004", "email": "rossina.ahmed.applicant04@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Dundee graduate applicant with guarantor"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Calum Fraser", "phone": "+447700940005", "email": "calum.fraser.applicant05@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Inverness applicant comparing two listings"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Eve Robertson", "phone": "+447700940006", "email": "eve.robertson.applicant06@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Stirling family applicant requiring quick move"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Noah Bell", "phone": "+447700940007", "email": "noah.bell.applicant07@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Perth applicant who cancelled after booking"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Holly McDonald", "phone": "+447700940008", "email": "holly.mcdonald.applicant08@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Ayr applicant needing weekend viewing"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Gregor Campbell", "phone": "+447700940009", "email": "gregor.campbell.applicant09@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Falkirk applicant awaiting follow-up"}, {"role": "applicant", "contact_type": "applicant", "full_name": "Zara McIntyre", "phone": "+447700940010", "email": "zara.mcintyre.applicant10@fixtures.renovoai.co.uk", "company_name": null, "notes": "fixture_seed_scotland_20260318 | scenario: Livingston applicant who completed viewing"}]'::jsonb) as x(
    role text,
    contact_type text,
    full_name text,
    phone text,
    email text,
    company_name text,
    notes text
  )
)
insert into public.contacts (
  full_name,
  phone,
  email,
  role,
  contact_type,
  company_name,
  notes,
  is_active,
  created_at,
  updated_at
)
select
  full_name,
  phone,
  email,
  role,
  contact_type,
  company_name,
  notes,
  true,
  now(),
  now()
from source_contacts
on conflict (phone) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  contact_type = excluded.contact_type,
  company_name = excluded.company_name,
  notes = excluded.notes,
  is_active = true,
  updated_at = now();

-- Insert fixture contractor company records.
with source_contractors as (
  select *
  from jsonb_to_recordset('[{"contact_email": "neil.baxter.contractor01@fixtures.renovoai.co.uk", "company_name": "Apex Heating Services", "primary_trade": "heating", "coverage_area": "Edinburgh & Lothians", "emergency_callout": true, "rating": 4.8, "is_active": true}, {"contact_email": "eilidh.ross.contractor02@fixtures.renovoai.co.uk", "company_name": "Clyde Plumbing & Drainage", "primary_trade": "plumbing", "coverage_area": "Glasgow & Renfrewshire", "emergency_callout": true, "rating": 4.7, "is_active": true}, {"contact_email": "craig.munro.contractor03@fixtures.renovoai.co.uk", "company_name": "Forth Electrical", "primary_trade": "electrical", "coverage_area": "Aberdeen & Aberdeenshire", "emergency_callout": false, "rating": 4.5, "is_active": true}, {"contact_email": "megan.christie.contractor04@fixtures.renovoai.co.uk", "company_name": "Highland Roofing Co", "primary_trade": "roofing", "coverage_area": "Inverness & Highlands", "emergency_callout": false, "rating": 4.6, "is_active": true}, {"contact_email": "alan.mcdougall.contractor05@fixtures.renovoai.co.uk", "company_name": "Tayside Locksmiths", "primary_trade": "keys_access", "coverage_area": "Dundee & Angus", "emergency_callout": true, "rating": 4.9, "is_active": true}, {"contact_email": "lucy.rennie.contractor06@fixtures.renovoai.co.uk", "company_name": "Caledonia Joinery", "primary_trade": "damage", "coverage_area": "Stirling & Falkirk", "emergency_callout": false, "rating": 4.4, "is_active": true}, {"contact_email": "mark.nicol.contractor07@fixtures.renovoai.co.uk", "company_name": "Saltire Decor", "primary_trade": "cleaning", "coverage_area": "Perth & Kinross", "emergency_callout": false, "rating": 4.2, "is_active": true}, {"contact_email": "kara.burns.contractor08@fixtures.renovoai.co.uk", "company_name": "Fife Draincare", "primary_trade": "plumbing", "coverage_area": "Fife", "emergency_callout": true, "rating": 4.5, "is_active": true}, {"contact_email": "tom.barclay.contractor09@fixtures.renovoai.co.uk", "company_name": "Grampian Glazing", "primary_trade": "damage", "coverage_area": "Aberdeen", "emergency_callout": false, "rating": 4.3, "is_active": true}, {"contact_email": "rachel.milne.contractor10@fixtures.renovoai.co.uk", "company_name": "Lothian Fire & Safety", "primary_trade": "electrical", "coverage_area": "Edinburgh", "emergency_callout": false, "rating": 4.8, "is_active": true}, {"contact_email": "jamie.kerr.contractor11@fixtures.renovoai.co.uk", "company_name": "Border Cleaning Group", "primary_trade": "cleaning", "coverage_area": "Scottish Borders", "emergency_callout": false, "rating": 4.1, "is_active": true}, {"contact_email": "molly.boyd.contractor12@fixtures.renovoai.co.uk", "company_name": "West Coast Grounds", "primary_trade": "other", "coverage_area": "Ayrshire & Inverclyde", "emergency_callout": false, "rating": 4.0, "is_active": true}]'::jsonb) as x(
    contact_email text,
    company_name text,
    primary_trade text,
    coverage_area text,
    emergency_callout boolean,
    rating numeric,
    is_active boolean
  )
)
insert into public.contractors (
  contact_id,
  company_name,
  primary_trade,
  coverage_area,
  emergency_callout,
  rating,
  is_active,
  created_at,
  updated_at
)
select
  c.id,
  sc.company_name,
  sc.primary_trade,
  sc.coverage_area,
  sc.emergency_callout,
  sc.rating,
  sc.is_active,
  now(),
  now()
from source_contractors sc
join public.contacts c on c.email = sc.contact_email;

with source_trades as (
  select *
  from jsonb_to_recordset('[{"contact_email": "neil.baxter.contractor01@fixtures.renovoai.co.uk", "trade_type": "plumbing"}, {"contact_email": "eilidh.ross.contractor02@fixtures.renovoai.co.uk", "trade_type": "drainage"}, {"contact_email": "craig.munro.contractor03@fixtures.renovoai.co.uk", "trade_type": "fire_alarm"}, {"contact_email": "megan.christie.contractor04@fixtures.renovoai.co.uk", "trade_type": "guttering"}, {"contact_email": "lucy.rennie.contractor06@fixtures.renovoai.co.uk", "trade_type": "joinery"}, {"contact_email": "rachel.milne.contractor10@fixtures.renovoai.co.uk", "trade_type": "safety_checks"}]'::jsonb) as x(contact_email text, trade_type text)
)
insert into public.contractor_trades (contractor_id, trade_type, created_at)
select co.id, st.trade_type, now()
from source_trades st
join public.contacts c on c.email = st.contact_email
join public.contractors co on co.contact_id = c.id;

-- Insert properties.
with source_properties as (
  select *
  from jsonb_to_recordset('[{"address_line_1": "Fixture 1 Rose Street", "address_line_2": "Flat 2F", "city": "Edinburgh", "postcode": "EH2 2PR", "country": "Scotland", "property_type": "apartment", "bedroom_count": 1, "bathroom_count": 1, "furnishing_status": "furnished", "management_type": "full_management", "is_active": true, "landlord_email": "alasdair.macleod.landlord01@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 2 Buchanan Street", "address_line_2": "Apartment 4B", "city": "Glasgow", "postcode": "G1 3HL", "country": "Scotland", "property_type": "apartment", "bedroom_count": 2, "bathroom_count": 1, "furnishing_status": "part_furnished", "management_type": "rent_collection", "is_active": true, "landlord_email": "fiona.campbell.landlord02@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 3 Union Street", "address_line_2": "Top Floor", "city": "Aberdeen", "postcode": "AB11 6DA", "country": "Scotland", "property_type": "flat", "bedroom_count": 2, "bathroom_count": 1, "furnishing_status": "unfurnished", "management_type": "full_management", "is_active": true, "landlord_email": "ross.stewart.landlord03@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 4 Reform Street", "address_line_2": "Block C, Flat 3", "city": "Dundee", "postcode": "DD1 1SJ", "country": "Scotland", "property_type": "flat", "bedroom_count": 1, "bathroom_count": 1, "furnishing_status": "part_furnished", "management_type": "full_management", "is_active": true, "landlord_email": "isla.morrison.landlord04@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 5 High Street", "address_line_2": "Flat 1", "city": "Inverness", "postcode": "IV1 1HT", "country": "Scotland", "property_type": "flat", "bedroom_count": 2, "bathroom_count": 1, "furnishing_status": "furnished", "management_type": "full_management", "is_active": true, "landlord_email": "hamish.fraser.landlord05@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 6 King Street", "address_line_2": "Townhouse", "city": "Stirling", "postcode": "FK8 1DN", "country": "Scotland", "property_type": "house", "bedroom_count": 4, "bathroom_count": 2, "furnishing_status": "unfurnished", "management_type": "let_only", "is_active": true, "landlord_email": "mairi.sinclair.landlord06@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 7 South Street", "address_line_2": "Apartment 2", "city": "Perth", "postcode": "PH2 8PH", "country": "Scotland", "property_type": "apartment", "bedroom_count": 2, "bathroom_count": 1, "furnishing_status": "furnished", "management_type": "full_management", "is_active": true, "landlord_email": "ewan.douglas.landlord07@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 8 Alloway Place", "address_line_2": "Ground Floor", "city": "Ayr", "postcode": "KA7 2AA", "country": "Scotland", "property_type": "flat", "bedroom_count": 1, "bathroom_count": 1, "furnishing_status": "furnished", "management_type": "rent_collection", "is_active": true, "landlord_email": "catriona.kerr.landlord08@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 9 Pittencrieff Street", "address_line_2": "Maisonette", "city": "Dunfermline", "postcode": "KY12 8AJ", "country": "Scotland", "property_type": "house", "bedroom_count": 3, "bathroom_count": 2, "furnishing_status": "unfurnished", "management_type": "full_management", "is_active": true, "landlord_email": "callum.reid.landlord09@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 10 Gauze Street", "address_line_2": "Flat 5", "city": "Paisley", "postcode": "PA1 1EP", "country": "Scotland", "property_type": "flat", "bedroom_count": 2, "bathroom_count": 1, "furnishing_status": "part_furnished", "management_type": "full_management", "is_active": true, "landlord_email": "morag.paterson.landlord10@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 11 Vicar Street", "address_line_2": "Flat 3A", "city": "Falkirk", "postcode": "FK1 1LL", "country": "Scotland", "property_type": "flat", "bedroom_count": 2, "bathroom_count": 1, "furnishing_status": "unfurnished", "management_type": "full_management", "is_active": true, "landlord_email": "graeme.macdonald.landlord11@fixtures.renovoai.co.uk"}, {"address_line_1": "Fixture 12 Almondvale Boulevard", "address_line_2": "Apartment 8", "city": "Livingston", "postcode": "EH54 6QX", "country": "Scotland", "property_type": "apartment", "bedroom_count": 2, "bathroom_count": 2, "furnishing_status": "furnished", "management_type": "let_only", "is_active": true, "landlord_email": "shona.robertson.landlord12@fixtures.renovoai.co.uk"}]'::jsonb) as x(
    address_line_1 text,
    address_line_2 text,
    city text,
    postcode text,
    country text,
    property_type text,
    bedroom_count int,
    bathroom_count int,
    furnishing_status text,
    management_type text,
    is_active boolean,
    landlord_email text
  )
)
insert into public.properties (
  address_line_1,
  address_line_2,
  city,
  postcode,
  country,
  property_type,
  bedroom_count,
  bathroom_count,
  furnishing_status,
  management_type,
  landlord_contact_id,
  is_active,
  created_at,
  updated_at
)
select
  sp.address_line_1,
  sp.address_line_2,
  sp.city,
  sp.postcode,
  sp.country,
  sp.property_type,
  sp.bedroom_count,
  sp.bathroom_count,
  sp.furnishing_status,
  sp.management_type,
  landlord.id,
  sp.is_active,
  now(),
  now()
from source_properties sp
join public.contacts landlord on landlord.email = sp.landlord_email;

-- Insert tenancies.
with source_tenancies as (
  select *
  from jsonb_to_recordset('[{"fixture_reference": "FX-TEN-001", "property_address_line_1": "Fixture 1 Rose Street", "tenant_email": "lewis.johnston.tenant01@fixtures.renovoai.co.uk", "landlord_email": "alasdair.macleod.landlord01@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-09-01", "end_date": "2026-08-31", "rent_amount": 1150, "deposit_amount": 1150, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-001"}, {"fixture_reference": "FX-TEN-002", "property_address_line_1": "Fixture 2 Buchanan Street", "tenant_email": "emma.mckay.tenant02@fixtures.renovoai.co.uk", "landlord_email": "fiona.campbell.landlord02@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-11-15", "end_date": "2026-11-14", "rent_amount": 980, "deposit_amount": 980, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-002"}, {"fixture_reference": "FX-TEN-003", "property_address_line_1": "Fixture 3 Union Street", "tenant_email": "fraser.gordon.tenant03@fixtures.renovoai.co.uk", "landlord_email": "ross.stewart.landlord03@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-04-01", "end_date": "2026-04-12", "rent_amount": 1350, "deposit_amount": 1350, "deposit_scheme_name": "mydeposits Scotland", "deposit_reference": "FX-DEP-003"}, {"fixture_reference": "FX-TEN-004", "property_address_line_1": "Fixture 4 Reform Street", "tenant_email": "ailsa.mclean.tenant04@fixtures.renovoai.co.uk", "landlord_email": "isla.morrison.landlord04@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-10-10", "end_date": "2026-10-09", "rent_amount": 890, "deposit_amount": 890, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-004"}, {"fixture_reference": "FX-TEN-005", "property_address_line_1": "Fixture 5 High Street", "tenant_email": "rory.henderson.tenant05@fixtures.renovoai.co.uk", "landlord_email": "hamish.fraser.landlord05@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2026-01-05", "end_date": "2026-12-31", "rent_amount": 1025, "deposit_amount": 1025, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-005"}, {"fixture_reference": "FX-TEN-006", "property_address_line_1": "Fixture 6 King Street", "tenant_email": "sophie.hamilton.tenant06@fixtures.renovoai.co.uk", "landlord_email": "mairi.sinclair.landlord06@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-07-01", "end_date": "2026-06-30", "rent_amount": 1650, "deposit_amount": 1650, "deposit_scheme_name": "mydeposits Scotland", "deposit_reference": "FX-DEP-006"}, {"fixture_reference": "FX-TEN-007", "property_address_line_1": "Fixture 7 South Street", "tenant_email": "iain.davidson.tenant07@fixtures.renovoai.co.uk", "landlord_email": "ewan.douglas.landlord07@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-06-15", "end_date": "2026-05-15", "rent_amount": 1200, "deposit_amount": 1200, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-007"}, {"fixture_reference": "FX-TEN-008", "property_address_line_1": "Fixture 8 Alloway Place", "tenant_email": "orla.kennedy.tenant08@fixtures.renovoai.co.uk", "landlord_email": "catriona.kerr.landlord08@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-08-20", "end_date": "2026-08-19", "rent_amount": 875, "deposit_amount": 875, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-008"}, {"fixture_reference": "FX-TEN-009", "property_address_line_1": "Fixture 9 Pittencrieff Street", "tenant_email": "connor.wallace.tenant09@fixtures.renovoai.co.uk", "landlord_email": "callum.reid.landlord09@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-03-01", "end_date": "2026-09-30", "rent_amount": 1450, "deposit_amount": 1450, "deposit_scheme_name": "mydeposits Scotland", "deposit_reference": "FX-DEP-009"}, {"fixture_reference": "FX-TEN-010", "property_address_line_1": "Fixture 10 Gauze Street", "tenant_email": "jenna.forbes.tenant10@fixtures.renovoai.co.uk", "landlord_email": "morag.paterson.landlord10@fixtures.renovoai.co.uk", "status": "active", "tenancy_status": "active", "start_date": "2025-05-05", "end_date": "2026-04-05", "rent_amount": 1095, "deposit_amount": 1095, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-010"}, {"fixture_reference": "FX-TEN-011", "property_address_line_1": "Fixture 11 Vicar Street", "tenant_email": "ben.mcallister.tenant11@fixtures.renovoai.co.uk", "landlord_email": "graeme.macdonald.landlord11@fixtures.renovoai.co.uk", "status": "ended", "tenancy_status": "ended", "start_date": "2024-02-01", "end_date": "2026-02-28", "rent_amount": 950, "deposit_amount": 950, "deposit_scheme_name": "SafeDeposits Scotland", "deposit_reference": "FX-DEP-011"}, {"fixture_reference": "FX-TEN-012", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "tenant_email": "niamh.grant.tenant12@fixtures.renovoai.co.uk", "landlord_email": "shona.robertson.landlord12@fixtures.renovoai.co.uk", "status": "ended", "tenancy_status": "ended", "start_date": "2024-07-15", "end_date": "2026-02-15", "rent_amount": 1100, "deposit_amount": 1100, "deposit_scheme_name": "mydeposits Scotland", "deposit_reference": "FX-DEP-012"}]'::jsonb) as x(
    fixture_reference text,
    property_address_line_1 text,
    tenant_email text,
    landlord_email text,
    status text,
    tenancy_status text,
    start_date date,
    end_date date,
    rent_amount numeric,
    deposit_amount numeric,
    deposit_scheme_name text,
    deposit_reference text
  )
)
insert into public.tenancies (
  property_id,
  tenant_contact_id,
  landlord_contact_id,
  status,
  tenancy_status,
  start_date,
  end_date,
  rent_amount,
  deposit_amount,
  deposit_scheme_name,
  deposit_reference,
  created_at,
  updated_at
)
select
  p.id,
  tenant.id,
  landlord.id,
  st.status,
  st.tenancy_status,
  st.start_date,
  st.end_date,
  st.rent_amount,
  st.deposit_amount,
  st.deposit_scheme_name,
  st.deposit_reference,
  now(),
  now()
from source_tenancies st
join public.properties p on p.address_line_1 = st.property_address_line_1
join public.contacts tenant on tenant.email = st.tenant_email
join public.contacts landlord on landlord.email = st.landlord_email;

-- Insert fixture ledger entries before automation so balances are realistic when the automation runs.
with source_ledger as (
  select *
  from jsonb_to_recordset('[{"tenancy_reference": "FX-TEN-001", "property_address_line_1": "Fixture 1 Rose Street", "tenant_email": "lewis.johnston.tenant01@fixtures.renovoai.co.uk", "entry_type": "payment", "category": "rent", "status": "cleared", "amount": 1150, "due_date": "2026-03-02", "period_start": null, "period_end": "2026-03-02", "posted_at": "2026-03-02T09:00:00+00:00", "reference": "FX-PAY-2026-03-001", "notes": "fixture_seed_scotland_20260318 | March rent paid in full"}, {"tenancy_reference": "FX-TEN-002", "property_address_line_1": "Fixture 2 Buchanan Street", "tenant_email": "emma.mckay.tenant02@fixtures.renovoai.co.uk", "entry_type": "payment", "category": "rent", "status": "cleared", "amount": 980, "due_date": "2026-03-03", "period_start": null, "period_end": "2026-03-03", "posted_at": "2026-03-03T09:00:00+00:00", "reference": "FX-PAY-2026-03-002", "notes": "fixture_seed_scotland_20260318 | March rent paid in full"}, {"tenancy_reference": "FX-TEN-005", "property_address_line_1": "Fixture 5 High Street", "tenant_email": "rory.henderson.tenant05@fixtures.renovoai.co.uk", "entry_type": "payment", "category": "rent", "status": "cleared", "amount": 1025, "due_date": "2026-03-01", "period_start": null, "period_end": "2026-03-01", "posted_at": "2026-03-01T09:00:00+00:00", "reference": "FX-PAY-2026-03-005", "notes": "fixture_seed_scotland_20260318 | March rent paid in full"}, {"tenancy_reference": "FX-TEN-006", "property_address_line_1": "Fixture 6 King Street", "tenant_email": "sophie.hamilton.tenant06@fixtures.renovoai.co.uk", "entry_type": "payment", "category": "rent", "status": "cleared", "amount": 1650, "due_date": "2026-03-05", "period_start": null, "period_end": "2026-03-05", "posted_at": "2026-03-05T09:00:00+00:00", "reference": "FX-PAY-2026-03-006", "notes": "fixture_seed_scotland_20260318 | March rent paid in full"}, {"tenancy_reference": "FX-TEN-007", "property_address_line_1": "Fixture 7 South Street", "tenant_email": "iain.davidson.tenant07@fixtures.renovoai.co.uk", "entry_type": "payment", "category": "rent", "status": "cleared", "amount": 1200, "due_date": "2026-03-01", "period_start": null, "period_end": "2026-03-01", "posted_at": "2026-03-01T09:00:00+00:00", "reference": "FX-PAY-2026-03-007", "notes": "fixture_seed_scotland_20260318 | March rent paid in full"}, {"tenancy_reference": "FX-TEN-008", "property_address_line_1": "Fixture 8 Alloway Place", "tenant_email": "orla.kennedy.tenant08@fixtures.renovoai.co.uk", "entry_type": "payment", "category": "rent", "status": "cleared", "amount": 875, "due_date": "2026-03-04", "period_start": null, "period_end": "2026-03-04", "posted_at": "2026-03-04T09:00:00+00:00", "reference": "FX-PAY-2026-03-008", "notes": "fixture_seed_scotland_20260318 | March rent paid in full"}, {"tenancy_reference": "FX-TEN-004", "property_address_line_1": "Fixture 4 Reform Street", "tenant_email": "ailsa.mclean.tenant04@fixtures.renovoai.co.uk", "entry_type": "payment", "category": "rent", "status": "cleared", "amount": 300, "due_date": "2026-03-06", "period_start": null, "period_end": "2026-03-06", "posted_at": "2026-03-06T09:00:00+00:00", "reference": "FX-PAY-2026-03-004", "notes": "fixture_seed_scotland_20260318 | Partial March payment received"}, {"tenancy_reference": "FX-TEN-009", "property_address_line_1": "Fixture 9 Pittencrieff Street", "tenant_email": "connor.wallace.tenant09@fixtures.renovoai.co.uk", "entry_type": "charge", "category": "rent", "status": "open", "amount": 1450, "due_date": "2026-02-01", "period_start": "2026-02-01", "period_end": "2026-02-28", "posted_at": "2026-02-01T09:00:00+00:00", "reference": "FX-CHG-2026-02-009", "notes": "fixture_seed_scotland_20260318 | February rent remains unpaid"}, {"tenancy_reference": "FX-TEN-010", "property_address_line_1": "Fixture 10 Gauze Street", "tenant_email": "jenna.forbes.tenant10@fixtures.renovoai.co.uk", "entry_type": "charge", "category": "rent", "status": "open", "amount": 1095, "due_date": "2026-02-05", "period_start": "2026-02-01", "period_end": "2026-02-28", "posted_at": "2026-02-05T09:00:00+00:00", "reference": "FX-CHG-2026-02-010", "notes": "fixture_seed_scotland_20260318 | February rent remains unpaid during notice period"}]'::jsonb) as x(
    tenancy_reference text,
    property_address_line_1 text,
    tenant_email text,
    entry_type text,
    category text,
    status text,
    amount numeric,
    due_date date,
    period_start date,
    period_end date,
    posted_at timestamptz,
    reference text,
    notes text
  )
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
  automation_source
)
select
  t.id,
  p.id,
  c.id,
  sl.entry_type,
  sl.category,
  sl.status,
  sl.amount,
  sl.due_date,
  sl.period_start,
  sl.period_end,
  sl.posted_at,
  sl.reference,
  sl.notes,
  'fixture_seed'
from source_ledger sl
join public.properties p on p.address_line_1 = sl.property_address_line_1
join public.contacts c on c.email = sl.tenant_email
join public.tenancies t on t.property_id = p.id and t.tenant_contact_id = c.id;

-- Insert maintenance cases.
with source_cases as (
  select *
  from jsonb_to_recordset('[{"case_number": "FX-MNT-001", "tenant_email": "lewis.johnston.tenant01@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 1 Rose Street", "tenancy_reference": "FX-TEN-001", "case_type": "maintenance", "category": "leak", "status": "open", "priority": "high", "source_channel": "portal", "subject": "Fixture leak investigation", "summary": "Ceiling leak reported after heavy rain in the stairwell cupboard.", "description": "fixture_seed_scotland_20260318 | Ceiling leak reported after heavy rain in the stairwell cupboard.", "maintenance_status": "reported", "assigned_contractor_email": null, "scheduled_for": null, "approval_required": false, "estimated_cost": null, "completed_at": null}, {"case_number": "FX-MNT-002", "tenant_email": "emma.mckay.tenant02@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 2 Buchanan Street", "tenancy_reference": "FX-TEN-002", "case_type": "maintenance", "category": "heating", "status": "triaged", "priority": "urgent", "source_channel": "portal", "subject": "Fixture boiler triage", "summary": "Heating has failed and the tenant has no hot water.", "description": "fixture_seed_scotland_20260318 | Heating has failed and the tenant has no hot water.", "maintenance_status": "triaged", "assigned_contractor_email": "neil.baxter.contractor01@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": false, "estimated_cost": 180, "completed_at": null}, {"case_number": "FX-MNT-003", "tenant_email": "fraser.gordon.tenant03@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 3 Union Street", "tenancy_reference": "FX-TEN-003", "case_type": "maintenance", "category": "electrical", "status": "awaiting_contractor", "priority": "medium", "source_channel": "portal", "subject": "Fixture EICR follow-up", "summary": "Sockets in the bedroom are tripping intermittently.", "description": "fixture_seed_scotland_20260318 | Sockets in the bedroom are tripping intermittently.", "maintenance_status": "quote_requested", "assigned_contractor_email": "craig.munro.contractor03@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": false, "estimated_cost": 240, "completed_at": null}, {"case_number": "FX-MNT-004", "tenant_email": "ailsa.mclean.tenant04@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 4 Reform Street", "tenancy_reference": "FX-TEN-004", "case_type": "maintenance", "category": "damage", "status": "awaiting_landlord", "priority": "high", "source_channel": "portal", "subject": "Fixture roof approval", "summary": "Water ingress has damaged the bedroom ceiling and decoration.", "description": "fixture_seed_scotland_20260318 | Water ingress has damaged the bedroom ceiling and decoration.", "maintenance_status": "awaiting_approval", "assigned_contractor_email": "megan.christie.contractor04@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": true, "estimated_cost": 1800, "completed_at": null}, {"case_number": "FX-MNT-005", "tenant_email": "rory.henderson.tenant05@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 5 High Street", "tenancy_reference": "FX-TEN-005", "case_type": "maintenance", "category": "keys_access", "status": "scheduled", "priority": "medium", "source_channel": "portal", "subject": "Fixture lock replacement", "summary": "Front door lock is sticking and needs replacement before weekend check-in.", "description": "fixture_seed_scotland_20260318 | Front door lock is sticking and needs replacement before weekend check-in.", "maintenance_status": "scheduled", "assigned_contractor_email": "alan.mcdougall.contractor05@fixtures.renovoai.co.uk", "scheduled_for": "2026-03-21T10:00:00+00:00", "approval_required": false, "estimated_cost": 160, "completed_at": null}, {"case_number": "FX-MNT-006", "tenant_email": "sophie.hamilton.tenant06@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 6 King Street", "tenancy_reference": "FX-TEN-006", "case_type": "maintenance", "category": "damage", "status": "in_progress", "priority": "medium", "source_channel": "portal", "subject": "Fixture joinery repair", "summary": "Bathroom vanity and boxing need joinery repairs after a plumbing leak.", "description": "fixture_seed_scotland_20260318 | Bathroom vanity and boxing need joinery repairs after a plumbing leak.", "maintenance_status": "in_progress", "assigned_contractor_email": "lucy.rennie.contractor06@fixtures.renovoai.co.uk", "scheduled_for": "2026-03-19T13:00:00+00:00", "approval_required": false, "estimated_cost": 420, "completed_at": null}, {"case_number": "FX-MNT-007", "tenant_email": "iain.davidson.tenant07@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 7 South Street", "tenancy_reference": "FX-TEN-007", "case_type": "maintenance", "category": "cleaning", "status": "resolved", "priority": "low", "source_channel": "portal", "subject": "Fixture end-of-tenancy clean", "summary": "Communal clean completed ahead of renewal inspection.", "description": "fixture_seed_scotland_20260318 | Communal clean completed ahead of renewal inspection.", "maintenance_status": "completed", "assigned_contractor_email": "mark.nicol.contractor07@fixtures.renovoai.co.uk", "scheduled_for": "2026-03-12T09:00:00+00:00", "approval_required": false, "estimated_cost": 95, "completed_at": "2026-03-12T15:30:00+00:00"}, {"case_number": "FX-MNT-008", "tenant_email": "orla.kennedy.tenant08@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 8 Alloway Place", "tenancy_reference": "FX-TEN-008", "case_type": "maintenance", "category": "general", "status": "cancelled", "priority": "low", "source_channel": "portal", "subject": "Fixture external works cancel", "summary": "Planned grounds tidy-up cancelled after landlord deferred the works.", "description": "fixture_seed_scotland_20260318 | Planned grounds tidy-up cancelled after landlord deferred the works.", "maintenance_status": "cancelled", "assigned_contractor_email": "molly.boyd.contractor12@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": false, "estimated_cost": 210, "completed_at": null}]'::jsonb) as x(
    case_number text,
    tenant_email text,
    property_address_line_1 text,
    tenancy_reference text,
    case_type text,
    category text,
    status text,
    priority text,
    source_channel text,
    subject text,
    summary text,
    description text,
    maintenance_status text,
    assigned_contractor_email text,
    scheduled_for timestamptz,
    approval_required boolean,
    estimated_cost numeric,
    completed_at timestamptz
  )
)
insert into public.cases (
  case_number,
  contact_id,
  property_id,
  tenancy_id,
  case_type,
  category,
  priority,
  status,
  source_channel,
  subject,
  summary,
  description,
  opened_by_contact_id,
  created_at,
  updated_at,
  last_activity_at,
  next_action_at,
  waiting_on,
  waiting_reason
)
select
  sc.case_number,
  tenant.id,
  p.id,
  t.id,
  sc.case_type,
  sc.category,
  sc.priority,
  sc.status,
  sc.source_channel,
  sc.subject,
  sc.summary,
  sc.description,
  tenant.id,
  now(),
  now(),
  now(),
  case when sc.status in ('open', 'triaged', 'awaiting_contractor', 'awaiting_landlord', 'scheduled', 'in_progress') then now() + interval '2 days' else null end,
  case when sc.status = 'awaiting_contractor' then 'contractor' when sc.status = 'awaiting_landlord' then 'landlord' else 'none' end,
  case when sc.status = 'awaiting_contractor' then 'Waiting on contractor quote' when sc.status = 'awaiting_landlord' then 'Awaiting landlord approval' else null end
from source_cases sc
join public.contacts tenant on tenant.email = sc.tenant_email
join public.properties p on p.address_line_1 = sc.property_address_line_1
join public.tenancies t on t.property_id = p.id and t.tenant_contact_id = tenant.id;

-- Update generated maintenance requests with scenario detail.
with source_cases as (
  select *
  from jsonb_to_recordset('[{"case_number": "FX-MNT-001", "tenant_email": "lewis.johnston.tenant01@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 1 Rose Street", "tenancy_reference": "FX-TEN-001", "case_type": "maintenance", "category": "leak", "status": "open", "priority": "high", "source_channel": "portal", "subject": "Fixture leak investigation", "summary": "Ceiling leak reported after heavy rain in the stairwell cupboard.", "description": "fixture_seed_scotland_20260318 | Ceiling leak reported after heavy rain in the stairwell cupboard.", "maintenance_status": "reported", "assigned_contractor_email": null, "scheduled_for": null, "approval_required": false, "estimated_cost": null, "completed_at": null}, {"case_number": "FX-MNT-002", "tenant_email": "emma.mckay.tenant02@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 2 Buchanan Street", "tenancy_reference": "FX-TEN-002", "case_type": "maintenance", "category": "heating", "status": "triaged", "priority": "urgent", "source_channel": "portal", "subject": "Fixture boiler triage", "summary": "Heating has failed and the tenant has no hot water.", "description": "fixture_seed_scotland_20260318 | Heating has failed and the tenant has no hot water.", "maintenance_status": "triaged", "assigned_contractor_email": "neil.baxter.contractor01@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": false, "estimated_cost": 180, "completed_at": null}, {"case_number": "FX-MNT-003", "tenant_email": "fraser.gordon.tenant03@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 3 Union Street", "tenancy_reference": "FX-TEN-003", "case_type": "maintenance", "category": "electrical", "status": "awaiting_contractor", "priority": "medium", "source_channel": "portal", "subject": "Fixture EICR follow-up", "summary": "Sockets in the bedroom are tripping intermittently.", "description": "fixture_seed_scotland_20260318 | Sockets in the bedroom are tripping intermittently.", "maintenance_status": "quote_requested", "assigned_contractor_email": "craig.munro.contractor03@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": false, "estimated_cost": 240, "completed_at": null}, {"case_number": "FX-MNT-004", "tenant_email": "ailsa.mclean.tenant04@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 4 Reform Street", "tenancy_reference": "FX-TEN-004", "case_type": "maintenance", "category": "damage", "status": "awaiting_landlord", "priority": "high", "source_channel": "portal", "subject": "Fixture roof approval", "summary": "Water ingress has damaged the bedroom ceiling and decoration.", "description": "fixture_seed_scotland_20260318 | Water ingress has damaged the bedroom ceiling and decoration.", "maintenance_status": "awaiting_approval", "assigned_contractor_email": "megan.christie.contractor04@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": true, "estimated_cost": 1800, "completed_at": null}, {"case_number": "FX-MNT-005", "tenant_email": "rory.henderson.tenant05@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 5 High Street", "tenancy_reference": "FX-TEN-005", "case_type": "maintenance", "category": "keys_access", "status": "scheduled", "priority": "medium", "source_channel": "portal", "subject": "Fixture lock replacement", "summary": "Front door lock is sticking and needs replacement before weekend check-in.", "description": "fixture_seed_scotland_20260318 | Front door lock is sticking and needs replacement before weekend check-in.", "maintenance_status": "scheduled", "assigned_contractor_email": "alan.mcdougall.contractor05@fixtures.renovoai.co.uk", "scheduled_for": "2026-03-21T10:00:00+00:00", "approval_required": false, "estimated_cost": 160, "completed_at": null}, {"case_number": "FX-MNT-006", "tenant_email": "sophie.hamilton.tenant06@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 6 King Street", "tenancy_reference": "FX-TEN-006", "case_type": "maintenance", "category": "damage", "status": "in_progress", "priority": "medium", "source_channel": "portal", "subject": "Fixture joinery repair", "summary": "Bathroom vanity and boxing need joinery repairs after a plumbing leak.", "description": "fixture_seed_scotland_20260318 | Bathroom vanity and boxing need joinery repairs after a plumbing leak.", "maintenance_status": "in_progress", "assigned_contractor_email": "lucy.rennie.contractor06@fixtures.renovoai.co.uk", "scheduled_for": "2026-03-19T13:00:00+00:00", "approval_required": false, "estimated_cost": 420, "completed_at": null}, {"case_number": "FX-MNT-007", "tenant_email": "iain.davidson.tenant07@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 7 South Street", "tenancy_reference": "FX-TEN-007", "case_type": "maintenance", "category": "cleaning", "status": "resolved", "priority": "low", "source_channel": "portal", "subject": "Fixture end-of-tenancy clean", "summary": "Communal clean completed ahead of renewal inspection.", "description": "fixture_seed_scotland_20260318 | Communal clean completed ahead of renewal inspection.", "maintenance_status": "completed", "assigned_contractor_email": "mark.nicol.contractor07@fixtures.renovoai.co.uk", "scheduled_for": "2026-03-12T09:00:00+00:00", "approval_required": false, "estimated_cost": 95, "completed_at": "2026-03-12T15:30:00+00:00"}, {"case_number": "FX-MNT-008", "tenant_email": "orla.kennedy.tenant08@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 8 Alloway Place", "tenancy_reference": "FX-TEN-008", "case_type": "maintenance", "category": "general", "status": "cancelled", "priority": "low", "source_channel": "portal", "subject": "Fixture external works cancel", "summary": "Planned grounds tidy-up cancelled after landlord deferred the works.", "description": "fixture_seed_scotland_20260318 | Planned grounds tidy-up cancelled after landlord deferred the works.", "maintenance_status": "cancelled", "assigned_contractor_email": "molly.boyd.contractor12@fixtures.renovoai.co.uk", "scheduled_for": null, "approval_required": false, "estimated_cost": 210, "completed_at": null}]'::jsonb) as x(
    case_number text,
    tenant_email text,
    property_address_line_1 text,
    tenancy_reference text,
    case_type text,
    category text,
    status text,
    priority text,
    source_channel text,
    subject text,
    summary text,
    description text,
    maintenance_status text,
    assigned_contractor_email text,
    scheduled_for timestamptz,
    approval_required boolean,
    estimated_cost numeric,
    completed_at timestamptz
  )
)
update public.maintenance_requests mr
set
  status = sc.maintenance_status,
  contractor_id = contractor.id,
  scheduled_for = sc.scheduled_for,
  landlord_approval_required = sc.approval_required,
  estimated_cost = sc.estimated_cost,
  completed_at = sc.completed_at,
  updated_at = now()
from source_cases sc
join public.cases c on c.case_number = sc.case_number
left join public.contacts contractor_contact on contractor_contact.email = sc.assigned_contractor_email
left join public.contractors contractor on contractor.contact_id = contractor_contact.id
where mr.case_id = c.id;

-- Insert viewing cases.
with source_cases as (
  select *
  from jsonb_to_recordset('[{"case_number": "FX-VIEW-001", "applicant_email": "abbie.ferguson.applicant01@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Requested Saturday morning viewing.", "description": "fixture_seed_scotland_20260318 | Requested Saturday morning viewing.", "viewing_status": "requested", "requested_date": "2026-03-22T11:00:00+00:00", "booked_slot": null, "notes": "Requested Saturday morning viewing."}, {"case_number": "FX-VIEW-002", "applicant_email": "jamie.patterson.applicant02@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Interested after seeing listing on Rightmove.", "description": "fixture_seed_scotland_20260318 | Interested after seeing listing on Rightmove.", "viewing_status": "requested", "requested_date": "2026-03-23T14:00:00+00:00", "booked_slot": null, "notes": "Interested after seeing listing on Rightmove."}, {"case_number": "FX-VIEW-003", "applicant_email": "megan.boyd.applicant03@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "case_type": "viewing", "category": "viewing_booking", "status": "scheduled", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Booked evening viewing for Aberdeen flat.", "description": "fixture_seed_scotland_20260318 | Booked evening viewing for Aberdeen flat.", "viewing_status": "booked", "requested_date": "2026-03-20T17:30:00+00:00", "booked_slot": "2026-03-21T17:30:00+00:00", "notes": "Booked evening viewing for Aberdeen flat."}, {"case_number": "FX-VIEW-004", "applicant_email": "rossina.ahmed.applicant04@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "case_type": "viewing", "category": "viewing_booking", "status": "scheduled", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Confirmed viewing with guarantor attending.", "description": "fixture_seed_scotland_20260318 | Confirmed viewing with guarantor attending.", "viewing_status": "confirmed", "requested_date": "2026-03-24T13:00:00+00:00", "booked_slot": "2026-03-24T13:00:00+00:00", "notes": "Confirmed viewing with guarantor attending."}, {"case_number": "FX-VIEW-005", "applicant_email": "calum.fraser.applicant05@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 3 Union Street", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Wants flexible midweek appointment.", "description": "fixture_seed_scotland_20260318 | Wants flexible midweek appointment.", "viewing_status": "requested", "requested_date": "2026-03-25T09:30:00+00:00", "booked_slot": null, "notes": "Wants flexible midweek appointment."}, {"case_number": "FX-VIEW-006", "applicant_email": "eve.robertson.applicant06@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 7 South Street", "case_type": "viewing", "category": "viewing_booking", "status": "resolved", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Completed family viewing, awaiting feedback.", "description": "fixture_seed_scotland_20260318 | Completed family viewing, awaiting feedback.", "viewing_status": "completed", "requested_date": "2026-03-10T12:00:00+00:00", "booked_slot": "2026-03-10T12:00:00+00:00", "notes": "Completed family viewing, awaiting feedback."}, {"case_number": "FX-VIEW-007", "applicant_email": "noah.bell.applicant07@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 8 Alloway Place", "case_type": "viewing", "category": "viewing_booking", "status": "cancelled", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Applicant cancelled after finding another property.", "description": "fixture_seed_scotland_20260318 | Applicant cancelled after finding another property.", "viewing_status": "cancelled", "requested_date": "2026-03-18T16:00:00+00:00", "booked_slot": null, "notes": "Applicant cancelled after finding another property."}, {"case_number": "FX-VIEW-008", "applicant_email": "holly.mcdonald.applicant08@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 9 Pittencrieff Street", "case_type": "viewing", "category": "viewing_booking", "status": "scheduled", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Weekend viewing requested in Ayr.", "description": "fixture_seed_scotland_20260318 | Weekend viewing requested in Ayr.", "viewing_status": "booked", "requested_date": "2026-03-26T10:30:00+00:00", "booked_slot": "2026-03-26T10:30:00+00:00", "notes": "Weekend viewing requested in Ayr."}, {"case_number": "FX-VIEW-009", "applicant_email": "gregor.campbell.applicant09@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Awaiting call back after brochure was sent.", "description": "fixture_seed_scotland_20260318 | Awaiting call back after brochure was sent.", "viewing_status": "requested", "requested_date": "2026-03-27T15:00:00+00:00", "booked_slot": null, "notes": "Awaiting call back after brochure was sent."}, {"case_number": "FX-VIEW-010", "applicant_email": "zara.mcintyre.applicant10@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "case_type": "viewing", "category": "viewing_booking", "status": "resolved", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Completed viewing for Livingston apartment.", "description": "fixture_seed_scotland_20260318 | Completed viewing for Livingston apartment.", "viewing_status": "completed", "requested_date": "2026-03-14T11:00:00+00:00", "booked_slot": "2026-03-14T11:00:00+00:00", "notes": "Completed viewing for Livingston apartment."}]'::jsonb) as x(
    case_number text,
    applicant_email text,
    property_address_line_1 text,
    case_type text,
    category text,
    status text,
    priority text,
    source_channel text,
    subject text,
    summary text,
    description text,
    viewing_status text,
    requested_date timestamptz,
    booked_slot timestamptz,
    notes text
  )
)
insert into public.cases (
  case_number,
  contact_id,
  property_id,
  case_type,
  category,
  priority,
  status,
  source_channel,
  subject,
  summary,
  description,
  opened_by_contact_id,
  created_at,
  updated_at,
  last_activity_at,
  next_action_at,
  waiting_on,
  waiting_reason
)
select
  sc.case_number,
  applicant.id,
  p.id,
  sc.case_type,
  sc.category,
  sc.priority,
  sc.status,
  sc.source_channel,
  sc.subject,
  sc.summary,
  sc.description,
  applicant.id,
  now(),
  now(),
  now(),
  case when sc.status in ('open', 'scheduled') then now() + interval '1 day' else null end,
  'none',
  null
from source_cases sc
join public.contacts applicant on applicant.email = sc.applicant_email
join public.properties p on p.address_line_1 = sc.property_address_line_1;

-- Update generated viewing requests with requested dates and statuses.
with source_cases as (
  select *
  from jsonb_to_recordset('[{"case_number": "FX-VIEW-001", "applicant_email": "abbie.ferguson.applicant01@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Requested Saturday morning viewing.", "description": "fixture_seed_scotland_20260318 | Requested Saturday morning viewing.", "viewing_status": "requested", "requested_date": "2026-03-22T11:00:00+00:00", "booked_slot": null, "notes": "Requested Saturday morning viewing."}, {"case_number": "FX-VIEW-002", "applicant_email": "jamie.patterson.applicant02@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Interested after seeing listing on Rightmove.", "description": "fixture_seed_scotland_20260318 | Interested after seeing listing on Rightmove.", "viewing_status": "requested", "requested_date": "2026-03-23T14:00:00+00:00", "booked_slot": null, "notes": "Interested after seeing listing on Rightmove."}, {"case_number": "FX-VIEW-003", "applicant_email": "megan.boyd.applicant03@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "case_type": "viewing", "category": "viewing_booking", "status": "scheduled", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Booked evening viewing for Aberdeen flat.", "description": "fixture_seed_scotland_20260318 | Booked evening viewing for Aberdeen flat.", "viewing_status": "booked", "requested_date": "2026-03-20T17:30:00+00:00", "booked_slot": "2026-03-21T17:30:00+00:00", "notes": "Booked evening viewing for Aberdeen flat."}, {"case_number": "FX-VIEW-004", "applicant_email": "rossina.ahmed.applicant04@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "case_type": "viewing", "category": "viewing_booking", "status": "scheduled", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Confirmed viewing with guarantor attending.", "description": "fixture_seed_scotland_20260318 | Confirmed viewing with guarantor attending.", "viewing_status": "confirmed", "requested_date": "2026-03-24T13:00:00+00:00", "booked_slot": "2026-03-24T13:00:00+00:00", "notes": "Confirmed viewing with guarantor attending."}, {"case_number": "FX-VIEW-005", "applicant_email": "calum.fraser.applicant05@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 3 Union Street", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Wants flexible midweek appointment.", "description": "fixture_seed_scotland_20260318 | Wants flexible midweek appointment.", "viewing_status": "requested", "requested_date": "2026-03-25T09:30:00+00:00", "booked_slot": null, "notes": "Wants flexible midweek appointment."}, {"case_number": "FX-VIEW-006", "applicant_email": "eve.robertson.applicant06@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 7 South Street", "case_type": "viewing", "category": "viewing_booking", "status": "resolved", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Completed family viewing, awaiting feedback.", "description": "fixture_seed_scotland_20260318 | Completed family viewing, awaiting feedback.", "viewing_status": "completed", "requested_date": "2026-03-10T12:00:00+00:00", "booked_slot": "2026-03-10T12:00:00+00:00", "notes": "Completed family viewing, awaiting feedback."}, {"case_number": "FX-VIEW-007", "applicant_email": "noah.bell.applicant07@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 8 Alloway Place", "case_type": "viewing", "category": "viewing_booking", "status": "cancelled", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Applicant cancelled after finding another property.", "description": "fixture_seed_scotland_20260318 | Applicant cancelled after finding another property.", "viewing_status": "cancelled", "requested_date": "2026-03-18T16:00:00+00:00", "booked_slot": null, "notes": "Applicant cancelled after finding another property."}, {"case_number": "FX-VIEW-008", "applicant_email": "holly.mcdonald.applicant08@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 9 Pittencrieff Street", "case_type": "viewing", "category": "viewing_booking", "status": "scheduled", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Weekend viewing requested in Ayr.", "description": "fixture_seed_scotland_20260318 | Weekend viewing requested in Ayr.", "viewing_status": "booked", "requested_date": "2026-03-26T10:30:00+00:00", "booked_slot": "2026-03-26T10:30:00+00:00", "notes": "Weekend viewing requested in Ayr."}, {"case_number": "FX-VIEW-009", "applicant_email": "gregor.campbell.applicant09@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "case_type": "viewing", "category": "viewing_booking", "status": "open", "priority": "medium", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Awaiting call back after brochure was sent.", "description": "fixture_seed_scotland_20260318 | Awaiting call back after brochure was sent.", "viewing_status": "requested", "requested_date": "2026-03-27T15:00:00+00:00", "booked_slot": null, "notes": "Awaiting call back after brochure was sent."}, {"case_number": "FX-VIEW-010", "applicant_email": "zara.mcintyre.applicant10@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "case_type": "viewing", "category": "viewing_booking", "status": "resolved", "priority": "low", "source_channel": "webform", "subject": "Fixture viewing enquiry", "summary": "Completed viewing for Livingston apartment.", "description": "fixture_seed_scotland_20260318 | Completed viewing for Livingston apartment.", "viewing_status": "completed", "requested_date": "2026-03-14T11:00:00+00:00", "booked_slot": "2026-03-14T11:00:00+00:00", "notes": "Completed viewing for Livingston apartment."}]'::jsonb) as x(
    case_number text,
    applicant_email text,
    property_address_line_1 text,
    case_type text,
    category text,
    status text,
    priority text,
    source_channel text,
    subject text,
    summary text,
    description text,
    viewing_status text,
    requested_date timestamptz,
    booked_slot timestamptz,
    notes text
  )
)
update public.viewing_requests vr
set
  requested_date = sc.requested_date,
  booked_slot = sc.booked_slot,
  status = sc.viewing_status,
  notes = sc.notes,
  updated_at = now()
from source_cases sc
join public.cases c on c.case_number = sc.case_number
where vr.case_id = c.id;

-- Insert deposit cases.
with source_cases as (
  select *
  from jsonb_to_recordset('[{"case_number": "FX-DEP-CASE-001", "tenant_email": "ben.mcallister.tenant11@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "tenancy_reference": "FX-TEN-011", "case_type": "deposit", "category": "deposit_dispute", "status": "open", "priority": "high", "source_channel": "internal", "subject": "Fixture deposit claim", "summary": "Evidence pack uploaded for wall damage and cleaning deductions.", "description": "fixture_seed_scotland_20260318 | Evidence pack uploaded for wall damage and cleaning deductions.", "claim_status": "disputed", "total_claim_amount": 420, "tenant_agreed_amount": 150, "disputed_amount": 270, "scheme_reference": "SCHEME-FX-DEP-CASE-001", "evidence_notes": "Evidence pack uploaded for wall damage and cleaning deductions.", "submitted_at": "2026-03-11T10:00:00+00:00", "resolved_at": null}, {"case_number": "FX-DEP-CASE-002", "tenant_email": "niamh.grant.tenant12@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "tenancy_reference": "FX-TEN-012", "case_type": "deposit", "category": "deposit_dispute", "status": "resolved", "priority": "low", "source_channel": "internal", "subject": "Fixture deposit claim", "summary": "Deposit released after agreed carpet cleaning deduction.", "description": "fixture_seed_scotland_20260318 | Deposit released after agreed carpet cleaning deduction.", "claim_status": "resolved", "total_claim_amount": 180, "tenant_agreed_amount": 180, "disputed_amount": 0, "scheme_reference": "SCHEME-FX-DEP-CASE-002", "evidence_notes": "Deposit released after agreed carpet cleaning deduction.", "submitted_at": "2026-03-08T10:00:00+00:00", "resolved_at": "2026-03-15T16:00:00+00:00"}]'::jsonb) as x(
    case_number text,
    tenant_email text,
    property_address_line_1 text,
    tenancy_reference text,
    case_type text,
    category text,
    status text,
    priority text,
    source_channel text,
    subject text,
    summary text,
    description text,
    claim_status text,
    total_claim_amount numeric,
    tenant_agreed_amount numeric,
    disputed_amount numeric,
    scheme_reference text,
    evidence_notes text,
    submitted_at timestamptz,
    resolved_at timestamptz
  )
)
insert into public.cases (
  case_number,
  contact_id,
  property_id,
  tenancy_id,
  case_type,
  category,
  priority,
  status,
  source_channel,
  subject,
  summary,
  description,
  opened_by_contact_id,
  created_at,
  updated_at,
  last_activity_at,
  next_action_at,
  waiting_on,
  waiting_reason,
  resolved_at,
  closed_at
)
select
  sc.case_number,
  tenant.id,
  p.id,
  t.id,
  sc.case_type,
  sc.category,
  sc.priority,
  sc.status,
  sc.source_channel,
  sc.subject,
  sc.summary,
  sc.description,
  tenant.id,
  now(),
  now(),
  now(),
  case when sc.status = 'open' then now() + interval '3 days' else null end,
  case when sc.status = 'open' then 'tenant' else 'none' end,
  case when sc.status = 'open' then 'Awaiting tenant response on deposit claim' else null end,
  sc.resolved_at,
  case when sc.status = 'resolved' then sc.resolved_at else null end
from source_cases sc
join public.contacts tenant on tenant.email = sc.tenant_email
join public.properties p on p.address_line_1 = sc.property_address_line_1
join public.tenancies t on t.property_id = p.id and t.tenant_contact_id = tenant.id;

-- Update generated deposit claims.
with source_cases as (
  select *
  from jsonb_to_recordset('[{"case_number": "FX-DEP-CASE-001", "tenant_email": "ben.mcallister.tenant11@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 11 Vicar Street", "tenancy_reference": "FX-TEN-011", "case_type": "deposit", "category": "deposit_dispute", "status": "open", "priority": "high", "source_channel": "internal", "subject": "Fixture deposit claim", "summary": "Evidence pack uploaded for wall damage and cleaning deductions.", "description": "fixture_seed_scotland_20260318 | Evidence pack uploaded for wall damage and cleaning deductions.", "claim_status": "disputed", "total_claim_amount": 420, "tenant_agreed_amount": 150, "disputed_amount": 270, "scheme_reference": "SCHEME-FX-DEP-CASE-001", "evidence_notes": "Evidence pack uploaded for wall damage and cleaning deductions.", "submitted_at": "2026-03-11T10:00:00+00:00", "resolved_at": null}, {"case_number": "FX-DEP-CASE-002", "tenant_email": "niamh.grant.tenant12@fixtures.renovoai.co.uk", "property_address_line_1": "Fixture 12 Almondvale Boulevard", "tenancy_reference": "FX-TEN-012", "case_type": "deposit", "category": "deposit_dispute", "status": "resolved", "priority": "low", "source_channel": "internal", "subject": "Fixture deposit claim", "summary": "Deposit released after agreed carpet cleaning deduction.", "description": "fixture_seed_scotland_20260318 | Deposit released after agreed carpet cleaning deduction.", "claim_status": "resolved", "total_claim_amount": 180, "tenant_agreed_amount": 180, "disputed_amount": 0, "scheme_reference": "SCHEME-FX-DEP-CASE-002", "evidence_notes": "Deposit released after agreed carpet cleaning deduction.", "submitted_at": "2026-03-08T10:00:00+00:00", "resolved_at": "2026-03-15T16:00:00+00:00"}]'::jsonb) as x(
    case_number text,
    tenant_email text,
    property_address_line_1 text,
    tenancy_reference text,
    case_type text,
    category text,
    status text,
    priority text,
    source_channel text,
    subject text,
    summary text,
    description text,
    claim_status text,
    total_claim_amount numeric,
    tenant_agreed_amount numeric,
    disputed_amount numeric,
    scheme_reference text,
    evidence_notes text,
    submitted_at timestamptz,
    resolved_at timestamptz
  )
)
update public.deposit_claims dc
set
  claim_status = sc.claim_status,
  total_claim_amount = sc.total_claim_amount,
  tenant_agreed_amount = sc.tenant_agreed_amount,
  disputed_amount = sc.disputed_amount,
  scheme_reference = sc.scheme_reference,
  evidence_notes = sc.evidence_notes,
  submitted_at = sc.submitted_at,
  resolved_at = sc.resolved_at,
  updated_at = now()
from source_cases sc
join public.cases c on c.case_number = sc.case_number
where dc.case_id = c.id;

-- Run automation now that fixture tenancies and baseline rent/payment history exist.
select public.run_rent_and_lease_automation(current_date);

commit;
