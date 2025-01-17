@method=POST @endpoint=/sync/enrolled
Feature: check if bebeficiary enrolled in a program 

This API is to be exposed by the IBR.
It will be called by the SP systems or other registeries to update the data.

    @smoke @positive
    Scenario: Successfully check if beneficiary is enrolled in a program
        Given System wanna check beneficiary status in a program
        When POST request to check beneficiary status in a program is sent
        Then The response from the enrolled is received
        And The enrolled response should have status 200
        And The enrolled response should have "Content-Type": "application/json" header
        And The enrolled response should be returned in a timely manner 15000ms
        And The enrolled response should match json schema