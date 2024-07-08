// Replace with your actual testing framework functions
const request = require('supertest'); // Example using supertest

describe('Register Endpoint (End-to-End)', () => {
  it('registers user successfully with default organisation', async () => {
    const userData = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', password: 'password123' };
    const response = await request(app).post('/auth/register').send(userData);

    expect(response.statusCode).to.equal(201); // Check for successful creation status code
    expect(response.body).to.have.property('user'); // Check for user object in response
    expect(response.body).to.have.property('accessToken'); // Check for access token in response
    // Further assertions on user details and organisation name (if applicable)
  });

  // Similar test cases for other scenarios mentioned in the prompt
});
