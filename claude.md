# CFO Diagnostic Platform

## What This Is
Financial maturity assessment tool. Users answer questions, system scores their finance workflow maturity, identifies gaps, recommends actions.

## Architecture
- `CFOdiagnosis_v1/` - Backend (Express.js, TypeScript, Supabase)
- `CFOdiagnosis_v2/` - Frontend (React 19, Vite, TypeScript)

## Key Principles (DO NOT VIOLATE)
1. Spec v2.6.4 is frozen — don't modify specs/ without explicit approval
2. Scoring logic must be pure functions — no side effects
3. Missing answers = 0 score (conservative)
4. Maturity gates are deterministic, evidence-based

## Current State Machine
NOT_STARTED → IN_PROGRESS → COMPLETED → LOCKED

## When Working on This Codebase
- Test scoring changes against existing test cases
- Don't break the API contract (check endpoints)
- Frontend state flows through stateMachine.ts
