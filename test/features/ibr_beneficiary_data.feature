@data
Feature: IBR beneficiary data rules (DO.IBR.04 Beneficiary)

A Beneficiary is what the SP-MIS conveys to the IBR: the assistance unit benefiting from a
programme (an individual member, a household or a family), the programmes it is enrolled
in, its enrolment status and the benefits it received. Every Beneficiary attribute is
optional (0...1 / 0...*), but whenever one IS sent it must be correct: a code from the IBR
code directory, the right data type and format, and consistent with the rest of the
beneficiary: enrolment after birth, status changes and benefits after enrolment, no
benefit after death, no deceased household, an assistance unit matching its group, a
member belonging to the beneficiary's group. The member, the group, every programme and
every benefit follow their own rules.

This feature runs offline and proves the rules applied to every beneficiary returned or
sent by the API scenarios (beneficiary search results, enrolment updates, notifications,
receipt transaction status).

Sources: DCI IBR v1.0.0 data standard (DO.IBR.04.01-DO.IBR.04.09, CD.IBR.01a/b, CD.IBR.02),
extensions/ibr/v1/data/Beneficiary.jsonld, extensions/ibr/Beneficiary.yaml,
extensions/ibr/v1/code (EnrollmentStatusEnum, BenefitTypeEnum), core/v1/code/AssistanceUnit.

  # ---------------------------------------------------------------------------
  # Reference records
  # ---------------------------------------------------------------------------
  @smoke
  Scenario Outline: Reference beneficiary "<record>" is valid IBR data
    Given the "<record>" Beneficiary record
    Then the record should be valid

    Examples:
      | record     |
      | household  |
      | individual |
      | graduated  |
      | suspended  |
      | deceased   |
      | in-kind    |
      | minimal    |

  Scenario: A beneficiary with no attribute at all is accepted (nothing is mandatory)
    Given an empty Beneficiary record
    Then the record should be valid

  Scenario: The published spec Beneficiary example does not follow the IBR data standard
    Given the "spec example" Beneficiary record
    Then the record should be rejected because of:
      | /member/member_identifier must be array                                 |
      | /member/related_person must be array                                    |
      | /member/is_disabled must be equal to one of the allowed values          |
      | /member/disability_info must be array                                   |
      | /member/marital_status must be equal to one of the allowed values       |
      | /member/employment_status must be equal to one of the allowed values    |
      | /member/occupation must be equal to one of the allowed values           |
      | /member/language_code must be array                                     |
      | /member/education_level must be equal to one of the allowed values      |
      | /member/additional_attributes must be array                             |
      | /member/registration_date must match pattern                            |
      | member.demographic_info wraps the person in "person"                    |
      | member.programme_identifier is a Beneficiary attribute                  |

  Scenario: The enrolment of the spec example is still wrong once moved to the beneficiary
    Given the "household" Beneficiary record
    When its "programme_identifier" attribute is set to '{"programme":{"programme_identifier":"DCI001","programme_name":"Test Programme"}}'
    And its "enrolment_date" attribute is set to '"02.02.2024"'
    And its "enrolment_status" attribute is set to '"Active"'
    And its "status_change_date" attribute is set to '""'
    And its "benefits" attribute is set to '{"benefit_type":"Cash","benefit_date":"02.05.2024","benefit_value":"USD 50","benefit_frequency":"Monthly"}'
    Then the record should be rejected because of:
      | /programme_identifier must be array                             |
      | /enrolment_date must match pattern                              |
      | /enrolment_status must be equal to one of the allowed values    |
      | /status_change_date must be array                               |
      | /benefits must be array                                         |

  # ---------------------------------------------------------------------------
  # Absent optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: Optional attribute "<attribute>" may be omitted
    Given the "<record>" Beneficiary record
    When its "<attribute>" attribute is removed
    Then the record should be valid

    Examples:
      | record     | attribute                                   |
      | household  | @context                                    |
      | household  | @id                                         |
      | household  | @type                                       |
      | household  | assistance_unit                             |
      | household  | group                                       |
      | household  | member                                      |
      | household  | member.demographic_info                     |
      | household  | programme_identifier                        |
      | household  | programme_identifier.0.programme_description |
      | household  | programme_identifier.0.benefit              |
      | household  | programme_identifier.0.benefit_frequency    |
      | household  | enrolment_date                              |
      | household  | enrolment_status                            |
      | household  | status_change_date                          |
      | household  | benefits                                    |
      | household  | benefits.0.benefit_value                    |
      | household  | benefits.0.benefit_date                     |
      | household  | additional_attributes                       |
      | individual | enrollment_date                             |
      | individual | enrollment_status                           |
      | deceased   | status_change_date                          |
      | in-kind    | benefits.3.benefit_quantity                 |

  # ---------------------------------------------------------------------------
  # Every code of every code list is accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: Every <list> code is accepted for <attribute>
    Given the "<record>" Beneficiary record
    Then every "<list>" code should be accepted as "<attribute>"
    And every "<list>" code should be accepted as a JSON integer for "<attribute>"

    Examples:
      | list             | record     | attribute               |
      | assistanceUnit   | individual | assistance_unit         |
      | enrollmentStatus | graduated  | enrolment_status        |
      | enrollmentStatus | individual | enrollment_status       |
      | benefitType      | household  | benefits.0.benefit_type |

  # ---------------------------------------------------------------------------
  # Correct values for optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: "<attribute>" accepts the correct value <value>
    Given the "<record>" Beneficiary record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples: Assistance unit and enrolment
      | record    | attribute          | value                                       |
      | household | assistance_unit    | 2                                           |
      | household | enrolment_date     | "2022-02-01T10:00:00+02:00"                 |
      | household | enrollment_date    | "2022-02-01"                                |
      | household | enrollment_status  | "1"                                         |
      | household | enrollment_status  | 1                                           |
      | household | status_change_date | []                                          |
      | household | status_change_date | ["2022-02-01", "2023-01-01T08:00:00Z"]      |

    Examples: Programmes (0...* Programme)
      | record    | attribute            | value                                                                                                                    |
      | household | programme_identifier | [{"programme_name":"Emergency Relief","programme_identifier":"DCI000"}]                                                  |
      | household | programme_identifier | [{"programme_name":"Child Support Grant","programme_identifier":"DCI001"},{"programme_name":"Old Age Pension","programme_identifier":"DCI002"}] |

    Examples: Benefits (0...* Benefit)
      | record    | attribute                  | value                                      |
      | household | benefits                   | []                                         |
      | household | benefits                   | [{"benefit_type":"6"}]                     |
      | household | benefits                   | [{"benefit_description":"Blankets"}]      |
      | household | benefits.0.benefit_value   | "50.25"                                    |
      | household | benefits.0.benefit_value   | 0                                          |
      | household | benefits.0.benefit_quantity | 1                                         |

    Examples: Member and group (individual, household or family beneficiary)
      | record     | attribute | value                                                                          |
      | household  | member    | {"member_identifier":[{"identifier_type":"UIN","identifier_value":"M100000002"}]} |
      | household  | group     | {"group_identifier":[{"identifier_type":"UIN","identifier_value":"GRP1001"}]}  |
      | individual | group     | {"group_identifier":[{"identifier_type":"UIN","identifier_value":"GRP4001"}],"group_type":"1"} |

    Examples: Additional attributes (list of strings or of name / value pairs)
      | record    | attribute             | value                                      |
      | household | additional_attributes | []                                         |
      | household | additional_attributes | ["priority_household"]                     |
      | household | additional_attributes | [{"name":"payment_channel","value":"bank"}] |

  # ---------------------------------------------------------------------------
  # Incorrect values for optional attributes are rejected
  # ---------------------------------------------------------------------------
  Scenario Outline: "<attribute>" rejects the incorrect value <value>
    Given the "<record>" Beneficiary record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples: Assistance unit (AssistanceUnitEnum 1-3) and enrolment status (EnrollmentStatusEnum 1-4)
      | record     | attribute         | value       | error                                                        |
      | individual | assistance_unit   | "household" | /assistance_unit must be equal to one of the allowed values  |
      | individual | assistance_unit   | "Member"    | /assistance_unit must be equal to one of the allowed values  |
      | individual | assistance_unit   | "4"         | /assistance_unit must be equal to one of the allowed values  |
      | individual | assistance_unit   | 0           | /assistance_unit must be equal to one of the allowed values  |
      | household  | enrolment_status  | "Active"    | /enrolment_status must be equal to one of the allowed values |
      | household  | enrolment_status  | "active"    | /enrolment_status must be equal to one of the allowed values |
      | household  | enrolment_status  | "5"         | /enrolment_status must be equal to one of the allowed values |
      | household  | enrolment_status  | 1.5         | /enrolment_status must be equal to one of the allowed values |
      | individual | enrollment_status | "Graduated" | /enrollment_status must be equal to one of the allowed values |

    Examples: Programmes
      | record    | attribute                                   | value                                                                              | error                                                              |
      | household | programme_identifier                        | {"programme_name":"Child Support Grant","programme_identifier":"DCI001"}           | /programme_identifier must be array                                |
      | household | programme_identifier                        | "DCI001"                                                                           | /programme_identifier must be array                                |
      | household | programme_identifier                        | []                                                                                 | /programme_identifier must NOT have fewer than 1 items             |
      | household | programme_identifier                        | [{"programme_name":"Child Support Grant"}]                                         | must have required property 'programme_identifier'                 |
      | household | programme_identifier                        | [{"programme_identifier":"DCI001"}]                                                | must have required property 'programme_name'                       |
      | household | programme_identifier                        | [{"programme":{"programme_identifier":"DCI001","programme_name":"Test Programme"}}] | must have required property 'programme_name'                      |
      | household | programme_identifier.0.programme_identifier | ""                                                                                 | /programme_identifier/0/programme_identifier must NOT have fewer than 1 characters |
      | household | programme_identifier.0.programme_type       | "CCT"                                                                              | /programme_identifier/0/programme_type must be equal to one of the allowed values |

    Examples: Dates (DF.01)
      | record    | attribute          | value          | error                                                                |
      | household | enrolment_date     | "02.02.2024"   | /enrolment_date must match pattern                                   |
      | household | enrolment_date     | "2024-02-30"   | enrolment_date "2024-02-30" is not a valid ISO 8601 calendar date    |
      | household | enrolment_date     | "2999-01-01"   | enrolment_date "2999-01-01" is in the future                         |
      | household | enrolment_date     | 20220201       | /enrolment_date must be string                                       |
      | household | status_change_date | "2022-02-01"   | /status_change_date must be array                                    |
      | household | status_change_date | [""]           | /status_change_date/0 must match pattern                             |
      | household | status_change_date | ["2999-01-01"] | status_change_date "2999-01-01" is in the future                     |

    Examples: Benefits
      | record    | attribute                   | value                  | error                                                             |
      | household | benefits                    | {"benefit_type":"1"}   | /benefits must be array                                           |
      | household | benefits.0.benefit_type     | "Cash"                 | /benefits/0/benefit_type must be equal to one of the allowed values |
      | household | benefits.0.benefit_type     | "7"                    | /benefits/0/benefit_type must be equal to one of the allowed values |
      | household | benefits.0.benefit_value    | "USD 50"               | /benefits/0/benefit_value must match pattern                      |
      | household | benefits.0.benefit_value    | -5                     | /benefits/0/benefit_value must be >= 0                            |
      | household | benefits.0.benefit_date     | "02.05.2024"           | /benefits/0/benefit_date must match pattern                       |
      | household | benefits.0.benefit_quantity | 0                      | /benefits/0/benefit_quantity must be >= 1                         |

    Examples: Member and group (their own rules apply)
      | record    | attribute                   | value            | error                                                              |
      | household | member                      | "M100000001"     | /member must be object                                             |
      | household | member.member_identifier    | "HS0205202401"   | /member/member_identifier must be array                            |
      | household | member.demographic_info.sex | "F"              | /member/demographic_info/sex must be equal to one of the allowed values |
      | household | member.marital_status       | "Single"         | /member/marital_status must be equal to one of the allowed values  |
      | household | group                       | []               | /group must be object                                              |
      | household | group.group_type            | "household"      | /group/group_type must be equal to one of the allowed values       |
      | household | group.poverty_score         | "low"            | /group/poverty_score must be number                                |

    Examples: Additional attributes and linked data keywords
      | record    | attribute             | value             | error                                                          |
      | household | additional_attributes | "priority"        | /additional_attributes must be array                           |
      | household | additional_attributes | [""]              | /additional_attributes/0 must NOT have fewer than 1 characters |
      | household | additional_attributes | [42]              | /additional_attributes/0 must be string                        |
      | household | additional_attributes | [{"name":"x"}]    | /additional_attributes/0 must have required property 'value'   |
      | household | @type                 | {}                | /@type must be string                                          |

  # ---------------------------------------------------------------------------
  # Cross-attribute consistency (only checked when the attributes are sent)
  # ---------------------------------------------------------------------------
  Scenario Outline: Beneficiary attributes must be consistent: <rule>
    Given the "<record>" Beneficiary record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples: Both spellings of the enrolment attributes agree
      | rule                         | record    | attribute         | value        | error                                                                 |
      | enrolment dates disagree     | household | enrollment_date   | "2022-03-01" | enrolment_date "2022-02-01" contradicts enrollment_date "2022-03-01"  |
      | enrolment statuses disagree  | household | enrollment_status | "4"          | enrolment_status "1" contradicts enrollment_status "4"                |

    Examples: Chronology
      | rule                              | record    | attribute               | value          | error                                                                              |
      | enrolled before birth             | household | enrolment_date          | "1980-01-01"   | enrolment_date 1980-01-01 is before member.demographic_info.birth_date 1985-05-20  |
      | status changed before enrolment   | graduated | status_change_date      | ["2024-01-01"] | status_change_date[0] 2024-01-01 is before enrolment_date 2024-06-03               |
      | benefit received before enrolment | household | benefits.0.benefit_date | "2021-12-31"   | benefits[0].benefit_date 2021-12-31 is before enrolment_date 2022-02-01            |
      | benefit received after death      | deceased  | benefits.0.benefit_date | "2024-12-01"   | benefits[0].benefit_date 2024-12-01 is after member.demographic_info.death_date 2024-11-02 |

    Examples: Enrolment status
      | rule                              | record    | attribute          | value | error                                                                                   |
      | deceased person still active      | deceased  | enrolment_status   | "1"   | enrolment_status is 1 (Active) but member.demographic_info.death_date 2024-11-02 is given |
      | a household cannot be deceased    | household | enrolment_status   | "2"   | enrolment_status 2 (Deceased) applies to an individual, not to assistance_unit 2 (Household) |
      | a family cannot be deceased       | suspended | enrolment_status   | 2     | enrolment_status 2 (Deceased) applies to an individual, not to assistance_unit 3 (Family) |
      | status change sent without a date | graduated | status_change_date | []    | enrolment_status is 3 (Graduated) but status_change_date is empty                       |

    Examples: Assistance unit, member and group
      | rule                          | record    | attribute            | value                                                                                    | error                                                                    |
      | unit contradicts group type   | household | assistance_unit      | "3"                                                                                      | assistance_unit 3 (Family) contradicts group.group_type 2 (Household)    |
      | member outside the group      | household | member               | {"member_identifier":[{"identifier_type":"UIN","identifier_value":"M200000001"}]}        | member (UIN\|M200000001) is not a member of the beneficiary group         |
      | programme listed twice        | household | programme_identifier | [{"programme_name":"A","programme_identifier":"DCI001"},{"programme_name":"B","programme_identifier":"DCI001"}] | programme_identifier lists programme DCI001 more than once |

    Examples: The member, group and programmes follow their own rules
      | rule                              | record    | attribute                                       | value        | error                                                                  |
      | member registered before birth    | household | member.registration_date                        | "1980-01-01" | member.registration_date 1980-01-01 is before demographic_info.birth_date 1985-05-20 |
      | group smaller than its members    | household | group.group_size                                | 2            | group.member_list has 4 members, more than group_size 2                |
      | recurrence with count and until   | household | programme_identifier.0.benefit_frequency.0.count | 12          | gives both count and until                                             |

  Scenario: A beneficiary whose assistance unit is a member cannot be only a group
    Given the "household" Beneficiary record
    When its "assistance_unit" attribute is set to '"1"'
    And its "member" attribute is removed
    And its "group.group_type" attribute is removed
    Then the record should be rejected because of "assistance_unit is 1 (Member) but only a group is given"

  Scenario Outline: Consistent beneficiary attributes are accepted: <case>
    Given the "<record>" Beneficiary record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples:
      | case                                     | record    | attribute               | value                                                                             |
      | status changed on the enrolment day      | household | status_change_date      | ["2022-02-01"]                                                                    |
      | benefit received on the enrolment day    | household | benefits.0.benefit_date | "2022-02-01"                                                                      |
      | benefit received on the day of death     | deceased  | benefits.0.benefit_date | "2024-11-02"                                                                      |
      | household represented by another member  | household | member                  | {"member_identifier":[{"identifier_type":"UIN","identifier_value":"M100000003"}]} |
      | assistance unit sent as a JSON integer   | suspended | assistance_unit         | 3                                                                                 |
      | both spellings with the same date        | household | enrollment_date         | "2022-02-01"                                                                      |
      | deceased individual                      | deceased  | enrolment_status        | 2                                                                                 |
