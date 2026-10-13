@method=POST @endpoint=ibr/sync/enrollment/updates
Feature: Publish beneficiaries, benefits and status changes to the IBR (POST /registry/sync/enrollment/updates)

PRS.IBR.02: after each delivery of benefits (monthly, quarterly, ad hoc) the SP-MIS publishes
to the IBR, as one batch, which benefits were provided to which beneficiaries, for every
benefit type (cash, voucher, in-kind, training, work opportunity, insurance) and for
individual and household beneficiaries.
PRS.IBR.03: the SP-MIS informs the IBR, as a batch, when the enrolment status of a
beneficiary changes (death, graduation, suspension).
The IBR confirms receipt of the published data (PRS.IBR.02.6, PRS.IBR.03.4) with an
EnrollmentUpdatesResponse.

The request is an EnrollmentUpdatesRequest (enrolled_updates.beneficiaries: Beneficiary
records) under a callback header with action "notify", as the spec defines it. Every
published beneficiary is first checked against the IBR data rules; the IBR must refuse
beneficiaries whose data breaks them (@strict-data).

  Background:
    Given the "enrollment updates" endpoint

  @smoke
  Scenario: Successfully publish the benefits of a household beneficiary
    Given an enrolment update of type "enrollement" publishing the Beneficiary records "household"
    Then the request should be a valid "enrollment-updates" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid "enrollment-updates-response" message
    And every published beneficiary should be acknowledged

  # ---------------------------------------------------------------------------
  # PRS.IBR.02: beneficiaries and the benefits they received
  # ---------------------------------------------------------------------------
  @functional
  Scenario Outline: Publishing the <profile> beneficiary (<case>) is acknowledged
    Given an enrolment update of type "enrollement" publishing the Beneficiary records "<profile>"
    Then the request should be a valid "enrollment-updates" message
    When the request is sent
    Then the response should be a valid "enrollment-updates-response" message
    And every published beneficiary should be acknowledged

    Examples:
      | profile    | case                                                         |
      | household  | household, cash benefits, every Beneficiary attribute        |
      | individual | individual, cash benefit, enrollment_* spelling              |
      | in-kind    | in-kind, voucher and insurance benefits for a child          |
      | graduated  | training and work opportunity benefits                       |
      | minimal    | a member reference only                                      |

  @functional
  Scenario: Every benefit type is published in one batch (PRS.IBR.02.3, PRS.IBR.02.5)
    Given an enrolment update of type "enrollement" publishing the Beneficiary records "household, individual, in-kind, graduated"
    Then the request should be a valid "enrollment-updates" message
    When the request is sent
    Then the response should be a valid "enrollment-updates-response" message
    And every published beneficiary should be acknowledged

  @functional
  Scenario: A publication without a receipt type is acknowledged (receipt_type is optional)
    Given an enrolment update publishing the Beneficiary records "household, individual"
    Then the request should be a valid "enrollment-updates" message
    When the request is sent
    Then the response should be a valid "enrollment-updates-response" message
    And every published beneficiary should be acknowledged

  # ---------------------------------------------------------------------------
  # PRS.IBR.03: enrolment status changes (death, graduation, suspension)
  # ---------------------------------------------------------------------------
  @functional
  Scenario Outline: A <change> is published and acknowledged
    Given an enrolment update of type "<receipt type>" publishing the Beneficiary records "<profile>"
    Then the request should be a valid "enrollment-updates" message
    When the request is sent
    Then the response should be a valid "enrollment-updates-response" message
    And every published beneficiary should be acknowledged

    Examples:
      | change                         | receipt type              | profile   |
      | death                          | enrollement_status_change | deceased  |
      | graduation                     | enrollement_status_change | graduated |
      | suspension of a family         | enrollement_status_change | suspended |
      | death (correct spelling)       | enrollment_status_change  | deceased  |

  @functional
  Scenario: Status changes are published as one batch for every affected beneficiary (PRS.IBR.03.3)
    Given an enrolment update of type "enrollement_status_change" publishing the Beneficiary records "deceased, graduated, suspended"
    Then the request should be a valid "enrollment-updates" message
    When the request is sent
    Then the response should be a valid "enrollment-updates-response" message
    And every published beneficiary should be acknowledged

  @functional
  Scenario Outline: An individual or household status change is acknowledged: <case>
    Given an enrolment update publishing the "<profile>" Beneficiary record with "<attribute>" set to '<value>'
    Then the request should be a valid "enrollment-updates" message
    When the request is sent
    Then the response should be a valid "enrollment-updates-response" message
    And every published beneficiary should be acknowledged

    Examples:
      | case                                 | profile    | attribute          | value                         |
      | household suspended                  | household  | enrolment_status   | "4"                           |
      | household graduated                  | household  | enrolment_status   | "3"                           |
      | individual suspended                 | individual | enrollment_status  | "4"                           |
      | status change dates listed           | household  | status_change_date | ["2022-02-01", "2025-06-30"]  |

  # ---------------------------------------------------------------------------
  # Requests that break the spec must be refused
  # ---------------------------------------------------------------------------
  @negative
  Scenario Outline: An invalid enrolment update is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples: Envelope and header (callback header, action "notify")
      | case                   | field              | value       |
      | missing header         | header             | <removed>   |
      | missing message        | message            | <removed>   |
      | wrong action           | header.action      | "register"  |
      | missing header status  | header.status      | <removed>   |
      | unknown header status  | header.status      | "done"      |
      | missing message_id     | header.message_id  | <removed>   |
      | invalid message_ts     | header.message_ts  | "now"       |

    Examples: EnrollmentUpdatesRequest
      | case                          | field                                 | value                  |
      | missing transaction_id        | message.transaction_id                | <removed>              |
      | missing enrolled_updates      | message.enrolled_updates              | <removed>              |
      | receipt_information instead   | message                               | {"transaction_id":"TXN1","receipt_information":{"beneficiaries":[]}} |
      | missing beneficiaries         | message.enrolled_updates.beneficiaries | <removed>             |
      | empty beneficiaries           | message.enrolled_updates.beneficiaries | []                    |
      | beneficiaries not a list      | message.enrolled_updates.beneficiaries | {"assistance_unit":"1"} |
      | unknown receipt type          | message.enrolled_updates.receipt_type | "register"             |

    @strict-data
    Examples: Beneficiary data that breaks the IBR data standard
      | case                            | field                                                                  | value             |
      | assistance unit as a label      | message.enrolled_updates.beneficiaries.0.assistance_unit               | "household"       |
      | enrolment status as a label     | message.enrolled_updates.beneficiaries.0.enrolment_status              | "Active"          |
      | enrolment date not ISO 8601     | message.enrolled_updates.beneficiaries.0.enrolment_date                | "02.02.2024"      |
      | programmes not a list           | message.enrolled_updates.beneficiaries.0.programme_identifier          | {"programme_name":"Child Support Grant","programme_identifier":"DCI001"} |
      | programme without identifier    | message.enrolled_updates.beneficiaries.0.programme_identifier.0.programme_identifier | <removed> |
      | programme type out of the list  | message.enrolled_updates.beneficiaries.0.programme_identifier.0.programme_type | "15"      |
      | benefit type as a label         | message.enrolled_updates.beneficiaries.0.benefits.0.benefit_type       | "Cash"            |
      | benefit value with a currency   | message.enrolled_updates.beneficiaries.0.benefits.0.benefit_value      | "USD 50"          |
      | status change date not a list   | message.enrolled_updates.beneficiaries.0.status_change_date            | "2022-02-01"      |
      | member identifier as a string   | message.enrolled_updates.beneficiaries.0.member.member_identifier      | "M100000001"      |
      | member marital status label     | message.enrolled_updates.beneficiaries.0.member.marital_status         | "married"         |
      | person sex as a label           | message.enrolled_updates.beneficiaries.0.member.demographic_info.sex   | "F"               |
      | group size as text              | message.enrolled_updates.beneficiaries.0.group.group_size              | "4"               |
      | frequency not an RRULE value    | message.enrolled_updates.beneficiaries.0.programme_identifier.0.benefit_frequency.0.freq | "Monthly" |

  @negative
  Scenario: A body that is not JSON is rejected
    When the raw body "beneficiaries" is sent
    Then the request should be rejected according to the DCI error model
