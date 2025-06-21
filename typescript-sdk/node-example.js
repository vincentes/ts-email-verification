// node-example.js - Node.js usage with nodejs target
const { parse_and_validate_email_wasm } = require('../rust-wasm/pkg');

// Simple validation
function validateEmail(email) {
  try {
    const result = parse_and_validate_email_wasm(email);
    
    if (result.is_valid) {
      console.log(`✅ Valid email: ${email}`);
      console.log(`   Local part: ${result.local_part}`);
      console.log(`   Domain: ${result.domain}`);
      console.log(`   Domain score: ${result.domain_score}`);
    } else {
      console.log(`❌ Invalid email: ${email}`);
      console.log(`   Error: ${result.error_message}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error validating email: ${error.message}`);
    return null;
  }
}

// Test some emails
const testEmails = [
  'test@example.com',
  'invalid-email',
  'user@domain.co.uk',
  'very-long-email-address-that-exceeds-the-maximum-length-of-320-characters-very-long-email-address-that-exceeds-the-maximum-length-of-320-characters-very-long-email-address-that-exceeds-the-maximum-length-of-320-characters-very-long-email-address-that-exceeds-the-maximum-length-of-320-characters-very-long-email-address-that-exceeds-the-maximum-length-of-320-characters@example.com'
];

console.log('Email Validation Results:\n');
testEmails.forEach(email => {
  validateEmail(email);
  console.log('---');
}); 