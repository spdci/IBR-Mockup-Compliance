// Identifiers and programmes the suite queries, per record type. The defaults match the
// records served by the mock IBR. To run against a real IBR, point TEST_DATA_FILE at a JSON
// file overriding any entry, e.g.
//   { "records": { "Beneficiary": { "household": { "identifier_type": "UIN", "identifier_value": "HH-0042" } } },
//     "programmes": { "enrolled": "CSG-2024" } }

import { readFileSync } from 'node:fs';

const uin = (identifier_value) => ({ identifier_type: 'UIN', identifier_value });

const defaults = {
  records: {
    Beneficiary: {
      // Household enrolled in the child grant, found by its group identifier.
      household: uin('GRP1001'),
      // The same household found through its head (PRS.IBR.01.3: member level).
      'by head of household': uin('M100000001'),
      individual: uin('M200000001'),
      // A beneficiary found through the identifier of its person (demographic_info.identifier).
      'by person identifier': uin('200000001'),
      graduated: uin('M847951632'),
      suspended: uin('GRP3001'),
      deceased: { identifier_type: 'DRN', identifier_value: 'DRN2024000123' },
      'in-kind': { identifier_type: 'BRN', identifier_value: 'BRN2014000004' },
      minimal: uin('M900000001'),
      unknown: uin('B999999999'),
      // The mock rejects this value with rjct.search.too_many_records_found.
      too_many: uin('TOOMANY000'),
    },
    IBRPerson: {
      full: uin('100000001'),
      minimal: uin('300000001'),
      deceased: { identifier_type: 'DRN', identifier_value: 'DRN2024000123' },
      multi: { identifier_type: 'MRN', identifier_value: 'MRN2008000202' },
      child: uin('100000003'),
      newborn: { identifier_type: 'BRN', identifier_value: 'BRN2014000004' },
      'example person': uin('847951632'),
      unknown: uin('999999999'),
      too_many: uin('TOOMANY000'),
    },
    Member: {
      full: uin('M100000001'),
      minimal: uin('M900000001'),
      // A member found through the identifier of its person (demographic_info.identifier).
      'by person identifier': uin('100000001'),
      disabled: uin('M100000004'),
      widow: uin('M200000001'),
      deceased: uin('M300000002'),
      child: uin('M100000003'),
      single: uin('M847951632'),
      unknown: uin('M999999999'),
      too_many: uin('TOOMANY000'),
    },
    Group: {
      full: uin('GRP1001'),
      minimal: uin('GRP2001'),
      large: uin('GRP3001'),
      single: uin('GRP4001'),
      // Households found through the identifier of one of their members.
      'by member identifier': uin('M100000002'),
      'by person identifier': uin('100000002'),
      'by birth registration': { identifier_type: 'BRN', identifier_value: 'BRN2014000004' },
      unknown: uin('GRP9999'),
      too_many: uin('TOOMANY000'),
    },
  },
  // PRS.IBR.01: programmes queried by the enrolment checks.
  programmes: {
    // The child grant: the "household" beneficiary is actively enrolled in it.
    'child grant': 'DCI001',
    // The old age pension: the "individual" beneficiary is actively enrolled in it.
    pension: 'DCI002',
    // Public works: the "graduated" beneficiary left it.
    'public works': 'DCI003',
    'school feeding': 'DCI004',
    unknown: 'DCI999',
  },
  regType: 'ns:org:RegistryType:IBR',
};

const overrides = process.env.TEST_DATA_FILE ? JSON.parse(readFileSync(process.env.TEST_DATA_FILE, 'utf8')) : {};

export const testData = {
  ...defaults,
  ...overrides,
  records: Object.fromEntries(Object.entries(defaults.records).map(([type, set]) => [
    type, { ...set, ...(overrides.records?.[type] || {}) },
  ])),
  programmes: { ...defaults.programmes, ...(overrides.programmes || {}) },
};

export function testRecord(type, name) {
  const set = testData.records[type];
  if (!set) throw new Error(`Unknown record type "${type}". Known: ${Object.keys(testData.records).join(', ')}`);
  if (!set[name]) throw new Error(`Unknown test ${type} "${name}". Known: ${Object.keys(set).join(', ')}`);
  return set[name];
}

export function testProgramme(name) {
  const programme = testData.programmes[name];
  if (!programme) throw new Error(`Unknown test programme "${name}". Known: ${Object.keys(testData.programmes).join(', ')}`);
  return programme;
}
