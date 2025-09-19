// JWT Token Test Script
// Run this in browser console to add JWT token for testing

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0wMDEiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU3NDQyODYwLCJleHAiOjE3NTc0NDM3NjB9.AAQXYSMxY4mTmv3-ji3OL8Kok4V8SvZQ0rr2wwcQXFY';

const USER_DATA = {
  id: 'admin-001',
  username: 'admin',
  email: 'admin@getfairplay.org',
  name: 'Admin User',
  role: 'admin',
  permissions: ['all']
};

// Add token to localStorage
localStorage.setItem('authToken', JWT_TOKEN);
localStorage.setItem('user', JSON.stringify(USER_DATA));

console.log('✅ JWT Token added to localStorage');
console.log('Token:', JWT_TOKEN);
console.log('User:', USER_DATA);

// Test API call
fetch('https://api.getfairplay.org/api/v1/cameras', {
  headers: {
    'Authorization': 'Bearer ' + JWT_TOKEN,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Test Successful:', data);
})
.catch(error => {
  console.error('❌ API Test Failed:', error);
});
