import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: ["node_modules/(?!(email-validator-wasm)/)"],
  moduleNameMapper: {
    "^../rust-wasm/pkg$": "<rootDir>/../rust-wasm/pkg",
  },
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "**/*.{ts,js}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/coverage/**",
    "!**/wasm/**",
    "!**/jest.config.js",
    "!**/rollup.config.js",
    "!**/tsconfig*.json",
  ],
};