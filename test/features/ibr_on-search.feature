@method=POST @endpoint=ibr/on-search
Feature: Receive async search results from IBR through a callback

This API is exposed by SP to receive search results from IBR.
CRVS will call this API after processing the original search request.

    @smoke
    Scenario: Successfully receive async search results from IBR
        Given SP has previously sent a search request to IBR
        When IBR completes processing and calls SP on-search callback
        Then SP should receive the on-search response from IBR
        And The on-search response should have status 200
        And The on-search response should have "Content-Type": "application/json" header
        And The on-search response should be received within 15000ms
        And The on-search response should match the expected JSON schema
        