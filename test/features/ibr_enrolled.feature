@method=POST @endpoint=ibr/sync/enrolled
Feature: Check whether a beneficiary is enrolled in a programme (POST /registry/sync/enrolled)

PRS.IBR.01: an SP-MIS queries the IBR to verify whether a person, a member or a household
is enrolled in a specific programme before enrolling it in its own scheme. The IBR answers
with a minimal yes / no per beneficiary (EnrolledResponse.enrolled_status), never with the
beneficiary's records (data minimisation, PRS.IBR.01.2). Queries can be made at individual
(member) level and at group / household level, for a batch of potential beneficiaries, and
once per programme.

The request carries an EnrolledRequest: enrolled_criteria with a query_type, a
response_entity (Group or Member) and a query. The suite uses the spec's expression form:
  { "member_identifier": { "eq": "M100000001" }, "programme_identifier": { "eq": "DCI001" } }
with "in" for batches, plus the idtype-value and predicate forms.

  Background:
    Given the "enrolled" endpoint

  @smoke
  Scenario: Successfully check that a member is enrolled in a programme
    Given an enrolment check of the "full" Member in the "child grant" programme
    Then the request should be a valid "enrolled" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid "enrolled-response" message
    And every enrolment answer should have status "succ"
    And the enrolment check should answer 1 item
    And the enrolled status should be "yes"
    And the enrolment answer should disclose no beneficiary data

  # ---------------------------------------------------------------------------
  # PRS.IBR.01.1, 01.3, 01.4, 01.6: individual and household level, one programme at a time
  # ---------------------------------------------------------------------------
  @functional @mock
  Scenario Outline: The <type> "<profile>" is reported "<expected>" for the <programme> programme
    Given an enrolment check of the "<profile>" <type> in the "<programme>" programme
    Then the request should be a valid "enrolled" message
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And every enrolment answer should have status "succ"
    And the enrolment check should answer 1 item
    And the enrolled status should be "<expected>"
    And the enrolment answer should disclose no beneficiary data

    Examples: Individual level (member, PRS.IBR.01.3)
      | type   | profile  | programme      | expected |
      | Member | full     | child grant    | yes      |
      | Member | widow    | pension        | yes      |
      | Member | disabled | school feeding | yes      |
      | Member | minimal  | child grant    | no       |
      | Member | unknown  | child grant    | no       |

    Examples: Individual level (person identifier)
      | type      | profile  | programme   | expected |
      | IBRPerson | full     | child grant | yes      |
      | IBRPerson | newborn  | school feeding | yes   |
      | IBRPerson | deceased | pension     | no       |
      | IBRPerson | unknown  | pension     | no       |

    Examples: Group / household level (PRS.IBR.01.4)
      | type  | profile | programme   | expected |
      | Group | full    | child grant | yes      |
      | Group | large   | child grant | no       |
      | Group | minimal | child grant | no       |
      | Group | unknown | child grant | no       |

    Examples: One request per programme (PRS.IBR.01.6)
      | type   | profile | programme      | expected |
      | Member | full    | pension        | no       |
      | Member | widow   | child grant    | no       |
      | Member | single  | public works   | no       |
      | Member | full    | unknown        | no       |

  @functional @mock
  Scenario Outline: Enrolment in any programme: the <type> "<profile>" is reported "<expected>"
    Given an enrolment check of the "<profile>" <type> in any programme
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And the enrolled status should be "<expected>"

    Examples:
      | type   | profile | expected |
      | Member | full    | yes      |
      | Member | widow   | yes      |
      | Member | single  | no       |
      | Group  | full    | yes      |
      | Group  | large   | no       |

  @functional
  Scenario Outline: The answer for the <type> "<profile>" is a coded yes / no
    Given an enrolment check of the "<profile>" <type> in the "child grant" programme
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And the enrolled status should be "yes" or "no"
    And the enrolment answer should disclose no beneficiary data

    Examples:
      | type      | profile  |
      | Member    | full     |
      | Member    | deceased |
      | IBRPerson | child    |
      | Group     | single   |

  # ---------------------------------------------------------------------------
  # PRS.IBR.01.5: a batch of potential beneficiaries in one request
  # ---------------------------------------------------------------------------
  @functional
  Scenario Outline: A batch check of <count> <type> records answers every one of them
    Given a batch enrolment check of the <type> records "<records>" in the "child grant" programme
    Then the request should be a valid "enrolled" message
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And every enrolment answer should have status "succ"
    And the enrolment check should answer <count> items
    And the enrolled status should be "yes" or "no"
    And the enrolment answer should disclose no beneficiary data

    Examples:
      | type      | records                         | count |
      | Member    | full, widow, minimal, unknown   | 4     |
      | IBRPerson | full, newborn, deceased         | 3     |
      | Group     | full, large                     | 2     |

  @functional @mock
  Scenario Outline: A batch of <expected> beneficiaries is answered "<expected>" for each of them
    Given a batch enrolment check of the <type> records "<records>" in the "<programme>" programme
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And the enrolment check should answer <count> items
    And the enrolled status should be "<expected>"

    Examples:
      | type   | records                    | programme   | count | expected |
      | Member | full, by person identifier | child grant | 2     | yes      |
      | Member | minimal, unknown, single   | child grant | 3     | no       |

  # ---------------------------------------------------------------------------
  # Other query forms of the spec
  # ---------------------------------------------------------------------------
  @functional
  Scenario Outline: An idtype-value enrolment check of the <type> "<profile>" is answered
    Given an enrolment check of the "<profile>" <type> by identifier
    Then the request should be a valid "enrolled" message
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And every enrolment answer should have status "succ"
    And the enrolled status should be "yes" or "no"
    And the enrolment answer should disclose no beneficiary data

    Examples:
      | type      | profile |
      | Member    | full    |
      | IBRPerson | full    |
      | Group     | full    |

  @functional
  Scenario: A predicate enrolment check (process flow 2 form) is answered
    Given an enrolment check of the "example person" IBRPerson written as a predicate
    Then the request should be a valid "enrolled" message
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And the enrolled status should be "yes" or "no"
    And the enrolment answer should disclose no beneficiary data

  @functional
  Scenario: The query of the EnrolledCriteria example is answered
    Given an enrolment check of the "full" IBRPerson in the "child grant" programme written as in the spec example
    Then the request should be a valid "enrolled" message
    When the request is sent
    Then the response should be a valid "enrolled-response" message
    And the enrolled status should be "yes" or "no"
    And the enrolment answer should disclose no beneficiary data

  @functional
  Scenario Outline: The <entity> response entity is accepted
    Given an enrolment check of the "full" Member in the "child grant" programme
    And the enrolment check asks for the "<entity>" response entity
    Then the request should be a valid "enrolled" message
    When the request is sent
    Then the response should be a valid "enrolled-response" message

    Examples:
      | entity      |
      | Member      |
      | Group       |
      | Beneficiary |

  # ---------------------------------------------------------------------------
  # Requests that break the spec must be refused
  # ---------------------------------------------------------------------------
  @negative
  Scenario Outline: An invalid enrolment check is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples: Envelope and header
      | case                 | field              | value        |
      | missing header       | header             | <removed>    |
      | missing message      | message            | <removed>    |
      | wrong action         | header.action      | "enrolled"   |
      | missing message_id   | header.message_id  | <removed>    |
      | missing sender_id    | header.sender_id   | <removed>    |
      | missing total_count  | header.total_count | <removed>    |
      | invalid message_ts   | header.message_ts  | "2026-10-13" |

    Examples: EnrolledRequest
      | case                               | field                                     | value                                 |
      | missing transaction_id             | message.transaction_id                    | <removed>                             |
      | missing enrolled_criteria          | message.enrolled_criteria                 | <removed>                             |
      | enrolled_criteria not an object    | message.enrolled_criteria                 | "member M100000001"                   |
      | missing query_type                 | message.enrolled_criteria.query_type      | <removed>                             |
      | unknown query_type                 | message.enrolled_criteria.query_type      | "sql"                                 |
      | missing query                      | message.enrolled_criteria.query           | <removed>                             |
      | empty query                        | message.enrolled_criteria.query           | {}                                    |
      | query not an object                | message.enrolled_criteria.query           | "M100000001"                          |
      | unknown response_entity            | message.enrolled_criteria.response_entity | "Household"                           |
      | idtype-value query without value   | message.enrolled_criteria                 | {"query_type":"idtype-value","query":{"type":"UIN"}} |
      | predicate query without operator   | message.enrolled_criteria                 | {"query_type":"predicate","query":{"attribute_name":"member_identifier","attribute_value":"M1"}} |
      | predicate query unknown operator   | message.enrolled_criteria                 | {"query_type":"predicate","query":{"attribute_name":"member_identifier","operator":"like","attribute_value":"M1"}} |

  @negative
  Scenario: A body that is not JSON is rejected
    When the raw body "enrolled?" is sent
    Then the request should be rejected according to the DCI error model
