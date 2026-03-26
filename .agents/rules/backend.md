---
trigger: model_decision
description: Apply when generating or modifying backend code, including API, DB, auth, and business logic. Always enforce security, architecture, DI, input validation, and error handling. Skip for frontend or AI tasks.
---

### Dependency Injection Rules (FastAPI)

### Purpose

- Enforce correct usage of FastAPI dependency system
- Replace traditional middleware patterns for request-level logic

---

### Core Principle

- Use dependencies for all request-scoped logic
- Do NOT use middleware for authentication or business logic

---

### Required Usage

#### Use dependencies for:

- Authentication (JWT verification)
- Authorization (roles, permissions)
- Database session injection
- Request context (current user, company)

---

### Example Responsibilities

- Extract token from request
- Validate and decode JWT
- Fetch user or related entities
- Return structured context to route

---

### Structure

server/app/api/dependencies/

- auth.py
- db.py

---

### Code Generation Constraints

- Dependencies must be pure functions
- Must return structured data (e.g. user object)
- Must raise HTTPException on failure
- Must not return raw errors
- Must not contain unrelated logic

---

### Forbidden

- Using middleware for authentication
- Mutating request objects (no req.user pattern)
- Embedding auth logic inside routes
- Mixing dependency logic with business logic

---

### Required Pattern

- Route receives dependency via injection
- Dependency handles validation and context
- Route uses returned data only

---

### Security Rules

- Always validate token before use
- Reject missing or malformed tokens
- Do not trust decoded payload without verification
- Never expose token data in responses

---

### Error Handling

- Use HTTPException with proper status codes:
  - 401 Unauthorized
  - 403 Forbidden
- Do not leak internal details in errors

---

### Anti-Patterns

- Express-style middleware replication
- Global mutable request state
- Silent auth failures

---

### Observability and Logging

### Purpose

- Ensure visibility into system behavior
- Enable debugging and monitoring in production

---

### Required

- Log all incoming requests (method, path)
- Log all errors with context
- Use structured logging (JSON format preferred)
- Include request ID if possible

---

### Forbidden

- Logging sensitive data (tokens, passwords, API keys)
- Using print statements
- Logging full request bodies without filtering

---

### Error Logging

- Log internal errors with full detail
- Return sanitized error messages to client

---

### Secrets and Configuration

### Required

- All secrets must be stored in environment variables
- Use .env files only for local development
- Validate required environment variables on startup

---

### Forbidden

- Hardcoding API keys
- Committing .env files to repository
- Logging secrets

---

### Testing Rules

### Required

- All core services must be testable independently
- Avoid tight coupling that prevents testing
- Use dependency injection to enable mocking

---

### Scope

- Unit test service logic
- Do not test framework internals

---

### Forbidden

- Embedding logic that cannot be tested

---

### Async and Performance

### Required

- Use async functions for I/O operations
- Avoid blocking operations in request handlers
- Offload heavy work to background tasks if needed

---

### Forbidden

- Blocking network calls in async routes
- Long-running operations inside request lifecycle

---

### Input Sanitization

### Required

- Validate all URLs before processing
- Reject malformed or unsafe inputs
- Normalize inputs before usage

---

### Forbidden

- Passing raw user input to external services
- Blindly trusting user-provided data
