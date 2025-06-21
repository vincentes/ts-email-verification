import { parse_and_validate_email_wasm } from "./wasm";

interface EmailValidationResult {
  isValid: boolean;
  localPart?: string;
  domain?: string;
  domainScore?: number;
  errorMessage?: string;
}

interface EmailParseError {
  error_type: string;
  message: string;
  details?: string;
}

class EmailValidationError extends Error {
  public readonly errorType: string;
  public readonly details?: string;

  constructor(message: string, errorType: string, details?: string) {
    super(message);
    this.name = "EmailValidationError";
    this.errorType = errorType;
    this.details = details;
  }
}

class EmailValidator {
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
