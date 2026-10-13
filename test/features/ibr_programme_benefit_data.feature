@data
Feature: IBR programme and benefit data rules (Programme, Benefit, BenefitFrequency)

A beneficiary lists the programmes it is enrolled in (Programme) and the benefits it
received (Benefit); a programme describes the benefits it provides and how often they are
delivered (BenefitFrequency, an iCalendar recurrence rule).

The only mandatory IBR data attributes are programme_name and programme_identifier of a
Programme (1...1): a programme cannot be named without them. Every other attribute is
optional, but whenever one IS sent it must be correct: a code from the IBR code directory
(institution type, legal status, social protection functions, contribution type, programme
type, benefit type), a decimal value, a whole quantity, an RRULE frequency and weekday, a
recurrence that ends after its start and does not give both a count and an end date.

This feature runs offline and proves the rules applied to every programme and benefit of
every beneficiary returned or sent by the API scenarios.

Sources: DCI IBR v1.0.0 data standard (DO.IBR.PRG.01-11, DO.IBR.BEN.01-05, DO.IBR.BF.01-06,
CD.IBR.02-CD.IBR.07, DT.03, DT.04), extensions/ibr/v1/data (Programme, Benefit),
extensions/ibr/v1/code (BenefitFrequency, BenefitTypeEnum, InstitutionEnum, LegalStatusEnum,
SocialProtectionFunctionEnum, ContributionTypeEnum, ProgrammeTypeEnum), RFC 5545 (RRULE).

  # ---------------------------------------------------------------------------
  # Reference records
  # ---------------------------------------------------------------------------
  @smoke
  Scenario Outline: Reference <type> "<record>" is valid IBR data
    Given the "<record>" <type> record
    Then the record should be valid

    Examples: Programmes
      | type      | record         |
      | Programme | full           |
      | Programme | minimal        |
      | Programme | pension        |
      | Programme | public works   |
      | Programme | school feeding |

    Examples: Benefits
      | type    | record           |
      | Benefit | full             |
      | Benefit | minimal          |
      | Benefit | cash             |
      | Benefit | voucher          |
      | Benefit | in-kind          |
      | Benefit | training         |
      | Benefit | work opportunity |
      | Benefit | insurance        |

    Examples: Benefit frequencies
      | type             | record          |
      | BenefitFrequency | full            |
      | BenefitFrequency | minimal         |
      | BenefitFrequency | monthly         |
      | BenefitFrequency | every two weeks |
      | BenefitFrequency | ten payments    |
      | BenefitFrequency | yearly          |

  Scenario Outline: A <type> with no attribute at all is accepted (nothing is mandatory)
    Given an empty <type> record
    Then the record should be valid

    Examples:
      | type             |
      | Benefit          |
      | BenefitFrequency |

  # ---------------------------------------------------------------------------
  # Programme (DO.IBR.PRG)
  # ---------------------------------------------------------------------------
  Scenario: A programme needs its name and identifier (1...1)
    Given an empty Programme record
    Then the record should be rejected because of:
      | must have required property 'programme_name'       |
      | must have required property 'programme_identifier' |

  Scenario Outline: Mandatory programme attribute "<attribute>" may not be omitted
    Given the "full" Programme record
    When its "<attribute>" attribute is removed
    Then the record should be rejected because of "must have required property '<attribute>'"

    Examples:
      | attribute            |
      | programme_name       |
      | programme_identifier |

  Scenario Outline: Optional programme attribute "<attribute>" may be omitted
    Given the "full" Programme record
    When its "<attribute>" attribute is removed
    Then the record should be valid

    Examples:
      | attribute                   |
      | @context                    |
      | @type                       |
      | programme_description       |
      | implementing_institution    |
      | institution_type            |
      | legal_status                |
      | social_protection_functions |
      | contribution_type           |
      | programme_type              |
      | benefit                     |
      | benefit_frequency           |

  Scenario Outline: Every <list> code is accepted for the programme's <attribute>
    Given the "full" Programme record
    Then every "<list>" code should be accepted as "<attribute>"
    And every "<list>" code should be accepted as a JSON integer for "<attribute>"

    Examples:
      | list             | attribute                 |
      | institutionType  | institution_type          |
      | legalStatus      | legal_status              |
      | contributionType | contribution_type         |
      | programmeType    | programme_type            |
      | benefitType      | benefit.0.benefit_type    |

  Scenario: Every SocialProtectionFunctionEnum code is accepted in the list social_protection_functions
    Given the "full" Programme record
    Then every "socialProtectionFunction" code should be accepted in the list "social_protection_functions"

  Scenario: Every RRULE frequency is accepted for the programme's benefit_frequency
    Given the "full" Programme record
    Then every "rruleFrequency" code should be accepted as "benefit_frequency.0.freq"

  Scenario Outline: The programme's "<attribute>" accepts the correct value <value>
    Given the "full" Programme record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples:
      | attribute                   | value                                              |
      | social_protection_functions | []                                                 |
      | social_protection_functions | ["1", "15"]                                        |
      | social_protection_functions | [1, 2, 3]                                          |
      | benefit                     | []                                                 |
      | benefit                     | [{"benefit_type":"1"},{"benefit_type":"3","benefit_description":"Rice"}] |
      | benefit_frequency           | []                                                 |
      | benefit_frequency           | [{"freq":"MONTHLY"},{"freq":"YEARLY","dtstart":"2025-12-01"}] |
      | programme_identifier        | "PRG-2024/0001"                                    |

  Scenario Outline: The programme's "<attribute>" rejects the incorrect value <value>
    Given the "full" Programme record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples: Identification
      | attribute             | value | error                                                    |
      | programme_name        | ""    | /programme_name must NOT have fewer than 1 characters    |
      | programme_name        | 1     | /programme_name must be string                           |
      | programme_identifier  | ""    | /programme_identifier must NOT have fewer than 1 characters |
      | programme_identifier  | 1001  | /programme_identifier must be string                     |
      | programme_description | ""    | /programme_description must NOT have fewer than 1 characters |

    Examples: Codes (CD.IBR.03-CD.IBR.07)
      | attribute                   | value                 | error                                                                  |
      | institution_type            | "Public"              | /institution_type must be equal to one of the allowed values           |
      | institution_type            | "9"                   | /institution_type must be equal to one of the allowed values           |
      | legal_status                | "anchored"            | /legal_status must be equal to one of the allowed values               |
      | legal_status                | 4                     | /legal_status must be equal to one of the allowed values               |
      | contribution_type           | "Non-contributory"    | /contribution_type must be equal to one of the allowed values          |
      | contribution_type           | "0"                   | /contribution_type must be equal to one of the allowed values          |
      | programme_type              | "CCT"                 | /programme_type must be equal to one of the allowed values             |
      | programme_type              | "15"                  | /programme_type must be equal to one of the allowed values             |
      | social_protection_functions | "4"                   | /social_protection_functions must be array                             |
      | social_protection_functions | ["16"]                | /social_protection_functions/0 must be equal to one of the allowed values |
      | social_protection_functions | ["Old Age"]           | /social_protection_functions/0 must be equal to one of the allowed values |

    Examples: Benefits and frequencies provided by the programme
      | attribute                | value                   | error                                                                 |
      | benefit                  | {"benefit_type":"1"}    | /benefit must be array                                                |
      | benefit.0.benefit_type   | "Cash"                  | /benefit/0/benefit_type must be equal to one of the allowed values    |
      | benefit.0.benefit_value  | "USD 50"                | /benefit/0/benefit_value must match pattern                           |
      | benefit_frequency        | "Monthly"               | /benefit_frequency must be array                                      |
      | benefit_frequency.0.freq | "Monthly"               | /benefit_frequency/0/freq must be equal to one of the allowed values  |

  Scenario Outline: Programme attributes must be consistent: <rule>
    Given the "full" Programme record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples:
      | rule                               | attribute                   | value         | error                                                       |
      | a function listed twice            | social_protection_functions | ["4", "4"]    | social_protection_functions contains duplicates: 4          |
      | the same function as code and text | social_protection_functions | [4, "4"]      | social_protection_functions contains duplicates: 4          |
      | benefit received in the future     | benefit.0.benefit_date      | "2999-01-01"  | benefit[0].benefit_date "2999-01-01" is in the future       |
      | recurrence ending before its start | benefit_frequency.0.until   | "2021-01-01"  | benefit_frequency[0].until 2021-01-01 is before dtstart 2022-02-01 |

  # ---------------------------------------------------------------------------
  # Benefit (DO.IBR.BEN)
  # ---------------------------------------------------------------------------
  Scenario Outline: Optional benefit attribute "<attribute>" may be omitted
    Given the "full" Benefit record
    When its "<attribute>" attribute is removed
    Then the record should be valid

    Examples:
      | attribute           |
      | @type               |
      | benefit_type        |
      | benefit_date        |
      | benefit_value       |
      | benefit_description |
      | benefit_quantity    |

  Scenario: Every BenefitTypeEnum code is accepted for benefit_type
    Given the "full" Benefit record
    Then every "benefitType" code should be accepted as "benefit_type"
    And every "benefitType" code should be accepted as a JSON integer for "benefit_type"

  Scenario Outline: The benefit's "<attribute>" accepts the correct value <value>
    Given the "full" Benefit record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples: Value (DT.04 decimal, as a number or a decimal string)
      | attribute     | value     |
      | benefit_value | 0         |
      | benefit_value | 1250.75   |
      | benefit_value | "1250.75" |
      | benefit_value | "50"      |

    Examples: Quantity (DT.03 integer) and date (DF.01)
      | attribute        | value                  |
      | benefit_quantity | 1                      |
      | benefit_quantity | 1000                   |
      | benefit_date     | "2025-09-01T10:00:00Z" |
      | benefit_date     | "2024-02-29"           |

  Scenario Outline: The benefit's "<attribute>" rejects the incorrect value <value>
    Given the "full" Benefit record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples: Type (BenefitTypeEnum 1-6)
      | attribute    | value     | error                                               |
      | benefit_type | "Cash"    | /benefit_type must be equal to one of the allowed values |
      | benefit_type | "In-kind" | /benefit_type must be equal to one of the allowed values |
      | benefit_type | "0"       | /benefit_type must be equal to one of the allowed values |
      | benefit_type | "7"       | /benefit_type must be equal to one of the allowed values |
      | benefit_type | 3.5       | /benefit_type must be equal to one of the allowed values |

    Examples: Value
      | attribute     | value    | error                                |
      | benefit_value | "USD 50" | /benefit_value must match pattern    |
      | benefit_value | "50,00"  | /benefit_value must match pattern    |
      | benefit_value | "-5"     | /benefit_value must match pattern    |
      | benefit_value | -0.01    | /benefit_value must be >= 0          |
      | benefit_value | true     | /benefit_value must be number        |
      | benefit_value | {"amount":50,"currency":"USD"} | /benefit_value must be number |

    Examples: Quantity, description and date
      | attribute           | value        | error                                                           |
      | benefit_quantity    | 0            | /benefit_quantity must be >= 1                                  |
      | benefit_quantity    | 2.5          | /benefit_quantity must be integer                               |
      | benefit_quantity    | "5"          | /benefit_quantity must be integer                               |
      | benefit_description | ""           | /benefit_description must NOT have fewer than 1 characters      |
      | benefit_description | ["rice"]     | /benefit_description must be string                             |
      | benefit_date        | "02.05.2024" | /benefit_date must match pattern                                |
      | benefit_date        | "2025-02-30" | benefit_date "2025-02-30" is not a valid ISO 8601 calendar date |
      | benefit_date        | "2999-01-01" | benefit_date "2999-01-01" is in the future                      |

  # ---------------------------------------------------------------------------
  # BenefitFrequency (DO.IBR.BF, iCalendar RRULE)
  # ---------------------------------------------------------------------------
  Scenario Outline: Optional frequency attribute "<attribute>" may be omitted
    Given the "full" BenefitFrequency record
    When its "<attribute>" attribute is removed
    Then the record should be valid

    Examples:
      | attribute |
      | freq      |
      | dtstart   |
      | interval  |
      | wkst      |
      | until     |

  Scenario Outline: Every RRULE <list> value is accepted for <attribute>
    Given the "full" BenefitFrequency record
    Then every "<list>" code should be accepted as "<attribute>"

    Examples:
      | list           | attribute |
      | rruleFrequency | freq      |
      | weekday        | wkst      |

  Scenario Outline: The frequency's "<attribute>" accepts the correct value <value>
    Given the "<record>" BenefitFrequency record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples:
      | record       | attribute | value                  |
      | full         | interval  | 3                      |
      | full         | dtstart   | "2022-02-01T00:00:00Z" |
      | full         | until     | "2035-12-31"           |
      | ten payments | count     | 1                      |
      | ten payments | dtstart   | "2027-01-01"           |

  Scenario Outline: The frequency's "<attribute>" rejects the incorrect value <value>
    Given the "<record>" BenefitFrequency record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples:
      | record       | attribute | value        | error                                                      |
      | full         | freq      | "Monthly"    | /freq must be equal to one of the allowed values           |
      | full         | freq      | "monthly"    | /freq must be equal to one of the allowed values           |
      | full         | freq      | "BIWEEKLY"   | /freq must be equal to one of the allowed values           |
      | full         | wkst      | "Monday"     | /wkst must be equal to one of the allowed values           |
      | full         | wkst      | "mo"         | /wkst must be equal to one of the allowed values           |
      | full         | interval  | 0            | /interval must be >= 1                                     |
      | full         | interval  | 1.5          | /interval must be integer                                  |
      | full         | interval  | "1"          | /interval must be integer                                  |
      | ten payments | count     | 0            | /count must be >= 1                                        |
      | ten payments | count     | "10"         | /count must be integer                                     |
      | full         | dtstart   | "01/02/2022" | /dtstart must match pattern                                |
      | full         | until     | "2025-02-30" | until "2025-02-30" is not a valid ISO 8601 calendar date   |

  Scenario Outline: A recurrence must be consistent: <rule>
    Given the "<record>" BenefitFrequency record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples:
      | rule                           | record       | attribute | value        | error                                         |
      | ends before it starts          | full         | until     | "2021-01-01" | until 2021-01-01 is before dtstart 2022-02-01 |
      | count and until both given     | full         | count     | 12           | gives both count and until                    |
      | until and count both given     | ten payments | until     | "2025-10-31" | gives both count and until                    |
