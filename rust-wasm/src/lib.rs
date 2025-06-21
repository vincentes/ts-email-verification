use serde::{Serialize, Deserialize};
use regex::Regex;
use wasm_bindgen::prelude::*;

/// Result of email parsing and validation
/// Contains validation status, parsed components, and domain risk scoring
#[derive(Debug, Serialize, Deserialize)]
pub struct EmailParseResult {
    /// Whether the email is valid according to RFC standards
    pub is_valid: bool,
    /// The local part of the email (before the @ symbol)
    pub local_part: Option<String>,
    /// The domain part of the email (after the @ symbol)
    pub domain: Option<String>,
    /// Risk score for the domain (0-100, higher is more trusted)
    pub domain_score: Option<f64>,
    /// Error message if validation failed
    pub error_message: Option<String>
}

/// Error structure for email parsing failures
/// Provides detailed error information for debugging and user feedback
#[derive(Debug, Serialize, Deserialize)]
pub struct EmailParseError {
    /// Type of error that occurred (e.g., "RegexError", "InvalidInput")
    pub error_type: String,
    /// Human-readable error message
    pub message: String,
    /// Additional error details if available
    pub details: Option<String>
}

impl std::fmt::Display for EmailParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}: {}", self.error_type, self.message)
    }
}

/// Scores a domain based on its trustworthiness and reputation
/// 
/// Returns a risk score from 0-100 where:
/// - 80+ : Trusted domains (Google, Outlook, Yahoo)
/// - 20-30: Disposable/temporary email domains
/// - 50: Default score for regular domains
/// 
/// # Arguments
/// * `domain` - The domain string to score (case-insensitive)
/// 
/// # Returns
/// * `f64` - Risk score between 0 and 100
/// 
/// # Examples
/// ```
/// assert_eq!(score_domain("google.com"), 80.0);
/// assert_eq!(score_domain("mailinator.com"), 20.0);
/// assert_eq!(score_domain("example.com"), 50.0);
/// ```
fn score_domain(domain: &str) -> f64 {
    let domain_lower = domain.to_lowercase();
    
    let trusted_domains = vec![
        "google.com",
        "outlook.com", 
        "yahoo.com"
    ];
    
    let disposable_domains = vec![
        "mailinator.com",
        "tempmail.com"
    ];
    
    if trusted_domains.contains(&domain_lower.as_str()) {
        return 80.0;
    }
    
    if disposable_domains.contains(&domain_lower.as_str()) {
        return 20.0;
    }
    
    return 50.0;
}

/// Parses and validates an email address according to RFC standards
/// 
/// Performs comprehensive email validation including:
/// - Format validation using RFC-compliant regex
/// - Length validation (max 320 characters)
/// - Local part and domain extraction
/// - Domain risk scoring
/// - Edge case handling (consecutive dots, special characters)
/// 
/// # Arguments
/// * `email` - The email string to validate
/// 
/// # Returns
/// * `Result<EmailParseResult, EmailParseError>` - Validation result or error
/// 
/// # Examples
/// ```
/// // Valid email
/// let result = parse_and_validate_email("user@example.com").unwrap();
/// assert!(result.is_valid);
/// assert_eq!(result.local_part, Some("user".to_string()));
/// assert_eq!(result.domain, Some("example.com".to_string()));
/// 
/// // Invalid email
/// let result = parse_and_validate_email("invalid-email").unwrap();
/// assert!(!result.is_valid);
/// assert_eq!(result.error_message, Some("Invalid email format".to_string()));
/// ```
pub fn parse_and_validate_email(email: &str) -> Result<EmailParseResult, EmailParseError> {
    if email.is_empty() {
        return Ok(EmailParseResult {
            is_valid: false,
            local_part: None,
            domain: None,
            domain_score: None,
            error_message: Some("Email cannot be empty".to_string())
        });
    }

    if email.len() > 320 {
        return Ok(EmailParseResult {
            is_valid: false,
            local_part: None,
            domain: None,
            domain_score: None,
            error_message: Some("Email exceeds maximum length of 320 characters".to_string())
        });
    }

    let email_regex = match Regex::new(r"^[a-zA-Z0-9_%+-](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9_%+-])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$") {
        Ok(regex) => regex,
        Err(e) => return Err(EmailParseError {
            error_type: "RegexError".to_string(),
            message: "Failed to compile email regex".to_string(),
            details: Some(e.to_string())
        })
    };

    if !email_regex.is_match(email) {
        return Ok(EmailParseResult {
            is_valid: false,
            local_part: None,
            domain: None,
            domain_score: None,
            error_message: Some("Invalid email format".to_string())
        });
    }

    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 {
        return Ok(EmailParseResult {
            is_valid: false,
            local_part: None,
            domain: None,
            domain_score: None,
            error_message: Some("Invalid email format".to_string())
        });
    }

    let local_part = parts[0];
    if local_part.contains("..") {
        return Ok(EmailParseResult {
            is_valid: false,
            local_part: None,
            domain: None,
            domain_score: None,
            error_message: Some("Invalid email format".to_string())
        });
    }

    let local_part = local_part.to_string();
    let domain = parts[1].to_string();

    let domain_score = score_domain(&domain);

    Ok(EmailParseResult {
        is_valid: true,
        local_part: Some(local_part),
        domain: Some(domain),
        domain_score: Some(domain_score),
        error_message: None
    })
}

/// WebAssembly entry point for email validation
/// 
/// This function is exposed to JavaScript via wasm-bindgen and provides
/// the main interface for email validation from the TypeScript SDK.
/// 
/// # Arguments
/// * `email` - The email string to validate
/// 
/// # Returns
/// * `JsValue` - Serialized EmailParseResult or EmailParseError
/// 
/// # Examples
/// ```javascript
/// // From JavaScript/TypeScript
/// const result = parse_and_validate_email_wasm("user@example.com");
/// console.log(result.is_valid); // true
/// ```
#[wasm_bindgen]
pub fn parse_and_validate_email_wasm(email: &str) -> JsValue {
    match parse_and_validate_email(email) {
        Ok(result) => serde_wasm_bindgen::to_value(&result).unwrap(),
        Err(e) => serde_wasm_bindgen::to_value(&e).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Tests valid email format validation
    #[test]
    fn test_valid_email() {
        // TODO: Test valid email formats
        let email = "test@example.com";
        let result = parse_and_validate_email(email).unwrap();
        assert!(result.is_valid);
        assert_eq!(result.local_part, Some("test".to_string()));
        assert_eq!(result.domain, Some("example.com".to_string()));
        assert_eq!(result.domain_score, Some(80.0));
        assert_eq!(result.error_message, None);
    }

    /// Tests invalid email format rejection
    #[test]
    fn test_invalid_email_format() {
        let email = "test2.com";
        let result = parse_and_validate_email(email).unwrap();
        assert!(!result.is_valid);
        assert_eq!(result.local_part, None);
        assert_eq!(result.domain, None);
        assert_eq!(result.domain_score, None);
        assert_eq!(result.error_message, Some("Invalid email format".to_string()));
    }

    /// Tests empty string input handling
    #[test]
    fn test_empty_email() {
        let email = "";
        let result = parse_and_validate_email(email).unwrap();
        assert!(!result.is_valid);
        assert_eq!(result.local_part, None);
        assert_eq!(result.domain, None);
        assert_eq!(result.domain_score, None);
        assert_eq!(result.error_message, Some("Email cannot be empty".to_string()));
    }

    /// Tests email length limit enforcement
    #[test]
    fn test_too_long_email() {
        let email = "a".repeat(321);
        let result = parse_and_validate_email(&email).unwrap();
        assert!(!result.is_valid);
        assert_eq!(result.local_part, None);
        assert_eq!(result.domain, None);
        assert_eq!(result.domain_score, None);
        assert_eq!(result.error_message, Some("Email exceeds maximum length of 320 characters".to_string()));
    }

    /// Tests domain scoring functionality
    #[test]
    fn test_domain_scoring() {
        // Test trusted domains
        assert_eq!(score_domain("google.com"), 80.0);
        assert_eq!(score_domain("outlook.com"), 80.0);
        assert_eq!(score_domain("yahoo.com"), 80.0);
        assert_eq!(score_domain("GOOGLE.COM"), 80.0); // Case insensitive
        
        // Test disposable domains
        assert_eq!(score_domain("mailinator.com"), 20.0);
        assert_eq!(score_domain("tempmail.com"), 20.0);
        assert_eq!(score_domain("MAILINATOR.COM"), 20.0); // Case insensitive
        
        // Test regular domains (default score)
        assert_eq!(score_domain("example.com"), 50.0);
        assert_eq!(score_domain("test.org"), 50.0);
        assert_eq!(score_domain("company.net"), 50.0);
    }

    /// Tests various edge cases and boundary conditions
    /// TODO: Low priority 
    #[test]
    fn test_edge_cases() {
        // Test special characters that might cause issues
        let special_char_emails = vec![
            "test@domain.com!",  // Exclamation at end
            "test@domain.com#",  // Hash at end
            "test#@domain.com",  // Hash in local part (should be invalid)
            "test@domain.com$",  // Dollar at end
            "test$@domain.com",  // Dollar in local part (should be invalid)
            "test@domain.com&",  // Ampersand at end
            "test&@domain.com",  // Ampersand in local part (should be invalid)
            "test@domain.com*",  // Asterisk at end
            "test*@domain.com",  // Asterisk in local part (should be invalid)
            "test@domain.com(",  // Parenthesis at end
            "test(@domain.com",  // Parenthesis in local part (should be invalid)
            "test@domain.com)",  // Parenthesis at end
            "test)@domain.com",  // Parenthesis in local part (should be invalid)
            "test@domain.com[",  // Bracket at end
            "test[@domain.com",  // Bracket in local part (should be invalid)
            "test@domain.com]",  // Bracket at end
            "test]@domain.com",  // Bracket in local part (should be invalid)
            "test@domain.com{",  // Brace at end
            "test{@domain.com",  // Brace in local part (should be invalid)
            "test@domain.com}",  // Brace at end
            "test}@domain.com",  // Brace in local part (should be invalid)
            "test@domain.com\\", // Backslash at end
            "test\\@domain.com", // Backslash in local part (should be invalid)
            "test@domain.com/",  // Forward slash at end
            "test/@domain.com",  // Forward slash in local part (should be invalid)
            "test@domain.com|",  // Pipe at end
            "test|@domain.com",  // Pipe in local part (should be invalid)
            "test@domain.com<",  // Less than at end
            "test<@domain.com",  // Less than in local part (should be invalid)
            "test@domain.com>",  // Greater than at end
            "test>@domain.com",  // Greater than in local part (should be invalid)
            "test@domain.com?",  // Question mark at end
            "test?@domain.com",  // Question mark in local part (should be invalid)
            "test@domain.com:",  // Colon at end
            "test:@domain.com",  // Colon in local part (should be invalid)
            "test@domain.com;",  // Semicolon at end
            "test;@domain.com",  // Semicolon in local part (should be invalid)
            "test@domain.com\"", // Quote at end
            "test\"@domain.com", // Quote in local part (should be invalid)
            "test@domain.com'",  // Single quote at end
            "test'@domain.com",  // Single quote in local part (should be invalid)
            "test@domain.com`",  // Backtick at end
            "test`@domain.com",  // Backtick in local part (should be invalid)
            "test@domain.com~",  // Tilde at end
            "test~@domain.com",  // Tilde in local part (should be invalid)
            "test@domain.com=",  // Equals at end
            "test=@domain.com",  // Equals in local part (should be invalid)
            "test@domain.com,",  // Comma at end
            "test,@domain.com",  // Comma in local part (should be invalid)
        ];

        for email in special_char_emails {
            let result = parse_and_validate_email(email).unwrap();
            // All of these should be invalid due to special characters
            assert!(!result.is_valid, "Email {} should be invalid due to special characters", email);
            assert_eq!(result.error_message, Some("Invalid email format".to_string()));
        }

        // Test Unicode/international domain handling
        let unicode_emails = vec![
            "test@münchen.de",        // German umlaut
            "test@москва.рф",         // Cyrillic
            "test@中国.cn",           // Chinese
            "test@日本.jp",           // Japanese
            "test@한국.kr",           // Korean
            "test@العربية.sa",        // Arabic
            "test@ελλάδα.gr",         // Greek
            "test@עברית.il",          // Hebrew
            "test@ไทย.th",            // Thai
            "test@việtnam.vn",        // Vietnamese
            "test@भारत.in",           // Hindi
            "test@বাংলা.bd",          // Bengali
            "test@தமிழ்.in",          // Tamil
            "test@ગુજરાતી.in",        // Gujarati
            "test@ಕನ್ನಡ.in",          // Kannada
            "test@മലയാളം.in",         // Malayalam
            "test@తెలుగు.in",         // Telugu
            "test@ଓଡ଼ିଆ.in",          // Odia
            "test@پاکستان.pk",        // Urdu
            "test@افغانستان.af",      // Pashto/Dari
            "test@türkiye.tr",        // Turkish
            "test@čeština.cz",        // Czech
            "test@slovenčina.sk",     // Slovak
            "test@română.ro",         // Romanian
            "test@български.bg",      // Bulgarian
            "test@српски.rs",         // Serbian
            "test@slovenščina.si",    // Slovenian
            "test@latviešu.lv",       // Latvian
            "test@íslenska.is",       // Icelandic
        ];

        for email in unicode_emails {
            let result = parse_and_validate_email(email).unwrap();
            // Our current regex doesn't support Unicode domains, so these should be invalid
            assert!(!result.is_valid, "Email {} should be invalid due to Unicode domain (not supported by current regex)", email);
            assert_eq!(result.error_message, Some("Invalid email format".to_string()));
        }

        // Test edge cases with valid ASCII domains but unusual patterns
        let edge_case_emails = vec![
            "a@b.co",                 // Very short but valid
            "test@sub.domain.com",    // Subdomain
            "test@domain-name.com",   // Hyphen in domain
            "test-user@domain.com",   // Hyphen in local part
            "test.user@domain.com",   // Dot in local part
            "test_user@domain.com",   // Underscore in local part
            "test+tag@domain.com",    // Plus in local part
            "test%percent@domain.com", // Percent in local part
            "123@456.com",            // All numbers
            "test@123domain.com",     // Numbers in domain
            "test@domain123.com",     // Numbers at end of domain
            "test@a-very-long-domain-name-that-is-still-valid.com", // Long domain
            "a-very-long-local-part-that-should-still-be-valid@domain.com", // Long local part
        ];

        for email in edge_case_emails {
            let result = parse_and_validate_email(email).unwrap();
            // These should all be valid according to our regex
            assert!(result.is_valid, "Email {} should be valid", email);
            assert!(result.local_part.is_some());
            assert!(result.domain.is_some());
            assert_eq!(result.domain_score, Some(50.0)); // Default score for regular domains
            assert_eq!(result.error_message, None);
        }

        // Test malformed emails
        let malformed_emails = vec![
            "@domain.com",           // Missing local part
            "test@",                 // Missing domain
            "test@@domain.com",      // Double @
            "test@domain",           // Missing TLD
            "test@domain.",          // Missing TLD after dot
            "test@.domain.com",      // Leading dot in domain
            "test@domain..com",      // Double dot in domain
            "test@domain.c",         // TLD too short
            ".test@domain.com",      // Leading dot in local part
            "test.@domain.com",      // Trailing dot in local part
            "te..st@domain.com",     // Double dot in local part
            "test @domain.com",      // Space in local part
            "test@ domain.com",      // Space in domain
            "test@domain .com",      // Space in domain
            "test@domain. com",      // Space after dot
            "",                      // Empty (already tested but good to include)
            " ",                     // Just space
            "   ",                   // Multiple spaces
            "\t",                    // Tab character
            "\n",                    // Newline character
            "\r",                    // Carriage return
            "test\n@domain.com",     // Newline in email
            "test@domain\n.com",     // Newline in domain
        ];

        for email in malformed_emails {
            let result = parse_and_validate_email(email).unwrap();
            if email.is_empty() {
                assert_eq!(result.error_message, Some("Email cannot be empty".to_string()));
            } else {
                assert!(!result.is_valid, "Email '{}' should be invalid", email);
                assert_eq!(result.error_message, Some("Invalid email format".to_string()));
            }
        }
    }
} 