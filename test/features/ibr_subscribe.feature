@method=POST @endpoint=ibr/subscribe
Feature: Subscribe To IBR based on specific criteria

This API is to be exposed by the IBR.
It will be called by the SP systems or other registeries .

    @smoke
    Scenario: Successfully subscribe to get new beneficiaries enrollment to be processed smoke type test
        Given System wanna subscribe to get new enrollments for beneficiaries
        When POST request to subscribe is sent
        Then The response from the subscribe is received
        And The subscribe response should have status 200
        And The subscribe response should have "Content-Type": "application/json" header
        And The subscribe response should be returned in a timely manner 15000ms
        And The subscribe response should match json schema