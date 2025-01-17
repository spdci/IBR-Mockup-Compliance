@method=POST @endpoint=/sync/search
Feature: Search beneficiaries from IBR based on specific criteria

This API is to be exposed by the IBR.
It will be called by the SP systems or other registeries .

    @smoke
    Scenario: Successfully search beneficiaries to be processed smoke type test
        Given System wanna search for beneficiaries
        When POST request to search is sent
        Then The response from the search is received
        And The search response should have status 200
        And The search response should have "Content-Type": "application/json" header
        And The search response should be returned in a timely manner 15000ms
        And The search response should match json schema