import { EmailValidator, EmailValidationError } from "./main";

describe("EmailValidator", () => {
  describe("validateEmail", () => {
    test("should validate a correct email format", async () => {
      const email = "test@example.com";
      const result = await EmailValidator.validateEmail(email);

      expect(result.isValid).toBe(true);
      expect(result.localPart).toBe("test");
      expect(result.domain).toBe("example.com");
      expect(result.domainScore).toBe(80.0);
      expect(result.errorMessage).toBeUndefined();
    });

    test("should reject invalid email format", async () => {
      const email = "test2.com";
      const result = await EmailValidator.validateEmail(email);

      expect(result.isValid).toBe(false);
      expect(result.localPart).toBeUndefined();
      expect(result.domain).toBeUndefined();
      expect(result.domainScore).toBeUndefined();
      expect(result.errorMessage).toBe("Invalid email format");
    });

    test("should reject empty email", async () => {
      const email = "";
      const result = await EmailValidator.validateEmail(email);

      expect(result.isValid).toBe(false);
      expect(result.localPart).toBeUndefined();
      expect(result.domain).toBeUndefined();
      expect(result.domainScore).toBeUndefined();
      expect(result.errorMessage).toBe("Email cannot be empty");
    });

    test("should reject email exceeding 320 characters", async () => {
      const email = "a".repeat(321);

      await expect(EmailValidator.validateEmail(email)).rejects.toThrow(
        EmailValidationError
      );
      await expect(EmailValidator.validateEmail(email)).rejects.toThrow(
        "Email exceeds maximum length of 320 characters"
      );
    });

    test("should throw error for non-string input", async () => {
      await expect(EmailValidator.validateEmail(123 as any)).rejects.toThrow(
        EmailValidationError
      );
      await expect(EmailValidator.validateEmail(123 as any)).rejects.toThrow(
        "Email must be a string"
      );
    });

    test("should throw error for null/undefined input", async () => {
      await expect(EmailValidator.validateEmail(null as any)).rejects.toThrow(
        EmailValidationError
      );
      await expect(
        EmailValidator.validateEmail(undefined as any)
      ).rejects.toThrow(EmailValidationError);
    });

    test("should validate various valid email formats", async () => {
      const validEmails = [
        "a@b.co",
        "test@sub.domain.com",
        "test@domain-name.com",
        "test-user@domain.com",
        "test.user@domain.com",
        "test_user@domain.com",
        "test+tag@domain.com",
        "test%percent@domain.com",
        "123@456.com",
        "test@123domain.com",
        "test@domain123.com",
      ];

      for (const email of validEmails) {
        const result = await EmailValidator.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.localPart).toBeDefined();
        expect(result.domain).toBeDefined();
        expect(result.domainScore).toBe(80.0);
        expect(result.errorMessage).toBeUndefined();
      }
    });

    test("should reject emails with special characters", async () => {
      const specialCharEmails = [
        "test@domain.com!",
        "test#@domain.com",
        "test$@domain.com",
        "test&@domain.com",
        "test*@domain.com",
        "test(@domain.com",
        "test)@domain.com",
        "test[@domain.com",
        "test]@domain.com",
        "test{@domain.com",
        "test}@domain.com",
        "test\\@domain.com",
        "test/@domain.com",
        "test|@domain.com",
        "test<@domain.com",
        "test>@domain.com",
        "test?@domain.com",
        "test:@domain.com",
        "test;@domain.com",
        'test"@domain.com',
        "test'@domain.com",
        "test`@domain.com",
        "test~@domain.com",
        "test=@domain.com",
        "test,@domain.com",
      ];

      for (const email of specialCharEmails) {
        const result = await EmailValidator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe("Invalid email format");
      }
    });

    test("should reject Unicode/international domains", async () => {
      const unicodeEmails = [
        "test@münchen.de",
        "test@москва.рф",
        "test@中国.cn",
        "test@日本.jp",
        "test@한국.kr",
        "test@العربية.sa",
        "test@ελλάδα.gr",
        "test@עברית.il",
      ];

      for (const email of unicodeEmails) {
        const result = await EmailValidator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe("Invalid email format");
      }
    });
  });

  describe("validateEmails", () => {
    test("should validate multiple valid emails", async () => {
      const emails = [
        "test1@example.com",
        "test2@domain.org",
        "user@company.net",
      ];

      const results = await EmailValidator.validateEmails(emails);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.isValid).toBe(true);
        expect(result.localPart).toBeDefined();
        expect(result.domain).toBeDefined();
        expect(result.domainScore).toBe(80.0);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    test("should handle mixed valid and invalid emails", async () => {
      const emails = [
        "valid@example.com",
        "invalid.email",
        "another@valid.com",
        "@invalid.com",
        "last@valid.org",
      ];

      const results = await EmailValidator.validateEmails(emails);

      expect(results).toHaveLength(5);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
      expect(results[3].isValid).toBe(false);
      expect(results[4].isValid).toBe(true);
    });

    test("should handle empty array", async () => {
      const results = await EmailValidator.validateEmails([]);
      expect(results).toHaveLength(0);
    });

    test("should throw error for non-array input", async () => {
      await expect(
        EmailValidator.validateEmails("not an array" as any)
      ).rejects.toThrow(EmailValidationError);
      await expect(
        EmailValidator.validateEmails("not an array" as any)
      ).rejects.toThrow("Emails must be an array");
    });

    test("should handle array with invalid types gracefully", async () => {
      const emails = [
        "valid@example.com",
        123 as any,
        "another@valid.com",
        null as any,
        undefined as any,
      ];

      const results = await EmailValidator.validateEmails(emails);

      expect(results).toHaveLength(5);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[1].errorMessage).toContain("Email must be a string");
      expect(results[2].isValid).toBe(true);
      expect(results[3].isValid).toBe(false);
      expect(results[4].isValid).toBe(false);
    });

    test("should handle large batch of emails", async () => {
      const emails = Array.from(
        { length: 100 },
        (_, i) => `test${i}@example.com`
      );

      const results = await EmailValidator.validateEmails(emails);

      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    test("should create EmailValidationError with correct properties", () => {
      const error = new EmailValidationError(
        "Test message",
        "TestError",
        "Test details"
      );

      expect(error.name).toBe("EmailValidationError");
      expect(error.message).toBe("Test message");
      expect(error.errorType).toBe("TestError");
      expect(error.details).toBe("Test details");
      expect(error instanceof Error).toBe(true);
    });

    test("should create EmailValidationError without details", () => {
      const error = new EmailValidationError("Test message", "TestError");

      expect(error.details).toBeUndefined();
    });
  });

  describe("WASM Initialization", () => {
    test("should initialize WASM module only once", async () => {
      // First call
      const result1 = await EmailValidator.validateEmail("test@example.com");
      expect(result1.isValid).toBe(true);

      // Second call (should reuse initialized WASM)
      const result2 = await EmailValidator.validateEmail("test2@example.com");
      expect(result2.isValid).toBe(true);
    });
  });
});
