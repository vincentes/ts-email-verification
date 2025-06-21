import { parse_and_validate_email_wasm } from "./wasm";

/**
 * Result of email validation containing validation status and parsed components
 */
interface EmailValidationResult {
  /** Whether the email is valid according to RFC standards */
  isValid: boolean;
  /** The local part of the email (before the @ symbol) */
  localPart?: string;
  /** The domain part of the email (after the @ symbol) */
  domain?: string;
  /** Risk score for the domain (0-100, higher is more trusted) */
  domainScore?: number;
  /** Error message if validation failed */
  errorMessage?: string;
}

/**
 * Error structure returned from WASM when parsing fails
 */
interface EmailParseError {
  /** Type of error that occurred */
  error_type: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details if available */
  details?: string;
}

/**
 * Custom error class for email validation errors
 * Extends the standard Error class with additional error type and details
 */
class EmailValidationError extends Error {
  /** The type of validation error that occurred */
  public readonly errorType: string;
  /** Additional error details if available */
  public readonly details?: string;

  /**
   * Creates a new EmailValidationError
   * @param message - Human-readable error message
   * @param errorType - Type of error that occurred
   * @param details - Additional error details (optional)
   */
  constructor(message: string, errorType: string, details?: string) {
    super(message);
    this.name = "EmailValidationError";
    this.errorType = errorType;
    this.details = details;
  }
}

/**
 * Main email validation class providing methods to validate single or multiple email addresses
 * Uses WebAssembly (WASM) for high-performance email parsing and validation
 */
class EmailValidator {
  /**
   * Validates input parameters before processing
   * @param email - The email string to validate
   * @throws {EmailValidationError} When input is invalid
   */
  private static validateInput(email: string): void {
    if (typeof email !== "string") {
      throw new EmailValidationError("Email must be a string", "InvalidInput");
    }

    if (email.length > 320) {
      throw new EmailValidationError(
        "Email exceeds maximum length of 320 characters",
        "InvalidLength"
      );
    }
  }

  /**
   * Validates a single email address
   *
   * Performs comprehensive email validation including:
   * - Format validation according to RFC standards
   * - Length validation (max 320 characters)
   * - Domain scoring for risk assessment
   * - Local part and domain extraction
   *
   * @param email - The email address to validate
   * @returns Promise resolving to EmailValidationResult with validation details
   * @throws {EmailValidationError} When validation fails or WASM execution errors occur
   *
   * @example
   * ```typescript
   * try {
   *   const result = await EmailValidator.validateEmail("user@example.com");
   *   if (result.isValid) {
   *     console.log(`Valid email: ${result.localPart}@${result.domain}`);
   *     console.log(`Domain score: ${result.domainScore}`);
   *   } else {
   *     console.log(`Invalid email: ${result.errorMessage}`);
   *   }
   * } catch (error) {
   *   console.error("Validation error:", error.message);
   * }
   * ```
   */
  static async validateEmail(email: string): Promise<EmailValidationResult> {
    this.validateInput(email);

    try {
      const result = parse_and_validate_email_wasm(email);

      // Check if the result is an error
      if ("error_type" in result) {
        const error = result as EmailParseError;
        throw new EmailValidationError(
          error.message,
          error.error_type,
          error.details
        );
      }

      // Convert snake_case from Rust to camelCase for TypeScript
      return {
        isValid: result.is_valid,
        localPart: result.local_part || undefined,
        domain: result.domain || undefined,
        domainScore: result.domain_score || undefined,
        errorMessage: result.error_message || undefined,
      };
    } catch (error) {
      if (error instanceof EmailValidationError) {
        throw error;
      }

      throw new EmailValidationError(
        `WASM execution failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "WasmError"
      );
    }
  }

  /**
   * Validates multiple email addresses in batch
   *
   * Processes an array of email addresses and returns validation results for each.
   * If individual email validation fails, the error is captured in the result
   * rather than throwing an exception, allowing batch processing to continue.
   *
   * @param emails - Array of email addresses to validate
   * @returns Promise resolving to array of EmailValidationResult objects
   * @throws {EmailValidationError} When input is not an array
   *
   * @example
   * ```typescript
   * const emails = ["user1@example.com", "invalid-email", "user2@google.com"];
   * const results = await EmailValidator.validateEmails(emails);
   *
   * results.forEach((result, index) => {
   *   console.log(`Email ${index + 1}: ${result.isValid ? 'Valid' : 'Invalid'}`);
   *   if (!result.isValid) {
   *     console.log(`  Error: ${result.errorMessage}`);
   *   }
   * });
   * ```
   */
  static async validateEmails(
    emails: string[]
  ): Promise<EmailValidationResult[]> {
    if (!Array.isArray(emails)) {
      throw new EmailValidationError("Emails must be an array", "InvalidInput");
    }

    const results: EmailValidationResult[] = [];

    for (const email of emails) {
      try {
        const result = await this.validateEmail(email);
        results.push(result);
      } catch (error) {
        if (error instanceof EmailValidationError) {
          results.push({
            isValid: false,
            errorMessage: error.message,
          });
        } else {
          results.push({
            isValid: false,
            errorMessage: "Unknown validation error",
          });
        }
      }
    }

    return results;
  }
}

export { EmailValidator, EmailValidationResult, EmailValidationError };
