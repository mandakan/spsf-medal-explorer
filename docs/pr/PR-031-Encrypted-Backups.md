# PR-031: Encrypted Backups (Optional)

## Overview

**Phase**: 5 of 6 (Backup Improvements Roadmap)
**Priority**: LOW 💡
**Effort**: 4-5 days
**Impact**: Privacy protection for power users

Adds optional AES-GCM encryption for backup exports using the Web Crypto API, protecting sensitive data if backups are lost or stolen.

## Problem Statement

```
Current State:
├─ Backups are plain JSON (readable by anyone)
├─ If file leaked, all data exposed
├─ No privacy protection
├─ Users concerned about cloud storage security
└─ Sensitive notes/data visible

Result: Privacy-conscious users hesitant to use cloud backups
```

## Solution: Optional Password-Protected Encryption

```
After PR-031:
├─ AES-256-GCM encryption via Web Crypto API
├─ Password-protected backup exports
├─ "Advanced" toggle in settings (opt-in)
├─ Clear warning about password loss
├─ Unencrypted backups still default
└─ Decrypt on import with password

Result: Power users get strong privacy, no confusion for basic users
```

## DESCRIPTION

### What This PR Does

1. **Encryption Settings**
   - Optional toggle: "Encrypt backups with password"
   - Password setup with confirmation
   - Password hint storage (not password itself)
   - Clear warning about irrecoverability

2. **Encryption Manager**
   - AES-256-GCM via Web Crypto API
   - PBKDF2 for key derivation
   - Random salt and IV per backup
   - Metadata preserved (version, date)

3. **Export Flow**
   - Check if encryption enabled
   - Prompt for password if needed
   - Encrypt JSON payload
   - Add metadata envelope

4. **Import Flow**
   - Detect encrypted backups
   - Prompt for password
   - Decrypt and verify
   - Clear error if wrong password

5. **User Education**
   - "What is encryption?" help section
   - Warning: "If you forget password, backup is lost"
   - Recommendation: Keep unencrypted backup too

## Current Implementation Reference

**Files to integrate with**:
- `/src/logic/exporter.js` - Export logic
- `/src/utils/exportManager.js` - Format generation
- `/src/utils/importManager.js` - Import parsing
- `/src/pages/Settings.jsx` - Add encryption preferences

## Files to Create/Modify

### NEW Files

```
src/utils/encryptionManager.js
├─ encryptData(data, password)
├─ decryptData(encrypted, password)
├─ deriveKey(password, salt)
└─ generateSalt(), generateIV()

src/components/EncryptionSettings.jsx
├─ Enable/disable toggle
├─ Password setup form
├─ Password hint input
└─ Educational warnings

src/components/DecryptDialog.jsx
├─ Password input on import
├─ Decrypt button
├─ Error handling
└─ Wrong password feedback
```

### MODIFIED Files

```
src/logic/exporter.js
└─ Check encryption preference, encrypt if enabled

src/utils/exportManager.js
└─ Wrap encrypted data in envelope

src/utils/importManager.js
└─ Detect encrypted format, trigger decrypt

src/pages/Settings.jsx
└─ Add EncryptionSettings component
```

## CODE STRUCTURE

### encryptionManager.js (NEW)

```javascript
// src/utils/encryptionManager.js

/**
 * Encryption utilities using Web Crypto API
 * AES-256-GCM for authenticated encryption
 * PBKDF2 for key derivation from password
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16 // bytes
const IV_LENGTH = 12 // bytes for GCM

/**
 * Encrypt backup data with password
 * @param {Object} data - Profile backup object
 * @param {string} password - User password
 * @returns {Object} Encrypted envelope
 */
export async function encryptData(data, password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // Derive key from password
  const key = await deriveKey(password, salt)

  // Convert data to JSON string
  const dataString = JSON.stringify(data)
  const dataBuffer = new TextEncoder().encode(dataString)

  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv
    },
    key,
    dataBuffer
  )

  // Convert to base64 for JSON storage
  const encryptedData = bufferToBase64(encryptedBuffer)
  const saltB64 = bufferToBase64(salt)
  const ivB64 = bufferToBase64(iv)

  return {
    encrypted: true,
    version: '1.0',
    algorithm: ALGORITHM,
    keyDerivation: 'PBKDF2',
    iterations: PBKDF2_ITERATIONS,
    salt: saltB64,
    iv: ivB64,
    data: encryptedData,
    timestamp: new Date().toISOString()
  }
}

/**
 * Decrypt backup data with password
 * @param {Object} envelope - Encrypted envelope
 * @param {string} password - User password
 * @returns {Object} Decrypted profile backup
 */
export async function decryptData(envelope, password) {
  if (!envelope.encrypted) {
    throw new Error('Data is not encrypted')
  }

  if (!password) {
    throw new Error('Password required for decryption')
  }

  // Convert base64 to buffers
  const salt = base64ToBuffer(envelope.salt)
  const iv = base64ToBuffer(envelope.iv)
  const encryptedBuffer = base64ToBuffer(envelope.data)

  // Derive key from password
  const key = await deriveKey(password, salt, envelope.iterations)

  try {
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encryptedBuffer
    )

    // Convert back to JSON
    const dataString = new TextDecoder().decode(decryptedBuffer)
    return JSON.parse(dataString)
  } catch (error) {
    if (error.name === 'OperationError') {
      throw new Error('Incorrect password or corrupted backup')
    }
    throw error
  }
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  const passwordBuffer = new TextEncoder().encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive AES key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Check if backup is encrypted
 */
export function isEncrypted(data) {
  return data && data.encrypted === true
}

/**
 * Buffer to base64 string
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Base64 string to buffer
 */
function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
```

### EncryptionSettings.jsx (NEW)

```jsx
// src/components/EncryptionSettings.jsx

import { useState, useEffect } from 'react'
import { useStorage } from '../hooks/useStorage'

/**
 * Encryption settings for advanced users
 * Password-protected backup option
 * WCAG 2.1 AA compliant
 */
export default function EncryptionSettings() {
  const { manager } = useStorage()
  const [enabled, setEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hint, setHint] = useState('')
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [error, setError] = useState(null)

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      if (!manager) return

      const encEnabled = await manager.getMetadata('encryptionEnabled')
      const passHint = await manager.getMetadata('passwordHint')

      setEnabled(!!encEnabled)
      setHint(passHint || '')
    }

    loadSettings()
  }, [manager])

  const handleToggle = () => {
    if (enabled) {
      // Disable encryption
      setEnabled(false)
      manager?.setMetadata('encryptionEnabled', false)
      setPassword('')
      setConfirmPassword('')
    } else {
      // Show password setup
      setShowPasswordSetup(true)
    }
  }

  const handleSavePassword = async () => {
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Save settings (password stored in memory only, never persisted)
    await manager.setMetadata('encryptionEnabled', true)
    await manager.setMetadata('passwordHint', hint)

    setEnabled(true)
    setShowPasswordSetup(false)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-color-text-primary mb-2">
          Encrypted Backups (Advanced)
        </h3>
        <p className="text-sm text-color-text-secondary">
          Protect your backups with password encryption
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div
        className="
          p-4 rounded-lg border-2
          ${enabled ? 'border-color-primary bg-blue-50 dark:bg-blue-950' : 'border-color-border bg-color-bg-secondary'}
        "
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="
              mt-1 w-5 h-5
              text-color-primary
              focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-color-primary
            "
          />

          <div>
            <p className="font-medium text-color-text-primary">
              Encrypt backups with password
            </p>
            <p className="text-sm text-color-text-secondary mt-1">
              {enabled
                ? 'Encryption is enabled. All new backups will be encrypted.'
                : 'Enable password protection for your backups'}
            </p>
          </div>
        </label>
      </div>

      {/* Password Setup Modal */}
      {showPasswordSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-setup-title"
            className="
              w-full max-w-md
              bg-color-bg-primary
              border-2 border-color-border
              rounded-xl shadow-2xl
              p-6
            "
          >
            <h3 id="password-setup-title" className="text-xl font-bold text-color-text-primary mb-4">
              Set Encryption Password
            </h3>

            {/* Warning */}
            <div
              className="
                mb-4 p-4 rounded-lg
                bg-yellow-50 dark:bg-yellow-950
                border-2 border-yellow-400 dark:border-yellow-600
              "
              role="alert"
            >
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                ⚠️ Important Warning
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                If you forget this password, your encrypted backups{' '}
                <strong>cannot be recovered</strong>. There is no password reset.
              </p>
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-color-text-primary mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="
                    w-full px-3 py-2 rounded-lg
                    bg-color-bg-secondary
                    border-2 border-color-border
                    text-color-text-primary
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-color-primary
                  "
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-color-text-primary mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="
                    w-full px-3 py-2 rounded-lg
                    bg-color-bg-secondary
                    border-2 border-color-border
                    text-color-text-primary
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-color-primary
                  "
                />
              </div>

              <div>
                <label htmlFor="hint" className="block text-sm font-medium text-color-text-primary mb-1">
                  Password Hint (Optional)
                </label>
                <input
                  id="hint"
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="A hint to help you remember"
                  className="
                    w-full px-3 py-2 rounded-lg
                    bg-color-bg-secondary
                    border-2 border-color-border
                    text-color-text-primary
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-color-primary
                  "
                />
              </div>

              {error && (
                <div
                  className="
                    p-3 rounded-lg
                    bg-color-error-bg text-color-error
                    border border-color-error
                  "
                  role="alert"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordSetup(false)}
                className="
                  flex-1 py-2 rounded-lg font-medium
                  bg-color-bg-secondary text-color-text-primary
                  border-2 border-color-border
                  hover:bg-color-bg-tertiary
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-offset-2 focus-visible:ring-color-border
                "
              >
                Cancel
              </button>

              <button
                onClick={handleSavePassword}
                className="
                  flex-1 py-2 rounded-lg font-medium
                  bg-color-primary text-white
                  hover:bg-color-primary-hover
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-offset-2 focus-visible:ring-color-primary
                "
              >
                Enable Encryption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Hint Display */}
      {enabled && hint && (
        <div
          className="
            p-4 rounded-lg
            bg-color-bg-secondary
            border border-color-border
          "
        >
          <p className="text-sm text-color-text-secondary">
            Password hint:{' '}
            <span className="text-color-text-primary">{hint}</span>
          </p>
        </div>
      )}

      {/* Educational Section */}
      <div
        className="
          p-4 rounded-lg
          bg-blue-50 dark:bg-blue-950
          border border-blue-200 dark:border-blue-800
        "
      >
        <h4 className="font-semibold text-color-text-primary mb-2">
          ℹ️ About Encrypted Backups
        </h4>
        <ul className="text-sm text-color-text-secondary space-y-1">
          <li>• Uses military-grade AES-256 encryption</li>
          <li>• Backups unreadable without your password</li>
          <li>• Password never stored (only in your memory)</li>
          <li>• Recommended: Keep unencrypted backup too</li>
          <li>• Optional feature for power users</li>
        </ul>
      </div>
    </div>
  )
}
```

## ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] AES-256-GCM encryption working
- [ ] PBKDF2 key derivation (100k iterations)
- [ ] Encrypted backups export correctly
- [ ] Decryption with correct password works
- [ ] Wrong password shows clear error
- [ ] Unencrypted backups still default

### Security Requirements
- [ ] Password never persisted to storage
- [ ] Random salt per backup
- [ ] Random IV per backup
- [ ] Authenticated encryption (GCM mode)
- [ ] No password in error messages

### UX Requirements
- [ ] Clear warning about password loss
- [ ] Password hint optional
- [ ] Opt-in (advanced users only)
- [ ] Non-intrusive for basic users
- [ ] Password strength validation (≥8 chars)

### Accessibility Requirements (WCAG 2.1 AA)
- [ ] Keyboard navigation works
- [ ] Focus-visible on inputs
- [ ] Labels associated with inputs
- [ ] Error messages announced
- [ ] Warning has role="alert"

### Testing Requirements
- [ ] Unit tests for encryption/decryption
- [ ] Round-trip test (encrypt → decrypt)
- [ ] Wrong password test
- [ ] Empty password test
- [ ] Integration test with export/import
- [ ] jest-axe: 0 violations

## DONE WHEN

- [ ] encryptionManager utility created
- [ ] EncryptionSettings component created
- [ ] DecryptDialog component created
- [ ] Export flow integrated
- [ ] Import flow integrated
- [ ] All tests passing
- [ ] Security review passed
- [ ] Manual encryption/decryption testing
- [ ] Code review passed
- [ ] Merged to main

## Success Metrics

```
Before PR-031:
├─ Backup encryption: None
├─ Privacy: Plain text JSON
└─ Power users: Concerned about cloud

After PR-031:
├─ Backup encryption: AES-256-GCM (opt-in)
├─ Privacy: Strong protection
└─ Power users: 5-10% adoption ✨
```

---

**Priority**: LOW 💡 (Optional for most users)
**Dependencies**: PR-027 (Backup UX), PR-032 (Data integrity recommended)
**Start Date**: Week 4 (or later)
**Target Completion**: 4-5 days
**Next PR**: [PR-032: Data Integrity](./PR-032-Data-Integrity.md) (can be done before this)
