#!/usr/bin/env node
// Generates the Mockoon environments of the DCI Integrated Beneficiary Registry (IBR) v1.0.0 API:
//   mockoon-ibr.json   IBR (registry) side, port 3003:
//                      search, sync/search, subscribe, unsubscribe, txn/status, sync/txn/status,
//                      sync/enrolled, sync/enrollment/updates
//   mockoon-sp.json    SP-MIS side (callbacks received from the IBR), port 3004:
//                      on-search, on-subscribe, on-unsubscribe, txn/on-status, notify
//
// Every endpoint validates the request against the spec schema (Mockoon valid_json_schema
// rule) and answers an ERR acknowledgement when it does not conform. Async IBR endpoints
// ACK and then call header.sender_uri back with the spec callback (on-search, ...).
//
// Searches return beneficiaries (Beneficiary), persons (IBRPerson), members (Member) or
// groups (Group) depending on search_criteria.reg_record_type / response_entity
// (Beneficiary when neither is given). The enrolment check answers yes / no per identifier
// and programme; enrolment updates are acknowledged beneficiary by beneficiary.
//
// Schemas and records are imported from the test suite so that the mocks and the
// compliance tests always agree. Run after changing them:
//   node mock/generate-mocks.mjs

import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { schemas } from '../test/features/support/helpers/schemas.js';
import {
  beneficiaries, recordsByIdentifier, predicateResults, enrolledIndex,
} from '../test/features/support/fixtures/records.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Stable UUIDs so regenerating produces minimal diffs.
const uuid = (seed) => {
  const h = createHash('sha1').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const REG_TYPE = 'ns:org:RegistryType:IBR';
const IBR_ID = 'ibr.example.org';
const NOW = '{{now "yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx"}}';
const JSON_HEADERS = [{ key: 'Content-Type', value: 'application/json' }];

// ---------------------------------------------------------------------------
// Handlebars templates
// ---------------------------------------------------------------------------
const ack = (status = 'ACK') => `{
  "message": {
    "ack_status": "${status}",
    "timestamp": "${NOW}",
    "correlation_id": "{{guid}}"
  }
}`;

const err = (what) => `{
  "message": {
    "ack_status": "ERR",
    "timestamp": "${NOW}",
    "error": {
      "code": "err.request.bad",
      "message": "Request does not conform to the DCI Integrated Beneficiary Registry ${what} schema"
    },
    "correlation_id": "{{guid}}"
  }
}`;

// One SearchResponse item for the search_request item in scope (`this`).
// The record type is search_criteria.reg_record_type, else response_entity, else Beneficiary.
// Records are looked up in the "index" data bucket: "<type>|<identifier_value>" for
// idtype-value queries, "<type>|<query_type>" for predicate and expression queries.
// Sort and pagination are honoured.
const searchItem = (indexVar) => `{{setVar 'all' (array)}}
      {{setVar 'rt' 'Beneficiary'}}{{#if this.search_criteria.response_entity}}{{setVar 'rt' this.search_criteria.response_entity}}{{/if}}{{#if this.search_criteria.reg_record_type}}{{setVar 'rt' this.search_criteria.reg_record_type}}{{/if}}
      {{#if (eq this.search_criteria.query_type 'idtype-value')}}{{setVar 'found' (dataRaw 'index' (concat @rt '|' this.search_criteria.query.value))}}{{else}}{{setVar 'found' (dataRaw 'index' (concat @rt '|' this.search_criteria.query_type))}}{{/if}}
      {{#if @found}}{{setVar 'all' (slice @found 0)}}{{/if}}
      {{#if this.search_criteria.sort}}{{setVar 'all' (sortBy @all this.search_criteria.sort.[0].attribute_name this.search_criteria.sort.[0].sort_order)}}{{/if}}
      {{setVar 'size' (bodyRaw (concat 'message.search_request.' ${indexVar} '.search_criteria.pagination.page_size') 10)}}
      {{setVar 'page' (bodyRaw (concat 'message.search_request.' ${indexVar} '.search_criteria.pagination.page_number') 1)}}
      {{#if (eq this.search_criteria.query.value 'TOOMANY000')}}
      {
        "reference_id": "{{this.reference_id}}",
        "timestamp": "${NOW}",
        "status": "rjct",
        "status_reason_code": "rjct.search.too_many_records_found",
        "status_reason_message": "Too many records match the search criteria, refine the query",
        "locale": "{{#if this.locale}}{{this.locale}}{{else}}eng{{/if}}"
      }
      {{else}}
      {
        "reference_id": "{{this.reference_id}}",
        "timestamp": "${NOW}",
        "status": "succ",
        "data": {
          "version": "1.0.0",
          "reg_type": "${REG_TYPE}",
          "reg_record_type": "{{@rt}}",
          "reg_records": {{{stringify (slice @all (multiply (subtract @page 1) @size) (multiply @page @size))}}}
        },
        "pagination": {
          "page_size": {{@size}},
          "page_number": {{@page}},
          "total_count": {{len @all}}
        },
        "locale": "{{#if this.locale}}{{this.locale}}{{else}}eng{{/if}}"
      }
      {{/if}}`;

const searchMessage = `{
    "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
    "correlation_id": "{{guid}}",
    "search_response": [
      {{#each (bodyRaw 'message.search_request')}}
      ${searchItem('@index')}{{#unless @last}},{{/unless}}
      {{/each}}
    ]
  }`;

const callbackHeader = (action, countPath) => `{
    "version": "1.0.0",
    "message_id": "{{guid}}",
    "message_ts": "${NOW}",
    "action": "${action}",
    "status": "succ",
    "total_count": ${countPath ? `{{len (bodyRaw '${countPath}')}}` : 1},
    "completed_count": ${countPath ? `{{len (bodyRaw '${countPath}')}}` : 1},
    "sender_id": "${IBR_ID}",
    "receiver_id": "{{bodyRaw 'header.sender_id'}}",
    "is_msg_encrypted": false
  }`;

const msgHeader = (action, countPath) => `{
    "version": "1.0.0",
    "message_id": "{{guid}}",
    "message_ts": "${NOW}",
    "action": "${action}",
    "sender_id": "${IBR_ID}",
    "receiver_id": "{{bodyRaw 'header.sender_id'}}",
    "total_count": ${countPath ? `{{len (bodyRaw '${countPath}')}}` : 1},
    "is_msg_encrypted": false
  }`;

const onSearchBody = `{
  "header": ${callbackHeader('on-search', 'message.search_request')},
  "message": ${searchMessage}
}`;

const subscribeMessage = `{
    "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
    "correlation_id": "{{guid}}",
    "subscribe_response": [
      {{#each (bodyRaw 'message.subscribe_request')}}
      {
        "reference_id": "{{this.reference_id}}",
        "timestamp": "${NOW}",
        "status": "succ",
        "subscriptions": [
          {
            "version": "1.0.0",
            "code": "SUB-{{guid}}",
            "status": "subscribe",
            "timestamp": "${NOW}",
            "reg_type": "{{#if this.subscribe_criteria.reg_type}}{{this.subscribe_criteria.reg_type}}{{else}}${REG_TYPE}{{/if}}",
            "reg_event_type": "{{this.subscribe_criteria.reg_event_type}}",
            {{#if this.subscribe_criteria.frequency}}"frequency": {{{stringify this.subscribe_criteria.frequency}}},{{/if}}
            {{#if this.subscribe_criteria.filter_type}}"filter_type": "{{this.subscribe_criteria.filter_type}}",{{/if}}
            "filter": {{{stringify this.subscribe_criteria.filter}}},
            "notify_record_type": "{{this.subscribe_criteria.notify_record_type}}",
            "locale": "{{#if this.locale}}{{this.locale}}{{else}}eng{{/if}}"
          }
        ],
        "locale": "{{#if this.locale}}{{this.locale}}{{else}}eng{{/if}}"
      }{{#unless @last}},{{/unless}}
      {{/each}}
    ]
  }`;

const unsubscribeMessage = `{
    "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
    "correlation_id": "{{guid}}",
    "timestamp": "${NOW}",
    "status": "succ",
    "subscription_status": [
      {{#each (bodyRaw 'message.subscription_codes')}}
      { "code": "{{this}}", "status": "unsubscribe" }{{#unless @last}},{{/unless}}
      {{/each}}
    ]
  }`;

// TxnStatusResponse for the txn_type asked: the search variant reports the search of the
// "household" beneficiary, the receipt variant the publication of two beneficiaries.
const txnStatusMessage = `{
    "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
    "correlation_id": "{{guid}}",
    "txnstatus_response": {
      "txn_type": "{{bodyRaw 'message.txnstatus_request.txn_type'}}",
      "txn_status":
      {{#switch (bodyRaw 'message.txnstatus_request.txn_type')}}
      {{#case 'subscribe'}}
      {
        "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
        "correlation_id": "{{guid}}",
        "subscribe_response": [
          {
            "reference_id": "{{bodyRaw 'message.txnstatus_request.reference_id'}}",
            "timestamp": "${NOW}",
            "status": "succ",
            "subscriptions": [
              { "version": "1.0.0", "code": "SUB-0001", "status": "subscribe", "timestamp": "${NOW}", "reg_type": "${REG_TYPE}", "reg_event_type": "enrollement_status_change", "notify_record_type": "Beneficiary" }
            ]
          }
        ]
      }
      {{/case}}
      {{#case 'receipt'}}
      {
        "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
        "receipt_information": {
          "receipt_type": "enrollement",
          "beneficiaries": {{{stringify (dataRaw 'receipt')}}}
        }
      }
      {{/case}}
      {{#default}}
      {
        "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
        "correlation_id": "{{guid}}",
        "search_response": [
          {
            "reference_id": "{{bodyRaw 'message.txnstatus_request.reference_id'}}",
            "timestamp": "${NOW}",
            "status": "succ",
            "data": {
              "version": "1.0.0",
              "reg_type": "${REG_TYPE}",
              "reg_record_type": "Beneficiary",
              "reg_records": {{{stringify (dataRaw 'index' 'Beneficiary|GRP1001')}}}
            },
            "pagination": { "page_size": 10, "page_number": 1, "total_count": 1 },
            "locale": "{{bodyRaw 'message.txnstatus_request.locale' 'eng'}}"
          }
        ]
      }
      {{/default}}
      {{/switch}}
    }
  }`;

// PRS.IBR.01: EnrolledResponse. The identifiers checked are read from the query
// (idtype-value "value", predicate "attribute_value", or the "eq" / "in" condition on
// person_identifier, member_identifier or group_identifier), the programme from
// programme_identifier.eq (any programme when absent). One yes / no answer per identifier,
// from the "enrolled" data bucket ("<identifier>|<programme>").
const Q = 'message.enrolled_criteria.query';
const enrolledResponse = `{{setVar 'ids' (array)}}
{{#if (bodyRaw '${Q}.value')}}{{setVar 'ids' (array (bodyRaw '${Q}.value'))}}{{/if}}
{{#if (bodyRaw '${Q}.attribute_value')}}{{setVar 'ids' (array (bodyRaw '${Q}.attribute_value'))}}{{/if}}
{{#if (bodyRaw '${Q}.person_identifier.eq')}}{{setVar 'ids' (array (bodyRaw '${Q}.person_identifier.eq'))}}{{/if}}
{{#if (bodyRaw '${Q}.person_identifier.in')}}{{setVar 'ids' (bodyRaw '${Q}.person_identifier.in')}}{{/if}}
{{#if (bodyRaw '${Q}.member_identifier.eq')}}{{setVar 'ids' (array (bodyRaw '${Q}.member_identifier.eq'))}}{{/if}}
{{#if (bodyRaw '${Q}.member_identifier.in')}}{{setVar 'ids' (bodyRaw '${Q}.member_identifier.in')}}{{/if}}
{{#if (bodyRaw '${Q}.group_identifier.eq')}}{{setVar 'ids' (array (bodyRaw '${Q}.group_identifier.eq'))}}{{/if}}
{{#if (bodyRaw '${Q}.group_identifier.in')}}{{setVar 'ids' (bodyRaw '${Q}.group_identifier.in')}}{{/if}}
{{setVar 'prog' (bodyRaw '${Q}.programme_identifier.eq' '*')}}
{
  "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
  "correlation_id": "{{guid}}",
  "enrolled_response": [
    {{#each @ids}}
    {
      "reference_id": "{{guid}}",
      "timestamp": "${NOW}",
      "status": "succ",
      "enrolled_status": "{{#if (dataRaw 'enrolled' (concat this '|' @prog))}}yes{{else}}no{{/if}}"
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ]
}`;

// PRS.IBR.02 / PRS.IBR.03: EnrollmentUpdatesResponse, one receipt per published beneficiary.
const enrollmentUpdatesResponse = `{
  "transaction_id": "{{bodyRaw 'message.transaction_id'}}",
  "correlation_id": "{{guid}}",
  "enrolled_response": [
    {{#each (bodyRaw 'message.enrolled_updates.beneficiaries')}}
    {
      "reference_id": "{{guid}}",
      "timestamp": "${NOW}",
      "status": "succ"
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ]
}`;

// ---------------------------------------------------------------------------
// Environment builders
// ---------------------------------------------------------------------------
const response = (seed, { statusCode = 200, label, body, rules = [], isDefault = false, callbacks = [] }) => ({
  uuid: uuid(seed),
  body,
  latency: 0,
  statusCode,
  label,
  headers: JSON_HEADERS,
  bodyType: 'INLINE',
  filePath: '',
  databucketID: '',
  sendFileAsBody: false,
  rules,
  rulesOperator: 'OR',
  disableTemplating: false,
  fallbackTo404: false,
  default: isDefault,
  crudKey: 'id',
  callbacks,
});

const invalidRequest = (schemaName) => [{
  target: 'body', modifier: '', value: `schemas.${schemaName}`, invert: true, operator: 'valid_json_schema',
}];

// POST route: ERR when the request breaks the spec schema, otherwise `ok`.
function route(env, endpoint, documentation, schemaName, ok) {
  return {
    uuid: uuid(`${env}:${endpoint}`),
    type: 'http',
    documentation,
    method: 'post',
    endpoint,
    responses: [
      response(`${env}:${endpoint}:ok`, { ...ok, isDefault: true }),
      response(`${env}:${endpoint}:err`, {
        statusCode: 400,
        label: `Request not conforming to the ${schemaName} schema`,
        body: err(schemaName),
        rules: invalidRequest(schemaName),
      }),
    ],
    responseMode: null,
    streamingMode: null,
    streamingInterval: 0,
  };
}

const healthcheck = (env) => ({
  uuid: uuid(`${env}:healthcheck`),
  type: 'http',
  documentation: 'Liveness probe used by the test runner',
  method: 'get',
  endpoint: 'healthcheck',
  responses: [response(`${env}:healthcheck:ok`, { label: 'UP', body: '{ "status": "UP" }', isDefault: true })],
  responseMode: null,
  streamingMode: null,
  streamingInterval: 0,
});

const callback = (env, name, documentation, body) => ({
  uuid: uuid(`${env}:callback:${name}`),
  id: name,
  uri: "{{bodyRaw 'header.sender_uri'}}",
  name,
  documentation,
  method: 'post',
  headers: JSON_HEADERS,
  bodyType: 'INLINE',
  body,
  databucketID: '',
  filePath: '',
  sendFileAsBody: true,
});

const bucket = (env, name, documentation, value) => ({
  uuid: uuid(`${env}:bucket:${name}`),
  id: name,
  name,
  documentation,
  value: JSON.stringify(value, null, 2),
});

function environment({ key, name, port, routes, data, callbacks = [] }) {
  return {
    uuid: uuid(`env:${key}`),
    lastMigration: 33,
    name,
    endpointPrefix: '',
    latency: 0,
    port,
    hostname: '',
    folders: [],
    routes,
    rootChildren: routes.map((r) => ({ type: 'route', uuid: r.uuid })),
    proxyMode: false,
    proxyHost: '',
    proxyRemovePrefix: false,
    tlsOptions: { enabled: false, type: 'CERT', pfxPath: '', certPath: '', keyPath: '', caPath: '', passphrase: '' },
    cors: true,
    headers: JSON_HEADERS,
    proxyReqHeaders: [{ key: '', value: '' }],
    proxyResHeaders: [{ key: '', value: '' }],
    data,
    callbacks,
  };
}

// ---------------------------------------------------------------------------
// IBR (registry) side
// ---------------------------------------------------------------------------
// Predicate and expression searches return the same records per record type.
const byQueryType = Object.fromEntries(
  Object.entries(predicateResults).flatMap(([key, records]) => {
    const type = key.split('|')[0];
    return [[`${type}|predicate`, records], [`${type}|expression`, records]];
  }),
);
const index = { ...recordsByIdentifier(), ...byQueryType };

const ibrSchemas = Object.fromEntries(['search', 'subscribe', 'unsubscribe', 'txn-status', 'enrolled', 'enrollment-updates'].map((k) => [k, schemas[k]]));

const ibrCallbacks = [
  callback('ibr', 'on-search', 'Async search results sent to header.sender_uri', onSearchBody),
  callback('ibr', 'on-subscribe', 'Subscription result sent to header.sender_uri',
    `{\n  "header": ${msgHeader('on-subscribe', 'message.subscribe_request')},\n  "message": ${subscribeMessage}\n}`),
  callback('ibr', 'on-unsubscribe', 'Unsubscribe result sent to header.sender_uri',
    `{\n  "header": ${msgHeader('on-unsubscribe')},\n  "message": ${unsubscribeMessage}\n}`),
  callback('ibr', 'txn-on-status', 'Transaction status sent to header.sender_uri',
    `{\n  "header": ${callbackHeader('txn-on-status')},\n  "message": ${txnStatusMessage}\n}`),
];
const fire = (name) => [{ uuid: uuid(`ibr:callback:${name}`), latency: 300 }];

const ibr = environment({
  key: 'ibr',
  name: 'DCI Integrated Beneficiary Registry v1.0.0 - registry',
  port: 3003,
  routes: [
    route('ibr', 'ibr/sync/search', 'POST /registry/sync/search - search beneficiaries, persons, members or groups and get results in the response', 'search', {
      label: 'Search results (header action on-search + SearchResponse)',
      body: `{\n  "header": ${callbackHeader('on-search', 'message.search_request')},\n  "message": ${searchMessage}\n}`,
    }),
    route('ibr', 'ibr/search', 'POST /registry/search - async search, results are sent to header.sender_uri (on-search)', 'search', {
      label: 'ACK, then on-search callback', body: ack(), callbacks: fire('on-search'),
    }),
    route('ibr', 'ibr/subscribe', 'POST /registry/subscribe - subscribe to IBR enrolment events, result sent to header.sender_uri (on-subscribe)', 'subscribe', {
      label: 'ACK, then on-subscribe callback', body: ack(), callbacks: fire('on-subscribe'),
    }),
    route('ibr', 'ibr/unsubscribe', 'POST /registry/unsubscribe - cancel subscriptions, result sent to header.sender_uri (on-unsubscribe)', 'unsubscribe', {
      label: 'ACK, then on-unsubscribe callback', body: ack(), callbacks: fire('on-unsubscribe'),
    }),
    route('ibr', 'ibr/txn/status', 'POST /registry/txn/status - async transaction status, result sent to header.sender_uri (txn/on-status)', 'txn-status', {
      label: 'ACK, then txn/on-status callback', body: ack(), callbacks: fire('txn-on-status'),
    }),
    route('ibr', 'ibr/sync/txn/status', 'POST /registry/sync/txn/status - transaction status in the response', 'txn-status', {
      label: 'Transaction status (header action txn-on-status + TxnStatusResponse)',
      body: `{\n  "header": ${callbackHeader('txn-on-status')},\n  "message": ${txnStatusMessage}\n}`,
    }),
    route('ibr', 'ibr/sync/enrolled', 'POST /registry/sync/enrolled - is a beneficiary enrolled in a programme (PRS.IBR.01), yes / no answer', 'enrolled', {
      label: 'EnrolledResponse (yes / no per identifier)', body: enrolledResponse,
    }),
    route('ibr', 'ibr/sync/enrollment/updates', 'POST /registry/sync/enrollment/updates - beneficiaries, benefits and status changes published by the SP-MIS (PRS.IBR.02, PRS.IBR.03)', 'enrollment-updates', {
      label: 'EnrollmentUpdatesResponse (one receipt per beneficiary)', body: enrollmentUpdatesResponse,
    }),
    healthcheck('ibr'),
  ],
  data: [
    bucket('ibr', 'index', 'IBR records by "<record type>|<identifier_value>" and by "<record type>|<query_type>"', index),
    bucket('ibr', 'enrolled', 'Active enrolments by "<identifier_value>|<programme_identifier>" ("*" = any programme)', enrolledIndex()),
    bucket('ibr', 'receipt', 'Beneficiaries reported by the receipt transaction status', [beneficiaries.household, beneficiaries.deceased]),
    bucket('ibr', 'schemas', 'DCI IBR request schemas (generated from test/features/support/helpers/schemas.js)', ibrSchemas),
  ],
  callbacks: ibrCallbacks,
});

// ---------------------------------------------------------------------------
// SP side (callbacks an IBR sends)
// ---------------------------------------------------------------------------
const spSchemas = Object.fromEntries(['on-search', 'on-subscribe', 'on-unsubscribe', 'txn-on-status', 'notify'].map((k) => [k, schemas[k]]));

const sp = environment({
  key: 'sp',
  name: 'DCI Integrated Beneficiary Registry v1.0.0 - SP-MIS callbacks',
  port: 3004,
  routes: [
    route('sp', 'ibr/on-search', 'POST /registry/on-search - receive async search results', 'on-search', { label: 'ACK', body: ack() }),
    route('sp', 'ibr/on-subscribe', 'POST /registry/on-subscribe - receive subscription result', 'on-subscribe', { label: 'ACK', body: ack() }),
    route('sp', 'ibr/on-unsubscribe', 'POST /registry/on-unsubscribe - receive unsubscribe result', 'on-unsubscribe', { label: 'ACK', body: ack() }),
    route('sp', 'ibr/txn/on-status', 'POST /registry/txn/on-status - receive transaction status', 'txn-on-status', { label: 'ACK', body: ack() }),
    route('sp', 'ibr/notify', 'POST /registry/notify - receive IBR enrolment notifications (PRS.IBR.03.5)', 'notify', { label: 'ACK', body: ack() }),
    healthcheck('sp'),
  ],
  data: [bucket('sp', 'schemas', 'DCI IBR callback schemas (generated from test/features/support/helpers/schemas.js)', spSchemas)],
});

// Keep the reference household reachable for the txn status template.
if (!index['Beneficiary|GRP1001']?.includes(beneficiaries.household)) throw new Error('The index must resolve Beneficiary|GRP1001 to the household beneficiary');

writeFileSync(path.join(root, 'mockoon-ibr.json'), `${JSON.stringify(ibr, null, 2)}\n`);
writeFileSync(path.join(root, 'mockoon-sp.json'), `${JSON.stringify(sp, null, 2)}\n`);
console.log('Generated mockoon-ibr.json and mockoon-sp.json');
