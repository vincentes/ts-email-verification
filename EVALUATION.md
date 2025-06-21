# Evaluation

## Challenges encountered
There were a few issues encountered when building this SDK. Namely, (1) the different target options of the `wasm-pack` (2) ECMAScript vs CommonJS (3) `ts-jest` known issues with ES modules.

To create the WebAssembly bindings, we need to decide on which module system to use to wrap the Rust code. Options are: `ES2015`, `ES2020`, `ES2022`, and `ESNext` for EcmaScript Modules (ESM). This is standard for NodeJS (v14+) and modern browsers, so initially, the Rust code was compiled into WebAssembly using `wasm-pack`'s web target. This flag outputs an ES module.

However, when attempting to execute tests on the TypeScript SDK wrapper, there was an issue. Even after including `transformIgnorePatterns` to transform ESM from `node_modules` into CommonJS and using the `useESM` property on the `jest.config.js` file, each `npx jest test` would output an error similar to the one described in this [StackOverFlow post](https://stackoverflow.com/questions/49263429/jest-gives-an-error-syntaxerror-unexpected-token-export).

There were two paths:

(1) Switch to `vitest`

(2) Use CommonJS as the output for the WebAssembly bindings

To reduce the coding challenge complexity for a 6-8hr timespan, option (2) was chosen.

The only target that outputs CommonJS is `wasm-pack build --target nodejs`.

## Handling error cases
A few distinctions. For the purpose of this challenge:

(1) Expected RFC-5321 validation errors such as: TLD requirements, empty strings, length limits, and invalid email formats (regex-based) were handled as a valid `EmailParseResult`, with `is_valid` set to false.

(2) Unexpected runtime errors such as regex compilation issues, were treated with `EmailParseError`.


## Trade offs
1. Using CommonJS as output for the `wasm-pack`, which means that the Rust WASM bindings only work for NodeJS environment unless transformation is done using babel plugins.

2. Another trade off was the fact that the `tarpaulin` code coverage report indicated 72% code coverage, which should be 80%+ ideally for critical systems like email validation.

3. Finally, the domain scoring algorithm was simplified to:

- Score of 80 for trusted domains:
  - google.com
  - outlook.com 
  - yahoo.com

- Score of 20 for disposable email domains:
  - mailinator.com
  - tempmail.com

- Score of 50 for any other email domain.

## Potential Improvements 
* Building for `web` usage. Needs a more comprehensive setup. However, if `vitest` was used instead of `jest`, most likely the transformations could be applied in the wrapper SDK. Browsers, APIs, and CLIs, could simply use the SDK. 

* Risks scoring system needs to have a more extensive list of trusted providers. Using a third-party API for risk scoring would be ideal depending on use case.

* Uploading to NPM instead of requiring manually building the SDK for usage.

* Increase to 80%+ code coverage if used in a production environment.

* Unicode and international domains should be valid.

* Strict RFC-5321 compliance for edge cases for 100% valid email coverage.

<img width="512" alt="Screenshot 2025-06-21 at 2 03 17 PM" src="https://github.com/user-attachments/assets/d480ad3e-236c-410b-9c9a-d0a5bf62cb90" />

<img width="877" alt="image" src="https://github.com/user-attachments/assets/b8c5b354-1d48-4f76-af41-f731d9f848b4" />

