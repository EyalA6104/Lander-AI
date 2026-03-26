---
trigger: model_decision
description: Apply when generating AI logic, prompts, or handling AI outputs. Always enforce prompt structure, cost control, determinism, schema consistency, and input/output sanitization. Skip for frontend or backend tasks.
---

### AI System Rules

### Purpose

- Define strict rules for AI usage and prompt engineering
- Ensure deterministic, structured, and reliable outputs

---

### Core Principles

- AI is a tool, not a decision-maker
- Outputs must always be structured
- Avoid ambiguity in prompts
- Use multi-step pipelines

---

### Code Generation Constraints

#### Prompt Design

- Must include system role
- Must define clear task
- Must enforce strict output format (JSON)
- Must avoid open-ended instructions

#### Output Format

- Always JSON
- Must match predefined schema
- Must not include free text outside schema

---

### Required Pipeline

1. Input preprocessing
2. Structured extraction
3. Multi-step analysis
4. Scoring
5. Final formatting

---

### Prompt Rules

#### Required

- Explicit instructions
- Defined schema
- Clear constraints

#### Forbidden

- Vague prompts
- Single large prompts handling multiple tasks
- Unstructured outputs

---

### Validation Layer

- All AI outputs must be validated before use
- Reject invalid JSON
- Handle missing fields

---

### Security Rules

#### Data Protection

- Do not send sensitive user data to AI
- Mask or remove personal data before sending
- Avoid sending full documents if unnecessary

#### Prompt Injection Protection

- Never trust input blindly
- Sanitize user input before passing to AI
- Restrict prompt scope

---

### Anti-Patterns

- Using AI without validation
- Trusting AI output blindly
- Mixing multiple responsibilities in one prompt

---

### Output Expectations

- Deterministic, structured AI responses
- Clean separation between steps
- Reliable and safe AI integration

---

### Cost Control

### Required

- Minimize number of AI calls per request
- Use smaller models when possible
- Cache repeated results when possible

---

### Forbidden

- Unbounded AI usage
- Redundant AI calls for same input

---

### Determinism

### Required

- Prefer stable outputs
- Keep prompts consistent
- Avoid randomness when not needed

---

### Forbidden

- Unpredictable output formats
- Changing schema between calls
