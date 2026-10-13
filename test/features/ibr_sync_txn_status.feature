@method=POST @endpoint=ibr/sync/txn/status
Feature: Synchronous transaction status check (POST /registry/sync/txn/status)

This API is exposed by the IBR and called by SP systems or other registries.
The response carries a callback header (action "txn-on-status") and a
TxnStatusResponse whose txn_status matches the requested txn_type: a SearchResponse for
a search, a SubscribeResponse for a subscription, a ReceiptRequest (the published
beneficiaries) for a receipt.

  Background:
    Given the "sync txn status" endpoint

  @smoke
  Scenario: Successfully get the status of a search transaction
    Given a transaction status request for "search" transactions by "transaction_id"
    Then the request should be a valid "txn-status" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid "sync-txn-status-response" message
    And the transaction status should be reported for a "search" transaction
    And every returned record should be valid IBR data

  @functional
  Scenario Outline: Status of a <txn type> transaction looked up by <attribute type>
    Given a transaction status request for "<txn type>" transactions by "<attribute type>"
    Then the request should be a valid "txn-status" message
    When the request is sent
    Then the response should be a valid "sync-txn-status-response" message
    And the transaction status should be reported for a "<txn type>" transaction
    And every returned record should be valid IBR data

    Examples:
      | txn type  | attribute type    |
      | search    | transaction_id    |
      | search    | reference_id_list |
      | search    | correlation_id    |
      | subscribe | transaction_id    |
      | subscribe | correlation_id    |
      | receipt   | transaction_id    |
      | receipt   | reference_id_list |

  @functional
  Scenario: The status of a search transaction carries valid beneficiary data
    Given a transaction status request for "search" transactions by "transaction_id"
    When the request is sent
    Then the response should be a valid "sync-txn-status-response" message
    And at least 1 record should be returned
    And every returned record should be a Beneficiary record
    And every returned record should be valid IBR data

  @functional
  Scenario: The receipt of published beneficiaries carries valid beneficiary data (PRS.IBR.00.6)
    Given a transaction status request for "receipt" transactions by "transaction_id"
    When the request is sent
    Then the response should be a valid "sync-txn-status-response" message
    And at least 1 record should be returned
    And every returned record should be a Beneficiary record
    And every returned record should be valid IBR data

  @negative
  Scenario Outline: An invalid sync transaction status request is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                             | field                                     | value      |
      | missing header                   | header                                    | <removed>  |
      | wrong action                     | header.action                             | "search"   |
      | missing message                  | message                                   | <removed>  |
      | missing transaction_id           | message.transaction_id                    | <removed>  |
      | unknown txn_type                 | message.txnstatus_request.txn_type        | "disburse" |
      | unknown attribute_type           | message.txnstatus_request.attribute_type  | "uin"      |
      | missing attribute_value          | message.txnstatus_request.attribute_value | <removed>  |
      | reference_id_list given a string | message.txnstatus_request                 | {"reference_id":"R1","txn_type":"receipt","attribute_type":"reference_id_list","attribute_value":"R1"} |

  @negative
  Scenario: A body that is not JSON is rejected
    When the raw body "<xml/>" is sent
    Then the request should be rejected according to the DCI error model
