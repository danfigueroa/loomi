const { faker } = require('@faker-js/faker');

module.exports = {
  $randomString: () => faker.person.firstName(),
  $randomInt: (min, max) => faker.number.int({ min, max }),
  $randomEmail: () => faker.internet.email(),
  
  beforeRequest: (requestParams, context, ee, next) => {
    console.log(`Making request to: ${requestParams.url}`);
    return next();
  },
  
  afterResponse: (requestParams, response, context, ee, next) => {
    if (response.statusCode >= 400) {
      console.log(`Error response: ${response.statusCode} for ${requestParams.url}`);
    }
    return next();
  }
};