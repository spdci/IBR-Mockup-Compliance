// A valid, minimal-but-realistic request for every endpoint.

import { endpoints, senderId, receiverId } from './helpers.js';
import { records, specBeneficiaryExample, specMemberExample, specPersonExample } from '../fixtures/records.js';
import {
  msgHeader, callbackHeader, envelope, searchItem, searchMessage, idTypeValueQuery,
  subscribeItem, subscribeMessage, unsubscribeMessage, txnStatusMessage,
  enrolledMessage, enrollmentUpdatesMessage,
  searchResponseMessage, subscribeResponseMessage, unsubscribeResponseMessage,
  txnStatusResponseMessage, notifyEvent, notifyMessage,
} from './payloads.js';

const specExamples = { Beneficiary: specBeneficiaryExample, Member: specMemberExample, IBRPerson: specPersonExample };

// A reference record: records.<type>.<name>, or the published spec example of that type.
export function recordFixture(type, name) {
  if (!records[type]) throw new Error(`Unknown record type "${type}". Known: ${Object.keys(records).join(', ')}`);
  if (name === 'spec example' && specExamples[type]) return structuredClone(specExamples[type]);
  if (!records[type][name]) throw new Error(`Unknown ${type} fixture "${name}". Known: ${Object.keys(records[type]).join(', ')}`);
  return structuredClone(records[type][name]);
}

export function defaultMessage(endpointName) {
  switch (endpointName) {
    case 'search':
    case 'sync search':
      return searchMessage([searchItem('Beneficiary', idTypeValueQuery('Beneficiary', 'household'))]);
    case 'subscribe':
      return subscribeMessage([subscribeItem('enrollement_status_change')]);
    case 'unsubscribe':
      return unsubscribeMessage(['SUB-0001']);
    case 'txn status':
    case 'sync txn status':
      return txnStatusMessage('search', 'transaction_id');
    case 'enrolled':
      return enrolledMessage('Member', ['full'], 'child grant');
    case 'enrollment updates':
      return enrollmentUpdatesMessage([recordFixture('Beneficiary', 'household')], 'enrollement');
    case 'on-search':
      return searchResponseMessage('Beneficiary', [recordFixture('Beneficiary', 'household')]);
    case 'on-subscribe':
      return subscribeResponseMessage();
    case 'on-unsubscribe':
      return unsubscribeResponseMessage();
    case 'txn on-status':
      return txnStatusResponseMessage('search', { recordType: 'Beneficiary', records: [recordFixture('Beneficiary', 'household')] });
    case 'notify':
      return notifyMessage([notifyEvent('enrollement_status_change', 'Beneficiary', [recordFixture('Beneficiary', 'suspended')])]);
    default:
      throw new Error(`No default message for endpoint "${endpointName}"`);
  }
}

// Endpoints whose request carries a callback header (MsgCallbackHeader). The SP-MIS sends the
// enrolment updates to the IBR, the others are sent by the IBR.
const usesCallbackHeader = new Set(['on-search', 'notify', 'txn on-status', 'enrollment updates']);

export function buildRequest(endpointName, message = defaultMessage(endpointName)) {
  const { action } = endpoints[endpointName];
  const items = message.search_request || message.subscribe_request || message.search_response
    || message.subscribe_response || message.notify_event || message.enrolled_updates?.beneficiaries || [message];
  const counts = { totalCount: items.length };
  let header;
  if (endpointName === 'enrollment updates') header = callbackHeader(action, { ...counts, from: senderId, to: receiverId });
  else if (usesCallbackHeader.has(endpointName)) header = callbackHeader(action, counts);
  else header = msgHeader(action, counts);
  return envelope(header, message);
}
