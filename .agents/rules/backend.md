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

---

# Docker and Containerization

## Purpose

- Ensure 100% environment parity between local development and production
- Standardize the deployment artifact for GCP Cloud Run and future scaling

## Core Principle

- Containers must be stateless and immutable
- Optimize for "Fast Cold Starts" by keeping images lean

## Required Usage

- Every backend service must include a `Dockerfile` in its root directory
- A `.dockerignore` file is mandatory to exclude `__pycache__`, `.venv`, and `.git`
- Use slim or alpine base images to minimize the attack surface and image size

## Required Pattern (Cloud Run)

- The application must bind to `0.0.0.0` (not `127.0.0.1`)
- The application must listen on the port defined by the `$PORT` environment variable
- Set `PYTHONUNBUFFERED=1` to ensure logs are streamed to Cloud Logging in real-time

## Forbidden

- Hardcoding secrets, API keys, or `.env` files inside the Docker image
- Running the application process as the `root` user (use a non-privileged user)
- Including build tools, compilers, or test suites in the final production image
- Using the `latest` tag for base images; always pin to a specific version

## Optimization and Security

- Use multi-stage builds if the installation requires heavy build dependencies (e.g., C++ compilers)
- Order `Dockerfile` commands to maximize layer caching (copy `requirements.txt` before source code)
- Keep the final image size under 500MB where possible

## Anti-Patterns

- "Works on my machine" excuses; the Docker image is the only source of truth for "working"
- Embedding local database files (e.g., SQLite) inside the image
