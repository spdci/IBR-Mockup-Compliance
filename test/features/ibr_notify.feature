@method=POST @endpoint=ibr/notify
Feature: Receive enrolment notifications from the IBR (POST /registry/notify)

This API is exposed by the subscriber (SP-MIS, other registries). The IBR calls it when a
subscribed event occurs: a new enrolment (enrollement) or a change of enrolment status
(enrollement_status_change: death, graduation, suspension), so that other schemes can
review eligibility (PRS.IBR.03.5). The suite plays the IBR: every notification is first
checked against the spec (including the IBR data rules of the beneficiaries, members,
groups and persons it carries), then the subscriber must acknowledge it.

  Background:
    Given the "notify" endpoint

  @smoke
  Scenario: Successfully receive a beneficiary status change
    Given a notify request for a "enrollement_status_change" event carrying the "suspended" Beneficiary record
    Then the request should be a valid "notify" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: A "<event>" notification carrying the <profile> <type> record is acknowledged
    Given a notify request for a "<event>" event carrying the "<profile>" <type> record
    Then the request should be a valid "notify" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: New enrolments (enrollement)
      | event       | type        | profile    |
      | enrollement | Beneficiary | household  |
      | enrollement | Beneficiary | individual |
      | enrollement | Beneficiary | in-kind    |
      | enrollement | Beneficiary | minimal    |
      | enrollement | Member      | full       |
      | enrollement | Group       | full       |
      | enrollement | IBRPerson   | full       |

    Examples: Enrolment status changes (enrollement_status_change: death, graduation, suspension)
      | event                     | type        | profile   |
      | enrollement_status_change | Beneficiary | deceased  |
      | enrollement_status_change | Beneficiary | graduated |
      | enrollement_status_change | Beneficiary | suspended |
      | enrollement_status_change | Member      | deceased  |
      | enrollement_status_change | Group       | large     |
      | enrollement_status_change | IBRPerson   | deceased  |

    Examples: Event type spellings (process flows, namespaced spec example)
      | event                                                    | type        | profile   |
      | enrollment                                               | Beneficiary | household |
      | enrollment_status_change                                 | Beneficiary | deceased  |
      | spdci-common:RegistryEventType:enrollement               | Member      | single    |
      | spdci-common:RegistryEventType:enrollement_status_change | Beneficiary | graduated |

  @functional
  Scenario Outline: reg_records may be a single <type> object, as declared in the spec
    Given a notify request for a "enrollement_status_change" event carrying the "<profile>" <type> record as a single object
    Then the request should be a valid "notify" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | type        | profile   |
      | Beneficiary | deceased  |
      | Member      | full      |
      | Group       | full      |
      | IBRPerson   | deceased  |

  @functional
  Scenario: A batch notification covers every affected beneficiary (PRS.IBR.03.3, PRS.IBR.03.5)
    Given a batch notify request for "enrollement_status_change" events carrying "Beneficiary:deceased, Beneficiary:graduated, Beneficiary:suspended, Member:deceased"
    Then the request should be a valid "notify" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

  @negative
  Scenario Outline: An invalid notification is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples: Envelope and event
      | case                    | field                                       | value          |
      | missing header          | header                                      | <removed>      |
      | wrong action            | header.action                               | "on-search"    |
      | missing header status   | header.status                               | <removed>      |
      | missing transaction_id  | message.transaction_id                      | <removed>      |
      | missing notify_event    | message.notify_event                        | <removed>      |
      | empty notify_event      | message.notify_event                        | []             |
      | missing reference_id    | message.notify_event.0.reference_id         | <removed>      |
      | missing timestamp       | message.notify_event.0.timestamp            | <removed>      |
      | missing data            | message.notify_event.0.data                 | <removed>      |
      | missing reg_record_type | message.notify_event.0.data.reg_record_type | <removed>      |
      | unknown reg_record_type | message.notify_event.0.data.reg_record_type | "Programme"    |
      | missing reg_records     | message.notify_event.0.data.reg_records     | <removed>      |
      | an SR event             | message.notify_event.0.data.reg_event_type  | "REGISTER"     |
      | unknown IBR event       | message.notify_event.0.data.reg_event_type  | "graduation"   |
      | invalid locale          | message.notify_event.0.locale               | "en-GB"        |

    @strict-data
    Examples: IBR data in the notification
      | case                            | field                                                                    | value          |
      | enrolment status as a label     | message.notify_event.0.data.reg_records.0.enrolment_status               | "Suspended"    |
      | assistance unit as a label      | message.notify_event.0.data.reg_records.0.assistance_unit                | "family"       |
      | status change date not a list   | message.notify_event.0.data.reg_records.0.status_change_date             | "2025-07-01"   |
      | programme without a name        | message.notify_event.0.data.reg_records.0.programme_identifier.0.programme_name | <removed> |
      | benefit value with a currency   | message.notify_event.0.data.reg_records.0.benefits.0.benefit_value       | "USD 50"       |
      | group type as a label           | message.notify_event.0.data.reg_records.0.group.group_type               | "family"       |
      | member marital status label     | message.notify_event.0.data.reg_records.0.member.marital_status          | "widowed"      |
      | person birth_date format        | message.notify_event.0.data.reg_records.0.member.demographic_info.birth_date | "05-05-1950" |
      | member records with bad sex     | message.notify_event.0.data                                              | {"reg_event_type":"enrollement","reg_record_type":"Member","reg_records":[{"demographic_info":{"sex":"Male"}}]} |
