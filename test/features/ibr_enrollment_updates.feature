@method=POST @endpoint=/sync/enrollment/updates
Feature: update / create beneficiaries in IBR 

This API is to be exposed by the IBR.
It will be called by the SP systems or other registeries to update the data.

    @smoke @positive
    Scenario: Successfully update beneficiaries smoke type test
        Given System wanna update beneficiaries enrollments
        When POST request to update or create beneficiaries is sent
        Then The response from the enrollment updates is received
        And The enrollment updates response should have status 200
        And The enrollment updates response should have "Content-Type": "application/json" header
        And The enrollment updates response should be returned in a timely manner 15000ms
        And The enrollment updates response should match json schema