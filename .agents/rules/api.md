---
trigger: model_decision
description: Apply when creating or updating API endpoints or request/response handling. Always enforce idempotency, validation, error handling, security, and contract consistency. Skip for frontend or AI tasks.
---

### API Design Rules

### Purpose

- Define consistent and secure API communication between frontend and backend

---

### Core Principles

- APIs must be predictable and consistent
- All endpoints must follow REST conventions
- Responses must be structured

---

### Endpoints

#### Naming

- Use clear, descriptive names
- Use HTTP verbs correctly

Example:
POST /analyze

---

### Request Rules

- Must validate all inputs
- Must reject invalid data
- Must use schemas

---

### Response Format

```json
{
  "status": "success | error",
  "data": {},
  "error": null
}

---

### Rate Limiting and Abuse Protection

### Required

- Implement rate limiting per IP (future)
- Limit number of requests per minute
- Protect expensive endpoints (AI calls)

---

### AI Protection

- Limit number of AI requests per user
- Prevent repeated abuse of analysis endpoint

---

### Forbidden

- Unlimited public access to AI endpoints

---

### Idempotency and Safe Operations

### Required

- GET endpoints must not modify state
- POST endpoints must handle duplicate requests safely
- Avoid unintended repeated processing

---

### Forbidden

- Side effects in read operations
```
