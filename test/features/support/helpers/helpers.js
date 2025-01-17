export const localhost = 'http://127.0.0.1:3333/';
export const defaultResponseTime = 15000;
export const defaultExpectedResponseTime = 15000;
export const acceptHeader = {
  key: 'Accept',
  value: 'application/json',
};
export const contentTypeHeader = {
  key: 'content-type',
  value: 'application/json; charset=utf-8',
};
export const searchEndpoint = 'sync/search';
export const searchResponseSchema = {
  type: 'object',
  required: ['reference_id', 'status', 'data', 'locale'],
  properties: {
    reference_id: { type: 'string' },
    timestamp: { type: 'string' },
    status: { type: 'string' },
    status_reason_code: { type: 'string' },
    status_reason_message: { type: 'string' },
    data: {
      type: 'object',
      required: ['version', 'reg_records'],
      properties: {
        version: { type: 'string' },
        reg_records: { type: 'array' },
      },
    },
    pagination: { type: 'object' },
    locale: { type: 'string' },
  },
};
export const enrollmentUpdatesEndpoint = 'sync/enrollment/updates'
export const enrollmentUpdatesResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'error', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};
export const enrolledEndpoint = 'sync/enrolled'
export const enrolledResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'error', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};