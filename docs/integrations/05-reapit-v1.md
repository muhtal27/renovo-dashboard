# Reapit v1 Connector

## Overview

Reapit Foundations is the UK's largest property management CRM, used by ~30% of letting agents. Renovo will publish a marketplace app that agencies install to connect their Reapit account.

## V1 Inbound Objects (Reapit → Renovo)

| Reapit resource | Renovo entity | Sync direction | Trigger |
|-----------------|---------------|----------------|---------|
| Properties | `properties` (cache) | Inbound | Webhook `properties.modified` + on-demand pull |
| Tenancies | `tenancies` (cache) | Inbound | Webhook `tenancies.modified` + on-demand pull |
| Contacts (tenants) | `tenancies.tenant_name`, `tenant_email` | Inbound | Resolved via tenancy relationships |
| Contacts (landlords) | `tenancies.landlord_name` | Inbound | Resolved via tenancy relationships |
| Negotiations | Not used in v1 | — | Deferred |

### Field mappings: Property

| Reapit field | Renovo field | Notes |
|-------------|-------------|-------|
| `id` | `external_refs.external_id` | Stored as `reapit:{id}` in reference |
| `address.line1` | `properties.address_line_1` | |
| `address.line2` | `properties.address_line_2` | |
| `address.line3` + `line4` | `properties.city` | Concatenate if both present |
| `address.postcode` | `properties.postcode` | |
| `address.buildingName` or `line1` | `properties.name` | Fallback to first line of address |
| `type` | Filter only | Only sync properties where `letting.status` is active |
| `modified` | `external_refs.metadata.modified_at` | For incremental sync |

### Field mappings: Tenancy

| Reapit field | Renovo field | Notes |
|-------------|-------------|-------|
| `id` | `external_refs.external_id` | |
| `propertyId` | Resolve via `external_refs` → `properties.id` | |
| `startDate` | `tenancies.start_date` | |
| `endDate` | `tenancies.end_date` | |
| `deposit` | `tenancies.deposit_amount` | |
| `related[role=tenant].name` | `tenancies.tenant_name` | First tenant contact |
| `related[role=tenant].email` | `tenancies.tenant_email` | |
| `related[role=landlord].name` | `tenancies.landlord_name` | |
| `status` | Filter only | Only sync `current` or `finished` tenancies |
| `modified` | `external_refs.metadata.modified_at` | |

## V1 Outbound Objects (Renovo → Reapit)

### Narrowed scope for v1

Full case mirror is the long-term goal but is complex. V1 focuses on the most valuable write-backs:

| Renovo event | Reapit action | API endpoint | Priority |
|-------------|---------------|-------------|----------|
| Case status changes | Create/update journal entry (note) | `POST /journal-entries` | **P0** |
| Document generated (liability report, charge letter) | Attach document to property | `POST /documents` | **P0** |
| Case resolved with outcome | Update tenancy negotiation status | `PATCH /tenancies/{id}` | **P1** |
| Claim submitted | Create journal entry with claim reference | `POST /journal-entries` | **P1** |

### What is explicitly deferred from v1

| Feature | Reason for deferral |
|---------|-------------------|
| Full defect-by-defect sync to Reapit | Reapit has no native "defect" entity; would require custom fields |
| Timeline event sync | Would flood Reapit's journal; operators prefer summary notes |
| Evidence photo sync | Large file uploads; Reapit storage limits unclear |
| Bidirectional case status (Reapit → Renovo) | Cases are Renovo-owned; external status changes would create conflicts |
| Tenancy creation from Renovo | Renovo never creates tenancies; always reads from PMS |
| Contact creation/update | Renovo never modifies contact data |

## Auth Assumptions

### Reapit Foundations OAuth 2.0

- **Grant type:** Authorization Code (for marketplace apps)
- **Scopes needed:** `read:properties`, `read:tenancies`, `read:contacts`, `write:journal-entries`, `write:documents`
- **Token storage:** Access token (1h TTL) + refresh token (30d TTL) stored encrypted per connection
- **Token refresh:** Automatic before expiry; if refresh fails → mark connection as `auth_failed`

### App registration

Renovo registers as a Reapit developer and creates a marketplace app:
- App type: "Integration"
- Listed in Reapit AppMarket
- Agencies click "Install" → OAuth consent screen → callback to Renovo
- Each installation creates one `integration_connections` row

## Install / Connection Flow

```
1. Agency finds "Renovo" in Reapit AppMarket
2. Clicks "Install" → redirected to Reapit OAuth consent
3. Agency approves requested scopes
4. Reapit redirects to: https://api.renovoai.co.uk/v1/integrations/reapit/callback
   ?code=AUTH_CODE&customerId=REAPIT_CUSTOMER_ID
5. Renovo exchanges code for tokens
6. Renovo stores:
   - integration_connections row (provider='reapit', credentials={access_token, refresh_token, expires_at})
   - config: {customer_id, installation_id}
7. Renovo registers webhooks with Reapit:
   POST /webhooks
   { url: "https://api.renovoai.co.uk/v1/webhooks/reapit/{connection_id}", topics: [...] }
8. Trigger initial backfill (properties → tenancies)
9. Connection status → 'active'
```

### Mapping Reapit customer to Renovo tenant

The OAuth callback must resolve which Renovo tenant this installation belongs to. Options:

**Recommended approach:** The install is initiated from Renovo's Settings page, which pre-creates the connection record and embeds the `connection_id` in the OAuth `state` parameter. When the callback arrives, we look up the connection by state → know the tenant.

**Fallback:** If the agency installs from Reapit AppMarket directly (not from Renovo), the callback creates a "pending" connection. The operator must then link it in Renovo Settings.

## Webhook Events Needed

| Reapit topic | Purpose | Processing |
|--------------|---------|-----------|
| `properties.modified` | Keep property cache fresh | Advisory → pull property by ID |
| `properties.created` | Discover new properties | Advisory → pull property by ID |
| `tenancies.modified` | Keep tenancy cache fresh | Advisory → pull tenancy by ID |
| `tenancies.created` | Discover new tenancies (potential trigger for rule engine) | Advisory → pull tenancy by ID, emit `tenancy.created` internal event |

## Sync Direction Summary

| Entity | Direction | Method |
|--------|-----------|--------|
| Properties | Reapit → Renovo | Webhook (advisory) + on-demand pull |
| Tenancies | Reapit → Renovo | Webhook (advisory) + on-demand pull |
| Contacts | Reapit → Renovo | Resolved via tenancy pull (embedded) |
| Case status notes | Renovo → Reapit | Push on case.status_changed event |
| Generated documents | Renovo → Reapit | Push on case.document_generated event |
| Tenancy status update | Renovo → Reapit | Push on case.resolved event |

## Reapit API Details

### Base URL

Production: `https://platform.reapit.cloud`
Sandbox: `https://platform.reapit.cloud` (uses sandbox customer ID)

### Key endpoints used

```
GET  /properties?customerId={id}&lettingStatus=toLet,underOffer,tenancyCurrent
GET  /properties/{id}
GET  /tenancies?customerId={id}&status=current,finished&modifiedFrom={since}
GET  /tenancies/{id}?embed=appointments,contacts
GET  /contacts/{id}
POST /journal-entries  (write case notes)
POST /documents        (attach files)
POST /webhooks         (register webhook subscriptions)
```

### Rate limits

Reapit applies per-customer rate limits (not published precisely). The connector must:
- Use exponential backoff on 429
- Respect `Retry-After` header
- Batch requests where possible (use `id` filters for bulk lookups)

## Risk Section

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Reapit marketplace approval takes 2-6 weeks | Blocks production testing with real agencies | Start application immediately; use sandbox for development |
| Reapit webhook delivery is not guaranteed | Missed events → stale cache | On-demand pull button + health check that detects drift |
| Reapit API versioning changes | Breaking changes with notice period | Pin to specific API version; monitor deprecation emails |
| Large portfolio backfill (1000+ properties) | Timeout or rate limit during initial sync | Batch with delays; allow partial backfill; retry failed batches |
| Refresh token expiry (30 days unused) | Connection silently dies | Health check every 6h; proactive refresh; alert operator on failure |
| Reapit customer ID resolution during install | Wrong tenant gets connected | Embed connection_id in OAuth state; validate after callback |

## Dependency Notes

1. **Reapit Developer Account** — must register at developers.reapit.cloud (requires company details, takes ~48h)
2. **Reapit Sandbox** — provided after developer registration; separate customer ID for testing
3. **SSL certificate** — callback URL must be HTTPS on a verified domain
4. **Webhook endpoint must respond within 5s** — Reapit retries 3x then disables webhook
5. **Document upload** — max 10MB per file; supported types: PDF, PNG, JPG
6. **Journal entries** — max 10,000 chars per entry; used for case status notes

## Implementation Checklist

- [ ] Register Reapit developer account
- [ ] Create marketplace app listing (name, description, icons, scopes)
- [ ] Implement OAuth callback handler
- [ ] Implement token refresh logic
- [ ] Implement ReapitApiClient (httpx wrapper)
- [ ] Implement property pull + mapping
- [ ] Implement tenancy pull + mapping
- [ ] Implement webhook receiver + signature verification
- [ ] Implement journal entry push (case status)
- [ ] Implement document upload push
- [ ] Health check (validate credentials every 6h)
- [ ] Settings UI: "Connect Reapit" button → OAuth flow
- [ ] Settings UI: Connection status, last sync, sync now button
- [ ] Submit for marketplace approval
