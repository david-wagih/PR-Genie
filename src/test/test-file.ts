// Test file with intentional issues for PR Genie testing

// Security issue: Unsafe user input
const userInput = process.env.USER_INPUT;
const html = `<div>${userInput}</div>`; // Potential XSS vulnerability

// Performance issue: Inefficient loop
const data = [1, 2, 3, 4, 5];
const result = [];
for (let i = 0; i < data.length; i++) {
  result.push(data[i] * 2);
}

// Type safety issue: Missing type annotations
function processData(input: number) {
  return input * 2;
}

// Error handling issue: Missing try-catch
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}

// Code organization issue: Mixed concerns
class UserManager {
  private users: any[] = [];

  async fetchUsers() {
    const response = await fetch('/api/users');
    this.users = await response.json();
  }

  validateUser(user: any) {
    return user.name && user.email;
  }

  saveUser(user: any) {
    this.users.push(user);
    return this.users.length;
  }
}

// Best practices issue: Hardcoded values
const API_URL = 'http://localhost:3000';
const MAX_RETRIES = 3;
const TIMEOUT = 5000;

// Code style issue: Inconsistent formatting
const spaces = 'too many spaces';
const noSpaces = 'no spaces around operator';

// Documentation issue: Missing JSDoc
function calculateTotal(items: { price: number }[]) {
  return items.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
}
