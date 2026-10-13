// Validation of DCI IBR payloads: JSON Schema (structure, types, formats, code lists) plus the
// semantic rules a schema cannot express (real calendar dates, chronology, consistency
// between attributes, between a beneficiary and its member / group / programmes / benefits,
// and between a request and its response).

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  schemas, ISO_DATE_PATTERN, BENEFICIARY_RECORD_TYPE_PATTERN, PERSON_RECORD_TYPE_PATTERN,
  MEMBER_RECORD_TYPE_PATTERN, GROUP_RECORD_TYPE_PATTERN,
} from './schemas.js';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const compiled = {};
const compile = (name) => {
  if (!schemas[name]) throw new Error(`Unknown schema "${name}". Known: ${Object.keys(schemas).join(', ')}`);
  compiled[name] ??= ajv.compile(schemas[name]);
  return compiled[name];
};

const formatAjvErrors = (errors = []) => {
  // anyOf/if branches produce noisy duplicates, keep the most specific ones.
  const seen = new Set();
  return errors
    .filter((e) => !['anyOf', 'if', 'oneOf'].includes(e.keyword))
    .map((e) => {
      const where = e.instancePath || '(root)';
      const extra = e.keyword === 'enum' ? ` ${JSON.stringify(e.params.allowedValues)}`
        : e.keyword === 'const' ? ` ${JSON.stringify(e.params.allowedValue)}` : '';
      return `${where} ${e.message}${extra}`;
    })
    .filter((m) => (seen.has(m) ? false : seen.add(m)));
};

export function validateSchema(name, data) {
  const validate = compile(name);
  const valid = validate(data);
  return { valid, errors: valid ? [] : formatAjvErrors(validate.errors) };
}

// ---------------------------------------------------------------------------
// Record types
// ---------------------------------------------------------------------------
export const RECORD_TYPES = ['Beneficiary', 'IBRPerson', 'Member', 'Group'];

// Maps a reg_record_type / response_entity value to Beneficiary, IBRPerson, Member or Group
// (undefined when it is not an IBR record type).
export function recordTypeOf(value) {
  if (typeof value !== 'string') return undefined;
  if (new RegExp(BENEFICIARY_RECORD_TYPE_PATTERN).test(value)) return 'Beneficiary';
  if (new RegExp(PERSON_RECORD_TYPE_PATTERN).test(value)) return 'IBRPerson';
  if (new RegExp(MEMBER_RECORD_TYPE_PATTERN).test(value)) return 'Member';
  if (new RegExp(GROUP_RECORD_TYPE_PATTERN).test(value)) return 'Group';
  return undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isoDateRe = new RegExp(ISO_DATE_PATTERN);

export function isRealDate(value) {
  if (typeof value !== 'string' || !isoDateRe.test(value)) return false;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// Calendar-day comparison so that "1985-05-20" and "1985-05-20T00:00:00Z" are the same day.
const day = (value) => value.slice(0, 10);
const present = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
const asList = (v) => (Array.isArray(v) ? v : [v]).filter(present);
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const today = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10); // 1 day clock-skew tolerance
const validDay = (v) => (typeof v === 'string' && isRealDate(v) ? day(v) : undefined);
const idKey = (id) => (isObject(id) && typeof id.identifier_type === 'string' && typeof id.identifier_value === 'string'
  ? `${id.identifier_type}|${id.identifier_value}` : undefined);
const idKeys = (list) => (Array.isArray(list) ? list.map(idKey).filter(Boolean) : []);
const isTrue = (flag) => flag === true || flag === 1;
const isFalse = (flag) => flag === false || flag === 0;
const codeOf = (v) => (v === undefined || v === null ? undefined : String(v));

// Every date that is sent must be a real calendar date and, unless it may lie ahead
// (e.g. the end of a recurrence), not in the future.
function checkDates(record, fields, where, { future = false } = {}) {
  const errors = [];
  for (const field of fields) {
    for (const value of asList(record[field])) {
      if (typeof value !== 'string') continue; // type errors are reported by the schema
      if (!isRealDate(value)) errors.push(`${where}.${field} "${value}" is not a valid ISO 8601 calendar date`);
      else if (!future && day(value) > today()) errors.push(`${where}.${field} "${value}" is in the future`);
    }
  }
  return errors;
}

function checkUpdatedAfterRegistration(record, where) {
  const registration = validDay(record.registration_date);
  const lastUpdated = validDay(record.last_updated);
  return registration && lastUpdated && lastUpdated < registration
    ? [`${where}.last_updated ${lastUpdated} is before registration_date ${registration}`]
    : [];
}

function checkDuplicateIdentifiers(list, where) {
  const keys = idKeys(list);
  const duplicates = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  return duplicates.length ? [`${where} contains duplicates: ${duplicates.join(', ')}`] : [];
}

function checkDuplicateValues(list, where) {
  if (!Array.isArray(list)) return [];
  const values = list.map(codeOf);
  const duplicates = [...new Set(values.filter((v, i) => v !== undefined && values.indexOf(v) !== i))];
  return duplicates.length ? [`${where} contains duplicates: ${duplicates.join(', ')}`] : [];
}

// Coordinates may be sent as text (schema:GeoCoordinates); their range is checked here.
function checkCoordinates(geo, where) {
  const errors = [];
  if (!isObject(geo)) return errors;
  for (const [axis, limit] of [['latitude', 90], ['longitude', 180]]) {
    const value = geo[axis];
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) > limit) {
      errors.push(`${where}.${axis} "${value}" is outside [-${limit}, ${limit}]`);
    }
  }
  return errors;
}

function checkPlace(place, where) {
  if (!isObject(place)) return [];
  return [
    ...checkCoordinates(place.geo, `${where}.geo`),
    ...asList(place.contains_place).flatMap((p, i) => checkPlace(p, `${where}.contains_place[${i}]`)),
    ...(isObject(place.contained_in_place) ? checkPlace(place.contained_in_place, `${where}.contained_in_place`) : []),
  ];
}

function checkAddresses(address, where) {
  const errors = [];
  for (const [i, a] of asList(address).entries()) {
    const geometry = a?.geo_location?.plus_code?.geometry;
    const ne = geometry?.bounds?.northeast;
    const sw = geometry?.bounds?.southwest;
    if (typeof ne?.latitude === 'number' && typeof sw?.latitude === 'number' && ne.latitude < sw.latitude) {
      errors.push(`${where}.address[${i}] geo bounds northeast.latitude ${ne.latitude} is south of southwest.latitude ${sw.latitude}`);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// DO.IBR.01 Person
// ---------------------------------------------------------------------------
export function checkPersonRules(person, where = 'record') {
  if (!isObject(person)) return [`${where} must be an object`];
  const errors = checkDates(person, ['birth_date', 'death_date', 'registration_date', 'last_updated'], where);

  const birth = validDay(person.birth_date);
  const death = validDay(person.death_date);
  const registration = validDay(person.registration_date);
  if (birth && death && death < birth) errors.push(`${where}.death_date ${death} is before birth_date ${birth}`);
  if (birth && registration && registration < birth) errors.push(`${where}.registration_date ${registration} is before birth_date ${birth}`);
  errors.push(...checkUpdatedAfterRegistration(person, where));
  errors.push(...checkDuplicateIdentifiers(person.identifier, `${where}.identifier`));
  errors.push(...checkAddresses(person.address, where));
  return errors;
}

// ---------------------------------------------------------------------------
// DO.IBR.02 Member
// ---------------------------------------------------------------------------
const memberKeys = (member) => [...idKeys(member?.member_identifier), ...idKeys(member?.demographic_info?.identifier)];
// Beneficiary attributes that published examples wrongly nest inside the member.
const BENEFICIARY_ONLY = ['programme_identifier', 'enrolment_date', 'enrollment_date', 'enrolment_status', 'enrollment_status', 'status_change_date', 'benefits'];

export function checkMemberRules(member, where = 'record') {
  if (!isObject(member)) return [`${where} must be an object`];
  const errors = checkDates(member, ['registration_date', 'last_updated'], where);
  errors.push(...checkUpdatedAfterRegistration(member, where));
  errors.push(...checkDuplicateIdentifiers(member.member_identifier, `${where}.member_identifier`));

  const person = member.demographic_info;
  if (isObject(person)) {
    // demographic_info IS the Person (IBR Member.jsonld); the published examples wrap it in "person".
    if (isObject(person.person)) {
      errors.push(`${where}.demographic_info wraps the person in "person": demographic_info must be the Person itself`);
    }
    errors.push(...checkPersonRules(person, `${where}.demographic_info`));
    const birth = validDay(person.birth_date);
    const registration = validDay(member.registration_date);
    if (birth && registration && registration < birth) {
      errors.push(`${where}.registration_date ${registration} is before demographic_info.birth_date ${birth}`);
    }
  }
  for (const field of BENEFICIARY_ONLY) {
    if (member[field] !== undefined) errors.push(`${where}.${field} is a Beneficiary attribute: send it on the beneficiary, not inside the member`);
  }

  // The two disability flags (data standard and core naming) must agree.
  if ((isTrue(member.is_disabled) && isFalse(member.self_id_disability)) || (isFalse(member.is_disabled) && isTrue(member.self_id_disability))) {
    errors.push(`${where}.is_disabled ${JSON.stringify(member.is_disabled)} contradicts self_id_disability ${JSON.stringify(member.self_id_disability)}`);
  }
  for (const [i, info] of asList(member.disability_info).entries()) {
    if (isObject(info) && !present(info.functional_type) && !present(info.disability_limitation_type) && present(info.functional_severity)) {
      errors.push(`${where}.disability_info[${i}] gives a functional_severity without the functional_type it applies to`);
    }
  }

  // A member cannot be related to itself, except with the relationship SELF.
  const own = memberKeys(member);
  for (const [i, related] of asList(member.related_person).entries()) {
    if (!isObject(related)) continue;
    const other = isObject(related.related_member)
      ? [...memberKeys(related.related_member), ...idKeys(related.related_member.identifier)] : [];
    const self = other.find((k) => own.includes(k));
    if (self && related.relationship_type !== 'SELF') {
      errors.push(`${where}.related_person[${i}] relates the member to itself (${self}) with relationship_type "${related.relationship_type}"`);
    }
    if (isObject(related.related_member)) {
      errors.push(...checkPersonRules(related.related_member, `${where}.related_person[${i}].related_member`));
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// DO.IBR.03 Group
// ---------------------------------------------------------------------------
export function checkGroupRules(group, where = 'record') {
  if (!isObject(group)) return [`${where} must be an object`];
  const errors = checkDates(group, ['registration_date', 'last_updated'], where);
  errors.push(...checkUpdatedAfterRegistration(group, where));
  errors.push(...checkDuplicateIdentifiers(group.group_identifier, `${where}.group_identifier`));
  errors.push(...checkAddresses(group.address, where));
  for (const field of ['place', 'geographical_location']) errors.push(...checkPlace(group[field], `${where}.${field}`));

  // place_address says which location applies: place (1) or address (0). The chosen one must be sent.
  const hasPlace = present(group.place) || present(group.geographical_location);
  if (isTrue(group.place_address) && !hasPlace) errors.push(`${where}.place_address is 1 (use place) but no place is given`);
  if (isFalse(group.place_address) && !present(group.address)) errors.push(`${where}.place_address is 0 (use address) but no address is given`);

  const membersList = Array.isArray(group.member_list) ? group.member_list : [];
  membersList.forEach((m, i) => errors.push(...checkMemberRules(m, `${where}.member_list[${i}]`)));
  if (isObject(group.group_head_info)) errors.push(...checkMemberRules(group.group_head_info, `${where}.group_head_info`));

  // group_size is the total number of members: the list cannot hold more.
  if (Number.isInteger(group.group_size) && membersList.length > group.group_size) {
    errors.push(`${where}.member_list has ${membersList.length} members, more than group_size ${group.group_size}`);
  }
  // A member must not be listed twice.
  const seen = new Map();
  membersList.forEach((m, i) => {
    for (const key of idKeys(m?.member_identifier)) {
      if (seen.has(key)) errors.push(`${where}.member_list[${i}] repeats member ${key} of member_list[${seen.get(key)}]`);
      else seen.set(key, i);
    }
  });
  // The head of the group must be one of the listed members (when both are identifiable).
  const headKeys = memberKeys(group.group_head_info);
  const listedKeys = membersList.flatMap(memberKeys);
  if (headKeys.length && listedKeys.length && !headKeys.some((k) => listedKeys.includes(k))) {
    errors.push(`${where}.group_head_info (${headKeys[0]}) is not one of the members in member_list`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Benefit, BenefitFrequency, Programme
// ---------------------------------------------------------------------------
export function checkBenefitRules(benefit, where = 'record') {
  if (!isObject(benefit)) return [`${where} must be an object`];
  return checkDates(benefit, ['benefit_date'], where);
}

export function checkBenefitFrequencyRules(frequency, where = 'record') {
  if (!isObject(frequency)) return [`${where} must be an object`];
  const errors = checkDates(frequency, ['dtstart', 'until'], where, { future: true });
  const start = validDay(frequency.dtstart);
  const until = validDay(frequency.until);
  if (start && until && until < start) errors.push(`${where}.until ${until} is before dtstart ${start}`);
  // RFC 5545: COUNT and UNTIL MUST NOT occur in the same recurrence rule.
  if (frequency.count !== undefined && frequency.until !== undefined) {
    errors.push(`${where} gives both count and until: a recurrence ends either after a count or at a date (RFC 5545)`);
  }
  return errors;
}

export function checkProgrammeRules(programme, where = 'record') {
  if (!isObject(programme)) return [`${where} must be an object`];
  const errors = checkDuplicateValues(programme.social_protection_functions, `${where}.social_protection_functions`);
  asList(programme.benefit).forEach((b, i) => errors.push(...checkBenefitRules(b, `${where}.benefit[${i}]`)));
  asList(programme.benefit_frequency).forEach((f, i) => errors.push(...checkBenefitFrequencyRules(f, `${where}.benefit_frequency[${i}]`)));
  return errors;
}

// ---------------------------------------------------------------------------
// DO.IBR.04 Beneficiary
// ---------------------------------------------------------------------------
const ENROLMENT_STATUS = { 1: 'Active', 2: 'Deceased', 3: 'Graduated', 4: 'Suspended' };
const ASSISTANCE_UNIT = { 1: 'Member', 2: 'Household', 3: 'Family' };

export function checkBeneficiaryRules(beneficiary, where = 'record') {
  if (!isObject(beneficiary)) return [`${where} must be an object`];
  const b = beneficiary;
  const errors = checkDates(b, ['enrolment_date', 'enrollment_date', 'status_change_date'], where);

  // Both spellings of the enrolment attributes may be sent, but they must agree.
  for (const [a, c] of [['enrolment_date', 'enrollment_date'], ['enrolment_status', 'enrollment_status']]) {
    if (b[a] !== undefined && b[c] !== undefined && codeOf(b[a]) !== codeOf(b[c])) {
      errors.push(`${where}.${a} ${JSON.stringify(b[a])} contradicts ${c} ${JSON.stringify(b[c])}`);
    }
  }
  const enrolment = validDay(b.enrolment_date ?? b.enrollment_date);
  const status = codeOf(b.enrolment_status ?? b.enrollment_status);
  const unit = codeOf(b.assistance_unit);

  if (isObject(b.member)) errors.push(...checkMemberRules(b.member, `${where}.member`));
  if (isObject(b.group)) errors.push(...checkGroupRules(b.group, `${where}.group`));
  asList(b.programme_identifier).forEach((p, i) => errors.push(...checkProgrammeRules(p, `${where}.programme_identifier[${i}]`)));
  asList(b.benefits).forEach((x, i) => errors.push(...checkBenefitRules(x, `${where}.benefits[${i}]`)));

  // A programme is listed once.
  const programmes = asList(b.programme_identifier).map((p) => p?.programme_identifier).filter((v) => typeof v === 'string');
  const repeated = [...new Set(programmes.filter((v, i) => programmes.indexOf(v) !== i))];
  if (repeated.length) errors.push(`${where}.programme_identifier lists programme ${repeated.join(', ')} more than once`);

  // Chronology: enrolment after birth, status changes and benefits after enrolment.
  const person = b.member?.demographic_info;
  const birth = validDay(person?.birth_date);
  const death = validDay(person?.death_date);
  if (enrolment && birth && enrolment < birth) errors.push(`${where}.enrolment_date ${enrolment} is before member.demographic_info.birth_date ${birth}`);
  asList(b.status_change_date).forEach((d, i) => {
    const changed = validDay(d);
    if (enrolment && changed && changed < enrolment) errors.push(`${where}.status_change_date[${i}] ${changed} is before enrolment_date ${enrolment}`);
  });
  asList(b.benefits).forEach((x, i) => {
    const received = validDay(x?.benefit_date);
    if (enrolment && received && received < enrolment) errors.push(`${where}.benefits[${i}].benefit_date ${received} is before enrolment_date ${enrolment}`);
    if (death && received && received > death) errors.push(`${where}.benefits[${i}].benefit_date ${received} is after member.demographic_info.death_date ${death}`);
  });

  // Enrolment status consistent with the person and the assistance unit.
  if (status === '1' && death) {
    errors.push(`${where}.enrolment_status is 1 (Active) but member.demographic_info.death_date ${death} is given`);
  }
  if (status === '2' && (unit === '2' || unit === '3')) {
    errors.push(`${where}.enrolment_status 2 (Deceased) applies to an individual, not to assistance_unit ${unit} (${ASSISTANCE_UNIT[unit]})`);
  }
  if (status && status !== '1' && Array.isArray(b.status_change_date) && !b.status_change_date.length) {
    errors.push(`${where}.enrolment_status is ${status} (${ENROLMENT_STATUS[status]}) but status_change_date is empty`);
  }

  // The assistance unit names who benefits: a member (1), a household (2) or a family (3).
  if (unit === '1' && isObject(b.group) && !isObject(b.member)) {
    errors.push(`${where}.assistance_unit is 1 (Member) but only a group is given`);
  }
  const groupType = codeOf(b.group?.group_type);
  if (unit && groupType && unit !== groupType) {
    errors.push(`${where}.assistance_unit ${unit} (${ASSISTANCE_UNIT[unit]}) contradicts group.group_type ${groupType} (${ASSISTANCE_UNIT[groupType]})`);
  }
  // The member of a household beneficiary is its head or nominated member: one of the group.
  if (isObject(b.group) && isObject(b.member)) {
    const own = memberKeys(b.member);
    const ofGroup = [b.group.group_head_info, ...(Array.isArray(b.group.member_list) ? b.group.member_list : [])].flatMap(memberKeys);
    if (own.length && ofGroup.length && !own.some((k) => ofGroup.includes(k))) {
      errors.push(`${where}.member (${own[0]}) is not a member of the beneficiary group`);
    }
  }
  return errors;
}

const rulesByType = {
  Beneficiary: checkBeneficiaryRules,
  IBRPerson: checkPersonRules,
  Member: checkMemberRules,
  Group: checkGroupRules,
  Programme: checkProgrammeRules,
  Benefit: checkBenefitRules,
  BenefitFrequency: checkBenefitFrequencyRules,
};

export function checkRecordRules(type, record, where = 'record') {
  return rulesByType[type](record, where);
}

// Schema + rules for one record of the given type.
export function validateRecord(type, record, where = 'record') {
  const { errors } = validateSchema(type, record);
  return [...errors.map((e) => where + e.replace(/^\(root\)/, '')), ...checkRecordRules(type, record, where)];
}

const recordsOf = (regRecords) => {
  if (Array.isArray(regRecords)) return regRecords;
  if (isObject(regRecords)) return [regRecords];
  return [];
};

// Extracts every IBR record from any message (search results, notifications, txn status,
// published beneficiaries), with the record type it must conform to. Without a
// reg_record_type, reg_records are Beneficiary records (as declared by the spec's SearchResponse).
export function extractRecords(message) {
  const out = [];
  if (!isObject(message)) return out;
  const fromItems = (items, path) => (Array.isArray(items) ? items : []).forEach((item, i) => {
    const data = item?.data;
    if (!isObject(data)) return;
    const type = data.reg_record_type === undefined ? 'Beneficiary' : recordTypeOf(data.reg_record_type);
    if (!type) return; // unknown record types are reported by the schema
    recordsOf(data.reg_records).forEach((record, j) => out.push({ type, record, where: `${path}[${i}].data.reg_records[${j}]` }));
  });
  const beneficiaries = (info, path) => (Array.isArray(info?.beneficiaries) ? info.beneficiaries : [])
    .forEach((record, j) => out.push({ type: 'Beneficiary', record, where: `${path}.beneficiaries[${j}]` }));
  fromItems(message.search_response, 'message.search_response');
  fromItems(message.notify_event, 'message.notify_event');
  const txnStatus = message.txnstatus_response?.txn_status;
  fromItems(txnStatus?.search_response, 'message.txnstatus_response.txn_status.search_response');
  beneficiaries(txnStatus?.receipt_information, 'message.txnstatus_response.txn_status.receipt_information');
  beneficiaries(message.enrolled_updates, 'message.enrolled_updates');
  return out;
}

// ---------------------------------------------------------------------------
// Message-level rules
// ---------------------------------------------------------------------------

// Rules on a callback header (sync responses and async callbacks).
export function checkCallbackHeaderRules(header) {
  const errors = [];
  if (!header) return errors;
  if (Number.isInteger(header.total_count) && Number.isInteger(header.completed_count) && header.completed_count > header.total_count) {
    errors.push(`header.completed_count ${header.completed_count} is greater than header.total_count ${header.total_count}`);
  }
  if (header.status === 'rjct' && !header.status_reason_code) {
    errors.push('header.status is "rjct" but no header.status_reason_code explains the rejection');
  }
  return errors;
}

// The record type a search_request item asks for (reg_record_type, else response_entity).
export function requestedRecordType(requestItem) {
  const criteria = requestItem?.search_criteria;
  return recordTypeOf(criteria?.reg_record_type) || recordTypeOf(criteria?.response_entity);
}

// Rules on a search result item, optionally against the original search_request item.
export function checkSearchResponseItem(item, where, requestItem) {
  const errors = [];
  if (!item || typeof item !== 'object') return errors;
  if (item.status === 'succ' && !item.data) errors.push(`${where}.status is "succ" but no data is returned`);
  if (item.status === 'rjct' && !item.status_reason_code) errors.push(`${where}.status is "rjct" but no status_reason_code is given`);
  if (item.status === 'rjct' && item.data && recordsOf(item.data.reg_records).length) {
    errors.push(`${where}.status is "rjct" but records are returned`);
  }
  const count = recordsOf(item.data?.reg_records).length;
  const p = item.pagination;
  if (p && Number.isInteger(p.page_size) && count > p.page_size) {
    errors.push(`${where} returns ${count} records, more than pagination.page_size ${p.page_size}`);
  }
  if (p && Number.isInteger(p.total_count) && Number.isInteger(p.page_size) && Number.isInteger(p.page_number)
      && count > Math.max(0, p.total_count - (p.page_number - 1) * p.page_size)) {
    errors.push(`${where} returns ${count} records, more than pagination.total_count ${p.total_count} allows on page ${p.page_number}`);
  }
  const requested = requestItem?.search_criteria?.pagination;
  if (requested && p) {
    if (Number.isInteger(requested.page_size) && p.page_size > requested.page_size) {
      errors.push(`${where}.pagination.page_size ${p.page_size} exceeds the requested page_size ${requested.page_size}`);
    }
    const askedPage = requested.page_number ?? 1;
    if (p.page_number !== askedPage) errors.push(`${where}.pagination.page_number ${p.page_number} is not the requested page ${askedPage}`);
  }
  // The records returned must be of the record type that was asked for.
  const asked = requestedRecordType(requestItem);
  const returned = item.data?.reg_record_type;
  if (asked && count && returned !== undefined && recordTypeOf(returned) !== asked) {
    errors.push(`${where}.data.reg_record_type "${returned}" is not the requested record type ${asked}`);
  }
  if (asked && asked !== 'Beneficiary' && count && returned === undefined) {
    errors.push(`${where}.data.reg_record_type is missing: ${asked} records were requested and untyped reg_records are Beneficiary records`);
  }
  return errors;
}

// Correlates a SearchResponse with the SearchRequest it answers.
export function checkSearchCorrelation(requestMessage, responseMessage, where = 'message') {
  const errors = [];
  if (!requestMessage || !responseMessage) return errors;
  if (responseMessage.transaction_id !== requestMessage.transaction_id) {
    errors.push(`${where}.transaction_id "${responseMessage.transaction_id}" does not echo the request transaction_id "${requestMessage.transaction_id}"`);
  }
  const requestItems = requestMessage.search_request || [];
  const byRef = Object.fromEntries(requestItems.map((r) => [r.reference_id, r]));
  const items = responseMessage.search_response || [];
  items.forEach((item, i) => {
    if (!(item.reference_id in byRef)) errors.push(`${where}.search_response[${i}].reference_id "${item.reference_id}" was not part of the request`);
    errors.push(...checkSearchResponseItem(item, `${where}.search_response[${i}]`, byRef[item.reference_id]));
  });
  const answered = new Set(items.map((i) => i.reference_id));
  for (const r of requestItems) {
    if (!answered.has(r.reference_id)) errors.push(`${where}: request reference_id "${r.reference_id}" has no search_response`);
  }
  return errors;
}

function checkFrequency(frequency, where) {
  if (!frequency?.start_time || !frequency?.end_time) return [];
  const start = Date.parse(frequency.start_time);
  const end = Date.parse(frequency.end_time);
  return !Number.isNaN(start) && !Number.isNaN(end) && end < start
    ? [`${where}.end_time ${frequency.end_time} is before start_time ${frequency.start_time}`]
    : [];
}

const echoesTransaction = (request, message) => (request?.message && message.transaction_id !== request.message.transaction_id
  ? [`message.transaction_id "${message.transaction_id}" does not echo the request transaction_id "${request.message.transaction_id}"`]
  : []);

// Rules on the items of an EnrolledResponse / EnrollmentUpdatesResponse.
function checkEnrolmentItems(items, where) {
  const errors = [];
  (Array.isArray(items) ? items : []).forEach((item, i) => {
    if (item?.status === 'rjct' && !item.status_reason_message) errors.push(`${where}[${i}].status is "rjct" but no status_reason_message explains it`);
  });
  return errors;
}

// The kinds of message whose header is a callback header.
const CALLBACK_KINDS = ['on-search', 'notify', 'txn-on-status', 'sync-search-response', 'sync-txn-status-response', 'enrollment-updates'];

// Full validation of a received message of the given kind. Returns a list of errors.
export function validateMessage(kind, body, request) {
  const errors = validateSchema(kind, body).errors.map((e) => `[schema] ${e}`);
  if (!body || typeof body !== 'object') return errors;

  // The sync enrolment responses may be the bare message (see schemas.js).
  const bare = ['enrolled-response', 'enrollment-updates-response'].includes(kind) && !body.header;
  const header = bare ? undefined : body.header;
  const message = bare ? body : body.message;
  const encrypted = header?.is_msg_encrypted === true;

  if (CALLBACK_KINDS.includes(kind) || (header && ['enrolled-response', 'enrollment-updates-response'].includes(kind))) {
    errors.push(...checkCallbackHeaderRules(header).map((e) => `[rule] ${e}`));
    if (header?.status === 'succ' && !message) errors.push('[rule] header.status is "succ" but no message is returned');
  }
  if (encrypted || !message) return errors;
  const rule = (list) => errors.push(...list.map((e) => `[rule] ${e}`));

  // Search results
  if (['on-search', 'sync-search-response'].includes(kind)) {
    if (request?.message) rule(checkSearchCorrelation(request.message, message));
    else (message.search_response || []).forEach((item, i) => rule(checkSearchResponseItem(item, `message.search_response[${i}]`)));
  }
  if (['txn-on-status', 'sync-txn-status-response'].includes(kind)) {
    const r = message.txnstatus_response;
    rule(echoesTransaction(request, message));
    const askedType = request?.message?.txnstatus_request?.txn_type;
    if (askedType && r?.txn_type && r.txn_type !== askedType) {
      rule([`txnstatus_response.txn_type "${r.txn_type}" does not match the requested txn_type "${askedType}"`]);
    }
    (r?.txn_status?.search_response || []).forEach((item, i) => rule(checkSearchResponseItem(item, `message.txnstatus_response.txn_status.search_response[${i}]`)));
  }
  if (['on-subscribe', 'on-unsubscribe', 'enrolled-response', 'enrollment-updates-response'].includes(kind)) {
    rule(echoesTransaction(request, message));
  }
  if (kind === 'on-subscribe') {
    (message.subscribe_response || []).forEach((item, i) => {
      if (item.status === 'rjct' && !item.status_reason_code) rule([`message.subscribe_response[${i}].status is "rjct" but no status_reason_code is given`]);
      if (item.status === 'succ' && !(item.subscriptions || []).length) rule([`message.subscribe_response[${i}].status is "succ" but no subscription code is returned`]);
      (item.subscriptions || []).forEach((s, j) => rule(checkFrequency(s.frequency, `message.subscribe_response[${i}].subscriptions[${j}].frequency`)));
    });
  }
  if (kind === 'subscribe') {
    (message.subscribe_request || []).forEach((item, i) => rule(checkFrequency(item?.subscribe_criteria?.frequency, `message.subscribe_request[${i}].subscribe_criteria.frequency`)));
  }
  if (kind === 'on-unsubscribe' && message.status === 'rjct' && !message.status_reason_code) {
    rule(['message.status is "rjct" but no status_reason_code is given']);
  }
  if (['enrolled-response', 'enrollment-updates-response'].includes(kind)) {
    rule(checkEnrolmentItems(message.enrolled_response, 'message.enrolled_response'));
  }
  if (kind === 'enrolled-response') {
    (message.enrolled_response || []).forEach((item, i) => {
      // PRS.IBR.01.2: the answer is a minimal yes / no, never the beneficiary records.
      const disclosed = Object.keys(item || {}).filter((k) => ['data', 'reg_records', 'beneficiary', 'beneficiaries', 'member', 'group', 'programme_identifier', 'benefits'].includes(k));
      if (disclosed.length) rule([`message.enrolled_response[${i}] discloses ${disclosed.join(', ')}: the enrolment answer must be a minimal yes / no (PRS.IBR.01.2)`]);
    });
  }

  // IBR data, wherever it appears.
  for (const { type, record, where } of extractRecords(message)) {
    errors.push(...checkRecordRules(type, record, where).map((e) => `[data] ${e}`));
  }
  return errors;
}

export function formatErrors(errors) {
  return errors.map((e) => `  - ${e}`).join('\n');
}
