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
