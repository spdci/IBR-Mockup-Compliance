@method=POST @endpoint=/sync/search
Feature: Search beneficiaries from IBR based on specific criteria

This API is to be exposed by the IBR.
It will be called by the SP systems or other registries.

    @smoke
    Scenario: Successfully search beneficiaries to be processed Smoke Test
        Given System wants to search for beneficiaries Smoke Test
        When A POST request to search is sent Smoke Test
        Then The response from the search should be received Smoke Test
        And The search response should have status 200 Smoke Test
        And The search response should have "Content-Type": "application/json" header Smoke Test
        And The search response should be returned in a timely manner within 15000ms Smoke Test
        And The search response should match the expected JSON schema Smoke Test

    @functional
    Scenario: Validate the structure of "reg_records" in search response Functional Test
        Given System has sent a search request for beneficiaries Functional Test
        When A POST request to search is sent Functional Test
        Then The response from the search should be received Functional Test
        And The search response should have status 200 Functional Test
        And The search response should have "Content-Type": "application/json" header Functional Test
        And The search response should contain a "reg_records" array Functional Test
        And Each item in the "reg_records" array should match the defined JSON schema Functional Test
