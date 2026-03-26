---
trigger: model_decision
description: Apply when building UI, React components, Next.js pages, client logic, or styling. Always enforce type safety, styling, accessibility, API contract adherence. Skip for backend, API, or AI tasks.
---

### Frontend Rules (Next.js)

### Purpose

- Define strict rules for UI, client logic, and interaction with backend
- Ensure secure, maintainable, and scalable frontend code

---

### Core Principles

- Frontend is presentation only
- No business logic in UI
- All data must come from backend APIs
- Never trust client-side data

---

### Structure

- app/ → pages and routing
- components/ → reusable UI
- lib/ → API layer and helpers
- types/ → TypeScript contracts

---

### Code Generation Constraints

#### Components

- Must be small, reusable, and focused
- Must not exceed 150 lines
- Must not contain API calls
- Must not contain business logic

#### Pages (app/)

- Must only orchestrate components
- Must not contain heavy logic
- Must not directly call external APIs (only backend)

#### API Calls

- Must go through lib/api.ts only
- Must use centralized request handler
- Must handle errors explicitly

---

### Security Rules

#### Forbidden

- Exposing API keys in frontend
- Calling third-party APIs directly from frontend
- Storing sensitive data in localStorage/sessionStorage
- Trusting any user input without validation

#### Required

- Use environment variables (NEXT_PUBLIC only when safe)
- Sanitize all user inputs before sending
- Validate all responses before rendering
- Handle all API errors gracefully

---

### State Management

- Use local state or React Query
- Avoid global state unless necessary
- Do not duplicate server state

---

### UI Rules

- Use Tailwind CSS only
- Maintain consistent spacing and typography
- Avoid inline styles unless necessary

---

### Naming Conventions

- Components: PascalCase
- Functions: camelCase
- Files: consistent naming

---

### Anti-Patterns

- Fetch inside components
- Large monolithic components
- Mixing UI and logic
- Hardcoded URLs

---

### Output Expectations

- Clean, readable, modular UI code
- Strict typing with no "any"
- Clear separation between layers

---

### Data Contract Consistency

### Required

- Frontend types must match backend schemas exactly
- Do not redefine API structures manually
- Keep a single source of truth for data contracts

---

### Forbidden

- Mismatched API response assumptions
- Hardcoded response shapes
