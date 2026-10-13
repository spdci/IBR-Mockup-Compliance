@method=POST @endpoint=ibr/sync/search
Feature: Synchronous search of the Integrated Beneficiary Registry (POST /registry/sync/search)

This API is exposed by the IBR and called by SP-MIS systems or other registries.
The response carries a callback header (action "on-search") and a SearchResponse.
A search targets one IBR record type (search_criteria.reg_record_type / response_entity):
beneficiaries (Beneficiary, the default record type of the IBR SearchResponse), persons
(IBRPerson), members (Member) or groups / households (Group).
Every returned record is checked against the IBR data rules of its type: attributes are
optional, but whatever is returned must be correct.

  Background:
    Given the "sync search" endpoint

  @smoke
  Scenario: Successful sync search of a household beneficiary by group identifier
    Given a search for the "household" Beneficiary by identifier
    Then the request should be a valid "search" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And the result should contain the record identified by the query
    And every returned record should be valid IBR data

  # ---------------------------------------------------------------------------
  # Beneficiary search (DO.IBR.04)
  # ---------------------------------------------------------------------------
  @functional @beneficiary
  Scenario Outline: Beneficiary search returns correct data for the <profile> beneficiary
    Given a search for the "<profile>" Beneficiary by identifier
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And every returned record should be a Beneficiary record
    And the result should contain the record identified by the query
    And at least 1 record should be returned
    And every returned record should be valid IBR data

    Examples: Household and family beneficiaries (by group identifier or head of household)
      | profile              |
      | household            |
      | by head of household |
      | suspended            |

    Examples: Individual beneficiaries (by member, person, birth or death registration)
      | profile              |
      | individual           |
      | by person identifier |
      | graduated            |
      | deceased             |
      | in-kind              |
      | minimal              |

  @functional @beneficiary
  Scenario: Untyped searches return Beneficiary records, as declared by the spec
    Given a search for the "individual" Beneficiary by identifier without a reg_record_type
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And every returned record should be a Beneficiary record
    And the result should contain the record identified by the query
    And every returned record should be valid IBR data

  # ---------------------------------------------------------------------------
  # Person search (DO.IBR.01)
  # ---------------------------------------------------------------------------
  @functional @person
  Scenario Outline: Person search by <identifier type> returns correct data for a <profile> person
    Given a search for the "<profile>" IBRPerson by identifier
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And every returned record should be a IBRPerson record
    And the result should contain the record identified by the query
    And at least 1 record should be returned
    And every returned record should be valid IBR data

    Examples:
      | identifier type | profile        |
      | UIN             | full           |
      | UIN             | minimal        |
      | DRN             | deceased       |
      | MRN             | multi          |
      | UIN             | child          |
      | BRN             | newborn        |
      | UIN             | example person |

  # ---------------------------------------------------------------------------
  # Member search (DO.IBR.02, PRS.IBR.01.3: queries at individual level)
  # ---------------------------------------------------------------------------
  @functional @member
  Scenario Outline: Member search returns correct data for the <profile> member
    Given a search for the "<profile>" Member by identifier
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And every returned record should be a Member record
    And the result should contain the record identified by the query
    And at least 1 record should be returned
    And every returned record should be valid IBR data

    Examples:
      | profile              |
      | full                 |
      | minimal              |
      | by person identifier |
      | disabled             |
      | widow                |
      | deceased             |
      | child                |
      | single               |

  # ---------------------------------------------------------------------------
  # Group search (DO.IBR.03, PRS.IBR.01.4: queries at group / household level)
  # ---------------------------------------------------------------------------
  @functional @group
  Scenario Outline: Group search returns correct data for the <profile> group
    Given a search for the "<profile>" Group by identifier
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And every returned record should be a Group record
    And the result should contain the record identified by the query
    And at least 1 record should be returned
    And every returned record should be valid IBR data

    Examples: By group identifier
      | profile |
      | full    |
      | minimal |
      | large   |
      | single  |

    Examples: Household of a person (by the identifier of one of its members)
      | profile               |
      | by member identifier  |
      | by person identifier  |
      | by birth registration |

  # ---------------------------------------------------------------------------
  # Analysis queries
  # ---------------------------------------------------------------------------
  @functional
  Scenario Outline: Predicate search for <type> records where <predicate>
    Given a predicate search for <type> records where "<predicate>"
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And every returned record should be a <type> record
    And every returned record should satisfy the predicate
    And every returned record should be valid IBR data

    Examples:
      | type        | predicate                                      |
      | Beneficiary | the beneficiary is enrolled in the child grant |
      | Group       | poverty_score is below 5                       |
      | Member      | the member is a female widow                   |
      | IBRPerson   | the person is a woman born since 1980          |

  @functional @beneficiary
  Scenario: Beneficiaries of a programme are all enrolled in that programme
    Given a predicate search for Beneficiary records where "the beneficiary is enrolled in the child grant"
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And at least 1 record should be returned
    And every returned beneficiary should be enrolled in programme "DCI001"

  @functional
  Scenario Outline: Expression search for <expression>
    Given an expression search for "<expression>"
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"
    And every returned record should be valid IBR data

    Examples:
      | expression                               |
      | Beneficiary enrolled in the child grant  |
      | Group with poverty_score below 5         |
      | Member who are female widows             |
      | IBRPerson who are women born since 1980  |

  # ---------------------------------------------------------------------------
  # Optional search criteria: pagination, sort, locale, consent / authorize
  # ---------------------------------------------------------------------------
  @functional
  Scenario Outline: Pagination is honoured (page <page>, page_size <size>)
    Given a predicate search for IBRPerson records where "the person is a woman born since 1980"
    And the search requests page <page> with page_size <size>
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And the search result pagination should report page <page> with at most <size> records per page
    And every returned record should be valid IBR data

    Examples:
      | page | size |
      | 1    | 1    |
      | 2    | 1    |
      | 1    | 2    |
      | 1    | 100  |

  @functional
  Scenario Outline: Sorting <type> records by <attribute> <order> is honoured
    Given a predicate search for <type> records where "<predicate>"
    And the search results are sorted by "<attribute>" in "<order>" order
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And the returned records should be sorted by "<attribute>" in "<order>" order

    Examples:
      | type        | predicate                                      | attribute      | order |
      | Beneficiary | the beneficiary is enrolled in the child grant | enrolment_date | asc   |
      | Beneficiary | the beneficiary is enrolled in the child grant | enrolment_date | desc  |
      | Group       | poverty_score is below 5                       | poverty_score  | asc   |
      | Group       | poverty_score is below 5                       | poverty_score  | desc  |
      | IBRPerson   | the person is a woman born since 1980          | birth_date     | asc   |
      | IBRPerson   | the person is a woman born since 1980          | birth_date     | desc  |

  @functional
  Scenario: The requested locale is honoured
    Given a search for the "household" Beneficiary by identifier
    And the search request asks for locale "fra"
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every requested locale should be honoured

  @functional
  Scenario: A search carrying consent and authorize information is accepted
    Given a search for the "individual" Beneficiary by identifier
    And the search request carries consent and authorize information
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And every search result should have status "succ"

  # ---------------------------------------------------------------------------
  # Batch, not found, rejection by the registry
  # ---------------------------------------------------------------------------
  @functional
  Scenario Outline: A batch search of <type> records answers every item with its own result
    Given a batch search for the <type> records "<records>"
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And each batch item should be answered with its own result
    And every returned record should be valid IBR data

    Examples:
      | type        | records                                          |
      | Beneficiary | household, individual, graduated, deceased, unknown |
      | IBRPerson   | full, deceased, newborn, unknown                 |
      | Member      | full, disabled, widow, unknown                   |
      | Group       | full, large, single, minimal, unknown            |

  @functional
  Scenario: A batch search may mix beneficiaries, persons, members and groups
    Given a batch search mixing record types "Beneficiary:household, Group:large, Member:widow, IBRPerson:deceased, Beneficiary:in-kind"
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And each batch item should be answered with its own result
    And every returned record should be valid IBR data

  @functional
  Scenario Outline: Searching an unknown <type> returns no record or a coded rejection
    Given a search for the "unknown" <type> by identifier
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And the search result should be empty or rejected with a valid reason code

    Examples:
      | type        |
      | Beneficiary |
      | IBRPerson   |
      | Member      |
      | Group       |

  @functional @mock
  Scenario: A rejected search item carries a spec reason code and no data
    Given a search for the "too_many" Beneficiary by identifier
    When the request is sent
    Then the response should be a valid "sync-search-response" message
    And the search result should be rejected with reason code "rjct.search.too_many_records_found"

  # ---------------------------------------------------------------------------
  # Requests that break the spec must be refused
  # ---------------------------------------------------------------------------
  @negative
  Scenario Outline: An invalid request is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples: Envelope and header
      | case                       | field                   | value        |
      | missing header             | header                  | <removed>    |
      | missing message            | message                 | <removed>    |
      | wrong action               | header.action           | "subscribe"  |
      | missing message_id         | header.message_id       | <removed>    |
      | missing message_ts         | header.message_ts       | <removed>    |
      | message_ts not ISO 8601    | header.message_ts       | "13/10/2026" |
      | missing sender_id          | header.sender_id        | <removed>    |
      | missing total_count        | header.total_count      | <removed>    |
      | total_count not an integer | header.total_count      | "one"        |
      | sender_uri not a URI       | header.sender_uri       | "not a uri"  |
      | is_msg_encrypted not bool  | header.is_msg_encrypted | "no"         |

    Examples: Search request
      | case                         | field                                                    | value                                   |
      | missing transaction_id       | message.transaction_id                                   | <removed>                               |
      | transaction_id too long      | message.transaction_id                                   | "TXN0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" |
      | missing search_request       | message.search_request                                   | <removed>                               |
      | empty search_request         | message.search_request                                   | []                                      |
      | missing reference_id         | message.search_request.0.reference_id                    | <removed>                               |
      | missing timestamp            | message.search_request.0.timestamp                       | <removed>                               |
      | invalid timestamp            | message.search_request.0.timestamp                       | "yesterday"                             |
      | missing search_criteria      | message.search_request.0.search_criteria                 | <removed>                               |
      | missing query_type           | message.search_request.0.search_criteria.query_type      | <removed>                               |
      | unknown query_type           | message.search_request.0.search_criteria.query_type      | "sql"                                   |
      | graphql is not an IBR search | message.search_request.0.search_criteria.query_type      | "graphql"                               |
      | missing query                | message.search_request.0.search_criteria.query           | <removed>                               |
      | query not matching type      | message.search_request.0.search_criteria.query           | [{"expression1":{"attribute_name":"enrolment_status","operator":"eq","attribute_value":"1"}}] |
      | idtype-value without value   | message.search_request.0.search_criteria.query           | {"type":"UIN"}                          |
      | unknown reg_record_type      | message.search_request.0.search_criteria.reg_record_type | "Household"                             |
      | unknown response_entity      | message.search_request.0.search_criteria.response_entity | "Person"                                |
      | invalid locale               | message.search_request.0.locale                          | "english"                               |
      | pagination without page_size | message.search_request.0.search_criteria.pagination      | {"page_number":1}                       |
      | page_size zero               | message.search_request.0.search_criteria.pagination      | {"page_size":0}                         |
      | invalid sort order           | message.search_request.0.search_criteria.sort            | [{"attribute_name":"enrolment_date","sort_order":"up"}] |
      | consent with invalid ts      | message.search_request.0.search_criteria.consent         | {"ts":"now"}                            |

    Examples: Predicate query
      | case                        | field                                    | value                                   |
      | unknown operator            | message.search_request.0.search_criteria | {"query_type":"predicate","query":[{"expression1":{"attribute_name":"enrolment_status","operator":"like","attribute_value":"1"}}]} |
      | unknown condition           | message.search_request.0.search_criteria | {"query_type":"predicate","query":[{"expression1":{"attribute_name":"enrolment_status","operator":"eq","attribute_value":"1"},"condition":"xor","expression2":{"attribute_name":"assistance_unit","operator":"eq","attribute_value":"2"}}]} |
      | expression without operator | message.search_request.0.search_criteria | {"query_type":"predicate","query":[{"expression1":{"attribute_name":"enrolment_status","attribute_value":"1"}}]} |
      | empty predicate             | message.search_request.0.search_criteria | {"query_type":"predicate","query":[]}  |

  @negative
  Scenario: A body that is not JSON is rejected
    When the raw body "this is not json" is sent
    Then the request should be rejected according to the DCI error model
