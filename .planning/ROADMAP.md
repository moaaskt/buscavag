# ROADMAP - v12.0: Polimento UI/UX, Total Multi-tenancy, Scraper Stream & Zero-State DB

## Phases

- [x] **Phase 45: Kanban Isolamento Multi-tenant**
  - Create `/api/candidate/board` API reading strictly from `user_saved_jobs` joined with `jobs`.
  - Update `CandidateRepository.updateSavedJobStatus` to handle drag-and-drop status changes.
  - Create `/api/candidate/board/status` to update the user's specific job status.
  - Refactor `src/app/board/page.tsx` to use the new endpoints and initialize empty.

- [ ] **Phase 46: Paywall Free na Análise de CV**
  - Add restriction in `src/app/api/candidate/analyze-cv/route.ts` checking `if (tier === 'free' && resume.ai_analysis) return 403`.
  - Update UI components rendering the "Reanalisar" button to change to "Upgrade Pro" when restricted.

- [ ] **Phase 47: Sincronização do Resumo para Bio**
  - Update payload schema of `/api/candidate/sync-skills/route.ts` to accept `summary`.
  - Update `repo.syncSkillsToProfile` to save `summary` to the `bio` column in `candidate_profiles`.
  - Ensure the UI correctly dispatches the summary and refreshes the profile tab.

- [ ] **Phase 48: Polimento de UI, Scraper Stream & Zero-State DB**
  - Verify and refine scraper logs streaming visual layout.
  - Add robust fallback states for zero-state DB scenarios in candidate dashboard and scrapers hub.
