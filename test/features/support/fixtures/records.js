// IBR records covering every data profile of the standard, for the four record types:
//   Beneficiary (DO.IBR.04), IBRPerson (DO.IBR.01), Member (DO.IBR.02) and Group (DO.IBR.03),
// and for the objects a beneficiary carries: Programme, Benefit and BenefitFrequency.
// They form one consistent registry: households (Group) list their members (Member), each
// member's demographic_info is a person (IBRPerson), and beneficiaries tie a member and/or
// a household to the programmes they are enrolled in and the benefits they received.
// Profiles range from a record carrying only an identifier up to one carrying every
// optional attribute.
//
// They are used by the tests (payloads sent to the IBR and SP endpoints, reference records
// for the data rules) and by mock/generate-mocks.mjs (records served by the mock IBR), so the
// mock and the tests always agree on the data.

const context = {
  spdci: 'https://schema.spdci.org/extensions/ibr/v1/data',
  spdcicore: 'https://schema.spdci.org/core/v1/data',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  owl: 'http://www.w3.org/2002/07/owl#',
};

const id = (identifier_type, identifier_value) => ({ '@type': 'Identifier', identifier_type, identifier_value });
const memberRef = (value) => ({ '@type': 'Member', member_identifier: [id('UIN', value)] });

// ---------------------------------------------------------------------------
// IBRPerson (demographic information)
// ---------------------------------------------------------------------------
const alice = {
  '@context': context,
  '@id': 'https://example.org/ibr_person/100000001',
  '@type': 'spdci:IBRPerson',
  identifier: [id('UIN', '100000001'), id('BRN', 'BRN1985000101')],
  name: { '@type': 'Name', surname: 'Smith', given_name: 'Alice', second_name: 'Mary', maiden_name: 'Jones', prefix: 'Ms.', suffix: 'PhD' },
  sex: 'female',
  birth_date: '1985-05-20T00:00:00Z',
  address: [{
    '@type': 'Address',
    address_line_1: '123 Main St',
    address_line_2: 'Apartment 4',
    locality: 'Anytown',
    sub_region_code: 'SR01',
    region_code: 'R1',
    postal_code: '12345',
    country_code: 'TH',
    geo_location: {
      '@type': 'GeoLocation',
      plus_code: {
        global_code: '7P52GQ8P+2V',
        geometry: {
          bounds: {
            northeast: { '@type': 'GeoCoordinates', latitude: 13.7570, longitude: 100.5025 },
            southwest: { '@type': 'GeoCoordinates', latitude: 13.7555, longitude: 100.5010 },
          },
          location: { '@type': 'GeoCoordinates', latitude: 13.7563, longitude: 100.5018 },
        },
      },
    },
  }],
  phone_number: ['+66891234567'],
  email: ['alice.smith@example.org'],
  registration_date: '2022-01-10T08:00:00Z',
  last_updated: '2025-06-15T10:00:00Z',
};

// Several identifiers, phone numbers, e-mails and addresses (both address namings).
const bob = {
  '@type': 'spdci:IBRPerson',
  identifier: [id('UIN', '100000002'), id('MRN', 'MRN2008000202')],
  name: { surname: 'Smith', given_name: 'Bob', prefix: 'Mr.' },
  sex: 'male',
  birth_date: '1982-03-15',
  address: [
    { address_line_1: '123 Main St', locality: 'Anytown', postal_code: '12345', country_code: 'TH' },
    { address_line1: '5 Rue de Rivoli', address_line2: 'Bat. B', locality: 'Paris', postal_code: '75001', country_code: 'FRA' },
  ],
  phone_number: ['+66891234568', '+33612345678'],
  email: ['bob.smith@example.org', 'b.smith@example.net'],
  registration_date: '2022-01-10',
};

const charlie = {
  identifier: [id('UIN', '100000003'), id('BRN', 'BRN2010000303')],
  name: { surname: 'Smith', given_name: 'Charlie' },
  sex: 'male',
  birth_date: '2010-07-05',
  registration_date: '2022-01-10',
};

// A child known only by a birth registration number.
const daisy = {
  identifier: [id('BRN', 'BRN2014000004')],
  name: { surname: 'Smith', given_name: 'Daisy' },
  sex: 'female',
  birth_date: '2014-09-22',
};

const lindiwe = {
  identifier: [id('UIN', '200000001')],
  name: { surname: 'Nkosi', given_name: 'Lindiwe' },
  sex: 'female',
  birth_date: '1950-05-05',
  phone_number: ['+27821234567'],
  address: { address_line_1: '45 Vilakazi Street', locality: 'Soweto', region_code: 'GT', country_code: 'ZA' },
  registration_date: '2019-03-01',
  last_updated: '2024-01-01',
};

const thabo = {
  identifier: [id('UIN', '200000002')],
  name: { surname: 'Nkosi', given_name: 'Thabo' },
  sex: 'male',
  birth_date: '2008-02-11',
};

// Deceased (PRS.IBR.03.1: death communicated by the SP-MIS).
const sipho = {
  identifier: [id('UIN', '300000002'), id('DRN', 'DRN2024000123')],
  name: { surname: 'Nkosi', given_name: 'Sipho' },
  sex: 'male',
  birth_date: '1940-02-11',
  death_date: '2024-11-02T23:40:00Z',
  registration_date: '2020-01-01',
  last_updated: '2024-11-05',
};

// The person of the published spec examples (UIN 847951632), written per the data standard.
const sudarat = {
  '@context': context,
  '@id': 'https://example.org/ibr_person/847951632',
  '@type': 'spdci:IBRPerson',
  identifier: [{ '@type': 'Identifier', identifier_type: 'UIN', identifier_value: '847951632' }],
  name: { '@type': 'Name', surname: 'Phumchai', given_name: 'Sudarat', prefix: 'Dr.', suffix: 'PhD' },
  birth_date: '1995-09-21T11:20:00',
  sex: 'female',
  address: [{
    '@type': 'Address',
    address_line1: 'Bophut Koh Samui',
    address_line2: 'Surat, Near Big Buddha Beach',
    locality: 'Thani',
    sub_region_code: 'SH',
    region_code: 'A205',
    postal_code: '84320',
    country_code: 'TH',
  }],
  phone_number: ['+66891234567'],
  email: ['sudarat.phumchai@example.com'],
  registration_date: '2022-09-21T11:20:00',
};

export const persons = {
  // Every IBRPerson attribute present with a correct value.
  full: alice,
  // Only an identifier: every other attribute is optional.
  minimal: { identifier: [id('UIN', '300000001')] },
  deceased: sipho,
  multi: bob,
  child: charlie,
  newborn: daisy,
  elder: lindiwe,
  teen: thabo,
  'example person': sudarat,
};

// ---------------------------------------------------------------------------
// Member
// ---------------------------------------------------------------------------
const head = {
  '@context': context,
  '@id': 'https://example.org/member/M100000001',
  '@type': 'spdci:Member',
  member_identifier: [id('UIN', 'M100000001')],
  demographic_info: alice,
  related_person: [
    { '@type': 'RelatedPerson', relationship_type: 'SPS', related_member: memberRef('M100000002') },
    { '@type': 'RelatedPerson', relationship_type: 'SON', related_member: memberRef('M100000003') },
    // related_member given as a Person (core RelatedPerson) instead of a Member reference.
    { '@type': 'RelatedPerson', relationship_type: 'DAU', related_member: { identifier: [id('BRN', 'BRN2014000004')], name: { surname: 'Smith', given_name: 'Daisy' } } },
  ],
  is_disabled: false,
  self_id_disability: false,
  // WG-SS "some difficulty" seeing: a functional limitation that is not a disability.
  disability_info: [{ '@type': 'DisabilityInfo', functional_type: ['VIS_SS'], functional_severity: '2' }],
  marital_status: 'M',
  employment_status: '4',
  occupation: '2',
  income_level: '2',
  language_code: ['en', 'th'],
  education_level: '6',
  additional_attributes: [{ name: 'main_language_at_home', value: 'th' }, { name: 'years_in_district', value: 12 }],
  registration_date: '2022-01-10T08:00:00Z',
  last_updated: '2025-06-15T10:00:00Z',
};

const spouse = {
  '@type': 'spdci:Member',
  member_identifier: [id('UIN', 'M100000002')],
  demographic_info: bob,
  related_person: [{ relationship_type: 'WIFE', related_member: memberRef('M100000001') }],
  is_disabled: false,
  marital_status: 'M',
  employment_status: '6',
  occupation: '6',
  income_level: 2,
  language_code: ['th', 'fra'],
  education_level: 3,
  registration_date: '2022-01-10T08:00:00Z',
};

const son = {
  member_identifier: [id('UIN', 'M100000003')],
  demographic_info: charlie,
  related_person: [
    { relationship_type: 'MTH', related_member: memberRef('M100000001') },
    { relationship_type: 'FTH', related_member: memberRef('M100000002') },
  ],
  marital_status: 'S',
  education_level: '2',
  registration_date: '2022-01-10',
};

// Self-identified disability with WG-SS functional limitations (both attribute namings).
const daughter = {
  member_identifier: [id('UIN', 'M100000004')],
  demographic_info: daisy,
  related_person: [{ relationship_type: 'MTH', related_member: memberRef('M100000001') }],
  is_disabled: true,
  self_id_disability: 1,
  disability_info: [
    { functional_type: ['MOB_SS', 'SC_SS'], functional_severity: 3 },
    { disability_limitation_type: 'HEAR_SS', functional_severity: '4' },
  ],
  marital_status: 'S',
  education_level: '0',
  registration_date: '2022-01-10',
};

const widow = {
  member_identifier: [id('UIN', 'M200000001')],
  demographic_info: lindiwe,
  related_person: [{ relationship_type: 'GRNDSON', related_member: memberRef('M200000002') }],
  is_disabled: false,
  marital_status: 'W',
  employment_status: '3',
  income_level: '1',
  language_code: ['zu', 'en'],
  education_level: '1',
  registration_date: '2019-03-01',
  last_updated: '2024-01-01',
};

const grandson = {
  member_identifier: [id('UIN', 'M200000002')],
  demographic_info: thabo,
  related_person: [{ relationship_type: 'GRMTH', related_member: memberRef('M200000001') }],
  marital_status: 'S',
  education_level: '2',
};

const widower = {
  member_identifier: [id('UIN', 'M300000002')],
  demographic_info: sipho,
  marital_status: 'W',
  employment_status: '2',
  registration_date: '2020-01-01',
  last_updated: '2024-11-05',
};

const single = {
  member_identifier: [id('UIN', 'M847951632')],
  demographic_info: sudarat,
  marital_status: 'S',
  employment_status: '6',
  occupation: '5',
  income_level: '1',
  language_code: ['th'],
  education_level: '6',
  registration_date: '2023-02-01',
};

export const members = {
  // Every Member attribute present with a correct value.
  full: head,
  // Only a member identifier.
  minimal: { member_identifier: [id('UIN', 'M900000001')] },
  spouse,
  child: son,
  disabled: daughter,
  widow,
  grandson,
  deceased: widower,
  single,
};

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------
export const groups = {
  // Every Group attribute present with a correct value.
  full: {
    '@context': context,
    '@id': 'https://example.org/group/GRP1001',
    '@type': 'spdci:Group',
    group_identifier: [id('UIN', 'GRP1001')],
    group_type: '2',
    place: {
      '@type': 'Place',
      name: 'Anytown village',
      address_line: '123 Main St, Anytown',
      geo: { '@type': 'GeoCoordinates', latitude: 13.7563, longitude: 100.5018 },
      contained_in_place: { '@type': 'Place', name: 'Anytown district' },
    },
    address: [{ '@type': 'Address', address_line_1: '123 Main St', locality: 'Anytown', postal_code: '12345', country_code: 'TH' }],
    place_address: false,
    poverty_score: 3.75,
    poverty_score_type: 'PMT',
    group_head_info: head,
    group_size: 4,
    member_list: [head, spouse, son, daughter],
    registration_date: '2022-01-10T08:00:00Z',
    last_updated: '2025-06-15T10:00:00Z',
    additional_attributes: [{ name: 'dwelling_type', value: 'rented' }, { name: 'receives_subsidy', value: true }],
  },

  // Only a group identifier.
  minimal: { group_identifier: [id('UIN', 'GRP2001')] },

  // Family located by place only (place_address = 1), coordinates sent as text, member list
  // shorter than group_size (only part of the family is listed).
  large: {
    '@type': 'spdci:Group',
    group_identifier: [id('UIN', 'GRP3001')],
    group_type: 3,
    place: { name: 'Soweto', geo: { latitude: '-26.2381', longitude: '27.9086' } },
    place_address: 1,
    poverty_score: 7.4,
    poverty_score_type: 'income-based',
    group_head_info: widow,
    group_size: 6,
    member_list: [widow, grandson],
    registration_date: '2019-03-01',
    last_updated: '2024-01-01',
  },

  // One-person group (assistance unit "Member") located by a single address object.
  single: {
    group_identifier: [id('UIN', 'GRP4001')],
    group_type: '1',
    address: { address_line1: 'Bophut Koh Samui', locality: 'Thani', postal_code: '84320', country_code: 'TH' },
    place_address: 0,
    poverty_score: 1.2,
    poverty_score_type: 'PMT',
    group_head_info: single,
    group_size: 1,
    member_list: [single],
    registration_date: '2023-02-01',
  },
};

// ---------------------------------------------------------------------------
// Benefit and BenefitFrequency
// ---------------------------------------------------------------------------
export const benefits = {
  // Every Benefit attribute present.
  full: { '@type': 'spdci:Benefit', benefit_type: '3', benefit_date: '2025-09-01', benefit_value: 12.5, benefit_description: 'Sacks of rice (25 kg)', benefit_quantity: 5 },
  // Only the type of benefit.
  minimal: { benefit_type: '1' },
  cash: { benefit_type: '1', benefit_date: '2025-09-01', benefit_value: 50 },
  voucher: { benefit_type: 2, benefit_date: '2025-09-15', benefit_value: '20.00', benefit_description: 'Food voucher' },
  'in-kind': { benefit_type: '3', benefit_date: '2025-09-01', benefit_description: 'School meals', benefit_quantity: 20 },
  training: { benefit_type: '4', benefit_date: '2024-07-01', benefit_description: 'Vocational training in solar panel installation' },
  'work opportunity': { benefit_type: '5', benefit_date: '2024-10-01', benefit_value: 300, benefit_description: 'Public works: road maintenance, 40 days' },
  insurance: { benefit_type: '6', benefit_date: '2025-01-01', benefit_value: '15.75', benefit_description: 'Health insurance premium' },
};

export const frequencies = {
  // Every BenefitFrequency attribute that can be combined (count and until exclude each other).
  full: { '@type': 'spdci:BenefitFrequency', freq: 'MONTHLY', dtstart: '2022-02-01', interval: 1, wkst: 'MO', until: '2030-01-31' },
  minimal: { freq: 'MONTHLY' },
  monthly: { freq: 'MONTHLY', dtstart: '2019-04-01', interval: 1 },
  'every two weeks': { freq: 'WEEKLY', dtstart: '2024-06-03T00:00:00Z', interval: 2, wkst: 'MO', until: '2025-03-31' },
  'ten payments': { freq: 'MONTHLY', dtstart: '2025-01-01', interval: 1, count: 10 },
  yearly: { freq: 'YEARLY', dtstart: '2025-01-01' },
};

// ---------------------------------------------------------------------------
// Programme
// ---------------------------------------------------------------------------
export const programmes = {
  // Every Programme attribute present with a correct value.
  full: {
    '@context': context,
    '@type': 'spdci:Programme',
    programme_name: 'Child Support Grant',
    programme_identifier: 'DCI001',
    programme_description: 'Monthly cash grant for households with children under 18',
    implementing_institution: 'Ministry of Social Development',
    institution_type: '1',
    legal_status: '1',
    social_protection_functions: ['4', '5'],
    contribution_type: '3',
    programme_type: '2',
    benefit: [{ benefit_type: '1', benefit_value: 50, benefit_description: 'Monthly child grant' }],
    benefit_frequency: [frequencies.full],
  },
  // Only the mandatory attributes (programme_name and programme_identifier are 1...1).
  minimal: { programme_name: 'Emergency Relief', programme_identifier: 'DCI000' },
  pension: {
    programme_name: 'Old Age Pension',
    programme_identifier: 'DCI002',
    implementing_institution: 'National Social Security Agency',
    institution_type: 1,
    legal_status: 1,
    social_protection_functions: ['1'],
    contribution_type: '3',
    programme_type: '3',
    benefit_frequency: [frequencies.monthly],
  },
  'public works': {
    programme_name: 'Community Public Works',
    programme_identifier: 'DCI003',
    programme_description: 'Temporary employment on community infrastructure and skills training',
    implementing_institution: 'Ministry of Labour',
    institution_type: '1',
    legal_status: '1',
    social_protection_functions: ['11', '7'],
    contribution_type: '3',
    programme_type: '6',
    benefit: [{ benefit_type: '5' }, { benefit_type: '4' }],
    benefit_frequency: [frequencies['every two weeks']],
  },
  'school feeding': {
    programme_name: 'School Feeding and Inclusion',
    programme_identifier: 'DCI004',
    implementing_institution: 'Hope for Children Foundation',
    institution_type: '4',
    legal_status: '2',
    social_protection_functions: ['13', '6', '2'],
    contribution_type: 3,
    programme_type: '5',
    benefit: [{ benefit_type: '3', benefit_description: 'School meals' }, { benefit_type: '2' }, { benefit_type: '6' }],
    benefit_frequency: [frequencies['ten payments'], frequencies.yearly],
  },
};

// ---------------------------------------------------------------------------
// Beneficiary
// ---------------------------------------------------------------------------
export const beneficiaries = {
  // A household enrolled in the child grant: every Beneficiary attribute present.
  household: {
    '@context': context,
    '@id': 'https://example.org/beneficiary/B0001',
    '@type': 'spdci:Beneficiary',
    assistance_unit: '2',
    group: groups.full,
    member: head,
    programme_identifier: [programmes.full],
    enrolment_date: '2022-02-01',
    enrolment_status: '1',
    status_change_date: ['2022-02-01T09:00:00Z'],
    benefits: [benefits.cash, { ...benefits.cash, benefit_date: '2025-10-01' }],
    additional_attributes: ['priority_household', { name: 'payment_channel', value: 'mobile_money' }],
  },

  // An individual enrolled in the old age pension.
  individual: {
    '@type': 'spdci:Beneficiary',
    assistance_unit: '1',
    member: widow,
    programme_identifier: [programmes.pension],
    enrollment_date: '2019-04-01T00:00:00Z',
    enrollment_status: 1,
    benefits: [{ benefit_type: '1', benefit_date: '2025-09-01', benefit_value: '180.00' }],
  },

  // Graduated from public works (PRS.IBR.03.1: graduation), with work and training benefits.
  graduated: {
    assistance_unit: '1',
    member: single,
    programme_identifier: [programmes['public works']],
    enrolment_date: '2024-06-03',
    enrolment_status: '3',
    status_change_date: ['2025-03-31'],
    benefits: [benefits.training, benefits['work opportunity']],
  },

  // A family whose enrolment is suspended (PRS.IBR.03.1: suspension).
  suspended: {
    assistance_unit: 3,
    group: groups.large,
    member: widow,
    programme_identifier: [programmes.full],
    enrolment_date: '2020-01-15',
    enrolment_status: '4',
    status_change_date: ['2024-01-01', '2025-07-01'],
    benefits: [{ benefit_type: '1', benefit_date: '2024-12-01', benefit_value: 50 }],
  },

  // Deceased beneficiary (PRS.IBR.03.1: death); the last benefit precedes the death.
  deceased: {
    assistance_unit: '1',
    member: widower,
    programme_identifier: [programmes.pension],
    enrolment_date: '2020-02-01',
    enrolment_status: '2',
    status_change_date: ['2024-11-05'],
    benefits: [{ benefit_type: '1', benefit_date: '2024-11-01', benefit_value: 180 }],
  },

  // A child with a disability receiving every in-kind / voucher / insurance benefit.
  'in-kind': {
    assistance_unit: '1',
    member: daughter,
    programme_identifier: [programmes['school feeding']],
    enrolment_date: '2023-01-09',
    enrolment_status: '1',
    benefits: [benefits['in-kind'], benefits.voucher, benefits.insurance, benefits.full],
  },

  // Only a member reference: every Beneficiary attribute is optional.
  minimal: { member: { member_identifier: [id('UIN', 'M900000001')] } },
};

export const records = {
  Beneficiary: beneficiaries,
  IBRPerson: persons,
  Member: members,
  Group: groups,
  Programme: programmes,
  Benefit: benefits,
  BenefitFrequency: frequencies,
};

// ---------------------------------------------------------------------------
// Published spec examples that do NOT follow the IBR data standard. They document the
// deviations the suite detects (codes sent as labels, identifier types outside
// IdentifierTypeEnum, single values where a list is required, wrong nesting).
// ---------------------------------------------------------------------------

// Beneficiary example of extensions/ibr/Beneficiary.yaml (also the IBR SearchResponse example).
export const specBeneficiaryExample = {
  '@context': {
    '@vocab': 'https://schema.spdci.org/extensions/ibr/v1',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    schema: 'http://schema.org/',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    owl: 'http://www.w3.org/2002/07/owl#',
  },
  '@id': 'Beneficiary',
  '@type': 'Beneficiary',
  assistance_unit: '1',
  member: {
    member_identifier: 'HS0205202401',
    demographic_info: {
      person: {
        identifier_type: 'NID',
        identifier_value: '0205202401',
        name: { first_name: 'Test', second_name: 'Test2', surname: 'Test3' },
        sex: 'F',
        birth_date: '02.05.2004',
        death_date: '',
        address: '',
        phone_number: '',
        email: '',
      },
    },
    relationship_head: '',
    related_person: '',
    is_disabled: '0',
    disability_info: '',
    marital_status: 'Single',
    employment_status: 'employed',
    occupation: 'Caregiver',
    income_level: '',
    language_code: 'Eng',
    education_level: 'Highschool',
    additional_attributes: '',
    registration_date: '02.05.2024',
    last_update: '',
    programme_identifier: {
      programme: { programme_identifier: 'DCI001', programme_name: 'Test Programme' },
      enrolment_date: '02.02.2024',
      enrolment_status: 'Active',
      status_change_date: '',
      benefits: { benefit_type: 'Cash', benefit_date: '02.05.2024', benefit_value: 'USD 50', benefit_frequency: 'Monthly' },
    },
  },
};

// Member example of extensions/ibr/Member.yaml (the invalid JSON of additional_attributes is
// written as a name/value list).
export const specMemberExample = {
  '@context': { spdci: 'https://schema.spdci.org/core/v1/data', common: 'https://schema.spdci.org/common/v1/' },
  '@id': 'https://example.org/sr_person/847951632',
  '@type': 'spdci:member',
  member_identifier: [{ '@type': 'Identifier', identifier_type: 'UIN', identifier_value: '42343545654' }],
  demographic_info: {
    '@type': 'SRPerson',
    identifier: [{ '@type': 'Identifier', identifier_type: 'NationalID', identifier_value: '9876543210' }],
    name: { '@type': 'Name', surname: 'Smith', given_name: 'Alice', prefix: 'Ms.', suffix: '' },
    sex: 'female',
    birth_date: '1985-05-20',
  },
  related_person: [
    { '@type': 'RelatedPerson', relationship_type: 'spouse', related_member: { '@type': 'Member', '@id': 'https://example.org/member/123456789', member_identifier: 'M123456789' } },
    { '@type': 'RelatedPerson', relationship_type: 'child', related_member: { '@type': 'Member', '@id': 'https://example.org/member/987654322', 'spdci:member_identifier': 'M987654322' } },
  ],
  is_disabled: false,
  marital_status: 'married',
  employment_status: 'employed',
  occupation: 'teacher',
  income_level: 'middle',
  language_code: ['en', 'es'],
  education_level: 'bachelor',
  additional_attributes: [{ name: 'extra_work', value: 'volunteer' }],
  registration_date: '2022-01-10T08:00:00Z',
  last_updated: '2023-06-15T10:00:00Z',
};

// Person example of extensions/ibr/Person.yaml (identifier as a single object).
export const specPersonExample = {
  '@context': {
    '@vocab': 'https://schema.spdci.org/extensions/ibr/v1',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    schema: 'http://schema.org/',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    owl: 'http://www.w3.org/2002/07/owl#',
  },
  '@id': 'Person',
  '@type': 'Person',
  identifier: { '@id': 'Identifier', '@type': 'Identifier', identifier_type: 'UIN', identifier_value: '847951632' },
  name: { '@type': 'Name', surname: 'Phumchai', given_name: 'Sudarat', second_name: '', prefix: 'Dr.', suffix: 'PhD' },
  household_status: '',
  benefiting_entity: 'Person',
  sex: 'female',
  birth_date: '1995-09-21T11:20:00',
  marital_status: 'M',
  registration_date: '2022-09-21T11:20:00',
  enrolment_date: '2022-10-21T11:20:00',
  enrolment_status: '3',
  benefit_type: '2',
  payment_status: '1',
};

// ---------------------------------------------------------------------------
// Lookups, as an IBR would resolve them
// ---------------------------------------------------------------------------
const identifiersOfPerson = (p) => (Array.isArray(p?.identifier) ? p.identifier : []);
const identifiersOfMember = (m) => [
  ...(Array.isArray(m?.member_identifier) ? m.member_identifier : []),
  ...identifiersOfPerson(m?.demographic_info),
];
const identifiersOfGroup = (g) => [
  ...(Array.isArray(g?.group_identifier) ? g.group_identifier : []),
  ...[g?.group_head_info, ...(g?.member_list || [])].flatMap(identifiersOfMember),
];
// A beneficiary is found by its member (and the member's person), its group identifier, or the
// head of its group: the individuals who are the beneficiary unit, not every household member.
const identifiersOfBeneficiary = (b) => [
  ...identifiersOfMember(b?.member),
  ...(Array.isArray(b?.group?.group_identifier) ? b.group.group_identifier : []),
  ...identifiersOfMember(b?.group?.group_head_info),
];
export const identifiersOf = {
  Beneficiary: identifiersOfBeneficiary,
  IBRPerson: identifiersOfPerson,
  Member: identifiersOfMember,
  Group: identifiersOfGroup,
};

const searchable = ['Beneficiary', 'IBRPerson', 'Member', 'Group'];

// "<record type>|<identifier value>" → records. A person is found by its identifiers, a member
// by its member identifier or its person identifiers, a group by its group identifier or the
// identifiers of any of its members, and a beneficiary as described above.
export function recordsByIdentifier() {
  const index = {};
  for (const type of searchable) {
    for (const record of Object.values(records[type])) {
      const values = new Set(identifiersOf[type](record).map((i) => i.identifier_value));
      for (const value of values) (index[`${type}|${value}`] ??= []).push(record);
    }
  }
  return index;
}

// Records matching the predicate / expression searches used by the tests.
export const predicateResults = {
  // Beneficiaries enrolled in the child grant (programme DCI001).
  'Beneficiary|programme_identifier.0.programme_identifier': [beneficiaries.household, beneficiaries.suspended],
  // Households with poverty_score < 5.
  'Group|poverty_score': [groups.full, groups.single],
  // Female widows.
  'Member|demographic_info.sex': [members.widow],
  // Women born on or after 1980-01-01.
  'IBRPerson|sex': [persons.full, persons.newborn, persons['example person']],
};

// PRS.IBR.01: "<identifier value>|<programme identifier>" → "yes" for the members, persons and
// groups of every beneficiary actively enrolled (enrolment_status 1) in that programme, and
// "<identifier value>|*" when they are actively enrolled in any programme.
export function enrolledIndex() {
  const index = {};
  for (const b of Object.values(beneficiaries)) {
    if (String(b.enrolment_status ?? b.enrollment_status) !== '1') continue;
    const values = new Set(identifiersOfBeneficiary(b).map((i) => i.identifier_value));
    for (const value of values) {
      index[`${value}|*`] = 'yes';
      for (const p of b.programme_identifier || []) index[`${value}|${p.programme_identifier}`] = 'yes';
    }
  }
  return index;
}
