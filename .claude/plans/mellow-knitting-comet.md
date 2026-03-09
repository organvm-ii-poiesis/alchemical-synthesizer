# E2G Review #5 — Comprehensive Audit + Test Coverage Gaps

**Date**: 2026-03-06
**Status**: PLANNED
**Predecessor**: E2G Review #4 (592 tests, COMPLETE)

## Context

E2G-4 raised total tests from ~480 to 592. This review performs a comprehensive audit of all 5 subprojects to find remaining test coverage gaps, identify the one known stub (`cmd_review` in alchemia CLI), and ensure every public function has at least one test.

**Lens**: Critique → Reinforcement → Risk Analysis → Growth

**Critique**: Despite 592 tests, several entire modules have zero direct test coverage. Alchemia has 24 source modules vs 7 test files — `channels/` (bookmarks, ai_chats, apple_notes), `absorb/` (classifier, name_variants, registry_loader), `intake/` (crawler, manifest_loader), `alchemize/` (deployer, batch_deployer), `synthesize.py`, and `cli.py` are all untested. Engine `governance/audit.py` and `governance/rules.py` have no direct unit tests. MCP `tools/seeds.py` and `tools/graph.py` have partial coverage at best. MCP `data/paths.py` has zero tests.

**Reinforcement**: No stubs/TODOs/NotImplementedErrors in production code (except one `cmd_review` print stub). All existing 592 tests pass. Architecture is clean with proper mocking patterns established.

**Risk**: Alchemia classifier (393 lines, 7-rule priority chain) has zero tests — any rule logic regression goes undetected. `governance/audit.py` (146 lines) only tested via CLI integration, not directly. The channel modules (`bookmarks.py`, `ai_chats.py`, `apple_notes.py`) interact with filesystem/subprocess — fragile without unit tests.

**Growth**: Fills all remaining gaps, adds the `cmd_review` implementation, and raises total tests to ~700+.

---

## Phase 1: Alchemia — Channels (0 → 3 test files)

### 1a. `channels/bookmarks.py` tests
**Create**: `alchemia-ingestvm/tests/test_bookmarks.py`

Source: `src/alchemia/channels/bookmarks.py` (125 lines)
Functions: `parse_safari_bookmarks()`, `parse_chrome_bookmarks()`, `sync_bookmarks()`, `_walk_safari_tree()`, `_walk_chrome_tree()`

- `test_parse_safari_missing_file` — monkeypatch `SAFARI_BOOKMARKS` to nonexistent path → `[]`
- `test_parse_safari_with_inspirations` — monkeypatch `subprocess.run` to return XML plist with Inspirations folder containing 2 bookmarks → verify 2 results with `source="safari"`
- `test_parse_safari_no_inspirations` — plist tree without Inspirations → `[]`
- `test_parse_chrome_missing_file` — monkeypatch `CHROME_BOOKMARKS` to nonexistent → `[]`
- `test_parse_chrome_with_inspirations` — create temp JSON with Chrome bookmark structure containing Inspirations folder → verify results with `source="chrome"`
- `test_parse_chrome_invalid_json` — write invalid JSON → `[]`
- `test_sync_bookmarks_combines_sources` — monkeypatch both parse functions → combined list

**7 tests**

### 1b. `channels/ai_chats.py` tests
**Create**: `alchemia-ingestvm/tests/test_ai_chats.py`

Source: `src/alchemia/channels/ai_chats.py` (138 lines)
Functions: `parse_chatgpt_export()`, `parse_claude_sessions()`, `parse_gemini_visits()`

- `test_chatgpt_missing_file` — `tmp_path` with no `conversations.json` → `[]`
- `test_chatgpt_with_conversations` — create fixture `conversations.json` with 2 conversations → verify 2 results with source/title/message_count
- `test_chatgpt_filters_short_messages` — messages < 50 chars excluded
- `test_claude_sessions_empty_dir` — `tmp_path` → `[]`
- `test_claude_sessions_with_jsonl` — create `.jsonl` with human messages → verify parsed
- `test_claude_sessions_skips_short_messages` — messages < 20 chars excluded
- `test_gemini_visits_no_files` — `tmp_path` with no matching glob → `[]`
- `test_gemini_visits_with_list_data` — create `_gemini_visit_001.json` with list → verify parsed
- `test_gemini_visits_with_dict_data` — create `_gemini_visit_002.json` with dict → verify parsed
- `test_gemini_visits_invalid_json` — corrupt file → skipped gracefully

**10 tests**

### 1c. `channels/apple_notes.py` tests
**Create**: `alchemia-ingestvm/tests/test_apple_notes.py`

Source: `src/alchemia/channels/apple_notes.py` (116 lines)
Functions: `export_alchemia_notes()`, `export_note_body()`

- `test_export_notes_success` — monkeypatch `subprocess.run` to return JSON lines → verify parsed
- `test_export_notes_no_folder` — subprocess returns "ERROR: folder Alchemia" → `[]` + info message
- `test_export_notes_timeout` — subprocess raises `TimeoutExpired` → `[]`
- `test_export_notes_nonzero_returncode` — returncode != 0 → `[]`
- `test_export_note_body_success` — monkeypatch subprocess → body text returned
- `test_export_note_body_timeout` — `TimeoutExpired` → `""`

**6 tests**

---

## Phase 2: Alchemia — Absorb + Intake (0 → 3 test files)

### 2a. `absorb/classifier.py` tests
**Create**: `alchemia-ingestvm/tests/test_classifier.py`

Source: `src/alchemia/absorb/classifier.py` (394 lines)
Functions: `classify_entry()`, `classify_all()`, `_get_toplevel_dir()`, `_subdir_for_ext()`, `_read_first_lines()`

Mock registry fixture: `{"by_name": {"my-repo": {"name": "my-repo", "organ": "ORGAN-I", "org": "ivviiviivvi"}}, "archived": set()}`

- `test_rule1_direct_repo_match` — entry path contains `Workspace/my-repo/file.md` → rule 1, confidence 1.0
- `test_rule2_name_variant_match` — toplevel `hokage-chess--believe-it!` → resolves to `hokage-chess`
- `test_rule3_staging_dir_match` — toplevel `ORG-IV-orchestration-staging` → ORGAN-IV
- `test_rule3b_dir_to_organ` — toplevel `OS-me` → ORGAN-IV
- `test_rule4_process_container` — path contains `processCONTAINER` → ORGAN-I
- `test_rule4_insort` — path contains `inSORT` → ORGAN-I
- `test_rule5_manifest_category` — entry has manifest with `"technical specifications"` → ORGAN-I
- `test_rule6_content_keyword` — create temp file with "epistemology recursive ontology" → ORGAN-I
- `test_rule6_insufficient_keywords` — only 1 keyword match → falls through to rule 7
- `test_rule7_unresolved` — no matches → rule 7, PENDING_REVIEW
- `test_classify_all_adds_classification` — verify all entries get `classification` key
- `test_subdir_for_ext_md` — `.md` → `"theory"`
- `test_subdir_for_ext_py` — `.py` → `"prototypes"`
- `test_subdir_for_ext_unknown` — `.xyz` → `"theory"` (default)
- `test_get_toplevel_dir` — path `/Users/x/Workspace/my-repo/sub/file.py` → `"my-repo"`

**15 tests**

### 2b. `absorb/name_variants.py` tests
**Create**: `alchemia-ingestvm/tests/test_name_variants.py`

Source: `src/alchemia/absorb/name_variants.py` (120 lines)
Functions: `resolve_variant()`, `resolve_staging()`, `resolve_organ_dir()`

- `test_resolve_variant_known` — `"hokage-chess--believe-it!"` → `"hokage-chess"`
- `test_resolve_variant_unknown` — `"no-such-thing"` → `None`
- `test_resolve_staging_known` — `"ORG-IV-orchestration-staging"` → `"organvm-iv-taxis"`
- `test_resolve_staging_unknown` — `"random-dir"` → `None`
- `test_resolve_organ_dir_known` — `"OS-me"` → dict with `organ="ORGAN-IV"`
- `test_resolve_organ_dir_unknown` — `"nope"` → `None`
- `test_name_variants_not_empty` — `NAME_VARIANTS` has at least 5 entries
- `test_dir_to_organ_not_empty` — `DIR_TO_ORGAN` has at least 5 entries

**8 tests**

### 2c. `intake/manifest_loader.py` tests
**Create**: `alchemia-ingestvm/tests/test_manifest_loader.py`

Source: `src/alchemia/intake/manifest_loader.py` (81 lines)
Functions: `enrich_from_manifest()`, `enrich_from_sidecars()`

- `test_enrich_from_manifest_matches` — create temp CSV with Title column, entries with matching filenames → verify `manifest` dict populated
- `test_enrich_from_manifest_no_match` — entries with non-matching names → `manifest` is `None`
- `test_enrich_from_manifest_stem_match` — `foo.md` matches `foo` in manifest
- `test_enrich_from_sidecars_found` — entries include `foo.py` and `foo.py.meta.json` → verify `sidecar` populated
- `test_enrich_from_sidecars_none` — no sidecar files → `sidecar` is `None`
- `test_enrich_from_sidecars_invalid_json` — sidecar file with invalid JSON → `sidecar` is `None`

**6 tests**

---

## Phase 3: Alchemia — Deployer + Synthesize + CLI Stub (0 → 4 test files, 1 modified)

### 3a. `alchemize/deployer.py` tests
**Create**: `alchemia-ingestvm/tests/test_deployer.py`

Source: `src/alchemia/alchemize/deployer.py` (148 lines)
Functions: `gh_api()`, `get_file_sha()`, `get_default_branch()`, `is_archived()`, `is_branch_protected()`, `put_file()`, `deploy_file()`

All tests must mock `subprocess.run` — no real API calls.

- `test_gh_api_success` — mock subprocess returns JSON → parsed dict
- `test_gh_api_failure` — mock returncode=1 → `None`
- `test_gh_api_non_json` — stdout is plain text → returns string
- `test_get_file_sha_exists` — mock returns `{"sha": "abc123"}` → `"abc123"`
- `test_get_file_sha_not_found` — mock returns None → `None`
- `test_get_default_branch` — mock returns `{"default_branch": "develop"}` → `"develop"`
- `test_is_archived_true` — mock returns `{"archived": true}` → `True`
- `test_is_archived_false` — mock returns `{"archived": false}` → `False`
- `test_deploy_file_dry_run` — `dry_run=True` → status `"dry_run"`, no subprocess calls
- `test_deploy_file_success` — mock put_file → status `"deployed"`
- `test_deploy_file_source_missing` — nonexistent source → status `"error"`

**11 tests**

### 3b. `alchemize/batch_deployer.py` tests
**Create**: `alchemia-ingestvm/tests/test_batch_deployer.py`

Source: `src/alchemia/alchemize/batch_deployer.py` (196 lines)
Functions: `build_deployment_manifest()`, `deploy_repo_batch()`

- `test_build_manifest_groups_by_repo` — entries with 2 different repos → 2 keys in manifest
- `test_build_manifest_skips_unclassified` — entry with status != CLASSIFIED → excluded
- `test_build_manifest_skips_non_deploy_actions` — action "reference" → excluded
- `test_deploy_repo_batch_dry_run` — `dry_run=True` → status `"dry_run"`, no subprocess
- `test_deploy_repo_batch_archived` — monkeypatch `is_repo_archived` → `True` → status `"skipped_archived"`
- `test_deploy_repo_batch_source_not_found` — nonexistent source file → failed count incremented

**6 tests**

### 3c. `synthesize.py` tests
**Create**: `alchemia-ingestvm/tests/test_synthesize.py`

Source: `src/alchemia/synthesize.py` (281 lines)
Functions: `analyze_references()`, `generate_creative_brief()`, `generate_all_briefs()`, `generate_workflow_integration_example()`

- `test_analyze_references_empty` — mock taste with no references → total=0
- `test_analyze_references_with_refs` — mock taste with 3 refs, 2 tags each → verify by_tag, by_type, tag_counts
- `test_generate_creative_brief_has_sections` — verify output contains "Identity", "Color Palette", organ name
- `test_generate_creative_brief_unknown_organ` — non-existent organ → uses organ key as name, no crash
- `test_generate_all_briefs` — `tmp_path` output → 8 files created (one per organ in ORGAN_MAP)
- `test_workflow_integration_example` — returns non-empty string containing "GitHub Actions"
- `test_organ_map_has_all_organs` — ORGAN_MAP has 8 entries

**7 tests**

### 3d. `cmd_review` stub implementation
**Modify**: `alchemia-ingestvm/src/alchemia/cli.py:231-233`

The only stub in the entire codebase: `cmd_review` just prints "Not yet implemented (Phase B)".

Implement as a non-interactive review display:
- Load `data/absorb-mapping.json`
- Filter entries by `--status` (default: `PENDING_REVIEW`)
- Display each entry: filename, rule matched, confidence, suggested organ/repo
- Print summary counts
- No interactive input needed — just a useful report

---

## Phase 4: Engine — Governance Direct Tests (0 → 1 new file, 1 modified)

### 4a. `governance/rules.py` tests
**Modify**: `organvm-engine/tests/test_governance.py` (add new test class)

Source: `src/organvm_engine/governance/rules.py` (43 lines)
Functions: `get_dependency_rules()`, `get_promotion_rules()`, `get_audit_thresholds()`, `get_organ_requirements()`

- `test_get_dependency_rules_present` — rules dict with `dependency_rules` key → returns it
- `test_get_dependency_rules_missing` — empty dict → `{}`
- `test_get_promotion_rules_present` — returns `promotion_rules` section
- `test_get_audit_thresholds` — returns `audit_thresholds` section
- `test_get_organ_requirements_present` — organ in rules → returns requirements
- `test_get_organ_requirements_missing` — unknown organ → `{}`

**6 tests**

### 4b. `governance/audit.py` tests
**Create**: `organvm-engine/tests/test_audit.py`

Source: `src/organvm_engine/governance/audit.py` (146 lines)
Functions: `run_audit()`, `AuditResult`

- `test_audit_result_passed_no_criticals` — empty critical list → `passed` is True
- `test_audit_result_failed_with_critical` — critical list populated → `passed` is False
- `test_audit_result_summary_includes_findings` — summary() contains "CRITICAL", "WARNINGS", "INFO"
- `test_audit_result_summary_pass` — no criticals → summary contains "PASS"
- `test_run_audit_clean_registry` — registry with no issues, rules with no thresholds → no criticals
- `test_run_audit_detects_missing_readme` — repo with empty `documentation_status`, rules with `critical.missing_readme: true` → critical finding
- `test_run_audit_detects_stale_repo` — repo with old `last_validated` date → warning
- `test_run_audit_detects_missing_ci` — repo without `ci_workflow`, rules with `warning.missing_ci_workflow: true` → warning
- `test_run_audit_propagates_dependency_result` — verify `dependency_result` field populated

**9 tests**

---

## Phase 5: MCP — Seeds, Graph, Paths Tests

### 5a. `tools/seeds.py` — expand coverage
**Modify**: `organvm-mcp-server/tests/test_tools.py`

Currently only `find_edges` and `find_edges_no_match` tested. Add:

- `test_get_seed_found` — mock seeds with matching org/name → returns seed dict
- `test_get_seed_not_found` — no match → `{"error": "..."}`
- `test_get_event_contract_found` — mock event catalog → returns matching event
- `test_get_event_contract_not_found` — no match → `{"error": "..."}`
- `test_list_events` — mock catalog with 2 events → `{"events": [...]}`
- `test_find_edges_produces_only` — direction="produces" → only produce edges

**6 tests**

### 5b. `tools/graph.py` — expand coverage
**Modify**: `organvm-mcp-server/tests/test_tools.py`

Currently `trace_dependencies`, `check_dependency` tested. Add:

- `test_get_dependency_graph_full` — no organ filter → all nodes/edges
- `test_get_dependency_graph_filtered` — organ filter → scoped nodes
- `test_check_dependency_no_rules` — empty rules → allowed by default
- `test_check_dependency_forbidden_edge` — edge in `forbidden_edges` → not allowed
- `test_normalize_repo_name_with_slash` — `"org/repo"` → `"repo"`
- `test_normalize_repo_name_empty` — `""` → `""`

**6 tests**

### 5c. `data/paths.py` tests
**Create**: `organvm-mcp-server/tests/test_paths.py`

Source: `src/organvm_mcp/data/paths.py` (66 lines)
Functions: `workspace_root()`, `corpus_dir()`, `registry_path()`, `event_catalog_path()`, `governance_rules_path()`, `engine_dir()`, `organ_directories()`

- `test_workspace_root_env` — set `ORGANVM_WORKSPACE_DIR` → uses env
- `test_workspace_root_default` — no env → falls back to `~/Workspace`
- `test_corpus_dir_env` — set `ORGANVM_CORPUS_DIR` → uses env
- `test_registry_path_suffix` — ends with `registry-v2.json`
- `test_governance_rules_path_suffix` — ends with `governance-rules.json`
- `test_event_catalog_path_suffix` — ends with `event-catalog.yaml`

**6 tests**

---

## Phase 6: Alchemia — Intake Crawler + Registry Loader

### 6a. `intake/crawler.py` tests
**Create**: `alchemia-ingestvm/tests/test_crawler.py`

Source: `src/alchemia/intake/crawler.py` (122 lines)
Functions: `sha256_file()`, `file_metadata()`, `crawl()`

- `test_sha256_file` — write known content to tmp file → verify hash
- `test_sha256_file_unreadable` — monkeypatch to raise OSError → `"ERROR_UNREADABLE"`
- `test_file_metadata_fields` — create temp file → verify all expected keys present
- `test_crawl_empty_dir` — empty `tmp_path` → `[]`
- `test_crawl_with_files` — create 3 files in tmp → verify 3 entries
- `test_crawl_skips_gitdir` — create `.git/` subdir with file → not included
- `test_crawl_skips_ds_store` — create `.DS_Store` file → not included
- `test_crawl_nonexistent_dir` — `tmp_path / "nope"` → `[]` (warning printed)

**8 tests**

### 6b. `absorb/registry_loader.py` tests
**Create**: `alchemia-ingestvm/tests/test_registry_loader.py`

Source: `src/alchemia/absorb/registry_loader.py` (59 lines)
Functions: `load_registry()`

- `test_load_registry_from_fixture` — create minimal registry JSON in tmp → verify `repos`, `by_name`, `by_org`, `archived` keys
- `test_load_registry_archived_detection` — repo with `status: "ARCHIVED"` → in `archived` set
- `test_load_registry_by_name_lookup` — verify `by_name["repo-x"]` returns correct info
- `test_load_registry_by_org_grouping` — 2 repos in same org → grouped correctly

**4 tests**

---

## Summary

| Phase | Subproject | New Tests | New Files | Modified Files |
|-------|-----------|-----------|-----------|----------------|
| 1a | Alchemia | 7 | test_bookmarks.py | — |
| 1b | Alchemia | 10 | test_ai_chats.py | — |
| 1c | Alchemia | 6 | test_apple_notes.py | — |
| 2a | Alchemia | 15 | test_classifier.py | — |
| 2b | Alchemia | 8 | test_name_variants.py | — |
| 2c | Alchemia | 6 | test_manifest_loader.py | — |
| 3a | Alchemia | 11 | test_deployer.py | — |
| 3b | Alchemia | 6 | test_batch_deployer.py | — |
| 3c | Alchemia | 7 | test_synthesize.py | — |
| 3d | Alchemia | — | — | cli.py (implement cmd_review) |
| 4a | Engine | 6 | — | test_governance.py |
| 4b | Engine | 9 | test_audit.py | — |
| 5a | MCP | 6 | — | test_tools.py |
| 5b | MCP | 6 | — | test_tools.py |
| 5c | MCP | 6 | test_paths.py | — |
| 6a | Alchemia | 8 | test_crawler.py | — |
| 6b | Alchemia | 4 | test_registry_loader.py | — |
| **Total** | | **~121** | **12 new** | **4 modified** |

Post-E2G-5 target: **~713 tests** (592 + 121)

Alchemia test files: 7 → 17 (covering all 24 source modules)
Engine test files: 21 → 22
MCP test files: 5 → 6

---

## Verification

After each phase:
1. `pytest <subproject>/tests/ -v` — all pass
2. `ruff check <subproject>/src/` — clean
3. No production path access — use `tmp_path`, monkeypatching, explicit mocking

Final:
```bash
source .venv/bin/activate
pytest organvm-engine/tests/ -v
pytest organvm-mcp-server/tests/ -v
pytest schema-definitions/tests/ -v
pytest system-dashboard/tests/ -v
pytest alchemia-ingestvm/tests/ -v
```

All 5 subprojects must show green with zero failures.
