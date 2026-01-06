# Backup & Data Management Roadmap

## Executive Summary

This roadmap outlines 6 phases of improvements to the backup and data management features of the Medal Explorer app. Each phase is designed to be implemented as a separate PR, building incrementally on previous work.

**Target Users**: Non-technical users managing <1MB of data
**Current Storage**: localStorage with manual JSON export
**Goal**: Reliable, intuitive backup/restore with improved UX and data safety

---

## Current State Analysis

### What Works ✓
- ✅ Manual JSON export (`exportProfileBackupToJson()`)
- ✅ CSV export for achievements
- ✅ Import with conflict resolution
- ✅ localStorage-based storage (v2.0 with migrations)
- ✅ Profile-level data management
- ✅ Dry-run preview before import

### Current Gaps 🔴
- ❌ Export/import not prominent in UI
- ❌ No backup reminders or safety net
- ❌ No visual confirmation after export
- ❌ localStorage limitations (5-10MB, can be cleared)
- ❌ No encrypted backup option
- ❌ No cross-device sync guidance
- ❌ Limited data integrity checks

---

## 6-Phase Implementation Plan

```
Phase 1: UX Polish (2-3 days)
├─ Prominent backup buttons
├─ Better file naming
├─ Confirmation screens
└─ Import preview improvements

Phase 2: IndexedDB Migration (4-5 days)
├─ IndexedDB storage layer
├─ Auto-migration from localStorage
├─ Backward compatibility
└─ Maintain subfolder isolation

Phase 3: Backup Reminders (3-4 days)
├─ Track last backup date
├─ Configurable reminders
├─ Gentle in-app prompts
└─ Safety education

Phase 4: Cross-Device Workflows (2-3 days)
├─ Web Share API integration
├─ Cloud storage guidance
├─ Simplified restore recipe
└─ No vendor lock-in

Phase 5: Encrypted Backups (4-5 days)
├─ Web Crypto API encryption
├─ Password-protected exports
├─ Optional feature
└─ Power-user focused

Phase 6: Data Integrity (3-4 days)
├─ Schema versioning
├─ Checksum validation
├─ Migration system
└─ Import history log
```

**Total Estimated Effort**: 18-24 days (3-4 weeks)

---

## Phase Overview

### Phase 1: UX Polish Around Backups
**Priority**: HIGH 🔥
**Effort**: 2-3 days
**Impact**: Makes backups obvious and reassuring

[→ Full Specification: PR-027-Backup-UX-Polish.md](./PR-027-Backup-UX-Polish.md)

**Key Features**:
- Add prominent "Back up my data" button to Home page
- Smart file naming: `medal-backup-YYYY-MM-DD.json`
- Post-export confirmation with tips
- Import button next to export
- Read-only summary before restore

**Success Metrics**:
- Users find backup in <10 seconds
- 0 confused user reports
- Backup usage increases 3x

---

### Phase 2: IndexedDB Migration
**Priority**: HIGH 🔥
**Effort**: 4-5 days
**Impact**: More reliable storage, future-proofing

[→ Full Specification: PR-028-IndexedDB-Migration.md](./PR-028-IndexedDB-Migration.md)

**Key Features**:
- Transparent IndexedDB layer under DataManager
- Auto-migration from localStorage on first load
- Fallback to localStorage if IndexedDB unavailable
- Maintain prod/test subfolder isolation
- No UI changes (invisible to users)

**Success Metrics**:
- 0 data loss during migration
- Storage capacity increases to 50MB+
- Performance improves for large profiles

---

### Phase 3: Backup Reminders & Safety Nets
**Priority**: MEDIUM ⚡
**Effort**: 3-4 days
**Impact**: Reduces risk of data loss

[→ Full Specification: PR-029-Backup-Reminders.md](./PR-029-Backup-Reminders.md)

**Key Features**:
- Track "last backup date" and "last data change"
- Gentle reminder after N days without backup
- User preference: Never / 30 days / 90 days
- "How to keep your data safe" help section
- Non-intrusive banner (dismissible)

**Success Metrics**:
- 50%+ users back up within reminder window
- 0 "annoying notification" complaints
- Reduced data loss incidents

---

### Phase 4: Simple Cross-Device Workflows
**Priority**: MEDIUM ⚡
**Effort**: 2-3 days
**Impact**: Easy cloud backup without vendor lock-in

[→ Full Specification: PR-030-Cross-Device-Workflows.md](./PR-030-Cross-Device-Workflows.md)

**Key Features**:
- Web Share API: "Share backup to cloud"
- Direct integration with Files, iCloud, Google Drive
- Simple restore recipe in UI
- No server-side storage (user owns data)
- Works with existing export formats

**Success Metrics**:
- 80% mobile users can share to cloud in 1 tap
- 0 vendor lock-in concerns
- Works offline (export + share later)

---

### Phase 5: Optional Encrypted Backups
**Priority**: LOW 💡
**Effort**: 4-5 days
**Impact**: Privacy for power users

[→ Full Specification: PR-031-Encrypted-Backups.md](./PR-031-Encrypted-Backups.md)

**Key Features**:
- AES-GCM encryption via Web Crypto API
- Password-protected backup exports
- "Advanced" toggle in settings
- Clear warning about password loss
- Opt-in (default: unencrypted)

**Success Metrics**:
- <10% adoption (power users only)
- 0 "I forgot my password" support requests
- Strong security (AES-256)

---

### Phase 6: Data Integrity & Future Changes
**Priority**: MEDIUM ⚡
**Effort**: 3-4 days
**Impact**: Ensures long-term data reliability

[→ Full Specification: PR-032-Data-Integrity.md](./PR-032-Data-Integrity.md)

**Key Features**:
- Backup metadata: schema version, timestamp, checksum
- Checksum validation on import
- Auto-migration for old backups
- Import history log (local)
- Corruption detection

**Success Metrics**:
- 0 corrupt imports
- All v1.0 backups work in v3.0
- Clear error messages on validation failures

---

## Implementation Dependencies

```
Phase 1: UX Polish
  └─ No dependencies (can start immediately)

Phase 2: IndexedDB
  └─ Should complete Phase 1 first (better UX for migration)

Phase 3: Reminders
  └─ Depends on: Phase 1 (needs export UI)

Phase 4: Cross-Device
  └─ Depends on: Phase 1 (uses same export)

Phase 5: Encryption
  └─ Depends on: Phase 1, 6 (needs export + integrity)

Phase 6: Data Integrity
  └─ Depends on: Phase 2 (benefits from IndexedDB)
```

**Recommended Order**: 1 → 2 → 6 → 3 → 4 → 5

---

## Design Principles

### 1. Non-Technical Users First
- No jargon ("backup" not "export JSON")
- Visual confirmation ("✓ Backup created")
- Simple instructions ("Save to iCloud Drive")
- Forgiving (preview before restore)

### 2. Data Ownership
- Users control where backups go
- No vendor lock-in
- Standard formats (JSON, CSV)
- Works offline

### 3. Progressive Disclosure
- Basic features prominent
- Advanced features hidden in settings
- Optional encryption for power users
- Help always available

### 4. WCAG 2.1 AA Compliance
- All interactive elements keyboard accessible
- 4.5:1 contrast ratios
- ARIA labels and live regions
- Focus-visible indicators
- Screen reader announcements

### 5. Mobile-First
- Touch targets ≥44px
- Responsive layouts
- Works on iOS Safari / Android Chrome
- Share API for cloud storage

---

## Technology Stack

### Current
- **Storage**: localStorage (5-10MB limit)
- **Export**: JSON, CSV, PDF, QR code
- **Import**: JSON with conflict resolution
- **Validation**: Per-type achievement validation

### After Phases 1-6
- **Storage**: IndexedDB (50MB+) with localStorage fallback
- **Export**: JSON, CSV, PDF, encrypted JSON, QR code
- **Import**: JSON, CSV with validation, preview, checksum
- **Reminders**: Preference-based system
- **Sharing**: Web Share API
- **Security**: Web Crypto API (AES-GCM)

---

## File Structure After All Phases

```
src/
├── data/
│   ├── dataManager.js (abstract interface)
│   ├── localStorage.js (v2.0 implementation)
│   ├── indexedDBManager.js (NEW - Phase 2)
│   └── migrationManager.js (NEW - Phase 2)
├── components/
│   ├── BackupButton.jsx (NEW - Phase 1)
│   ├── BackupConfirmation.jsx (NEW - Phase 1)
│   ├── ImportPreview.jsx (ENHANCED - Phase 1)
│   ├── BackupReminder.jsx (NEW - Phase 3)
│   ├── ShareBackupDialog.jsx (NEW - Phase 4)
│   ├── EncryptionSettings.jsx (NEW - Phase 5)
│   └── ImportHistory.jsx (NEW - Phase 6)
├── utils/
│   ├── exportManager.js (existing)
│   ├── importManager.js (existing)
│   ├── backupMetadata.js (NEW - Phase 6)
│   ├── checksumValidator.js (NEW - Phase 6)
│   ├── encryptionManager.js (NEW - Phase 5)
│   └── shareManager.js (NEW - Phase 4)
└── contexts/
    ├── BackupContext.jsx (NEW - Phase 3)
    └── StorageContext.jsx (ENHANCED - Phase 2)
```

---

## Testing Strategy

### Unit Tests (Jest)
- All utility functions: 95%+ coverage
- Data transformations: 100% coverage
- Validation logic: All edge cases
- Encryption/decryption: Round-trip tests

### Integration Tests
- Export → Import round-trip
- Migration: localStorage → IndexedDB
- Backup reminder scheduling
- Web Share API mocking

### Manual Testing
- Mobile: iOS Safari, Android Chrome
- Desktop: Chrome, Firefox, Safari
- Keyboard navigation
- Screen reader (NVDA, VoiceOver)
- Dark mode
- Offline mode

### Accessibility Testing
- jest-axe: 0 violations per component
- Manual keyboard testing
- Screen reader testing
- Color contrast validation

---

## Risk Mitigation

### Risk: Data Loss During Migration
**Mitigation**:
- Keep localStorage as fallback
- Test with 100+ profiles
- Dry-run migration option
- Clear error messages
- Backup prompt before migration

### Risk: Users Forget Encryption Password
**Mitigation**:
- Make encryption opt-in
- Clear warning: "Cannot recover without password"
- Suggest unencrypted backup too
- Password hint storage (not password)

### Risk: Browser Compatibility
**Mitigation**:
- Feature detection for IndexedDB, Web Crypto
- Graceful degradation to localStorage
- Polyfills where needed
- Tested on all major browsers

### Risk: File Size Growth
**Mitigation**:
- IndexedDB supports 50MB+
- Compression for large profiles
- Warn at 5MB threshold
- Suggest archiving old data

---

## Success Metrics (Overall)

### Before All Phases
```
Backup Usage:           15% of users
Data Loss Reports:      2-3 per month
Support Tickets:        "How do I backup?" (common)
Mobile Export:          Broken/hard
Storage Capacity:       5-10MB (localStorage)
```

### After All Phases
```
Backup Usage:           60%+ of users
Data Loss Reports:      <1 per quarter
Support Tickets:        Minimal backup questions
Mobile Export:          1-tap to cloud
Storage Capacity:       50MB+ (IndexedDB)
Encryption Adoption:    5-10% (power users)
```

---

## Rollout Plan

### Phase 1-2: Foundation (Week 1-2)
- Deploy to test environment
- Internal testing with 10+ users
- Monitor error rates
- Fix critical bugs

### Phase 3-4: User Features (Week 3)
- Gradual rollout: 10% → 50% → 100%
- Monitor backup rates
- Collect user feedback
- Adjust reminder frequency

### Phase 5-6: Advanced Features (Week 4)
- Beta test with power users
- Validate encryption/integrity
- Document edge cases
- Full production rollout

---

## Documentation Requirements

### User-Facing
- [ ] "How to back up your data" guide
- [ ] "How to restore from backup" guide
- [ ] "Using cloud storage" tutorial
- [ ] "Understanding encrypted backups" (advanced)
- [ ] FAQ section updated

### Developer-Facing
- [ ] IndexedDB migration guide
- [ ] Testing strategy document
- [ ] API documentation for new managers
- [ ] Migration runbook
- [ ] Troubleshooting guide

---

## Next Steps

1. **Review & Approve This Roadmap**
   - Stakeholder sign-off
   - Timeline agreement
   - Resource allocation

2. **Phase 1 Implementation**
   - Read [PR-027-Backup-UX-Polish.md](./PR-027-Backup-UX-Polish.md)
   - Create feature branch: `feature/backup-ux-polish`
   - Follow acceptance criteria
   - Submit PR when complete

3. **Iterative Rollout**
   - Complete phases sequentially
   - Test between phases
   - Gather user feedback
   - Adjust roadmap as needed

---

## Related Documents

- [PR-027: Backup UX Polish](./PR-027-Backup-UX-Polish.md)
- [PR-028: IndexedDB Migration](./PR-028-IndexedDB-Migration.md)
- [PR-029: Backup Reminders](./PR-029-Backup-Reminders.md)
- [PR-030: Cross-Device Workflows](./PR-030-Cross-Device-Workflows.md)
- [PR-031: Encrypted Backups](./PR-031-Encrypted-Backups.md)
- [PR-032: Data Integrity](./PR-032-Data-Integrity.md)

---

**Last Updated**: 2026-01-06
**Status**: Ready for Implementation
**Owner**: Development Team
