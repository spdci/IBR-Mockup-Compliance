@method=POST @endpoint=/sync/search
Feature: Search beneficiaries from IBR based on specific criteria

This API is to be exposed by the IBR.
It will be called by the SP systems or other registries.

    @smoke
    Scenario: Successfully search beneficiaries to be processed
        Given System wants to search for beneficiaries
        When A POST request to search is sent
        Then The response from the search should be received
        And The search response should have status 200
        And The search response should have "Content-Type": "application/json" header
        And The search response should be returned in a timely manner within 15000ms
        And The search response should match the expected JSON schema

     @functional
    Scenario: Validate the structure of reg_records in search response Functional Test
        Given System has sent a search request for beneficiaries for a functional test
        When A POST request to search is sent Functional Test
        Then The response from the search should be received Functional Test
        And The search response should contain a reg_records array Functional Test
        And Each item in the reg_records array should match the defined JSON schema Functional Test