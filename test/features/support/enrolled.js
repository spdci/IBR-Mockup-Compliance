import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then, Before } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  acceptHeader,
  enrolledEndpoint,
  enrolledResponseSchema,
} from './helpers/helpers.js';

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + enrolledEndpoint;

let specEnrolled;

// Given step: Initialize search for beneficiaries
Given(/^System wanna check beneficiary status in a program$/, function () {
  specEnrolled = spec(); // Initialize the specSearch object
  console.log("specEnrolled initialized", specEnrolled);  // Debug log
});

When(/^POST request to check beneficiary status in a program is sent$/, async function () {
  try {
    const response = await specEnrolled
      .post(baseUrl)
      .withHeaders(acceptHeader.key, acceptHeader.value);
    this.response = response; // Save response for validation in Then steps
   
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^The response from the enrolled is received$/, async function () {
  return chai.expect(this.response).to.exist; // Uncomment once debugged
});


// Then step: Validate the response status code
Then(/^The enrolled response should have status (\d+)$/, async  function(status)  {
  console.log(this.response.statusCode)
  
  return chai.expect(this.response.statusCode).to.equal(status);
});

// Then step: Validate header in the response
Then(/^The enrolled response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  console.log(this.response.rawHeaders)
  chai.expect(this.response.rawHeaders).to.include(key);
  //chai.expect(this.response.rawHeaders).to.include(value);
});

// Then step: Validate response time
Then(/^The enrolled response should be returned in a timely manner 15000ms$/, async function() {
    chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
  });

// Then step: Validate JSON schema of the response
Then(/^The enrolled response should match json schema$/, async  function() {
  chai.expect(this.response.body).to.be.jsonSchema(enrolledResponseSchema);
});
