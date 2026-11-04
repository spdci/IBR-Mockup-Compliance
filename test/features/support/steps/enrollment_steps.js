// PRS.IBR.01 (enrolment check, /registry/sync/enrolled) and PRS.IBR.02 / PRS.IBR.03
// (beneficiaries, benefits and status changes published by the SP-MIS,
// /registry/sync/enrollment/updates).

import './parameter_types.js';
import { Given, Then } from '@cucumber/cucumber';
import chai from 'chai';
import {
  enrolledMessage, enrolledByIdentifierMessage, enrollmentUpdatesMessage, newTransactionId,
} from '../helpers/payloads.js';
import { testRecord, testProgramme } from '../helpers/testdata.js';
import { recordFixture } from '../helpers/defaults.js';
import { useRequest, inspectedMessage } from './common_steps.js';

const { expect } = chai;

const names = (list) => list.split(',').map((n) => n.trim());
const enrolledItems = (world) => {
  const items = inspectedMessage(world)?.enrolled_response;
  expect(items, 'enrolled_response').to.be.an('array');
  return items;
};

// ---------------------------------------------------------------------------
// Enrolment check (PRS.IBR.01)
// ---------------------------------------------------------------------------
Given('an enrolment check of the {string} {recordType} in the {string} programme', function (name, type, programme) {
  useRequest(this, enrolledMessage(type, [name], programme));
});

Given('an enrolment check of the {string} {recordType} in any programme', function (name, type) {
  useRequest(this, enrolledMessage(type, [name]));
});

Given('an enrolment check of the {string} {recordType} by identifier', function (name, type) {
  useRequest(this, enrolledByIdentifierMessage(type, name));
});

// PRS.IBR.01.5: a batch of potential beneficiaries in one request ("in" operator).
Given('a batch enrolment check of the {recordType} records {string} in the {string} programme', function (type, list, programme) {
  useRequest(this, enrolledMessage(type, names(list), programme));
});

// PRS.IBR.01.4: the query names the response entity (Group for households, Member for individuals).
Given('the enrolment check asks for the {string} response entity', function (entity) {
  this.request.message.enrolled_criteria.response_entity = entity;
});

// The predicate form of the IBR process flow 2 example: { attribute_name, operator, attribute_value }.
Given('an enrolment check of the {string} {recordType} written as a predicate', function (name, type) {
  const { identifier_value } = testRecord(type, name);
  useRequest(this, {
    transaction_id: newTransactionId(),
    enrolled_criteria: {
      query_type: 'predicate',
      response_entity: type === 'Group' ? 'Group' : 'Member',
      query: { attribute_name: type === 'Group' ? 'group_identifier' : 'person_identifier', operator: 'eq', attribute_value: identifier_value },
    },
  });
});

// The exact query of EnrolledCriteria.yaml (dotted programme attribute).
Given('an enrolment check of the {string} IBRPerson in the {string} programme written as in the spec example', function (name, programme) {
  const { identifier_value } = testRecord('IBRPerson', name);
  useRequest(this, {
    transaction_id: newTransactionId(),
    enrolled_criteria: {
      query_type: 'expression',
      response_entity: 'Member',
      query: {
        person_identifier: { eq: identifier_value },
        'programme_identifier.program.programme_identifier': { eq: testProgramme(programme) },
      },
    },
  });
});

Then('the enrolment check should answer {int} item(s)', function (count) {
  expect(enrolledItems(this), 'enrolled_response items').to.have.lengthOf(count);
});

Then('every enrolment answer should have status {string}', function (status) {
  const items = enrolledItems(this);
  expect(items, 'enrolled_response').to.not.be.empty;
  items.forEach((item, i) => expect(item.status, `enrolled_response[${i}].status`).to.equal(status));
});

Then('the enrolled status should be {string}', function (expected) {
  const items = enrolledItems(this);
  expect(items, 'enrolled_response').to.not.be.empty;
  items.forEach((item, i) => expect(item.enrolled_status, `enrolled_response[${i}].enrolled_status`).to.equal(expected));
});

Then('the enrolled status should be {string} or {string}', function (a, b) {
  const items = enrolledItems(this);
  expect(items, 'enrolled_response').to.not.be.empty;
  items.forEach((item, i) => expect(item.enrolled_status, `enrolled_response[${i}].enrolled_status`).to.be.oneOf([a, b]));
});

// PRS.IBR.01.2: data minimisation, only the spec's yes / no answer comes back.
Then('the enrolment answer should disclose no beneficiary data', function () {
  const allowed = ['reference_id', 'timestamp', 'status', 'status_reason_message', 'enrolled_status'];
  enrolledItems(this).forEach((item, i) => {
    const extra = Object.keys(item).filter((k) => !allowed.includes(k));
    expect(extra, `enrolled_response[${i}] discloses more than the yes / no answer`).to.be.empty;
  });
  const message = inspectedMessage(this);
  expect(Object.keys(message).filter((k) => !['transaction_id', 'correlation_id', 'enrolled_response'].includes(k)),
    'enrolment check response attributes beyond the spec').to.be.empty;
});

// ---------------------------------------------------------------------------
// Enrolment updates (PRS.IBR.02 benefits, PRS.IBR.03 status changes)
// ---------------------------------------------------------------------------
Given('an enrolment update publishing the Beneficiary records {string}', function (list) {
  useRequest(this, enrollmentUpdatesMessage(names(list).map((n) => recordFixture('Beneficiary', n))));
});

Given('an enrolment update of type {string} publishing the Beneficiary records {string}', function (receiptType, list) {
  useRequest(this, enrollmentUpdatesMessage(names(list).map((n) => recordFixture('Beneficiary', n)), receiptType));
});

// A beneficiary changed on the fly: "<attribute>" of "<fixture>" set to a JSON value.
Given('an enrolment update publishing the {string} Beneficiary record with {string} set to {string}', function (name, path, json) {
  const record = recordFixture('Beneficiary', name);
  const keys = path.split('.');
  let o = record;
  keys.slice(0, -1).forEach((k) => { o = o[/^\d+$/.test(k) ? Number(k) : k]; });
  o[keys.at(-1)] = JSON.parse(json);
  useRequest(this, enrollmentUpdatesMessage([record], 'enrollement_status_change'));
});

Then('every published beneficiary should be acknowledged', function () {
  const items = enrolledItems(this);
  expect(items, 'enrolled_response').to.not.be.empty;
  items.forEach((item, i) => expect(item.status, `enrolled_response[${i}].status`).to.be.oneOf(['rcvd', 'pdng', 'succ']));
});
