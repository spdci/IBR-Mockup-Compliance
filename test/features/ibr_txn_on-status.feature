@method=POST @endpoint=ibr/txn/on-status
Feature: Get transaction status

This API is to be exposed by the IBR.
It will be called by the SP systems or other registries.

    @smoke
    Scenario: Successfully receive async txn status result from IBR
        Given SP has previously sent a txn status request to IBR
        When IBR completes processing and calls SP txn on-status callback
        Then SP should receive the txn on-status response from IBR
        And The txn on-status response should have status 200
        And The txn on-status response should have "Content-Type": "application/json" header
        And The txn on-status response should be returned in a timely manner 15000ms
        And The txn on-status response should match json schema