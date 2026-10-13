// JSON Schemas (draft-07) for the DCI Integrated Beneficiary Registry (IBR) API v1.0.0.
//
// Sources:
//  - api-standards/src/registry/ibr_api_v1.0.0.yaml (draft, 2026-07) and the schemas it
//    references (registry/ibr/*, registry/schema/*, extensions/ibr/*, common/schema/*)
//  - DCI IBR v1.0.0 data standard (self-assessment: DO.IBR.01 Person, DO.IBR.02 Member,
//    DO.IBR.03 Group, DO.IBR.04 Beneficiary, Programme, Benefit, BenefitFrequency, code
//    directory CD.IBR.01-07, data types and formats DT/DF)
//  - schemas/extensions/ibr/v1/{data,code} and schemas/core/v1/{data,code}
//
// Almost every IBR data attribute is optional (cardinality 0...1 or 0...*). The schemas
// therefore do not require them, but whenever an attribute IS present its type, format,
// code list and structure are enforced. The only mandatory data attributes are
// programme_name and programme_identifier of a Programme (1...1). Registry extensions
// (extra attributes) are allowed.
//
// The same definitions are embedded in the Mockoon mocks (valid_json_schema rules), so
// they deliberately use only draft-07 keywords and ajv-formats formats (no custom ones).

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------
const DATE = '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])';
const TIME = '([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d+)?)?';
const TZ = '(Z|[+-]([01]\\d|2[0-3]):?[0-5]\\d)';
// ISO 8601 calendar date, optionally with time and timezone (DF.01, e.g. "1985-05-20T00:00:00Z").
export const ISO_DATE_PATTERN = `^${DATE}(T${TIME}${TZ}?)?$`;
// E.164 phone number (DF.02).
export const E164_PATTERN = '^\\+[1-9]\\d{1,14}$';
// ISO 639-3 language code, as required by the spec's `locale`.
export const LOCALE_PATTERN = '^[a-z]{3}$';
// Member.language_code: ISO 639 code (LanguageCodeEnum uses "en", the spec example ["en", "es"]).
export const LANGUAGE_CODE_PATTERN = '^[a-z]{2,3}$';
// ISO 3166-1 alpha-2 / alpha-3 country code.
export const COUNTRY_CODE_PATTERN = '^[A-Z]{2,3}$';
// Open Location Code (plus code), full or padded.
export const PLUS_CODE_PATTERN = '^[23456789CFGHJMPQRVWX0]{2,8}\\+[23456789CFGHJMPQRVWX]{0,3}$';
// Decimal number sent as a string (DT.04; schema:GeoCoordinates accepts Number or Text).
export const DECIMAL_STRING_PATTERN = '^-?\\d+(\\.\\d+)?$';
// Non-negative amount sent as a string (Benefit.benefit_value, DT.04). "USD 50" is not a decimal.
export const AMOUNT_STRING_PATTERN = '^\\d+(\\.\\d+)?$';

// IBR record types (RegistryRecordType), bare or namespaced ("spdci-extensions-ibr:Member").
const NS = '^([A-Za-z0-9_.-]+:)*';
export const BENEFICIARY_RECORD_TYPE_PATTERN = `${NS}Beneficiary$`;
export const PERSON_RECORD_TYPE_PATTERN = `${NS}(IBRPerson|IBR_Person|Person)$`;
export const MEMBER_RECORD_TYPE_PATTERN = `${NS}Member$`;
export const GROUP_RECORD_TYPE_PATTERN = `${NS}Group$`;
export const RECORD_TYPE_PATTERN = `${NS}(Beneficiary|IBRPerson|IBR_Person|Person|Member|Group)$`;
// IBR registry events (registry/ibr/RegistryEventType.yaml), bare or namespaced as in the
// spec ("spdci-common:RegistryEventType:enrollement"). The spec spells them "enrollement";
// the correct spelling (process flow examples) is accepted too.
export const IBR_EVENT_PATTERN = `${NS}(enrollement|enrollement_status_change|enrollment|enrollment_status_change)$`;

// ---------------------------------------------------------------------------
// Code lists
// ---------------------------------------------------------------------------
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

export const codes = {
  // ----- data: core code directory (CD.COM) -----
  identifierType: ['UIN', 'BRN', 'MRN', 'DRN'], // IdentifierTypeEnum
  sex: ['male', 'female', 'other', 'unknown'], // SexCategoryEnum
  maritalStatus: ['S', 'M', 'W', 'A', 'D', 'L', 'U'], // MaritalStatusEnum (CD.COM.02)
  employmentStatus: range(1, 8), // EmploymentStatusEnum (CD.COM.16)
  occupation: range(0, 9), // OccupationEnum, ISCO-08 level 1 (CD.COM.18)
  educationLevel: range(0, 8), // EducationCodeEnum, ISCED 2011 (CD.COM.15)
  assistanceUnit: range(1, 3), // AssistanceUnitEnum (CD.COM.13): 1 Member, 2 Household, 3 Family
  functionalType: ['VIS_SS', 'HEAR_SS', 'MOB_SS', 'COG_SS', 'SC_SS', 'COM_SS'], // FunctionalLimitationType (WG-SS)
  functionalSeverity: range(1, 4), // FunctionalSeverityEnum
  relationshipType: [ // RelationshipTypeEnum (HL7 v3 RoleCode personal relationships)
    'SELF', 'PRIMSPOUS', 'FAMMEMB',
    'CHILD', 'CHILDADOPT', 'DAUADOPT', 'SONADOPT', 'CHILDFOST', 'DAUFOST', 'SONFOST', 'DAUC', 'DAU',
    'STPDAU', 'NCHILD', 'SON', 'SONC', 'STPSON', 'STPCHILD',
    'EXT', 'AUNT', 'MAUNT', 'PAUNT', 'COUSN', 'MCOUSN', 'PCOUSN',
    'GGRPRN', 'GGRFTH', 'MGGRFTH', 'PGGRFTH', 'GGRMTH', 'MGGRMTH', 'PGGRMTH', 'MGGRPRN', 'PGGRPRN',
    'GRNDCHILD', 'GRNDDAU', 'GRNDSON', 'GRPRN', 'GRFTH', 'MGRFTH', 'PGRFTH', 'GRMTH', 'PGRMTH', 'MGRMTH',
    'PGRPRN', 'MGRPRN',
    'INLAW', 'CHLDINLAW', 'DAUINLAW', 'SONINLAW', 'PRNINLAW', 'FTHINLAW', 'MTHINLAW', 'SIBINLAW',
    'BROINLAW', 'SISINLAW',
    'NIENEPH', 'NEPHEW', 'NEICE', 'UNCLE', 'PUNCLE', 'MUNCLE',
    'PRN', 'ADOPTP', 'ADOPTF', 'ADOPTM', 'FTH', 'FTHFOST', 'NFTH', 'NFTHF', 'STPFTH',
    'MTH', 'GESTM', 'FOSTMTH', 'NMTH', 'NMTHF', 'STPMTH', 'NPRN', 'PRNFOST', 'STPPRN',
    'SIB', 'BRO', 'HBRO', 'NBRO', 'TWINBRO', 'FTWINBRO', 'ITWINBRO', 'STPBRO', 'HSIB', 'HSIS', 'NSIB',
    'NSIS', 'TWINSIS', 'FTWINSIS', 'ITWINSIS', 'TWIN', 'FTWIN', 'ITWIN', 'SIS', 'STPSIS', 'STPSIB',
    'SIGOTHR', 'DOMPART', 'FRMSPS', 'SPS', 'HUSB', 'WIFE',
  ],

  // ----- data: IBR code directory (CD.IBR) -----
  enrollmentStatus: range(1, 4), // CD.IBR.01b EnrollmentStatusEnum: 1 Active, 2 Deceased, 3 Graduated, 4 Suspended
  benefitType: range(1, 6), // CD.IBR.02 BenefitTypeEnum: Cash, Voucher, In-kind, Training, Work opportunity, Insurance
  institutionType: range(1, 8), // CD.IBR.03 InstitutionEnum
  legalStatus: range(1, 3), // CD.IBR.04 LegalStatusEnum
  socialProtectionFunction: range(1, 15), // CD.IBR.05 SocialProtectionFunctionEnum
  contributionType: range(1, 3), // CD.IBR.06 ContributionTypeEnum
  programmeType: range(1, 14), // CD.IBR.07 ProgrammeTypeEnum
  // BenefitFrequency (iCalendar RRULE, RFC 5545)
  rruleFrequency: ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY', 'MINUTELY', 'SECONDLY'],
  weekday: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],

  // ----- API -----
  ibrEvent: ['enrollement', 'enrollement_status_change'],
  // receipt_type of ReceiptInformation (RegistryEventType, also spelled correctly in process flows).
  receiptType: ['enrollement', 'enrollement_status_change', 'enrollment', 'enrollment_status_change'],
  recordType: ['Beneficiary', 'IBRPerson', 'Member', 'Group'],
  // common/ResponseEntity.yaml lists Group and Member; EnrolledCriteria's example uses Beneficiary.
  responseEntity: ['Group', 'Member', 'Beneficiary'],
  enrolledStatus: ['yes', 'no'],
  requestStatus: ['rcvd', 'pdng', 'succ', 'rjct'],
  ackStatus: ['ACK', 'NACK', 'ERR'],
  searchQueryType: ['idtype-value', 'expression', 'predicate'], // social/QueryType.yaml (IBR search)
  queryType: ['idtype-value', 'expression', 'predicate', 'graphql'], // common/QueryType.yaml (subscribe, enrolled)
  operator: ['gt', 'lt', 'eq', 'ge', 'le', 'in'],
  condition: ['and', 'or', 'not'],
  sortOrder: ['asc', 'desc'],
  txnType: ['search', 'subscribe', 'receipt'],
  attributeType: ['transaction_id', 'reference_id_list', 'correlation_id'],
  subscriptionStatus: ['subscribe', 'unsubscribe'],
  searchStatusReasonCode: [
    'rjct.reference_id.invalid', 'rjct.reference_id.duplicate', 'rjct.timestamp.invalid',
    'rjct.search_criteria.invalid', 'rjct.filter.invalid', 'rjct.sort.invalid',
    'rjct.pagination.invalid', 'rjct.search.too_many_records_found',
  ],
  subscribeStatusReasonCode: [
    'rjct.reference_id.invalid', 'rjct.reference_id.duplicate', 'rjct.timestamp.invalid',
    'rjct.notify_types.invalid', 'rjct.notify_details.invalid', 'rjct.person_id.invalid',
    'rjct.event.already_subscribed',
  ],
  unsubscribeStatusReasonCode: [
    'rjct.reference_id.invalid', 'rjct.reference_id.duplicate', 'rjct.timestamp.invalid',
    'rjct.subscription_code.invalid', 'rjct.requester.invalid', 'rjct.event.already_unsubscribed',
  ],
  headerStatusReasonCode: [
    'rjct.version.invalid', 'rjct.message_id.duplicate', 'rjct.message_ts.invalid',
    'rjct.action.invalid', 'rjct.action.not_supported', 'rjct.total_count.invalid',
    'rjct.total_count.limit_exceeded', 'rjct.errors.too_many',
  ],
  errorCode: [
    'err.request.bad', 'err.request.unauthorized', 'err.request.forbidden', 'err.request.not_found',
    'err.request.timeout', 'err.version.not_supported', 'err.request.too_many_requests',
    'err.sender_id.invalid', 'err.sender_uri.invalid', 'err.receiver_id.invalid',
    'err.signature.missing', 'err.signature.invalid', 'err.encryption.invalid',
    'err.service.unavailable',
  ],
};

const ref = (name) => ({ $ref: `#/definitions/${name}` });
const str = { type: 'string' };
const nonEmptyStr = { type: 'string', minLength: 1 };
const jsonLd = {
  '@context': { type: ['string', 'object'] },
  '@id': str,
  '@type': str,
};
// A code from a code list. Numeric code lists ("1", "2", ...) also accept the JSON integer.
const code = (values) => ({
  enum: values.every((v) => /^\d+$/.test(v)) ? [...values, ...values.map(Number)] : values,
});
// DT.06 boolean; the standard describes these flags as yes (1) / no (0).
const flag = { enum: [true, false, 0, 1] };
// Cardinality 0...* (DT.05): a non-empty list.
const listOf = (item) => ({ type: 'array', minItems: 1, items: item });

// DO.IBR.01 Person attributes (also accepted on RelatedPerson.related_member).
const personProperties = {
  ...jsonLd,
  identifier: ref('IdentifierList'),
  name: ref('Name'),
  sex: { type: 'string', enum: codes.sex },
  birth_date: ref('IsoDate'),
  death_date: ref('IsoDate'),
  address: ref('AddressOrList'),
  phone_number: { type: 'array', items: { type: 'string', pattern: E164_PATTERN } },
  email: { type: 'array', items: { type: 'string', format: 'email' } },
  registration_date: ref('IsoDate'),
  last_updated: ref('IsoDate'),
};

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------
export const definitions = {
  // ----- common types -----
  DateTime: { type: 'string', format: 'date-time' },
  IsoDate: { type: 'string', pattern: ISO_DATE_PATTERN },
  TransactionId: { type: 'string', minLength: 1, maxLength: 99 },
  CorrelationId: { type: 'string', minLength: 1, maxLength: 99, pattern: '^[a-zA-Z0-9-]+$' },
  ReferenceId: nonEmptyStr,
  SubscriptionCode: { type: 'string', minLength: 1, maxLength: 99 },
  Locale: { type: 'string', pattern: LOCALE_PATTERN },
  RequestStatus: { type: 'string', enum: codes.requestStatus },
  StatusReasonMessage: { type: 'string', maxLength: 999 },
  Version: { type: 'string', minLength: 1 },
  RegType: nonEmptyStr,
  RegRecordType: { type: 'string', pattern: RECORD_TYPE_PATTERN },
  RegEventType: { type: 'string', pattern: IBR_EVENT_PATTERN },
  ResponseEntity: { type: 'string', enum: codes.responseEntity },
  AttributeValue: { type: ['string', 'number', 'boolean', 'object'] },
  Pagination: {
    type: 'object',
    required: ['page_size', 'page_number', 'total_count'],
    properties: {
      page_size: { type: 'integer', minimum: 1 },
      page_number: { type: 'integer', minimum: 1 },
      total_count: { type: 'integer', minimum: 0 },
    },
  },
  RequestPagination: {
    type: 'object',
    required: ['page_size'],
    properties: {
      page_size: { type: 'integer', minimum: 1 },
      page_number: { type: 'integer', minimum: 1 },
    },
  },
  Purpose: {
    type: 'object',
    properties: {
      text: str,
      code: str,
      ref_uri: { type: 'string', format: 'uri' },
    },
  },
  Consent: {
    type: 'object',
    properties: { ...jsonLd, ts: ref('DateTime'), purpose: ref('Purpose') },
  },

  // ----- message envelope -----
  MsgSignature: nonEmptyStr,
  Meta: { type: 'object' },
  MsgHeader: {
    type: 'object',
    required: ['message_id', 'message_ts', 'action', 'sender_id', 'total_count'],
    properties: {
      version: ref('Version'),
      message_id: nonEmptyStr,
      message_ts: ref('DateTime'),
      action: nonEmptyStr,
      sender_id: nonEmptyStr,
      sender_uri: { type: 'string', format: 'uri' },
      receiver_id: nonEmptyStr,
      total_count: { type: 'integer', minimum: 0 },
      is_msg_encrypted: { type: 'boolean' },
      meta: ref('Meta'),
    },
  },
  MsgCallbackHeader: {
    type: 'object',
    required: ['message_id', 'message_ts', 'action', 'status'],
    properties: {
      version: ref('Version'),
      message_id: nonEmptyStr,
      message_ts: ref('DateTime'),
      action: nonEmptyStr,
      status: ref('RequestStatus'),
      status_reason_code: { type: 'string', enum: codes.headerStatusReasonCode },
      status_reason_message: ref('StatusReasonMessage'),
      total_count: { type: 'integer', minimum: 0 },
      completed_count: { type: 'integer', minimum: 0 },
      sender_id: nonEmptyStr,
      receiver_id: nonEmptyStr,
      is_msg_encrypted: { type: 'boolean' },
      meta: ref('Meta'),
    },
  },
  EncryptedMessage: {
    type: 'object',
    required: ['header', 'ciphertext', 'encrypted_key', 'tag', 'iv'],
    properties: {
      header: {
        type: 'object',
        required: ['alg', 'enc', 'kid'],
        properties: { alg: nonEmptyStr, enc: nonEmptyStr, kid: nonEmptyStr },
      },
      ciphertext: nonEmptyStr,
      encrypted_key: nonEmptyStr,
      tag: nonEmptyStr,
      iv: nonEmptyStr,
    },
  },
  Error: {
    type: 'object',
    properties: {
      code: { type: 'string', enum: codes.errorCode },
      message: { type: 'string', maxLength: 999 },
    },
  },

  // ----- data building blocks (core) -----
  Identifier: {
    type: 'object',
    required: ['identifier_type', 'identifier_value'],
    properties: {
      ...jsonLd,
      identifier_type: { type: 'string', enum: codes.identifierType },
      identifier_value: nonEmptyStr,
    },
  },
  IdentifierList: listOf(ref('Identifier')),
  Name: {
    type: 'object',
    anyOf: [{ required: ['surname'] }, { required: ['given_name'] }],
    properties: {
      '@type': str,
      surname: str,
      given_name: str,
      second_name: str,
      maiden_name: str,
      prefix: str,
      suffix: str,
    },
  },
  Coordinate: {
    anyOf: [{ type: 'number' }, { type: 'string', pattern: DECIMAL_STRING_PATTERN }],
  },
  GeoCoordinates: {
    type: 'object',
    required: ['latitude', 'longitude'],
    properties: {
      '@id': str,
      '@type': str,
      latitude: { allOf: [ref('Coordinate'), { minimum: -90, maximum: 90 }] },
      longitude: { allOf: [ref('Coordinate'), { minimum: -180, maximum: 180 }] },
    },
  },
  GeoLocation: {
    type: 'object',
    properties: {
      '@id': str,
      '@type': str,
      plus_code: {
        type: 'object',
        properties: {
          global_code: { type: 'string', pattern: PLUS_CODE_PATTERN },
          geometry: {
            type: 'object',
            properties: {
              '@id': str,
              '@type': str,
              bounds: {
                type: 'object',
                properties: {
                  '@id': str,
                  '@type': str,
                  northeast: ref('GeoCoordinates'),
                  southwest: ref('GeoCoordinates'),
                },
              },
              location: ref('GeoCoordinates'),
            },
          },
        },
      },
    },
  },
  Address: {
    type: 'object',
    properties: {
      ...jsonLd,
      // core Address.jsonld uses address_line_1/2; other DCI examples address_line1/2 and
      // street_address/city/country.
      address_line_1: str,
      address_line_2: str,
      address_line1: str,
      address_line2: str,
      street_address: str,
      city: str,
      country: str,
      locality: str,
      sub_region_code: str,
      region_code: str,
      postal_code: str,
      country_code: { type: 'string', pattern: COUNTRY_CODE_PATTERN },
      geo_location: ref('GeoLocation'),
    },
  },
  // Person.address is 0...* (a list), Group.address 0...1 (one address): both forms are accepted.
  AddressOrList: { anyOf: [ref('Address'), listOf(ref('Address'))] },
  Place: {
    type: 'object',
    properties: {
      ...jsonLd,
      name: str,
      address_line: str,
      address: str,
      geo: ref('GeoCoordinates'),
      contained_in_place: { anyOf: [{ type: 'string' }, ref('Place')] },
      contains_place: { type: 'array', items: ref('Place') },
    },
  },
  AttributeNameValue: {
    type: 'object',
    required: ['name', 'value'],
    properties: { name: nonEmptyStr, value: ref('AttributeValue') },
  },
  AdditionalAttributes: { type: 'array', items: ref('AttributeNameValue') },

  // ----- DO.IBR.01 Person (IBRPerson) -----
  IBRPerson: { type: 'object', properties: personProperties },

  // ----- DisabilityInfo -----
  FunctionalType: code(codes.functionalType),
  DisabilityInfo: {
    type: 'object',
    properties: {
      '@type': str,
      // Data standard: functional_type (0...*); core DisabilityInfo.jsonld: disability_limitation_type.
      functional_type: { anyOf: [ref('FunctionalType'), listOf(ref('FunctionalType'))] },
      disability_limitation_type: { anyOf: [ref('FunctionalType'), listOf(ref('FunctionalType'))] },
      functional_severity: code(codes.functionalSeverity),
    },
  },

  // ----- RelatedPerson -----
  // related_member is a Person in core RelatedPerson.jsonld and a Member reference in the
  // spec example: the attributes of both are accepted.
  RelatedMember: {
    type: 'object',
    properties: {
      ...personProperties,
      member_identifier: ref('IdentifierList'),
      demographic_info: ref('IBRPerson'),
    },
  },
  RelatedPerson: {
    type: 'object',
    properties: {
      '@type': str,
      relationship_type: { type: 'string', enum: codes.relationshipType },
      related_member: ref('RelatedMember'),
    },
  },

  // ----- DO.IBR.02 Member -----
  Member: {
    type: 'object',
    properties: {
      ...jsonLd,
      member_identifier: ref('IdentifierList'),
      // IBR Member.jsonld: demographic_info is an IBR Person.
      demographic_info: ref('IBRPerson'),
      related_person: { type: 'array', items: ref('RelatedPerson') },
      // Data standard: self_id_disability; core Member.jsonld and spec example: is_disabled.
      is_disabled: flag,
      self_id_disability: flag,
      disability_info: { type: 'array', items: ref('DisabilityInfo') },
      marital_status: { type: 'string', enum: codes.maritalStatus },
      employment_status: code(codes.employmentStatus),
      occupation: code(codes.occupation),
      // CD.COM.17 is country-defined: any non-empty code.
      income_level: { anyOf: [nonEmptyStr, { type: 'integer' }] },
      language_code: { type: 'array', items: { type: 'string', pattern: LANGUAGE_CODE_PATTERN } },
      education_level: code(codes.educationLevel),
      additional_attributes: ref('AdditionalAttributes'),
      registration_date: ref('IsoDate'),
      last_updated: ref('IsoDate'),
    },
  },

  // ----- DO.IBR.03 Group -----
  Group: {
    type: 'object',
    properties: {
      ...jsonLd,
      group_identifier: ref('IdentifierList'),
      group_type: code(codes.assistanceUnit),
      // Data standard: place; core Group.jsonld: geographical_location.
      place: ref('Place'),
      geographical_location: ref('Place'),
      address: ref('AddressOrList'),
      place_address: flag,
      poverty_score: { type: 'number' },
      poverty_score_type: nonEmptyStr,
      group_head_info: ref('Member'),
      group_size: { type: 'integer', minimum: 1 },
      member_list: { type: 'array', items: ref('Member') },
      registration_date: ref('IsoDate'),
      last_updated: ref('IsoDate'),
      additional_attributes: ref('AdditionalAttributes'),
    },
  },

  // ----- Benefit (Benefit.jsonld) -----
  Amount: {
    anyOf: [{ type: 'number', minimum: 0 }, { type: 'string', pattern: AMOUNT_STRING_PATTERN }],
  },
  Benefit: {
    type: 'object',
    properties: {
      ...jsonLd,
      benefit_type: code(codes.benefitType),
      benefit_date: ref('IsoDate'),
      benefit_value: ref('Amount'),
      benefit_description: nonEmptyStr,
      benefit_quantity: { type: 'integer', minimum: 1 },
    },
  },

  // ----- BenefitFrequency (BenefitFrequency.jsonld, iCalendar RRULE) -----
  BenefitFrequency: {
    type: 'object',
    properties: {
      ...jsonLd,
      freq: { type: 'string', enum: codes.rruleFrequency },
      dtstart: ref('IsoDate'),
      interval: { type: 'integer', minimum: 1 },
      wkst: { type: 'string', enum: codes.weekday },
      count: { type: 'integer', minimum: 1 },
      until: ref('IsoDate'),
    },
  },

  // ----- Programme (Programme.jsonld) -----
  Programme: {
    type: 'object',
    // DO.IBR Programme: programme_name and programme_identifier are 1...1.
    required: ['programme_name', 'programme_identifier'],
    properties: {
      ...jsonLd,
      programme_name: nonEmptyStr,
      programme_identifier: nonEmptyStr,
      programme_description: nonEmptyStr,
      implementing_institution: nonEmptyStr,
      institution_type: code(codes.institutionType),
      legal_status: code(codes.legalStatus),
      social_protection_functions: { type: 'array', items: code(codes.socialProtectionFunction) },
      contribution_type: code(codes.contributionType),
      programme_type: code(codes.programmeType),
      benefit: { type: 'array', items: ref('Benefit') },
      benefit_frequency: { type: 'array', items: ref('BenefitFrequency') },
    },
  },

  // ----- DO.IBR.04 Beneficiary -----
  // additional_attributes: a list of strings (Beneficiary.jsonld) or of name/value pairs.
  BeneficiaryAdditionalAttributes: {
    type: 'array',
    items: { anyOf: [nonEmptyStr, ref('AttributeNameValue')] },
  },
  Beneficiary: {
    type: 'object',
    properties: {
      ...jsonLd,
      assistance_unit: code(codes.assistanceUnit),
      group: ref('Group'),
      member: ref('Member'),
      programme_identifier: listOf(ref('Programme')),
      // Data standard: enrolment_*; Beneficiary.jsonld: enrollment_*. Both spellings are accepted.
      enrolment_date: ref('IsoDate'),
      enrollment_date: ref('IsoDate'),
      enrolment_status: code(codes.enrollmentStatus),
      enrollment_status: code(codes.enrollmentStatus),
      status_change_date: { type: 'array', items: ref('IsoDate') },
      benefits: { type: 'array', items: ref('Benefit') },
      additional_attributes: ref('BeneficiaryAdditionalAttributes'),
    },
  },

  // reg_records are validated against the data object named by reg_record_type. Without a
  // reg_record_type they are Beneficiary records, as declared by the spec's SearchResponse.
  RecordsByType: {
    allOf: [
      {
        if: {
          anyOf: [
            { not: { required: ['reg_record_type'] } },
            { properties: { reg_record_type: { type: 'string', pattern: BENEFICIARY_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
          ],
        },
        then: { properties: { reg_records: ref('BeneficiaryRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: PERSON_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('IBRPersonRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: MEMBER_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('MemberRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: GROUP_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('GroupRecords') } },
      },
    ],
  },
  // Search responses carry an array; notify declares a single object (RegistryRecord.yaml).
  BeneficiaryRecords: { type: 'array', items: ref('Beneficiary') },
  IBRPersonRecords: { type: 'array', items: ref('IBRPerson') },
  MemberRecords: { type: 'array', items: ref('Member') },
  GroupRecords: { type: 'array', items: ref('Group') },
  BeneficiaryRecordOrRecords: { anyOf: [ref('BeneficiaryRecords'), ref('Beneficiary')] },
  IBRPersonRecordOrRecords: { anyOf: [ref('IBRPersonRecords'), ref('IBRPerson')] },
  MemberRecordOrRecords: { anyOf: [ref('MemberRecords'), ref('Member')] },
  GroupRecordOrRecords: { anyOf: [ref('GroupRecords'), ref('Group')] },
  SearchData: {
    type: 'object',
    required: ['reg_records'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_record_type: ref('RegRecordType'),
      reg_records: { type: 'array' },
    },
    allOf: [ref('RecordsByType')],
  },
  NotifyData: {
    type: 'object',
    required: ['reg_record_type', 'reg_records'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_event_type: ref('RegEventType'),
      reg_record_type: ref('RegRecordType'),
      reg_records: { type: ['array', 'object'] },
    },
    allOf: [
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: BENEFICIARY_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('BeneficiaryRecordOrRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: PERSON_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('IBRPersonRecordOrRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: MEMBER_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('MemberRecordOrRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: GROUP_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('GroupRecordOrRecords') } },
      },
    ],
  },
  // ReceiptInformation (extensions/ibr/ReceiptInformation.yaml): the beneficiaries published by
  // the SP-MIS, optionally with the receipt type (enrolments or status changes).
  ReceiptInformation: {
    type: 'object',
    properties: {
      receipt_type: { type: 'string', enum: codes.receiptType },
      beneficiaries: listOf(ref('Beneficiary')),
    },
  },

  // ----- queries -----
  Expression: {
    type: 'object',
    required: ['attribute_name', 'operator', 'attribute_value'],
    properties: {
      attribute_name: nonEmptyStr,
      operator: { type: 'string', enum: codes.operator },
      attribute_value: ref('AttributeValue'),
    },
  },
  PredicateQuery: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      required: ['expression1'],
      properties: {
        seq_num: { type: 'number' },
        expression1: ref('Expression'),
        condition: { type: 'string', enum: codes.condition },
        expression2: ref('Expression'),
      },
    },
  },
  IdTypeValueQuery: {
    type: 'object',
    required: ['type', 'value'],
    properties: {
      type: nonEmptyStr,
      value: ref('AttributeValue'),
    },
  },
  ExpressionQuery: {
    type: 'object',
    required: ['type', 'value'],
    properties: {
      type: nonEmptyStr,
      value: { type: 'object' },
    },
  },
  // query must be consistent with query_type (shared by search_criteria and subscribe_criteria).
  Query: {
    anyOf: [ref('IdTypeValueQuery'), ref('ExpressionQuery'), ref('PredicateQuery')],
  },
  SortItem: {
    type: 'object',
    required: ['attribute_name'],
    properties: {
      attribute_name: nonEmptyStr,
      sort_order: { type: 'string', enum: codes.sortOrder },
    },
  },
  SearchCriteria: {
    type: 'object',
    required: ['query_type', 'query'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_record_type: ref('RegRecordType'),
      query_type: { type: 'string', enum: codes.searchQueryType },
      response_entity: ref('ResponseEntity'),
      query: ref('Query'),
      sort: { type: 'array', items: ref('SortItem') },
      pagination: ref('RequestPagination'),
      consent: ref('Consent'),
      authorize: ref('Consent'),
    },
    allOf: [
      {
        if: { properties: { query_type: { const: 'idtype-value' } }, required: ['query_type'] },
        then: { properties: { query: ref('IdTypeValueQuery') } },
      },
      {
        if: { properties: { query_type: { const: 'predicate' } }, required: ['query_type'] },
        then: { properties: { query: ref('PredicateQuery') } },
      },
      {
        if: { properties: { query_type: { const: 'expression' } }, required: ['query_type'] },
        then: { properties: { query: ref('ExpressionQuery') } },
      },
    ],
  },
  Frequency: {
    type: 'object',
    required: ['start_time', 'end_time', 'frequency'],
    properties: {
      start_time: ref('DateTime'),
      end_time: ref('DateTime'),
      frequency: nonEmptyStr,
    },
  },
  SubscribeCriteria: {
    type: 'object',
    required: ['reg_event_type', 'filter', 'notify_record_type'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_event_type: ref('RegEventType'),
      frequency: ref('Frequency'),
      filter_type: { type: 'string', enum: codes.queryType },
      filter: ref('Query'),
      notify_record_type: ref('RegRecordType'),
      authorize: ref('Consent'),
    },
    allOf: [
      {
        if: { properties: { filter_type: { const: 'idtype-value' } }, required: ['filter_type'] },
        then: { properties: { filter: ref('IdTypeValueQuery') } },
      },
      {
        if: { properties: { filter_type: { const: 'predicate' } }, required: ['filter_type'] },
        then: { properties: { filter: ref('PredicateQuery') } },
      },
      {
        if: { properties: { filter_type: { enum: ['expression', 'graphql'] } }, required: ['filter_type'] },
        then: { properties: { filter: ref('ExpressionQuery') } },
      },
    ],
  },
  // EnrolledCriteria (extensions/ibr/EnrolledCriteria.yaml): query is an object; its shape
  // follows query_type. The spec example is an expression keyed by attribute
  // ({ "person_identifier": { "eq": "ABC451123" } }).
  EnrolledCriteria: {
    type: 'object',
    required: ['query_type', 'query'],
    properties: {
      query_type: { type: 'string', enum: codes.queryType },
      response_entity: ref('ResponseEntity'),
      query: { type: 'object', minProperties: 1 },
    },
    allOf: [
      {
        if: { properties: { query_type: { const: 'idtype-value' } }, required: ['query_type'] },
        then: { properties: { query: ref('IdTypeValueQuery') } },
      },
      {
        if: { properties: { query_type: { const: 'predicate' } }, required: ['query_type'] },
        then: { properties: { query: ref('Expression') } },
      },
    ],
  },

  // ----- messages -----
  SearchRequest: {
    type: 'object',
    required: ['transaction_id', 'search_request'],
    properties: {
      transaction_id: ref('TransactionId'),
      search_request: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'search_criteria'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            search_criteria: ref('SearchCriteria'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  SearchResponseItem: {
    type: 'object',
    required: ['reference_id', 'timestamp', 'status'],
    properties: {
      reference_id: ref('ReferenceId'),
      timestamp: ref('DateTime'),
      status: ref('RequestStatus'),
      status_reason_code: { type: 'string', enum: codes.searchStatusReasonCode },
      status_reason_message: ref('StatusReasonMessage'),
      data: ref('SearchData'),
      pagination: ref('Pagination'),
      locale: ref('Locale'),
    },
  },
  SearchResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'search_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      search_response: { type: 'array', items: ref('SearchResponseItem') },
    },
  },
  SubscribeRequest: {
    type: 'object',
    required: ['transaction_id', 'subscribe_request'],
    properties: {
      transaction_id: ref('TransactionId'),
      subscribe_request: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'subscribe_criteria'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            subscribe_criteria: ref('SubscribeCriteria'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  Subscription: {
    type: 'object',
    required: ['code', 'status', 'timestamp'],
    properties: {
      version: ref('Version'),
      code: ref('SubscriptionCode'),
      status: { type: 'string', enum: codes.subscriptionStatus },
      timestamp: ref('DateTime'),
      reg_type: ref('RegType'),
      reg_event_type: ref('RegEventType'),
      frequency: ref('Frequency'),
      filter_type: { type: 'string', enum: codes.queryType },
      filter: ref('Query'),
      notify_record_type: ref('RegRecordType'),
      locale: ref('Locale'),
    },
  },
  SubscribeResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'subscribe_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      subscribe_response: {
        type: 'array',
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'status'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            status: ref('RequestStatus'),
            status_reason_code: { type: 'string', enum: codes.subscribeStatusReasonCode },
            status_reason_message: ref('StatusReasonMessage'),
            subscriptions: { type: 'array', items: ref('Subscription') },
            pagination: ref('Pagination'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  UnSubscribeRequest: {
    type: 'object',
    required: ['transaction_id', 'timestamp', 'subscription_codes'],
    properties: {
      transaction_id: ref('TransactionId'),
      timestamp: ref('DateTime'),
      subscription_codes: { type: 'array', minItems: 1, items: ref('SubscriptionCode') },
    },
  },
  UnSubscribeResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'timestamp', 'status'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      timestamp: ref('DateTime'),
      status: ref('RequestStatus'),
      status_reason_code: { type: 'string', enum: codes.unsubscribeStatusReasonCode },
      status_reason_message: ref('StatusReasonMessage'),
      subscription_status: {
        type: 'array',
        items: {
          type: 'object',
          required: ['code', 'status'],
          properties: {
            code: ref('SubscriptionCode'),
            status: { type: 'string', enum: codes.subscriptionStatus },
          },
        },
      },
    },
  },
  NotifyEventRequest: {
    type: 'object',
    required: ['transaction_id', 'notify_event'],
    properties: {
      transaction_id: ref('TransactionId'),
      notify_event: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'data'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            data: ref('NotifyData'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  TxnStatusRequest: {
    type: 'object',
    required: ['transaction_id', 'txnstatus_request'],
    properties: {
      transaction_id: ref('TransactionId'),
      txnstatus_request: {
        type: 'object',
        required: ['reference_id', 'txn_type', 'attribute_type', 'attribute_value'],
        properties: {
          reference_id: ref('ReferenceId'),
          txn_type: { type: 'string', enum: codes.txnType },
          attribute_type: { type: 'string', enum: codes.attributeType },
          attribute_value: {
            anyOf: [
              ref('TransactionId'),
              { type: 'array', minItems: 1, items: ref('ReferenceId') },
            ],
          },
          locale: ref('Locale'),
        },
        // attribute_value must match the declared attribute_type.
        allOf: [
          {
            if: { properties: { attribute_type: { const: 'transaction_id' } }, required: ['attribute_type'] },
            then: { properties: { attribute_value: ref('TransactionId') } },
          },
          {
            if: { properties: { attribute_type: { const: 'correlation_id' } }, required: ['attribute_type'] },
            then: { properties: { attribute_value: ref('CorrelationId') } },
          },
          {
            if: { properties: { attribute_type: { const: 'reference_id_list' } }, required: ['attribute_type'] },
            then: { properties: { attribute_value: { type: 'array', minItems: 1, items: ref('ReferenceId') } } },
          },
        ],
      },
    },
  },
  ReceiptRequest: {
    type: 'object',
    required: ['transaction_id', 'receipt_information'],
    properties: {
      transaction_id: ref('TransactionId'),
      receipt_information: ref('ReceiptInformation'),
    },
  },
  TxnStatusResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'txnstatus_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      txnstatus_response: {
        type: 'object',
        required: ['txn_type', 'txn_status'],
        properties: {
          txn_type: { type: 'string', enum: codes.txnType },
          txn_status: {
            anyOf: [ref('SearchResponse'), ref('SubscribeResponse'), ref('ReceiptRequest')],
          },
        },
        // txn_status must be the response type matching txn_type.
        allOf: [
          {
            if: { properties: { txn_type: { const: 'search' } }, required: ['txn_type'] },
            then: { properties: { txn_status: ref('SearchResponse') } },
          },
          {
            if: { properties: { txn_type: { const: 'subscribe' } }, required: ['txn_type'] },
            then: { properties: { txn_status: ref('SubscribeResponse') } },
          },
          {
            if: { properties: { txn_type: { const: 'receipt' } }, required: ['txn_type'] },
            then: { properties: { txn_status: ref('ReceiptRequest') } },
          },
        ],
      },
    },
  },
  // PRS.IBR.01: verify enrolment (registry/ibr/EnrolledRequest.yaml, EnrolledResponse.yaml).
  EnrolledRequest: {
    type: 'object',
    required: ['transaction_id', 'enrolled_criteria'],
    properties: {
      transaction_id: ref('TransactionId'),
      enrolled_criteria: ref('EnrolledCriteria'),
    },
  },
  EnrolledResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'enrolled_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      enrolled_response: {
        type: 'array',
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'status', 'enrolled_status'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            status: ref('RequestStatus'),
            status_reason_message: ref('StatusReasonMessage'),
            enrolled_status: { type: 'string', enum: codes.enrolledStatus },
          },
        },
      },
    },
  },
  // PRS.IBR.02 / PRS.IBR.03 (registry/ibr/EnrollmentUpdatesRequest.yaml, ...Response.yaml).
  EnrollmentUpdatesRequest: {
    type: 'object',
    required: ['transaction_id', 'enrolled_updates'],
    properties: {
      transaction_id: ref('TransactionId'),
      enrolled_updates: {
        allOf: [ref('ReceiptInformation'), { type: 'object', required: ['beneficiaries'] }],
      },
    },
  },
  EnrollmentUpdatesResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'enrolled_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      enrolled_response: {
        type: 'array',
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'status'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            status: ref('RequestStatus'),
            status_reason_message: ref('StatusReasonMessage'),
          },
        },
      },
    },
  },

  // ----- synchronous HTTP responses -----
  AckResponse: {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'object',
        required: ['ack_status', 'timestamp', 'correlation_id'],
        properties: {
          ack_status: { type: 'string', enum: codes.ackStatus },
          timestamp: ref('DateTime'),
          error: ref('Error'),
          correlation_id: ref('CorrelationId'),
        },
        // An ERR acknowledgement must explain itself with an error code.
        if: { properties: { ack_status: { const: 'ERR' } }, required: ['ack_status'] },
        then: { required: ['error'], properties: { error: { required: ['code'] } } },
      },
    },
  },
  HttpErrorResponse: {
    type: 'object',
    required: ['errors'],
    properties: {
      errors: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['code'],
          properties: { code: nonEmptyStr, message: str },
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Envelopes: { signature, header, message } per endpoint
// ---------------------------------------------------------------------------
const encryptedIf = {
  properties: {
    header: { properties: { is_msg_encrypted: { const: true } }, required: ['is_msg_encrypted'] },
  },
  required: ['header'],
};

function envelope({ headerDef, action, messageDef, messageRequired }) {
  return {
    type: 'object',
    required: messageRequired ? ['header', 'message'] : ['header'],
    properties: {
      signature: ref('MsgSignature'),
      header: {
        allOf: [ref(headerDef), { type: 'object', properties: action ? { action: { const: action } } : {} }],
      },
      message: { type: 'object' },
    },
    // message is the plain payload, or an EncryptedMessage when header.is_msg_encrypted is true.
    if: encryptedIf,
    then: { properties: { message: ref('EncryptedMessage') } },
    else: { properties: { message: ref(messageDef) } },
  };
}

// The spec declares the bare EnrolledResponse / EnrollmentUpdatesResponse as the response of
// the sync enrolment endpoints, while every other DCI sync response is an envelope. Both
// forms are accepted; the envelope's header action is not fixed by the spec.
const bareOrEnvelope = (messageDef) => ({
  if: { type: 'object', required: ['header'] },
  then: envelope({ headerDef: 'MsgCallbackHeader', messageDef, messageRequired: false }),
  else: ref(messageDef),
});

export const envelopeDefinitions = {
  'search': envelope({ headerDef: 'MsgHeader', action: 'search', messageDef: 'SearchRequest', messageRequired: true }),
  'subscribe': envelope({ headerDef: 'MsgHeader', action: 'subscribe', messageDef: 'SubscribeRequest', messageRequired: true }),
  'unsubscribe': envelope({ headerDef: 'MsgHeader', action: 'unsubscribe', messageDef: 'UnSubscribeRequest', messageRequired: true }),
  'txn-status': envelope({ headerDef: 'MsgHeader', action: 'txn-status', messageDef: 'TxnStatusRequest', messageRequired: true }),
  'enrolled': envelope({ headerDef: 'MsgHeader', action: 'search', messageDef: 'EnrolledRequest', messageRequired: true }),
  // The spec gives /registry/sync/enrollment/updates a callback header with action "notify".
  'enrollment-updates': envelope({ headerDef: 'MsgCallbackHeader', action: 'notify', messageDef: 'EnrollmentUpdatesRequest', messageRequired: true }),
  'on-search': envelope({ headerDef: 'MsgCallbackHeader', action: 'on-search', messageDef: 'SearchResponse', messageRequired: false }),
  'on-subscribe': envelope({ headerDef: 'MsgHeader', action: 'on-subscribe', messageDef: 'SubscribeResponse', messageRequired: true }),
  'on-unsubscribe': envelope({ headerDef: 'MsgHeader', action: 'on-unsubscribe', messageDef: 'UnSubscribeResponse', messageRequired: true }),
  'notify': envelope({ headerDef: 'MsgCallbackHeader', action: 'notify', messageDef: 'NotifyEventRequest', messageRequired: false }),
  'txn-on-status': envelope({ headerDef: 'MsgCallbackHeader', action: 'txn-on-status', messageDef: 'TxnStatusResponse', messageRequired: false }),
  'enrolled-response': bareOrEnvelope('EnrolledResponse'),
  'enrollment-updates-response': bareOrEnvelope('EnrollmentUpdatesResponse'),
};
envelopeDefinitions['sync-search-response'] = envelopeDefinitions['on-search'];
envelopeDefinitions['sync-txn-status-response'] = envelopeDefinitions['txn-on-status'];

// Top-level, self-contained schemas (every one embeds all definitions so it can be compiled
// on its own, which is what Mockoon's valid_json_schema rule needs).
const standalone = (root) => ({ ...root, definitions });

export const schemas = {
  ...Object.fromEntries(Object.entries(envelopeDefinitions).map(([k, v]) => [k, standalone(v)])),
  'ack': standalone(definitions.AckResponse),
  'http-error': standalone(definitions.HttpErrorResponse),
  'Beneficiary': standalone(definitions.Beneficiary),
  'IBRPerson': standalone(definitions.IBRPerson),
  'Member': standalone(definitions.Member),
  'Group': standalone(definitions.Group),
  'Programme': standalone(definitions.Programme),
  'Benefit': standalone(definitions.Benefit),
  'BenefitFrequency': standalone(definitions.BenefitFrequency),
};
