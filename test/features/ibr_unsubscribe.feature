@method=POST @endpoint=/unsubscribe
Feature: Unsubscribe from IBR based on specific criteria

This API is to be exposed by the IBR.
It will be called by the SP systems or other registeries .

    @smoke
    Scenario: Successfully unsubscribe from IBR to be processed smoke type test
        Given System wanna unsubscribe from IBR
        When POST request to unsubscribe is sent
        Then The response from the unsubscribe is received
        And The unsubscribe response should have status 200
        And The unsubscribe response should have "Content-Type": "application/json" header
        And The unsubscribe response should be returned in a timely manner 15000ms
        And The unsubscribe response should match json schema