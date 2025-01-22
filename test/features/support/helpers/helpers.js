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
export const subscribeEndpoint = 'subscribe'
export const subscribeResponseSchema = {
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
export const unsubscribeEndpoint = 'unsubscribe'
export const unsubscribeResponseSchema = {
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

// Define the schema for validation
export const regRecordsSchema = {
    type: "object",
    properties: {
      assistance_unit: { type: "string" },
      member: {
        type: "object",
        properties: {
          "@type": { type: "string", const: "Member" },
          member_identifier: {
            type: "array",
            items: {
              type: "object",
              properties: {
                identifier_type: { type: "string" },
                identifier_value: { type: "string" }
              }
            }
          },
          demographic_info: {
            type: "object",
            properties: {
              "@type": { type: "string", const: "Person" },
              identifier: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    "@type": { type: "string", const: "Identifier" },
                    identifier_type: { type: "string" },
                    identifier_value: { type: "string" }
                  }
                }
              },
              name: {
                type: "object",
                properties: {
                  "@type": { type: "string", const: "Name" },
                  surname: { type: "string" },
                  given_name: { type: "string" },
                  prefix: { type: "string" },
                  suffix: { type: "string" }
                }
              },
              sex: { type: "string", enum: ["male", "female", "other"] },
              birth_date: { type: "string", format: "date" }
            }
          }
        }
      },
      programme_identifier: {
        type: "array",
        items: {
          type: "object",
          properties: {
            programme_name: { type: "string" },
            programme_code: { type: "string" }
          }
        }
      },
      enrollment_date: { type: "string", format: "date-time" },
      enrollment_status: { type: "string", enum: ["active", "inactive"] },
      status_change_date: {
        type: "array",
        items: { type: "string", format: "date-time" }
      },
      benefits: {
        type: "array",
        items: {
          type: "object",
          properties: {
            benefit_name: { type: "string" },
            benefit_amount: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
            currency: { type: "string" },
            date_received: { type: "string", format: "date" }
          }
        }
      }
    }
};

