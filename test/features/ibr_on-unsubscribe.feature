@method=POST @endpoint=ibr/on-unsubscribe
Feature: callback for Unsubscribe from IBR

This API is to be exposed by the IBR.
It will be called by the SP systems or other registeries .

    @smoke
    Scenario: Successfully  receive async unsubscribe results from IBR
        Given SP has previously sent an unsubscribe request to IBR
        When IBR completes processing and calls SP on-unsubscribe callback
        Then SP should receive the on-unsubscribe response from IBR
        And The on-unsubscribe response should have status 200
        And The on-unsubscribe response should have "Content-Type": "application/json" header
        And The on-unsubscribe response should be returned in a timely manner 15000ms
        And The on-unsubscribe response should match json schema