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
export const searchEndpoint = 'ibr/sync/search';
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
export const enrollmentUpdatesEndpoint = 'ibr/sync/enrollment/updates'
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
export const enrolledEndpoint = 'ibr/sync/enrolled'
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
export const subscribeEndpoint = 'ibr/subscribe'
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
export const unsubscribeEndpoint = 'ibr/unsubscribe'
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


export const asyncsearchEndpoint = 'ibr/search';
export const asyncsearchResponseSchema ={
  type: 'object',
  required: ['transaction_id', 'correlation_id', 'search_response'],
  properties: {
    transaction_id: { type: 'integer' },
    correlation_id: { type: 'string' },
    search_response: {
      type: 'object',
      required: ['status', 'message'],
      properties: {
        status: { type: 'string'},
        message: { type: 'string' }
      }
    }
  }
};


export const onsearchEndpoint= 'ibr/on-search';
export const onsearchResponseSchema = {
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
export const onsearchRequestSchema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "message": {
        "type": "object",
        "properties": {
          "transaction_id": { "type": "integer" },
          "correlation_id": { "type": "string" },
          "search_response": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "reference_id": { "type": "string" },
                "timestamp": { "type": "string" },
                "status": { "type": "string", "enum": ["rcvd", "processed", "failed"] },
                "status_reason_code": { "type": "string" },
                "status_reason_message": { "type": "string" },
                "data": { "type": "object" },
                "pagination": { "type": "object" },
                "locale": { "type": "string", "enum": ["en", "fr", "ar"] }
              }
            }
          }
        },
        "required": ["transaction_id", "correlation_id", "search_response"]
      }
    },
    "required": ["message"]
    
}

export const onsubscribeEndpoint = 'ibr/on-subscribe';
export const onsubscribeResponseSchema =  {
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

export const onunsubscribeEndpoint = 'ibr/on-unsubscribe';
export const onunsubscribeResponseSchema =  {
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

export const txnstatusEndpoint = 'ibr/sync/txn/status';
export const txnstatusResponseSchema = {
  type: 'object',
  required: ['transaction_id', 'correlation_id', 'txnstatus_response'],
  properties: {
    transaction_id: { type: 'integer' },
    correlation_id: { type: 'string' },
    txnstatus_response: {
      type: 'object',
      properties: {
        transaction_id: { type: 'integer' },
        correlation_id: { type: 'string', maxLength: 99 },
      }
    },
  }
};

export const asynctxnstatusEndpoint = 'ibr/txn/status';
export const asynctxnstatusResponseSchema =  {
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

export const ontxnstatusEndpoint = 'ibr/txn/on-status';
export const ontxnstatusResponseSchema =  {
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
