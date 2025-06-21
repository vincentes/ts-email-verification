// node-typescript-example.ts - TypeScript Node.js usage
import { parse_and_validate_email_wasm } from '../rust-wasm/pkg';

interface EmailValidationResult {
  is_valid: boolean;
  local_part?: string;
  domain?: string;
  domain_score?: number;
  error_message?: string;
}

class NodeEmailValidator {
  /**
   * Validate a single email address
   */
  static validateEmail(email: string): EmailValidationResult {
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }
    
    if (email.length > 320) {
      throw new Error('Email exceeds maximum length of 320 characters');
    }

    try {
      return parse_and_validate_email_wasm(email);
    } catch (error) {
      throw new Error(`WASM execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate multiple email addresses
   */
  static validateEmails(emails: string[]): EmailValidationResult[] {
    if (!Array.isArray(emails)) {
      throw new Error('Emails must be an array');
    }

    return emails.map(email => {
      try {
        return this.validateEmail(email);
      } catch (error) {
        return {
          is_valid: false,
          error_message: error instanceof Error ? error.message : 'Unknown validation error'
        };
      }
    });
  }

  /**
   * Get validation statistics
   */
  static getValidationStats(emails: string[]): {
    total: number;
    valid: number;
    invalid: number;
    validDomains: Set<string>;
  } {
    const results = this.validateEmails(emails);
    const validDomains = new Set<string>();
    
    let valid = 0;
    let invalid = 0;
    
    results.forEach(result => {
      if (result.is_valid) {
        valid++;
        if (result.domain) {
          validDomains.add(result.domain);
        }
      } else {
        invalid++;
      }
    });

    return {
      total: emails.length,
      valid,
      invalid,
      validDomains
    };
  }
}

// Example usage
async function main() {
  const testEmails = [
    'test@example.com',
    'user@domain.co.uk',
    'invalid-email',
    'another@test.org',
    'malformed@',
    'user+tag@example.com'
  ];

  console.log('Email Validation Results:\n');
  
  // Individual validation
  testEmails.forEach(email => {
    try {
      const result = NodeEmailValidator.validateEmail(email);
      console.log(`${email}: ${result.is_valid ? '✅ Valid' : '❌ Invalid'}`);
      if (result.is_valid) {
        console.log(`  Domain: ${result.domain}, Score: ${result.domain_score}`);
      } else {
        console.log(`  Error: ${result.error_message}`);
      }
    } catch (error) {
      console.log(`${email}: ❌ Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  console.log('\n---\n');

  // Batch validation with statistics
  const stats = NodeEmailValidator.getValidationStats(testEmails);
  console.log('Validation Statistics:');
  console.log(`Total emails: ${stats.total}`);
  console.log(`Valid: ${stats.valid}`);
  console.log(`Invalid: ${stats.invalid}`);
  console.log(`Unique valid domains: ${stats.validDomains.size}`);
  console.log('Valid domains:', Array.from(stats.validDomains).join(', '));
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { NodeEmailValidator, EmailValidationResult }; 