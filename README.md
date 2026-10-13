# IBR Registry Compliance and Mockup

Compliance test suite and mock API for the **DCI Integrated Beneficiary Registry (IBR) API v1.0.0**
([`ibr_api_v1.0.0.yaml`](https://github.com/spdci/api-standards), `draft` branch), checking the IBR
data standard: Person (DO.IBR.01), Member (DO.IBR.02), Group (DO.IBR.03), Beneficiary (DO.IBR.04),
Programme, Benefit and BenefitFrequency, the IBR code directory (CD.IBR.01-07) and the data types
and formats. The data objects and code lists come from [`spdci/schemas`](https://github.com/spdci/schemas)
(`extensions/ibr/v1`, `core/v1`) and the DCI IBR v1.0.0 self-assessment.

## What is covered

All 13 endpoints of the standard, split by the system that exposes them:

| Side | Endpoint (mock path) | Spec path | Mock behaviour |
|---|---|---|---|
| IBR | `ibr/sync/search` | `/registry/sync/search` | Search results (header `on-search` + SearchResponse) |
| IBR | `ibr/search` | `/registry/search` | ACK, then `on-search` callback to `header.sender_uri` |
| IBR | `ibr/sync/enrolled` | `/registry/sync/enrolled` | EnrolledResponse: `yes` / `no` per beneficiary |
| IBR | `ibr/sync/enrollment/updates` | `/registry/sync/enrollment/updates` | EnrollmentUpdatesResponse: one receipt per beneficiary |
| IBR | `ibr/subscribe` | `/registry/subscribe` | ACK, then `on-subscribe` callback |
| IBR | `ibr/unsubscribe` | `/registry/unsubscribe` | ACK, then `on-unsubscribe` callback |
| IBR | `ibr/txn/status` | `/registry/txn/status` | ACK, then `txn/on-status` callback |
| IBR | `ibr/sync/txn/status` | `/registry/sync/txn/status` | Transaction status (header `txn-on-status` + TxnStatusResponse) |
| SP-MIS | `ibr/on-search` | `/registry/on-search` | ACK |
| SP-MIS | `ibr/on-subscribe` | `/registry/on-subscribe` | ACK |
| SP-MIS | `ibr/on-unsubscribe` | `/registry/on-unsubscribe` | ACK |
| SP-MIS | `ibr/txn/on-status` | `/registry/txn/on-status` | ACK |
| SP-MIS | `ibr/notify` | `/registry/notify` | ACK |

Every mock endpoint validates the request against the spec schema, including the IBR data it
carries, and answers an `ERR` acknowledgement (`err.request.bad`, HTTP 400) when it does not
conform.

A search targets one IBR record type, given by `search_criteria.reg_record_type` (`Beneficiary`,
`IBRPerson`, `Member`, `Group`) or `response_entity` (`Member`, `Group`). Without either, the
records are beneficiaries, as declared by the IBR SearchResponse:

- **beneficiary search**: beneficiaries by the identifier of their member, of the member's person,
  of their group or of the head of their group, and by programme;
- **person search**: IBR persons by identifier (UIN, BRN, MRN, DRN);
- **member search**: members by member identifier or by the identifier of their person;
- **group search**: households by group identifier, or the household of a person by the
  identifier of any of its members.

The process flows of the standard map to these endpoints:

| Process flow | Endpoint | What the suite checks |
|---|---|---|
| PRS.IBR.01 SP-MIS checks whether a beneficiary is enrolled in a programme | `sync/enrolled` | member and household level, person identifier, any programme or one per programme, batches (`in`), idtype-value, predicate and spec example query forms, the minimal `yes` / `no` answer (no beneficiary data disclosed) |
| PRS.IBR.02 SP-MIS publishes beneficiaries and benefits | `sync/enrollment/updates` | every benefit type, individuals and households, batches, receipt per beneficiary, refusal of beneficiaries with invalid data |
| PRS.IBR.03 SP-MIS publishes enrolment status changes | `sync/enrollment/updates`, `notify`, `subscribe` | death, graduation, suspension, batches, alerting other schemes through notifications |
| PRS.IBR.00.6 receipt and transaction status | `txn/status`, `sync/txn/status`, `txn/on-status` | `search`, `subscribe` and `receipt` transactions by every attribute type |

PRS.IBR.04 (the IBR queries the social registry) is a call **from** the IBR to the SR: it is covered
by the SR compliance suite.

The test suite (`test/features`, 1206 scenarios) checks, per endpoint:

- **smoke**: status, JSON content type, response time, response schema;
- **functional**: beneficiary, person, member and group search by every identifier type; predicate
  and expression queries; batch requests, including batches mixing record types; pagination,
  sorting, locale, consent / authorize; not-found and rejected results; every enrolment check of
  PRS.IBR.01; every publication of PRS.IBR.02 / 03; every IBR event on every record type; every
  status reason code; every txn type and attribute type;
- **callback**: the full async round trip. The suite starts a listener, sends it as
  `header.sender_uri`, and validates the callback the IBR sends back;
- **negative**: requests that break the spec must be refused using one of the spec's error forms
  (`ERR` ack, HttpErrorResponse, or a `rjct` status);
- **data** (`ibr_*_data.feature`, offline): the IBR data rules.

### IBR data rules

Almost every IBR attribute is optional (cardinality 0...1 or 0...*), so a record may disclose only an
identifier. But whenever an attribute **is** sent it must be correct. Every record returned or sent
by any endpoint (search results, published beneficiaries, notifications, transaction status,
receipts) is checked against the rules of its record type, including the members, groups,
programmes and benefits nested in it. Registry-specific extension attributes are allowed.

**Beneficiary (DO.IBR.04)**

| Attribute | Rule when present |
|---|---|
| `assistance_unit` | AssistanceUnitEnum: 1 Member, 2 Household, 3 Family |
| `member` | Member (all member rules) |
| `group` | Group (all group rules) |
| `programme_identifier` | non-empty list of Programme; a programme is listed once |
| `enrolment_date` / `enrollment_date` | ISO 8601, real date, not in the future |
| `enrolment_status` / `enrollment_status` | EnrollmentStatusEnum: 1 Active, 2 Deceased, 3 Graduated, 4 Suspended |
| `status_change_date` | list of ISO 8601 dates, not in the future |
| `benefits` | list of Benefit |
| `additional_attributes` | list of strings or of `{ name, value }` |
| Consistency | both spellings agree when both are sent; enrolment ≥ birth of the member's person; status changes and benefits ≥ enrolment; no benefit after the person's death; a person with a death date is not Active; a household or family is not Deceased; a non-active status has a status change date when the list is sent; `assistance_unit` agrees with `group.group_type`; a Member unit is not given as a group only; the member is one of the group's members |

**Programme, Benefit, BenefitFrequency**

| Object | Attribute | Rule when present |
|---|---|---|
| Programme | `programme_name`, `programme_identifier` | **mandatory (1...1)**, non-empty strings |
| Programme | `institution_type` | InstitutionEnum 1-8 |
| Programme | `legal_status` | LegalStatusEnum 1-3 |
| Programme | `social_protection_functions` | list of SocialProtectionFunctionEnum 1-15, no duplicates |
| Programme | `contribution_type` | ContributionTypeEnum 1-3 |
| Programme | `programme_type` | ProgrammeTypeEnum 1-14 |
| Programme | `benefit`, `benefit_frequency` | lists of Benefit, BenefitFrequency |
| Benefit | `benefit_type` | BenefitTypeEnum 1-6 (Cash, Voucher, In-kind, Training, Work opportunity, Insurance) |
| Benefit | `benefit_date` | ISO 8601, real date, not in the future |
| Benefit | `benefit_value` | decimal ≥ 0, as a number or a decimal string (`"USD 50"` is rejected) |
| Benefit | `benefit_quantity` | integer ≥ 1 |
| BenefitFrequency | `freq` | RRULE frequency: YEARLY, MONTHLY, WEEKLY, DAILY, HOURLY, MINUTELY, SECONDLY |
| BenefitFrequency | `wkst` | MO, TU, WE, TH, FR, SA, SU |
| BenefitFrequency | `interval`, `count` | integer ≥ 1 |
| BenefitFrequency | `dtstart`, `until` | ISO 8601 real dates (may lie in the future); `until` ≥ `dtstart`; `count` and `until` not both given (RFC 5545) |

**Person (DO.IBR.01)**

| Attribute | Rule when present |
|---|---|
| `identifier` | non-empty list of Identifier: `identifier_type` in UIN, BRN, MRN, DRN; non-empty string `identifier_value`; no duplicates |
| `name` | object with at least `surname` or `given_name`; every part is a string |
| `sex` | male, female, other, unknown |
| `birth_date`, `death_date`, `registration_date`, `last_updated` | ISO 8601 date or date-time (DF.01), real calendar date, not in the future |
| `address` | Address object or non-empty list; text parts are strings; `country_code` ISO 3166 alpha-2/3; plus code format; geo bounds northeast ≥ southwest |
| `phone_number` | list of E.164 numbers (DF.02) |
| `email` | list of RFC 5322 addresses (DF.03) |
| Consistency | death ≥ birth; registration ≥ birth; last update ≥ registration |

**Member (DO.IBR.02)**

| Attribute | Rule when present |
|---|---|
| `member_identifier` | non-empty list of Identifier, no duplicates |
| `demographic_info` | the IBR Person itself (all person rules), not wrapped in `person` |
| `related_person` | list of RelatedPerson: `relationship_type` in RelationshipTypeEnum (107 codes); `related_member` is a Member reference or a Person; a member is not related to itself except as `SELF` |
| `is_disabled`, `self_id_disability` | boolean or 1 / 0; both flags agree when both are sent |
| `disability_info` | list of DisabilityInfo: `functional_type` / `disability_limitation_type` in VIS_SS, HEAR_SS, MOB_SS, COG_SS, SC_SS, COM_SS; `functional_severity` 1-4; a severity needs the limitation it applies to |
| `marital_status` | S, M, W, A, D, L, U |
| `employment_status` | EmploymentStatusEnum 1-8 |
| `occupation` | ISCO-08 level 1, 0-9 |
| `income_level` | non-empty country-defined code |
| `education_level` | ISCED 0-8 |
| `language_code` | list of ISO 639 codes |
| `additional_attributes` | list of `{ name, value }` |
| `registration_date`, `last_updated` | ISO 8601, real date, not in the future; registration ≥ birth of the person; last update ≥ registration |
| Beneficiary attributes | `programme_identifier`, `enrolment_*`, `status_change_date`, `benefits` belong to the beneficiary, not inside the member |

**Group (DO.IBR.03)**

| Attribute | Rule when present |
|---|---|
| `group_identifier` | non-empty list of Identifier, no duplicates |
| `group_type` | AssistanceUnitEnum: 1 Member, 2 Household, 3 Family |
| `place` / `geographical_location` | Place object; `geo` latitude in [-90, 90], longitude in [-180, 180] |
| `address` | Address object or non-empty list |
| `place_address` | boolean or 1 / 0; 1 requires a place, 0 requires an address |
| `poverty_score` | number (DT.04 decimal) |
| `poverty_score_type` | non-empty string |
| `group_head_info` | Member (all member rules); one of the members of `member_list` |
| `group_size` | integer ≥ 1; not smaller than the number of members listed |
| `member_list` | list of Member (all member rules); no member listed twice |
| `registration_date`, `last_updated`, `additional_attributes` | as for Member |

Numeric codes are accepted as strings (`"4"`) or JSON integers (`4`). Labels (`"Active"`, `"Cash"`,
`"household"`, `"married"`, `"Public"`) are rejected: the standard exchanges codes.

The rules live in `test/features/support/helpers/schemas.js` (JSON Schema) and
`test/features/support/helpers/validator.js` (cross-field rules). The data features prove each
rule: they accept each attribute when absent, accept every code of every code list and correct
values in every allowed form, and reject incorrect ones.

### Where the spec is ambiguous

The published sources disagree in places. The suite's choices:

- **enrolment attributes**: the data standard spells `enrolment_date` / `enrolment_status`,
  Beneficiary.jsonld `enrollment_date` / `enrollment_status`. Both are accepted; they must agree
  when both are sent;
- **mandatory attributes**: Beneficiary.jsonld and Benefit.jsonld list required attributes, the
  data standard (self-assessment) makes them 0...1. The suite follows the data standard: only
  `programme_name` and `programme_identifier` (1...1) are required;
- **Benefit.benefit_value**: `common:Currency` in Benefit.jsonld, Decimal in the data standard. A
  decimal is required (number or decimal string);
- **Beneficiary.additional_attributes**: a list of strings (Beneficiary.jsonld) or of name / value
  pairs (core). Both are accepted;
- **IBR events**: the spec enum spells `enrollement` / `enrollement_status_change`; the process
  flows spell `enrollment`. Both are accepted, bare or namespaced
  (`spdci-common:RegistryEventType:enrollement`). `Deregister` is described but not in the enum,
  so it is rejected;
- **response_entity**: `common/ResponseEntity.yaml` lists `Group` and `Member`, the EnrolledCriteria
  example uses `Beneficiary`. All three are accepted;
- **`sync/enrolled` and `sync/enrollment/updates` responses**: the spec gives the bare
  EnrolledResponse / EnrollmentUpdatesResponse as the response, while every other DCI sync response
  is an envelope (`header` + `message`). Both forms are accepted; the mock returns the bare form;
- **`sync/enrollment/updates` header**: the spec gives the request a callback header with action
  `notify` (so `header.status` is required). The suite follows the spec;
- **EnrolledCriteria.query**: an object whose shape is not defined beyond the example
  `{ "person_identifier": { "eq": ... } }`. The suite uses that expression form with
  `programme_identifier`, `member_identifier` and `group_identifier`, `in` for batches, and checks
  the `idtype-value` and predicate forms. EnrolledResponse items carry no identifier, so batch
  answers cannot be matched to the identifiers asked; the suite checks their number;
- **`reg_records`**: an array in SearchResponse, a single object in NotifyEventRequest (both
  accepted). Without a `reg_record_type`, `reg_records` are Beneficiary records;
- **IBR Person**: IBRPerson.jsonld is a subclass of core Person with no extra attribute (its `@id`
  reads `SR_Person`); the record type is accepted as `IBRPerson`, `IBR_Person` or `Person`;
- `address`: list (core Person) or single object (Group 0...1); address lines as
  `address_line_1`/`address_line_2`, `address_line1`/`address_line2` or
  `street_address`/`city`/`country`;
- disability flag: `self_id_disability` (data standard) and `is_disabled` (core, spec example);
- `txn_status` of a `subscribe` transaction: the spec only lists SearchResponse and
  ReceiptRequest, the suite expects a SubscribeResponse.

The published IBR examples do not follow the data standard themselves (codes sent as labels,
`NID` / `NationalID` outside IdentifierTypeEnum, `member_identifier` as a string, dates as
`02.05.2024`, `demographic_info` wrapping a `person`, the enrolment nested inside the member,
`benefit_value` as `"USD 50"`, the Person identifier as a single object).
`ibr_beneficiary_data.feature`, `ibr_member_data.feature` and `ibr_person_data.feature` list
exactly what is wrong with them.

## Prerequisites

Docker and Docker Compose. To run without Docker you need Node.js 18 or later.

## Run the mocks

```bash
./test_entrypoint.sh
```

The IBR endpoints are served on port **3333** and the SP-MIS endpoints on port **3334**. Run
`GET /healthcheck` on either port to check they are up.

The mocks are generated from the test suite's schemas and records, so the two always agree.
After changing `schemas.js` or `fixtures/records.js`, regenerate them and rebuild:

```bash
node mock/generate-mocks.mjs
```

The generated `mockoon-ibr.json` and `mockoon-sp.json` can be opened in the Mockoon desktop
app (v9 or later).

Mock test data. The mock IBR holds seven beneficiaries, their households, members and persons:

| Record type | Profile | Identifier | Enrolment |
|---|---|---|---|
| Beneficiary | household (every attribute) | UIN `GRP1001`, head UIN `M100000001` | Child Support Grant `DCI001`, Active |
| Beneficiary | individual (`enrollment_*` spelling) | UIN `M200000001`, person UIN `200000001` | Old Age Pension `DCI002`, Active |
| Beneficiary | graduated | UIN `M847951632` | Public Works `DCI003`, Graduated |
| Beneficiary | suspended (family) | UIN `GRP3001` | `DCI001`, Suspended |
| Beneficiary | deceased | DRN `DRN2024000123`, UIN `M300000002` | `DCI002`, Deceased |
| Beneficiary | in-kind (every benefit type) | BRN `BRN2014000004`, UIN `M100000004` | School Feeding `DCI004`, Active |
| Beneficiary | minimal (member reference only) | UIN `M900000001` | none |
| Group | full, minimal, large, single | UIN `GRP1001`, `GRP2001`, `GRP3001`, `GRP4001` | |
| Member | full, minimal, disabled, widow, deceased, child, single | UIN `M100000001`, `M900000001`, `M100000004`, `M200000001`, `M300000002`, `M100000003`, `M847951632` | |
| IBRPerson | full, minimal, deceased, multi, newborn, example person | UIN `100000001`, `300000001`, DRN `DRN2024000123`, MRN `MRN2008000202`, BRN `BRN2014000004`, UIN `847951632` | |

The enrolment check answers `yes` for the members, persons and groups of the **Active**
beneficiaries, for their programme or for "any programme" (no `programme_identifier` in the
query), and `no` otherwise. Predicate and expression searches return the beneficiaries of the
child grant, the households with `poverty_score` < 5, the female widow and the women born since
1980. The value `TOOMANY000` is rejected with `rjct.search.too_many_records_found`. Any other
identifier returns an empty result.

## Run the compliance tests

With Docker:

```bash
cd test && ./test_entrypoint.sh
```

Without Docker:

```bash
cd test && npm install && npx cucumber-js
```

Reports are written to `test/result` (HTML, JUnit XML, Cucumber messages).

### Testing your own implementation

| Variable | Default | Purpose |
|---|---|---|
| `IBR_BASE_URL` | `http://127.0.0.1:3333/` | IBR under test (search, enrolled, enrollment updates, subscribe, txn status, ...) |
| `SP_BASE_URL` | `http://127.0.0.1:3334/` | SP-MIS under test (on-search, notify, ...) |
| `CALLBACK_PORT` / `CALLBACK_BASE_URL` | `3335` / `http://127.0.0.1:3335/` | Listener used as `header.sender_uri`; must be reachable from the IBR under test |
| `TEST_DATA_FILE` | none | JSON overriding the identifiers and programmes queried (see `helpers/testdata.js`) |
| `AUTH_TOKEN` | none | Sent as `Authorization: Bearer <token>` |
| `SENDER_ID` / `RECEIVER_ID` | `spmis.example.org` / `ibr.example.org` | `header.sender_id` / `receiver_id` |
| `RESPONSE_TIMEOUT_MS` / `CALLBACK_TIMEOUT_MS` | `15000` / `10000` | Timeouts |
| `CUCUMBER_TAGS` (Docker only) | none | Tag expression to select scenarios |

Endpoint paths are listed in `test/features/support/helpers/helpers.js`.

A `TEST_DATA_FILE` names, per record type, identifiers that exist in your registry, and the
programmes to check enrolment against:

```json
{
  "records": {
    "Beneficiary": { "household": { "identifier_type": "UIN", "identifier_value": "HH-0042" } },
    "Member": { "widow": { "identifier_type": "UIN", "identifier_value": "M-7781" } },
    "IBRPerson": { "deceased": { "identifier_type": "DRN", "identifier_value": "D-2024-19" } }
  },
  "programmes": { "child grant": "CSG-2024", "pension": "OAP-01" }
}
```

Select scenarios with tags:

| Tag | Scenarios |
|---|---|
| `@smoke` | basic checks for each endpoint |
| `@functional` | use cases |
| `@beneficiary`, `@person`, `@member`, `@group` | sync search by record type |
| `@callback` | async round trips (need the listener to be reachable) |
| `@negative` | invalid requests |
| `@data` | offline IBR data rules |
| `@strict-data` | the IBR / SP-MIS must reject messages carrying invalid IBR data |
| `@mock` | relies on mock-only test data (exact yes / no answers, too-many-records rejection) |

For example, to test a real IBR:

```bash
IBR_BASE_URL=https://ibr.example.org/ TEST_DATA_FILE=./my-data.json npx cucumber-js --tags "not @mock"
```
