@method=POST @endpoint=ibr/subscribe
Feature: Subscribe to Integrated Beneficiary Registry events (POST /registry/subscribe)

This API is exposed by the IBR and called by SP-MIS systems or other registries that want
to be alerted when beneficiaries are enrolled or when their enrolment status changes
(PRS.IBR.03.5: alert other SP-MIS when a change affects eligibility in other schemes).
The subscriber names the IBR event (RegistryEventType: enrollement,
enrollement_status_change), the record type to be notified with and the beneficiaries to
watch (filter). The IBR acknowledges the request and delivers the subscription result
(SubscribeResponse with subscription codes) to the on-subscribe callback.

  Background:
    Given the "subscribe" endpoint

  @smoke
  Scenario: A subscription to enrolment status changes is acknowledged
    Given a subscribe request for "enrollement_status_change" events on Beneficiary records filtered by "idtype-value"
    Then the request should be a valid "subscribe" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: Subscription to "<event>" events on <type> records filtered by <filter type> is acknowledged
    Given a subscribe request for "<event>" events on <type> records filtered by "<filter type>"
    Then the request should be a valid "subscribe" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: Record types
      | event                     | type        | filter type  |
      | enrollement               | Beneficiary | idtype-value |
      | enrollement               | Member      | idtype-value |
      | enrollement               | Group       | idtype-value |
      | enrollement_status_change | Beneficiary | idtype-value |
      | enrollement_status_change | Member      | idtype-value |
      | enrollement_status_change | IBRPerson   | idtype-value |

    Examples: Filter types (common QueryType)
      | event                     | type        | filter type |
      | enrollement               | Beneficiary | predicate   |
      | enrollement               | Beneficiary | expression  |
      | enrollement_status_change | Beneficiary | graphql     |

    Examples: Event type spellings (spec enum, process flows, namespaced spec example)
      | event                                                  | type        | filter type  |
      | enrollment                                             | Beneficiary | idtype-value |
      | enrollment_status_change                               | Member      | idtype-value |
      | spdci-common:RegistryEventType:enrollement             | Beneficiary | predicate    |
      | spdci-common:RegistryEventType:enrollement_status_change | Group     | idtype-value |

  @functional
  Scenario: A batch subscription for several record types is acknowledged
    Given a subscribe request for "enrollement_status_change" events on the record types "Beneficiary, Member, Group, IBRPerson"
    Then the request should be a valid "subscribe" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

  # ---------------------------------------------------------------------------
  # Full async round trip
  # ---------------------------------------------------------------------------
  @callback
  Scenario Outline: The subscription result for "<event>" on <type> records is delivered to the on-subscribe callback
    Given a subscribe request for "<event>" events on <type> records filtered by "idtype-value"
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-subscribe" callback should be received
    And the callback should be a valid "on-subscribe" message
    And every subscription should be confirmed with a subscription code
    And every subscription should echo the requested event and record type

    Examples:
      | event                     | type        |
      | enrollement               | Beneficiary |
      | enrollement_status_change | Beneficiary |
      | enrollement_status_change | Member      |
      | enrollement               | Group       |

  @callback
  Scenario: Every item of a batch subscription is confirmed in the on-subscribe callback
    Given a subscribe request for "enrollement" events on the record types "Beneficiary, Member, Group"
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-subscribe" callback should be received
    And the callback should be a valid "on-subscribe" message
    And every subscription should be confirmed with a subscription code
    And every subscription should echo the requested event and record type

  # ---------------------------------------------------------------------------
  # Requests that break the spec must be refused
  # ---------------------------------------------------------------------------
  @negative
  Scenario Outline: An invalid subscription is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                         | field                                                               | value         |
      | missing header               | header                                                              | <removed>     |
      | wrong action                 | header.action                                                       | "search"      |
      | missing message              | message                                                             | <removed>     |
      | missing transaction_id       | message.transaction_id                                              | <removed>     |
      | empty subscribe_request      | message.subscribe_request                                           | []            |
      | missing subscribe_criteria   | message.subscribe_request.0.subscribe_criteria                      | <removed>     |
      | missing reg_event_type       | message.subscribe_request.0.subscribe_criteria.reg_event_type       | <removed>     |
      | an SR event                  | message.subscribe_request.0.subscribe_criteria.reg_event_type       | "REGISTER"    |
      | Deregister is not in the enum | message.subscribe_request.0.subscribe_criteria.reg_event_type      | "Deregister"  |
      | event in upper case          | message.subscribe_request.0.subscribe_criteria.reg_event_type       | "ENROLLEMENT" |
      | missing filter               | message.subscribe_request.0.subscribe_criteria.filter               | <removed>     |
      | filter not matching type     | message.subscribe_request.0.subscribe_criteria.filter               | [{"expression1":{"attribute_name":"enrolment_status","operator":"eq","attribute_value":"1"}}] |
      | unknown filter_type          | message.subscribe_request.0.subscribe_criteria.filter_type          | "sql"         |
      | missing notify_record_type   | message.subscribe_request.0.subscribe_criteria.notify_record_type   | <removed>     |
      | unknown notify_record_type   | message.subscribe_request.0.subscribe_criteria.notify_record_type   | "Programme"   |
      | frequency without end_time   | message.subscribe_request.0.subscribe_criteria.frequency.end_time   | <removed>     |
      | frequency start not ISO 8601 | message.subscribe_request.0.subscribe_criteria.frequency.start_time | "tomorrow"    |
      | frequency without cron       | message.subscribe_request.0.subscribe_criteria.frequency.frequency  | <removed>     |
      | invalid locale               | message.subscribe_request.0.locale                                  | "en"          |
      | missing reference_id         | message.subscribe_request.0.reference_id                            | <removed>     |
