# Contributing to SPDCI Compliance Test Suite

Thank you for your interest in contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Run tests: `npm test`

## Development Setup

```bash
# Install dependencies
npm install

# Run Social Registry tests against a local server
API_BASE_URL=http://localhost:8080 npm run test:social

# Run the mock server for client testing
npm run mock-server
```

## Project Structure

- `common/` - Shared infrastructure used across all domains
- `domains/` - Domain-specific tests and configurations
- `spec/` - OpenAPI specifications

See [README.md](README.md) for detailed structure.

## Adding Tests

### Adding a new test scenario

1. Create or update a `.feature` file in the appropriate domain folder
2. Add step definitions in the corresponding `support/` folder
3. Use appropriate tags: `@tier=core`, `@smoke`, `@profile=sr-registry`

### Adding a new domain

1. Create folder: `domains/<domain>/`
2. Add `config.js` with domain-specific settings
3. Add `payloads/` with request generators
4. Add `features/` with test scenarios
5. Copy the OpenAPI spec to `spec/`

## Code Style

- Use ES modules (`import`/`export`)
- Follow existing code patterns
- Keep step definitions focused and reusable
- Document complex validation logic

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure all tests pass
4. Submit a pull request with a description of changes

## Reporting Issues

Please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS)
- Relevant logs or error messages

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
