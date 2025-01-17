import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then, Before } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  contentTypeHeader,
  acceptHeader,
  searchEndpoint,
  searchResponseSchema,
} from './helpers/helpers.js';

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + searchEndpoint;
const endpointTag = { tags: `@endpoint=/${searchEndpoint}` };

let specSearch;

Before(endpointTag, () => {
  console.log("before endpoint")
  specSearch = spec(); // Initialize the specSearch object
  console.log("specSearch initialized", specSearch);  // Debug log
});

// Given step: Initialize search for beneficiaries
Given(/^System wanna search for beneficiaries$/, function () {
  specSearch = spec(); // Initialize the specSearch object
  console.log("specSearch initialized", specSearch);  // Debug log
});

When(/^POST request to search is sent$/, async function () {
  try {
    const response = await specSearch
      .post(baseUrl)
      .withHeaders(acceptHeader.key, acceptHeader.value);
    this.response = response; // Save response for validation in Then steps
   
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^The response from the search is received$/, async function () {
  return chai.expect(this.response).to.exist; // Uncomment once debugged
});


// Then step: Validate the response status code
Then(/^The search response should have status (\d+)$/, async  function(status)  {
  console.log(this.response.statusCode)
  
  return chai.expect(this.response.statusCode).to.equal(status);
});

// Then step: Validate header in the response
Then(/^The search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  console.log(this.response.rawHeaders)
  chai.expect(this.response.rawHeaders).to.include(key);
  //chai.expect(this.response.rawHeaders).to.include(value);
});

// Then step: Validate JSON schema of the response
Then(/^The search response should match json schema$/, async  function() {
  console.log(this.response.body)
  return chai.expect(this.response.body).to.be.jsonSchema(searchResponseSchema);
});
