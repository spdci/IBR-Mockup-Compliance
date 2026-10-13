// Runtime configuration of the compliance suite.
// Point IBR_BASE_URL at the Integrated Beneficiary Registry implementation under test
// (registry-side endpoints) and SP_BASE_URL at the SP-MIS implementation receiving callbacks
// (on-search, notify, ...). Both default to the bundled Mockoon mocks.

const withSlash = (url) => (url.endsWith('/') ? url : `${url}/`);

export const ibrBaseUrl = withSlash(process.env.IBR_BASE_URL || 'http://127.0.0.1:3333/');
export const spBaseUrl = withSlash(process.env.SP_BASE_URL || 'http://127.0.0.1:3334/');

// Local listener used as header.sender_uri for async flows, so the callbacks the
// IBR sends (on-search, on-subscribe, ...) can be captured and validated.
export const callbackPort = Number(process.env.CALLBACK_PORT || 3335);
export const callbackBaseUrl = withSlash(
  process.env.CALLBACK_BASE_URL || `http://127.0.0.1:${callbackPort}/`,
);

export const defaultResponseTime = Number(process.env.RESPONSE_TIMEOUT_MS || 15000);
export const defaultExpectedResponseTime = defaultResponseTime;
export const callbackTimeout = Number(process.env.CALLBACK_TIMEOUT_MS || 10000);

// Optional bearer token (spec security scheme: Authorization: Bearer <jwt>).
export const authToken = process.env.AUTH_TOKEN || '';

export const senderId = process.env.SENDER_ID || 'spmis.example.org';
export const receiverId = process.env.RECEIVER_ID || 'ibr.example.org';

export const acceptHeader = {
  key: 'Accept',
  value: 'application/json',
};
export const contentTypeHeader = {
  key: 'content-type',
  value: 'application/json; charset=utf-8',
};

// Every endpoint of the DCI Integrated Beneficiary Registry v1.0.0 API.
//  side          : which system exposes it (ibr = beneficiary registry, sp = SP-MIS / subscriber)
//  requestSchema : envelope schema the request must conform to
//  responseSchema: schema of the synchronous HTTP response
//  callback      : for async endpoints, the callback the IBR must send to header.sender_uri
export const endpoints = {
  'search': {
    side: 'ibr', path: 'ibr/search', action: 'search',
    requestSchema: 'search', responseSchema: 'ack',
    callback: { path: 'ibr/on-search', action: 'on-search', schema: 'on-search' },
  },
  'sync search': {
    side: 'ibr', path: 'ibr/sync/search', action: 'search',
    requestSchema: 'search', responseSchema: 'sync-search-response',
  },
  'subscribe': {
    side: 'ibr', path: 'ibr/subscribe', action: 'subscribe',
    requestSchema: 'subscribe', responseSchema: 'ack',
    callback: { path: 'ibr/on-subscribe', action: 'on-subscribe', schema: 'on-subscribe' },
  },
  'unsubscribe': {
    side: 'ibr', path: 'ibr/unsubscribe', action: 'unsubscribe',
    requestSchema: 'unsubscribe', responseSchema: 'ack',
    callback: { path: 'ibr/on-unsubscribe', action: 'on-unsubscribe', schema: 'on-unsubscribe' },
  },
  'txn status': {
    side: 'ibr', path: 'ibr/txn/status', action: 'txn-status',
    requestSchema: 'txn-status', responseSchema: 'ack',
    callback: { path: 'ibr/txn/on-status', action: 'txn-on-status', schema: 'txn-on-status' },
  },
  'sync txn status': {
    side: 'ibr', path: 'ibr/sync/txn/status', action: 'txn-status',
    requestSchema: 'txn-status', responseSchema: 'sync-txn-status-response',
  },
  // PRS.IBR.01: is a beneficiary enrolled in a programme (minimal yes / no answer).
  'enrolled': {
    side: 'ibr', path: 'ibr/sync/enrolled', action: 'search',
    requestSchema: 'enrolled', responseSchema: 'enrolled-response',
  },
  // PRS.IBR.02 / PRS.IBR.03: the SP-MIS publishes beneficiaries, benefits and status changes.
  'enrollment updates': {
    side: 'ibr', path: 'ibr/sync/enrollment/updates', action: 'notify',
    requestSchema: 'enrollment-updates', responseSchema: 'enrollment-updates-response',
  },
  'on-search': {
    side: 'sp', path: 'ibr/on-search', action: 'on-search',
    requestSchema: 'on-search', responseSchema: 'ack',
  },
  'on-subscribe': {
    side: 'sp', path: 'ibr/on-subscribe', action: 'on-subscribe',
    requestSchema: 'on-subscribe', responseSchema: 'ack',
  },
  'on-unsubscribe': {
    side: 'sp', path: 'ibr/on-unsubscribe', action: 'on-unsubscribe',
    requestSchema: 'on-unsubscribe', responseSchema: 'ack',
  },
  'txn on-status': {
    side: 'sp', path: 'ibr/txn/on-status', action: 'txn-on-status',
    requestSchema: 'txn-on-status', responseSchema: 'ack',
  },
  'notify': {
    side: 'sp', path: 'ibr/notify', action: 'notify',
    requestSchema: 'notify', responseSchema: 'ack',
  },
};

export const endpointUrl = (name) => {
  const endpoint = endpoints[name];
  if (!endpoint) throw new Error(`Unknown endpoint "${name}". Known: ${Object.keys(endpoints).join(', ')}`);
  return (endpoint.side === 'ibr' ? ibrBaseUrl : spBaseUrl) + endpoint.path;
};

// Kept for backwards compatibility with the previous helper exports.
export const localhost = ibrBaseUrl;
export const searchEndpoint = endpoints['sync search'].path;
export const asyncsearchEndpoint = endpoints.search.path;
export const subscribeEndpoint = endpoints.subscribe.path;
export const unsubscribeEndpoint = endpoints.unsubscribe.path;
export const txnstatusEndpoint = endpoints['sync txn status'].path;
export const asynctxnstatusEndpoint = endpoints['txn status'].path;
export const enrolledEndpoint = endpoints.enrolled.path;
export const enrollmentUpdatesEndpoint = endpoints['enrollment updates'].path;
export const onsearchEndpoint = endpoints['on-search'].path;
export const onsubscribeEndpoint = endpoints['on-subscribe'].path;
export const onunsubscribeEndpoint = endpoints['on-unsubscribe'].path;
export const ontxnstatusEndpoint = endpoints['txn on-status'].path;
export const notifyEndpoint = endpoints.notify.path;
