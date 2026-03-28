---
trigger: always_on
---

# Project Rules

### AGENTS.md — Engineering Rules and Architecture Guide

### Purpose

- Define strict engineering standards for all agents in this repository
- Ensure maintainability, scalability, and production-level quality
- Enforce consistency across frontend, backend, and AI systems
- These rules are mandatory unless explicitly overridden

---

### System Overview

### Architecture

Frontend (Next.js)  
↓  
Backend API (FastAPI)  
↓  
Services Layer (AI, Scraping, Logic)

### Core Principles

- Enforce strict separation of concerns
- Frontend handles presentation only
- Backend handles all computation and logic
- Services layer handles all business logic
- Prefer clarity over cleverness
- Build for production from day one

---

### Frontend Rules (Next.js)

### Structure

frontend/

- app/
- components/
- lib/
- types/
- public/

### Responsibilities

#### app/

- Defines routes and pages
- Handles layout structure
- Must remain minimal in logic

#### components/

- Contains reusable UI components
- Must be pure and presentation-focused
- No API calls allowed

#### lib/

- Handles API communication
- Contains helper functions
- Responsible for data transformation

#### types/

- Defines all TypeScript types
- Must strictly match backend schemas
- No usage of "any"

---

### Frontend Rules

#### Forbidden

- API calls inside components
- Business logic inside pages
- Deep unnecessary component nesting

#### Required

- Strong TypeScript usage
- Small and reusable components
- Clear separation between UI and logic

---

### Naming Conventions

- Components: PascalCase
- Functions: camelCase
- Files: consistent naming per folder

---

### UI Guidelines

- Use Tailwind CSS only
- Keep design minimal and clean
- Maintain consistent spacing and typography
- Prioritize readability over complexity

---

### Backend Rules (FastAPI)

### Structure

server/app/

- main.py
- api/routes/
- services/
- schemas/
- models/
- core/

---

### Responsibilities

#### main.py

- Initializes FastAPI application
- Registers routes
- Configures middleware (CORS)

#### api/routes/

- Defines API endpoints only
- Must not contain business logic
- Delegates work to services

#### services/

- Contains all business logic
- Handles AI processing, scraping, scoring
- Must be modular and reusable

#### schemas/

- Defines request and response models
- Uses Pydantic for validation
- Enforces strict typing

#### models/

- Defines database models (future use)

#### core/

- Handles configuration and environment variables

---

### Backend Rules

#### Forbidden

- Business logic inside routes
- Direct database access in routes
- Mixing multiple responsibilities in one file

#### Required

- Modular service design
- Clear function boundaries
- Typed inputs and outputs

---

### AI System Rules

### Principles

- AI is a tool, not a black box
- All outputs must be structured (JSON)
- Avoid large, monolithic prompts

---

### Required Pipeline

- Input processing
- Structured extraction
- Multi-step analysis
- Scoring
- Output formatting

---

### Prompt Rules

- Always define system role
- Always enforce output schema
- Avoid vague instructions
- Prefer deterministic outputs

---

### Forbidden

- Free-text AI responses in production
- Mixing multiple responsibilities in a single prompt

---

### Data Flow Rules

### Standard Flow

- Frontend collects user input
- Frontend sends request via lib/api
- Backend route receives request
- Route calls service layer
- Service processes data
- Backend returns structured response
- Frontend renders result

---

### Rule

- Each layer must have a single responsibility

---

### API Design Rules

### Endpoints

- Follow RESTful conventions
- Use clear and descriptive naming

Example:
POST /analyze

---

### Response Format

{
"status": "success",
"data": {},
"error": null
}

---

### Error Handling

- Never expose raw errors
- Always return structured error responses

---

### Code Quality Rules

### General

- No unused code
- No commented-out code blocks
- No console logs in production

---

### Functions

- Must be small and focused
- Must have a single responsibility
- Must use clear naming

---

### Files

- One responsibility per file
- Avoid files larger than 300 lines

---

### Environment Rules

### Frontend

.env.local

### Backend

.env

---

### Rules

- No hardcoded values
- Use environment variables for:
  - API URLs
  - API keys
  - configuration

---

### Development Flow

### Steps

- Define schema
- Create API route
- Implement service logic
- Connect frontend
- Test end-to-end
- Refactor

---

### Rule

- Do not skip layers
- Do not jump directly to AI integration

---

### Anti-Patterns (Forbidden)

- Monolithic files
- Tight coupling between frontend and backend
- Unstructured AI outputs
- Duplicate logic across layers
- Overengineering early

---

### Final Principle

- Build as if this system will go to production
- Optimize for clarity, scalability, and maintainability

---

### Agent Behavior

### Agents must

- Follow architecture strictly
- Maintain separation of concerns
- Prefer explicit structure
- Ask for clarification when uncertain

### Agents must not

- Invent new structure
- Skip defined layers
- Mix responsibilities

---

### End of Rules
