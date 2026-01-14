# Changelog

All notable changes to CodeSwitch will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.1.0] - 2026-01-14

### Interactive Diff Features Release

Major enhancement to the Diff visualization with 5 new features for code review and comparison.

### Added

#### Interactive Diff v6.1
- **Line Mapping** - Click on any COBOL line to highlight the corresponding Python code
  - Automatic mapping of COBOL paragraphs to Python methods
  - DATA DIVISION variables linked to Python class attributes
  - Visual highlighting with yellow/cyan indicators

- **Sync Scroll** - Synchronized scrolling between COBOL and Python panels
  - Toggle on/off with one click
  - Percentage-based scroll synchronization
  - Smooth scrolling experience

- **Enhanced Syntax Highlighting** - Improved code colorization
  - COBOL keywords (PERFORM, COMPUTE, MOVE, etc.) in purple
  - Python keywords (def, class, return, etc.) highlighted
  - Comments, strings, and numbers with distinct colors

- **Export PDF** - Generate diff reports as downloadable HTML/PDF
  - Side-by-side code comparison
  - Statistics summary (lines, ratio)
  - Professional styling for documentation

- **A/B Testing** - Compare multiple Python versions
  - Select Version A vs Version B
  - Automatic metrics comparison (lines, methods, tests passed)
  - Winner determination with analysis

#### New Components
- `lib/diff-features.ts` - Core diff algorithms and utilities
- `components/DiffPanel.tsx` - React component for interactive diff view
- New "Diff v6.1" tab in the main interface

### Changed
- Updated `activeTab` to include `diffv2` option
- Added `Scroll` and `FlaskConical` icons to imports

### Technical Details
- Line mapping uses paragraph detection and variable matching
- Scroll sync uses percentage-based calculation for different-length files
- Export generates standalone HTML with embedded CSS

---

## [6.0.0] - 2026-01-14

### 🎉 Major Release: Production Grade

This release transforms CodeSwitch from a transpiler into a **complete migration platform** with enhanced developer experience, defensive documentation, and production-ready tooling.

### Added

#### Developer Experience (UX)
- **Interactive Guidance Mode** (`run_with_guidance()`) - Detects missing external CALL implementations and guides developers through the migration process
- **Production Readiness Check** (`validate_production_ready()`) - Self-diagnostic method that validates all external dependencies before deployment
- **Print Production Status** (`print_production_status()`) - Visual dashboard showing migration completion percentage

#### CLI Tooling
- **`codeswitch_cli.py`** - One-liner CLI for complete transpilation with artifacts generation
- **Auto-generated `config.yaml`** - Template configuration file for production deployment
- **Auto-generated `external_calls_template.py`** - Skeleton implementations for all detected CALL statements

#### Defensive Code Generation
- **Code Reviewer Notes** - Embedded documentation in generated headers explaining architectural choices:
  - Why "dead code" exists after `STOP RUN` (COBOL fidelity)
  - Why stubs are intentional (Fail-Fast security pattern)
  - Line Count Ratio justification (2.7x expansion = type hints + dataclasses + logging)
- **Migration Report** (`MIGRATION_REPORT.md`) - Comprehensive markdown report with metrics, risks, and next steps

#### Runtime Modes
- **`_verbose_mode`** - Toggle logging output (disable warnings in production)
- **`_strict_mode`** - Fail-fast on undefined variables (development safety)

### Changed
- **Modular Architecture** - Core v6 logic extracted to `api/v6_features.py` for maintainability
- **Thread-Safe Wrapper** - `ThreadSafeWrapper` class for concurrent access protection
- **REDEFINES Simulator** - `RedefinesSimulator` for complex COBOL memory layouts

### Fixed
- Circular import issues between `transpile.py` and `v6_features.py`
- Dataclass initialization errors in generated code
- Regex syntax errors in CLI external call detection

### Metrics
- **146 unit tests passing**
- **Supports files up to 10,000+ COBOL lines**
- **Banking (1099 LOC) → Python (2971 LOC)** with full documentation

---

## [5.7.35] - 2026-01-13

### Added
- Enhanced REDEFINES support for complex record structures
- Improved PERFORM VARYING loop transpilation
- Better STRING/UNSTRING handling

### Fixed
- Edge cases in nested IF statements
- COMPUTE expression parsing with parentheses
- PIC clause decimal alignment

---

## [5.7.34] - 2026-01-12

### Added
- Initial production deployment
- Core AST-based transpilation engine
- Unit test auto-generation
- Security analysis module

### Known Limitations
- External CALL statements generate stubs (addressed in v6.0.0)
- Single-threaded execution model (documented as intentional in v6.0.0)

---

## [5.7.0] - 2026-01-10

### Added
- Chunked processing for large files (10K+ LOC)
- Parallel transpilation support
- Confidence scoring system

---

## [5.0.0] - 2026-01-05

### Added
- Initial public release
- Next.js 14 frontend with Monaco Editor
- Google Gemini 2.0 integration
- Supabase authentication

---

[6.0.0]: https://github.com/bebzo/cobol-ast-service/compare/v5.7.35...v6.0.0
[5.7.35]: https://github.com/bebzo/cobol-ast-service/compare/v5.7.34...v5.7.35
[5.7.34]: https://github.com/bebzo/cobol-ast-service/compare/v5.7.0...v5.7.34
[5.7.0]: https://github.com/bebzo/cobol-ast-service/compare/v5.0.0...v5.7.0
[5.0.0]: https://github.com/bebzo/cobol-ast-service/releases/tag/v5.0.0
