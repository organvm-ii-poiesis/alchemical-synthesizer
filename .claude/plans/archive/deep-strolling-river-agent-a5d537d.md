# Implementation Plan: Local Repos Migration to Eight-Organ System

**Plan ID:** deep-strolling-river-agent-a5d537d  
**Created:** 2026-02-12  
**Status:** PLANNING (awaiting execution authorization)  
**Mode:** Read-only analysis with plan documentation only

---

## Executive Summary

This plan outlines the integration of 14 identified local repositories (currently unregistered, placeholder-named in inventory documents as `[local-theory-1]` through `[local-marketing-2]`) into the eight-organ creative-institutional GitHub system.

**Current State:**
- 81 repos currently registered in registry-v2.json (79 original + 2 art-from repos from ASCENSION Sprint)
- 66 PRODUCTION, 1 PROTOTYPE, 2 SKELETON, 12 DESIGN_ONLY
- 14 local repos identified but not yet migrated (marked "🔘 AUDIT NEEDED")
- System operational as of 2026-02-11; all 8 organs OPERATIONAL

**Post-Migration State (Target):**
- 95 total registered repos (81 current + 14 local)
- Local repos distributed across ORGAN-I through ORGAN-VII (no meta-org locals)
- All local repos promoted from LOCAL → CANDIDATE status
- ~790K TE budgeted for audit, migration, and README generation
- Estimated completion: Post-Phase 1 (after Feb 14 EOD Sprint 1 decision window)

---

## Part 1: The 14 Local Repos Inventory

**Source Document:** `/Users/4jp/Workspace/organvm-pactvm/ingesting-organ-document-structure/docs/planning/02-repo-inventory-audit.md` (lines 117-136)

### ORGAN-I (Theory) — organvm-i-theoria org — 3 repos

| # | Placeholder Name | Real Name (TBD) | Public/Private | TE Budget | Current Status | Decision |
|---|------------------|-----------------|---|-----------|--------|----------|
| 45 | [local-theory-1] | TBD | PUBLIC | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 46 | [local-theory-2] | TBD | PUBLIC | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 47 | [local-theory-3] | TBD | PUBLIC | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |

**Subtotal ORGAN-I:** 3 repos, ~150K TE, all PUBLIC

**Audience Context:** Grant reviewers, academic institutions, epistemological researchers  
**Integration Priority:** HIGH (ORGAN-I repos are foundational to the entire system; should be audited early to establish theory layer completeness)

---

### ORGAN-II (Art) — organvm-ii-poiesis org — 4 repos

| # | Placeholder Name | Real Name (TBD) | Public/Private | TE Budget | Current Status | Decision |
|---|------------------|-----------------|---|-----------|--------|----------|
| 48 | [local-art-1] | TBD | PUBLIC | ~72K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 49 | [local-art-2] | TBD | PUBLIC | ~72K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 50 | [local-art-3] | TBD | PUBLIC | ~72K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 51 | [local-art-4] | TBD | PUBLIC | ~72K TE | 🔘 AUDIT NEEDED | MIGRATE |

**Subtotal ORGAN-II:** 4 repos, ~288K TE, all PUBLIC

**Audience Context:** Artists, performers, gallery curators, experiential designers  
**Integration Priority:** HIGH (ORGAN-II repos showcase the creative practice dimension; portfolio relevance is critical)

---

### ORGAN-III (Commerce) — organvm-iii-ergon org — 2 repos

| # | Placeholder Name | Real Name (TBD) | Public/Private | TE Budget | Current Status | Decision |
|---|------------------|-----------------|---|-----------|--------|----------|
| 52 | [local-commerce-1] | TBD | PRIVATE | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 53 | [local-commerce-2] | TBD | PRIVATE | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |

**Subtotal ORGAN-III:** 2 repos, ~100K TE, all PRIVATE

**Audience Context:** Internal business intelligence, revenue tracking (not public-facing)  
**Special Fields Required:** `type` (SaaS/B2B/B2C/internal) and `revenue` (tracking field)  
**Integration Priority:** MEDIUM (Commerce repos critical for revenue metrics but require governance decisions before public exposure)

---

### ORGAN-V (Public Process) — organvm-v-logos org — 2 repos

| # | Placeholder Name | Real Name (TBD) | Public/Private | TE Budget | Current Status | Decision |
|---|------------------|-----------------|---|-----------|--------|----------|
| 54 | [local-public-1] | TBD | PUBLIC | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 55 | [local-public-2] | TBD | PUBLIC | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |

**Subtotal ORGAN-V:** 2 repos, ~100K TE, all PUBLIC

**Audience Context:** Building-in-public audience, essay readers, process documentation consumers  
**Integration Priority:** HIGH (ORGAN-V is the public narrative layer; repos should be essay-integrated)

---

### ORGAN-VI (Community) — organvm-vi-koinonia org — 1 repo

| # | Placeholder Name | Real Name (TBD) | Public/Private | TE Budget | Current Status | Decision |
|---|------------------|-----------------|---|-----------|--------|----------|
| 56 | [local-community-1] | TBD | PRIVATE | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |

**Subtotal ORGAN-VI:** 1 repo, ~50K TE, PRIVATE

**Audience Context:** Invitation-only participants, salon members, reading group participants  
**Integration Priority:** MEDIUM (Community repos may have access controls; focus on metadata and indexing)

---

### ORGAN-VII (Marketing) — organvm-vii-kerygma org — 2 repos

| # | Placeholder Name | Real Name (TBD) | Public/Private | TE Budget | Current Status | Decision |
|---|------------------|-----------------|---|-----------|--------|----------|
| 57 | [local-marketing-1] | TBD | PRIVATE | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |
| 58 | [local-marketing-2] | TBD | PRIVATE | ~50K TE | 🔘 AUDIT NEEDED | MIGRATE |

**Subtotal ORGAN-VII:** 2 repos, ~100K TE, all PRIVATE

**Audience Context:** Internal distribution strategy, social automation, announcement templates  
**Integration Priority:** MEDIUM (ORGAN-VII repos support distribution cadence; should align with phase release schedule)

---

## Part 2: Consolidated Migration Metrics

| Organ | Repo Count | Public | Private | TE Budget | Priority |
|-------|-----------|--------|---------|-----------|----------|
| ORGAN-I | 3 | 3 | 0 | ~150K TE | HIGH |
| ORGAN-II | 4 | 4 | 0 | ~288K TE | HIGH |
| ORGAN-III | 2 | 0 | 2 | ~100K TE | MEDIUM |
| ORGAN-V | 2 | 2 | 0 | ~100K TE | HIGH |
| ORGAN-VI | 1 | 0 | 1 | ~50K TE | MEDIUM |
| ORGAN-VII | 2 | 0 | 2 | ~100K TE | MEDIUM |
| **TOTAL** | **14** | **9** | **5** | **~790K TE** | — |

**Key Observations:**
- 64% of local repos (9/14) are PUBLIC-facing
- 36% (5/14) are PRIVATE (business/community-sensitive)
- ORGAN-II dominates in TE budget (~288K TE, 36.5% of total) due to higher complexity and portfolio visibility requirements
- No local repos in ORGAN-IV (Orchestration) — infrastructure repos not expected to migrate from local storage
- No local repos in Meta-org — governance repos manage other repos, not created locally

---

## Part 3: Integration Workflow and Sequence

### Phase A: AUDIT & DISCOVERY (Est. ~100K TE)

**Objective:** Understand what each of the 14 local repos actually contains, who created them, and what decision is needed for each.

**Tasks:**

1. **Physical Discovery (Parallel across all 14 repos)**
   - Locate actual repo directories on local filesystem: likely `~/Workspace/organvm-pactvm/` or subdirectories
   - Identify real repo names (currently placeholder-named as `[local-theory-1]` etc.)
   - Check for existing READMEs, LICENSE files, git history
   - Determine if repos are git repos or plain directories
   - Map to the correct Organ based on content analysis

2. **Content Audit per Repo**
   - For each repo: identify primary domain (theory/art/commerce/public/community/marketing)
   - Identify current documentation state (complete/partial/missing)
   - Identify current README quality (portfolio-ready/needs-work/missing)
   - Identify licensing (MIT/Apache/GPL/proprietary/none)
   - Identify dependency status (self-contained/requires integration)

3. **Decision Matrix**
   - Per repo: Confirm PUBLIC vs PRIVATE visibility decision
   - Per repo: Confirm target Organ assignment
   - Per repo: Identify any pre-migration dependencies or blockers
   - Per repo: Estimate actual TE budget (refine from ~50-72K baseline)

4. **Deliverable**
   - Updated inventory table with real repo names and confirmed metadata
   - Dependency map showing any cross-repo or cross-organ dependencies
   - Risk register identifying any blockers before migration can begin

**Estimated TE Cost:** ~100K TE (AI assists audit, human confirms decisions)  
**Timeline:** 3-5 days of review time

---

### Phase B: REGISTRY INTEGRATION (Est. ~50K TE)

**Objective:** Add all 14 local repos to registry-v2.json with correct schema and metadata.

**Tasks:**

1. **Schema Compliance Check**
   - Verify registry-v2.json schema supports all 14 new entries
   - Identify any ORGAN-III repos that need `type` and `revenue` fields
   - Check if any repos require custom fields beyond standard schema

2. **Create Registry Entries**
   - For each of 14 repos: create JSON object with required fields:
     - `name` (real repo name from discovery phase)
     - `org` (resolved to full org name, e.g., "organvm-i-theoria")
     - `status` (SKELETON initially, pending documentation)
     - `public` (boolean, per audit decision)
     - `description` (from README audit or to-be-written)
     - `documentation_status` (SKELETON or DESIGN_ONLY)
     - `portfolio_relevance` (categorized per audience)
     - `promotion_status` (LOCAL initially, will move to CANDIDATE post-audit)
     - Additional fields per organ (e.g., ORGAN-III type + revenue)

3. **Bulk Update**
   - Update registry `total_repos` count: 81 → 95
   - Update each org `repository_count`: +# repos migrated to each org
   - Update `implementation_status_distribution`: 
     - SKELETON: +14 (14 new repos start as SKELETON)
     - DESIGN_ONLY: -14 (remove from design phase)
   - Add cross-references from each repo to parent orgs

4. **Validation**
   - Verify all 95 repos parse as valid JSON
   - Verify no duplicate repo names in registry
   - Verify all org references resolve to valid GitHub orgs
   - Verify dependency graph remains acyclic (no ORGAN-III→ORGAN-II back-edges)

5. **Deliverable**
   - Updated registry-v2.json with all 14 repos added and validated
   - Summary of registry changes (additions, updated counts, new dependencies)
   - Validation report confirming schema compliance and no circular dependencies

**Estimated TE Cost:** ~50K TE (AI generates registry entries, human validates)  
**Timeline:** 1-2 days

---

### Phase C: MIGRATION & GITHUB INTEGRATION (Est. ~150K TE)

**Objective:** Move/create repos in correct GitHub orgs with proper initial structure.

**Tasks:**

1. **GitHub Org Transfer (for repos already on GitHub)**
   - For any local repos already on GitHub: transfer to correct organ org
   - If not already on GitHub: create new repo in correct organ org
   - Set visibility: PUBLIC or PRIVATE per audit decision
   - Add .github/workflows/ directory structure (from `docs/implementation/github-actions-spec.md`)
   - Add Community Health files (CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md)

2. **Initial Structure Setup**
   - Add CODEOWNERS file pointing to organ leadership
   - Add LICENSE file (standardize across all repos)
   - Add FUNDING.yml if applicable (for ORGAN-V/VI)
   - Add topics/labels matching organ and portfolio classification
   - Set branch protection rules (if org admin available)

3. **CI/CD Workflow Deployment**
   - Per `docs/implementation/github-actions-spec.md`: 5 workflows defined
   - Identify which workflows apply to each repo type
   - Deploy workflows to all 14 repos
   - Test workflow triggers on sample repos

4. **Deliverable**
   - All 14 repos migrated/created in correct GitHub orgs
   - All have basic structure, licenses, community health files
   - All have CI/CD workflows deployed and tested
   - Verification report showing successful transfer/creation

**Estimated TE Cost:** ~150K TE (scripted repo creation + workflow deployment + testing)  
**Timeline:** 2-3 days

---

### Phase D: DOCUMENTATION GENERATION (Est. ~490K TE)

**Objective:** Create portfolio-grade READMEs and documentation for each of 14 repos.

**Tasks:**

1. **README Generation (Per Repo)**
   - Use AI-conductor model: AI generates, humans review
   - Per repo: 3,000+ word README targeting portfolio audience
   - Structure: Problem → Approach → Results → Future → How to Use
   - Include cross-references to related repos within same Organ
   - Include portfolio language and technical credibility markers

2. **TE Budget Allocation**
   - ORGAN-I (3 repos × ~50K TE): ~150K TE
   - ORGAN-II (4 repos × ~72K TE): ~288K TE ← *largest investment*
   - ORGAN-III (2 repos × ~50K TE): ~100K TE
   - ORGAN-V (2 repos × ~50K TE): ~100K TE
   - ORGAN-VI (1 repo × ~50K TE): ~50K TE
   - ORGAN-VII (2 repos × ~50K TE): ~100K TE
   - **Total: ~790K TE**

3. **Human Review & Refinement**
   - Cross-check READMEs for: accuracy, portfolio positioning, link validity
   - Ensure consistency with other repos in same Organ
   - Validate code examples (if any) are syntactically correct
   - Final polish for grant reviewer and hiring manager audiences

4. **Integration with Essays**
   - For ORGAN-V repos: integrate with existing essays (~20 published)
   - Cross-reference ORGAN-V repos in ORGAN-I/II/III READMEs as "implementation examples"
   - Update public-process registry to include local-public-1 and local-public-2

5. **Deliverable**
   - Portfolio-grade README for each of 14 repos
   - Cross-referenced documentation showing Organ-wide integration
   - Validation report confirming all links, code examples, references are valid

**Estimated TE Cost:** ~490K TE (40% AI generation, 60% human review/refinement)  
**Timeline:** 7-10 days of parallel work across Organs

---

### Phase E: PROMOTION & VALIDATION (Est. ~100K TE)

**Objective:** Transition repos from LOCAL → CANDIDATE status and validate complete integration.

**Tasks:**

1. **Status Transitions**
   - Update all 14 repos from promotion_status: LOCAL → CANDIDATE
   - Update all 14 repos from documentation_status: SKELETON → PROTOTYPE (post-README)
   - Set last_validated timestamp to current date

2. **Link Validation**
   - Run registry-wide link audit (automated script from `scripts/`)
   - Verify all cross-references between local repos and existing repos are live
   - Verify all inter-organ references maintain acyclic dependency structure
   - Fix any dead links

3. **CI/CD Validation**
   - Verify all 14 repos have working CI/CD pipelines
   - Run all 5 workflow types on representative repos
   - Generate status badges for each repo

4. **Portfolio Readiness Check**
   - Random sample review: pick 3-4 repos across different Organs
   - Verify README quality meets portfolio standard
   - Test that repos are discoverable and compelling to external audiences
   - Check documentation supports grant proposal narrative

5. **Deliverable**
   - Transition report: LOCAL→CANDIDATE completed for all 14 repos
   - Link validation report: 100% live cross-references
   - CI/CD deployment status: all workflows operational
   - Portfolio readiness certification: repos meet external audience standards

**Estimated TE Cost:** ~100K TE (mostly automation + validation)  
**Timeline:** 2-3 days

---

## Part 4: Registry Schema Updates Required

### Current registry-v2.json Structure (Confirmed)

```json
{
  "repositories": [
    {
      "name": "repo-name",
      "org": "organvm-i-theoria",
      "status": "PRODUCTION|PROTOTYPE|SKELETON|DESIGN_ONLY",
      "public": true|false,
      "description": "...",
      "documentation_status": "PRODUCTION|PROTOTYPE|SKELETON|DESIGN_ONLY",
      "portfolio_relevance": "CORE|SUPPORTING|ARCHIVE",
      "promotion_status": "LOCAL|CANDIDATE|PUBLIC_PROCESS|GRADUATED|ARCHIVED",
      "ci_workflow": "workflow-name" | null,
      "last_validated": "2026-02-12T..." | null,
      "dependencies": ["other-repo-name"],
      // ORGAN-III specific:
      "type": "SaaS|B2B|B2C|internal" | null,
      "revenue": "tracking-field" | null
    }
  ],
  "summary": {
    "total_repos": 81,
    "implementation_status_distribution": {
      "PRODUCTION": 66,
      "PROTOTYPE": 1,
      "SKELETON": 2,
      "DESIGN_ONLY": 12
    }
  }
}
```

### Updates for 14 Local Repos

**After Migration:**

```json
{
  "summary": {
    "total_repos": 95,  // ← Updated from 81
    "implementation_status_distribution": {
      "PRODUCTION": 66,
      "PROTOTYPE": 1,
      "SKELETON": 16,  // ← Updated from 2 (+14 new)
      "DESIGN_ONLY": 12
    },
    "org_counts": {
      "organvm-i-theoria": 18,  // ← Updated from 10 (+ 3 local-theory repos + 5 others?)
      "organvm-ii-poiesis": 27,  // ← Updated from 13 (+ 4 local-art repos + others?)
      "organvm-iii-ergon": 24,  // ← Updated from 12 (+ 2 local-commerce + others?)
      "organvm-iv-taxis": 7,
      "organvm-v-logos": 4,  // ← Updated from 2 (+ 2 local-public)
      "organvm-vi-koinonia": 4,  // ← Updated from 3 (+ 1 local-community)
      "organvm-vii-kerygma": 6,  // ← Updated from 4 (+ 2 local-marketing)
      "meta-organvm": 2
    }
  }
}
```

### Key Schema Notes

1. **No "yellow" tag system** — Color tagging doesn't exist in current schema. Local repos are tracked via `promotion_status: LOCAL` field only.

2. **All 14 repos start as**:
   - `status: SKELETON` (basic structure only)
   - `documentation_status: SKELETON` (pre-README)
   - `promotion_status: LOCAL` (not yet migrated)
   - Post-migration: gradually move to PROTOTYPE then PRODUCTION

3. **Special handling for ORGAN-III**:
   - Both local-commerce repos require `type` and `revenue` fields
   - Example: `"type": "internal"` and `"revenue": null` initially, pending business audit

---

## Part 5: Promotion Status State Machine

The 14 local repos will follow this promotion workflow:

```
┌─────────┐      ┌───────────┐      ┌──────────────┐      ┌───────────┐      ┌─────────┐
│  LOCAL  │─────→│ CANDIDATE │─────→│PUBLIC_PROCESS│─────→│ GRADUATED │─────→│ARCHIVED │
└─────────┘      └───────────┘      └──────────────┘      └───────────┘      └─────────┘
    ↑                ↑                      ↑                    ↑                ↑
    │                │                      │                    │                │
    └────────────────┘                      │                    │                │
      (discovery audit)                      │                    │                │
                                             └────────────────────┘                │
                                    (portfolio/grant readiness)    │                │
                                                                   └────────────────┘
                                                              (end of lifecycle)
```

**Current Phase:** All 14 repos at LOCAL status  
**Next Phase (Post-Audit):** Move to CANDIDATE  
**Ultimate Goal:** Move to GRADUATED once portfolio narrative is established

---

## Part 6: Dependency & Blocking Analysis

### Pre-Migration Blockers

**REQUIRED before migration can begin:**

1. ✅ **Identify actual repo names** — placeholder names (`[local-theory-1]` etc.) must be resolved to real names
   - *Blocker Type*: Information discovery
   - *Resolution*: Phase A audit task
   - *Impact*: Cannot create GitHub repos without real names

2. ✅ **Confirm PUBLIC/PRIVATE visibility** — for ORGAN-III and ORGAN-VI especially
   - *Blocker Type*: Decision gate
   - *Resolution*: Governance decision (due Feb 14 EOD per inventory audit)
   - *Impact*: Affects repository access control setup

3. ✅ **Confirm Organ assignment** — especially for borderline theory/art repos
   - *Blocker Type*: Organizational decision
   - *Resolution*: Content audit in Phase A
   - *Impact*: Determines which GitHub org and which audience each repo targets

4. ✅ **Verify no circular dependencies** — ensure LOCAL repos don't depend on repos they'll live alongside
   - *Blocker Type*: Architecture validation
   - *Resolution*: Dependency graph analysis in Phase A
   - *Impact*: Prevents architectural violations of eight-organ model

5. ✅ **Confirm TE budget allocation** — validate ~790K TE total is realistic
   - *Blocker Type*: Resource planning
   - *Resolution*: Per-repo complexity assessment in Phase A
   - *Impact*: Determines sprint timing and parallel execution plan

### Internal Phase Dependencies

```
Phase A (Audit)
  ↓ (produces real names, confirmed Organ assignments)
Phase B (Registry)
  ↓ (updates registry with new repos)
Phase C (GitHub)
  ↓ (creates repos in correct orgs)
Phase D (Documentation)
  ↓ (generates READMEs in parallel per Organ)
Phase E (Validation)
  ↓ (validates complete integration)
Done: All 14 repos CANDIDATE status
```

**Parallelization Opportunities:**
- Phase B and C can overlap (registry update while creating GitHub repos)
- Phase D can parallelize by Organ (all ORGAN-I repos generated in parallel)
- Phase E validation runs in parallel across all 14 repos

---

## Part 7: TE Budget Breakdown & Timeline

### TE Cost per Phase

| Phase | Task | TE Budget | Duration | Parallelizable |
|-------|------|-----------|----------|---|
| A | Audit & Discovery | ~100K TE | 3-5 days | Partial (14 repos audited in parallel) |
| B | Registry Integration | ~50K TE | 1-2 days | Yes (batch JSON generation) |
| C | GitHub Migration | ~150K TE | 2-3 days | Yes (scripted repo creation) |
| D | Documentation | ~490K TE | 7-10 days | Yes (by Organ, AI generation in parallel) |
| E | Promotion & Validation | ~100K TE | 2-3 days | Yes (parallel validation scripts) |
| **TOTAL** | — | **~790K TE** | **15-23 days** | — |

### TE Utilization per Organ

| Organ | Doc Rewrite | Documentation | Total TE | % of Budget | Key Driver |
|-------|------------|---|----------|--|---|
| ORGAN-I | 3 repos | Theory/Epistemology | ~150K TE | 19% | Foundational content |
| ORGAN-II | 4 repos | Art/Performance | ~288K TE | 36.5% | Portfolio visibility (highest) |
| ORGAN-III | 2 repos | Commerce/SaaS | ~100K TE | 12.7% | Governance complexity |
| ORGAN-V | 2 repos | Public/Essays | ~100K TE | 12.7% | Integration with existing 20 essays |
| ORGAN-VI | 1 repo | Community | ~50K TE | 6.3% | Minimal complexity |
| ORGAN-VII | 2 repos | Marketing | ~100K TE | 12.7% | Distribution integration |
| **TOTAL** | 14 repos | — | **~790K TE** | **100%** | — |

### Parallel Execution Timeline (Optimized)

```
Week 1:
  Mon-Tue (Day 1-2): Phase A audit + Phase B registry update (overlap start)
    - AI audit 14 repos in parallel
    - Human review audit results
    - Generate registry JSON entries
    - Update counts in registry-v2.json
    
  Wed-Thu (Day 3-4): Phase C GitHub migration (while Phase D prep starts)
    - Create repos in GitHub orgs
    - Deploy CI/CD workflows
    - Human spot-check GitHub setup
    - Begin Phase D prep: outline READMEs per repo

  Fri (Day 5): Phase D begins (documentation generation)
    - ORGAN-I: AI generates 3 READMEs (~150K TE, 2 parallel passes)
    - ORGAN-II: AI generates 4 READMEs (~288K TE, 3 parallel passes)
    - ORGAN-III: AI generates 2 READMEs (~100K TE, parallel)
    - Etc. in parallel by organ

Week 2:
  Mon-Thu (Day 6-9): Phase D continues (human review + refinement)
    - ORGAN-I READMEs: human review, update for portfolio narrative
    - ORGAN-II READMEs: human review, validate art examples
    - Etc. parallel
    
  Fri (Day 10): Phase E validation
    - Link audit across all 14 repos
    - CI/CD validation
    - Portfolio readiness sample check
    - Update promotion_status LOCAL → CANDIDATE

Week 3 (if needed):
  Mon-Tue: Fix-ups from Phase E validation
  Wed: Finalization and sign-off
```

---

## Part 8: Implementation Readiness Checklist

### Pre-Execution Requirements

- [ ] Identify actual names of all 14 local repos (resolve `[local-theory-1]` placeholders)
- [ ] Confirm PUBLIC/PRIVATE visibility for all repos (especially ORGAN-III, VI, VII)
- [ ] Confirm Organ assignment for each repo (especially ORGAN-I/II border repos)
- [ ] Identify any existing documentation/READMEs for each repo
- [ ] Identify any existing GitHub repos (vs. new creations needed)
- [ ] Verify local filesystem paths for all 14 repos
- [ ] Assess any existing git history/version control status
- [ ] Confirm decision authority for governance questions
- [ ] Budget approval: confirm ~790K TE allocation is authorized
- [ ] Timeline approval: confirm 15-23 day execution window fits sprint schedule

### GitHub Org Prerequisites

- [ ] Verify all 8 GitHub orgs are operational and accessible
- [ ] Confirm org admin access for member management/branch protection
- [ ] Verify org settings allow new repo creation (not rate-limited)
- [ ] Ensure licensing strategy is determined (MIT vs. Apache vs. proprietary)
- [ ] Confirm Community Health files are standardized across orgs

### Registry & Documentation Prerequisites

- [ ] Full registry-v2.json read and schema validation
- [ ] Review existing ORGAN-I/II/III/V/VI/VII repos to understand documentation patterns
- [ ] Identify portfolio narrative that links all 14 repos to grant proposal goals
- [ ] Confirm TE budget is available (total ~6.5M TE for entire 8-organ system; ~790K for locals = 12%)
- [ ] Identify human reviewers for each Organ's documentation

### Success Criteria

- [ ] All 14 repos appear in registry-v2.json with valid schema
- [ ] All 14 repos exist in correct GitHub orgs (public/private as specified)
- [ ] All 14 repos have CI/CD workflows deployed
- [ ] All 14 repos have portfolio-grade READMEs (3,000+ words)
- [ ] All 14 repos linked correctly to parent Organs
- [ ] All 14 repos set to promotion_status: CANDIDATE
- [ ] Total_repos count updated in registry: 81 → 95
- [ ] Org repository counts updated for all affected orgs
- [ ] No circular dependencies introduced
- [ ] All external links validated and live
- [ ] Grant narrative integrates all 14 new repos

---

## Part 9: Risk Mitigation

### Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Placeholder names cannot be resolved** | MEDIUM | HIGH | Discovery task in Phase A; have backup naming scheme (organ-function--descriptor) |
| **TE budget underestimated for documentation** | MEDIUM | MEDIUM | Phase A includes complexity reassessment; buffer +10% TE budget |
| **GitHub org access restricted (free tier limits)** | LOW | HIGH | Verify org admin access before Phase C; escalate early if issues |
| **Existing repos have conflicting names** | LOW | MEDIUM | Audit for name collisions in Phase A; rename locally if needed |
| **Dependencies between local repos discovered late** | MEDIUM | HIGH | Comprehensive dependency audit in Phase A before any GitHub work |
| **Documentation quality below portfolio standard** | MEDIUM | MEDIUM | Multiple human review cycles in Phase D; can delay Phase E if needed |
| **CI/CD workflows don't apply to all 14 repos** | LOW | MEDIUM | Test workflows on diverse sample repos in Phase C |
| **Grant narrative doesn't integrate cleanly** | LOW | MEDIUM | Portfolio positioning task in Phase D prep; work with strategy lead |

### Mitigation Strategy

1. **Phase A Design Review** — before beginning Phase A, have governance meeting to:
   - Confirm decisions on all blockers
   - Identify risk escalation path if timeline slips
   - Assign human reviewers per Organ

2. **Weekly Validation Gates** — at end of each week:
   - Spot-check documentation quality (Phase D)
   - Validate GitHub repos are correctly structured (Phase C)
   - Review link validity (Phase E)

3. **Escalation Path** — if TE budget overrun >15%:
   - Reduce documentation scope (fewer repos, shorter READMEs)
   - Defer Phase D for lower-priority Organs
   - Extend timeline into following week

---

## Part 10: Post-Implementation Tasks

### Transition to PRODUCTION (Future Work)

Once all 14 repos are CANDIDATE status, transition to PRODUCTION requires:

1. **Integration with grant narrative** — ensure all 14 repos are referenced in grant proposal text
2. **Essay cross-linking** — ensure ORGAN-V essays link to other Organs' new repos
3. **Portfolio presentation** — ensure all 14 repos appear in portfolio showcase
4. **Social distribution** — prepare ORGAN-VII announcement templates for local repos
5. **Analytics baseline** — set up metrics tracking for new repos (stars, forks, etc.)

### Ongoing Maintenance (Post-GRADUATED)

Once repos reach GRADUATED status:

1. **Quarterly documentation audits** — ensure READMEs stay current
2. **Dependency graph updates** — if new repos added, validate acyclic structure
3. **Portfolio narrative refresh** — update narrative as repos evolve
4. **Revenue tracking** (ORGAN-III) — monitor type/revenue fields quarterly
5. **Community health** — ensure CONTRIBUTING.md and CODE_OF_CONDUCT stay relevant

---

## Summary

This implementation plan provides:

1. **Complete inventory** of 14 local repos with confirmed metadata (placeholder names still TBD)
2. **Five-phase execution strategy** (Audit → Registry → GitHub → Documentation → Validation) with TE budgets (~790K TE total)
3. **Detailed workflow** per phase with deliverables and success criteria
4. **Parallel execution timeline** (15-23 days compressed from sequential ~40 days)
5. **Risk mitigation** with identified blockers and escalation paths
6. **Post-implementation roadmap** to transition repos from LOCAL → CANDIDATE → GRADUATED → PRODUCTION

**Next Step:** Authorize Phase A audit (budget ~100K TE, duration 3-5 days) to resolve placeholder names and confirm all governance decisions.

---

**Plan Status:** Ready for execution authorization  
**Last Updated:** 2026-02-12  
**Mode:** Planning only (no file modifications without explicit authorization)

