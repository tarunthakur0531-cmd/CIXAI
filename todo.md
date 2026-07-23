# CIX — Second Brain TODO

## Database & Backend
- [x] Create database schema for memories, tags, tasks, agents, insights, events
- [x] Create backend routers for memories CRUD + semantic search
- [x] Create backend routers for tasks/agents CRUD with status tracking
- [x] Create backend router for brain chat with LLM streaming
- [x] Create backend router for brain insights (patterns, summaries)
- [x] Create backend router for knowledge graph data
- [x] Create backend router for model gateway (list available models)
- [x] Create backend router for thought capture with auto-tagging
- [x] Create backend router for privacy dashboard (stats, delete, retention)

## Frontend - Dark Cyberpunk Styling
- [x] Set up dark cyberpunk theme with neon accents in index.css
- [x] Add Google Fonts (JetBrains Mono, Orbitron) to index.html
- [x] Configure App.tsx with dark theme and all routes

## Dashboard
- [x] Build Dashboard Home page with Brain Activity Overview
- [x] Display memory stats, recent captures, active agents, cognitive load metrics
- [x] Build sidebar navigation (Agents, Memories, Tasks, Insights, Graph, Privacy, Models)

## Memory Engine
- [x] Build Memory Engine page with full CRUD (create, read, update, delete)
- [x] Implement memory tagging and categorization
- [x] Implement semantic search for memories
- [x] Build memory list with filters and sorting

## AI Brain Chat
- [x] Build AI Brain Chat page with streaming LLM responses
- [x] Connect chat to memory context for relevant answers
- [x] Display streaming markdown responses

## Knowledge Graph
- [x] Build interactive D3.js node-link graph visualization
- [x] Make nodes clickable to explore memory connections
- [x] Show relationships between memories, topics, and entities

## Thought Capture
- [x] Build quick-capture input component
- [x] Auto-tag thoughts using LLM
- [x] Integrate with Memory Engine

## Brain Insights Panel
- [x] Build Brain Insights page showing daily/weekly summaries
- [x] Display detected patterns, recurring themes, behavioral trends
- [x] Generate insights from stored memories using LLM

## Task and Agent Queue
- [x] Build Task/Agent Queue page with status tracking
- [x] Implement statuses: pending, thinking, done
- [x] LLM-powered task decomposition
- [x] Agent list with status indicators

## Privacy & Data Dashboard
- [x] Build Privacy Dashboard showing memories by category
- [x] Implement delete entries functionality
- [x] Show data retention controls and transparency metrics

## Model Gateway
- [x] Build Model Selector with dynamically loaded available models
- [x] Support per-session model switching

## Authentication
- [x] Ensure all brain data routes are protected via Manus OAuth
- [x] Per-user isolated memory storage

## Testing
- [x] Write unit tests for backend routers
- [x] Verify all pages render correctly
## Gaps to Address
- [x] Implement quick-capture UI component on Dashboard for thought capture
- [x] Add agents list/status indicators to Tasks page
- [x] Add per-entry delete in Privacy page
- [x] Add LLM task decomposition in Tasks page
- [x] Verify Knowledge Graph D3 visualization works with data
- [x] Write backend tests for new routers
- [x] Streamline Dashboard thought capture to call thoughtCapture.quickCapture
