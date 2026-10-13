@method=POST @endpoint=ibr/on-search
Feature: Receive async search results from the IBR (POST /registry/on-search)

This API is exposed by the SP-MIS to receive search results from the IBR.
The suite plays the IBR: every payload it sends is first checked against the spec
(including the IBR data rules for beneficiaries, persons, members and groups), then the
SP-MIS must acknowledge it.

  Background:
    Given the "on-search" endpoint

  @smoke
  Scenario: Successfully receive async search results from the IBR
    Given an on-search callback carrying the "household" Beneficiary record
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: Results carrying the <profile> <type> record are acknowledged
    Given an on-search callback carrying the "<profile>" <type> record
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: Beneficiaries
      | type        | profile    |
      | Beneficiary | household  |
      | Beneficiary | individual |
      | Beneficiary | graduated  |
      | Beneficiary | suspended  |
      | Beneficiary | deceased   |
      | Beneficiary | in-kind    |
      | Beneficiary | minimal    |

    Examples: Persons
      | type      | profile        |
      | IBRPerson | example person |
      | IBRPerson | full           |
      | IBRPerson | minimal        |
      | IBRPerson | deceased       |
      | IBRPerson | multi          |
      | IBRPerson | newborn        |

    Examples: Members
      | type   | profile  |
      | Member | full     |
      | Member | minimal  |
      | Member | spouse   |
      | Member | child    |
      | Member | disabled |
      | Member | widow    |
      | Member | deceased |

    Examples: Groups
      | type  | profile |
      | Group | full    |
      | Group | minimal |
      | Group | large   |
      | Group | single  |

  @functional
  Scenario Outline: Results carrying several <type> records are acknowledged
    Given an on-search callback carrying the <type> records "<records>"
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | type        | records                                      |
      | Beneficiary | household, individual, graduated, deceased   |
      | IBRPerson   | full, deceased, newborn                      |
      | Member      | widow, grandson                              |
      | Group       | full, large, single, minimal                 |

  @functional
  Scenario: Untyped reg_records are Beneficiary records, as declared by the spec
    Given an on-search callback carrying the "household" Beneficiary record without a reg_record_type
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: An empty <type> result is acknowledged
    Given an on-search callback with an empty <type> result
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | type        |
      | Beneficiary |
      | IBRPerson   |
      | Member      |
      | Group       |

  @functional
  Scenario Outline: A rejected search with reason code <code> is acknowledged
    Given an on-search callback rejected with reason code "<code>"
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: SearchStatusReasonCode
      | code                               |
      | rjct.reference_id.invalid          |
      | rjct.reference_id.duplicate        |
      | rjct.timestamp.invalid             |
      | rjct.search_criteria.invalid       |
      | rjct.filter.invalid                |
      | rjct.sort.invalid                  |
      | rjct.pagination.invalid            |
      | rjct.search.too_many_records_found |

  @negative
  Scenario Outline: An invalid on-search callback is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples: Envelope and header
      | case                       | field                     | value          |
      | missing header             | header                    | <removed>      |
      | wrong action               | header.action             | "search"       |
      | missing header status      | header.status             | <removed>      |
      | unknown header status      | header.status             | "done"         |
      | unknown header reason code | header.status_reason_code | "rjct.unknown" |
      | missing message_ts         | header.message_ts         | <removed>      |

    Examples: Search response
      | case                         | field                                           | value               |
      | missing transaction_id       | message.transaction_id                          | <removed>           |
      | missing correlation_id       | message.correlation_id                          | <removed>           |
      | correlation_id invalid chars | message.correlation_id                          | "IBR 0001"          |
      | missing search_response      | message.search_response                         | <removed>           |
      | missing status               | message.search_response.0.status                | <removed>           |
      | unknown status               | message.search_response.0.status                | "ok"                |
      | unknown reason code          | message.search_response.0.status_reason_code    | "rjct.not_found"    |
      | data without reg_records     | message.search_response.0.data                  | {"version":"1.0.0"} |
      | unknown reg_record_type      | message.search_response.0.data.reg_record_type  | "Programme"         |
      | pagination missing total     | message.search_response.0.pagination            | {"page_size":1,"page_number":1} |
      | locale not ISO 639-3         | message.search_response.0.locale                | "en"                |

    @strict-data
    Examples: Beneficiary data in the result
      | case                              | field                                                                          | value              |
      | reg_records not an array          | message.search_response.0.data.reg_records                                     | {"assistance_unit":"2"} |
      | assistance unit as a label        | message.search_response.0.data.reg_records.0.assistance_unit                   | "household"        |
      | enrolment status as a label       | message.search_response.0.data.reg_records.0.enrolment_status                  | "Active"           |
      | enrolment date not ISO 8601       | message.search_response.0.data.reg_records.0.enrolment_date                    | "02.02.2022"       |
      | status change date not a list     | message.search_response.0.data.reg_records.0.status_change_date                | "2022-02-01"       |
      | programmes as a single object     | message.search_response.0.data.reg_records.0.programme_identifier              | {"programme_name":"Child Support Grant","programme_identifier":"DCI001"} |
      | programme without a name          | message.search_response.0.data.reg_records.0.programme_identifier.0.programme_name | <removed>      |
      | institution type as a label       | message.search_response.0.data.reg_records.0.programme_identifier.0.institution_type | "Public"     |
      | social protection function label  | message.search_response.0.data.reg_records.0.programme_identifier.0.social_protection_functions | ["Family"] |
      | frequency as text                 | message.search_response.0.data.reg_records.0.programme_identifier.0.benefit_frequency | "Monthly"   |
      | benefit type as a label           | message.search_response.0.data.reg_records.0.benefits.0.benefit_type           | "Cash"             |
      | benefit value with a currency     | message.search_response.0.data.reg_records.0.benefits.0.benefit_value          | "USD 50"           |
      | benefit quantity as text          | message.search_response.0.data.reg_records.0.benefits.0.benefit_quantity       | "5"                |
      | member identifier as a string     | message.search_response.0.data.reg_records.0.member.member_identifier          | "M100000001"       |
      | member marital status as label    | message.search_response.0.data.reg_records.0.member.marital_status             | "married"          |
      | member person sex outside list    | message.search_response.0.data.reg_records.0.member.demographic_info.sex       | "F"                |
      | member phone not E.164            | message.search_response.0.data.reg_records.0.member.demographic_info.phone_number | ["0891234567"]  |
      | group type as a label             | message.search_response.0.data.reg_records.0.group.group_type                  | "household"        |
      | group head education as label     | message.search_response.0.data.reg_records.0.group.group_head_info.education_level | "bachelor"     |
      | group member relationship label   | message.search_response.0.data.reg_records.0.group.member_list.0.related_person.0.relationship_type | "spouse" |

    @strict-data
    Examples: Person, member and group data in the result
      | case                           | field                          | value                 |
      | person records with bad sex    | message.search_response.0.data | {"reg_record_type":"IBRPerson","reg_records":[{"identifier":[{"identifier_type":"UIN","identifier_value":"1"}],"sex":"F"}]} |
      | person birth_date not ISO 8601 | message.search_response.0.data | {"reg_record_type":"IBRPerson","reg_records":[{"birth_date":"20/05/1985"}]} |
      | person e-mail invalid          | message.search_response.0.data | {"reg_record_type":"IBRPerson","reg_records":[{"email":["alice.example.org"]}]} |
      | member employment as label     | message.search_response.0.data | {"reg_record_type":"Member","reg_records":[{"employment_status":"employed"}]} |
      | member language not ISO 639    | message.search_response.0.data | {"reg_record_type":"Member","reg_records":[{"language_code":["English"]}]} |
      | group size as text             | message.search_response.0.data | {"reg_record_type":"Group","reg_records":[{"group_size":"4"}]} |
      | group poverty score as text    | message.search_response.0.data | {"reg_record_type":"Group","reg_records":[{"poverty_score":"3.75"}]} |
