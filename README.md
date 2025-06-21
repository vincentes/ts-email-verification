# ts-email-verification

A TypeScript SDK for fast email validation with internal Rust logic using `wasm-bindgen`.

## Prerequisites

- **Rust** (latest stable version, v1.83.0)
- **wasm-pack** - for building Rust to WebAssembly
- **Node.js** (v16+ recommended)
- **npm** or **yarn**

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
# or with cargo: cargo install wasm-pack

# Verify Node.js is installed
node --version  # Should be v16+
npm --version
```

## Build the SDK

```bash
cd typescript-sdk
npm install
npm run build
```

## Test the SDK

```bash
cd typescript-sdk
npm test
```

## Usage

```bash
cd your-project
npm install file:../path/to/typescript-sdk
```

Validating a single email.
```typescript
import { EmailValidator } from '@vbermudez/email-validator';

const result = await EmailValidator.validateEmail('test@example.com');
console.log(result); 

// { isValid: true, localPart: 'test', domain: 'example.com', domainScore: 80.0 }
```

Batch validation for multiple emails.
```typescript
// Test multiple emails
const results = await EmailValidator.validateEmails(['test@example.com', 'invalid.email']);
console.log(results); // Array of validation results
```

## Examples
Included in this repository are two folders that correspond to JavaScript and TypeScript examples using the verification SDK.

TypeScript example
```bash
# Test TypeScript app
cd test-ts-app
npm install
ts-node test.ts
```

JavaScript example
```bash
# Test JavaScript app  
cd ../test-app
npm install
node test.js
```
