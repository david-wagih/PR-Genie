"use strict";
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
function processData(input) {
    return input * 2;
}
// Error handling issue: Missing try-catch
async function fetchUserData(userId) {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
}
// Code organization issue: Mixed concerns
class UserManager {
    users = [];
    async fetchUsers() {
        const response = await fetch('/api/users');
        this.users = await response.json();
    }
    validateUser(user) {
        return user.name && user.email;
    }
    saveUser(user) {
        this.users.push(user);
        return this.users.length;
    }
}
// Best practices issue: Hardcoded values
const API_URL = 'http://localhost:3000';
const MAX_RETRIES = 3;
const TIMEOUT = 5000;
// Code style issue: Inconsistent formatting
const spaces = "too many spaces";
const noSpaces = "no spaces around operator";
// Documentation issue: Missing JSDoc
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}
