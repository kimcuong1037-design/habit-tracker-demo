# Habit Tracker - Project Guidelines

## Project Overview
A full-stack habit tracking application built as a Bootcamp demo project.
The app helps users build good habits through daily check-ins with scientific backing from behavioral psychology.

## Key Documents
- Requirements: `docs/requirements/`
- Product: `docs/product/`
- Design: `docs/design/`
- Architecture: `docs/architecture/`
- Project Plan: `docs/PROJECT-PLAN.md`
- Review Lessons: `docs/architecture/review-lessons.md` (实践经验积累，开发前必读)

## Tech Stack
- Frontend: TypeScript + React + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: SQLite via Prisma ORM
- API: RESTful
- Structure: Monorepo (packages/client + packages/server)
- Auth: JWT (bcrypt + jsonwebtoken), see DD-015

## Development Conventions
- Language: TypeScript (shared across frontend & backend)
- Code style: ESLint + Prettier
- Commit messages: Conventional Commits format
- Branch strategy: feature branches off main

## Key Design Decisions
- Habits limited to 5 active max (science-backed)
- Habit creation requires at least one Cue (Trigger or Habit Stacking)
- Streak break: comfort message + retroactive check-in (3x/month)
- Milestone reviews at 7, 21, 30, 66, 100 days
- Daily UX: minimal; milestones: warm + data-rich

## Current Status
All phases complete (0–5). Project delivered. See `docs/RETROSPECTIVE.md` for full retrospective.
