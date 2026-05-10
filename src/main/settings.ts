import { safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'

/**
 * BYO Anthropic API key, encrypted at rest using Electron's safeStorage.
 *
 * safeStorage hands off to OS-native keychains (Keychain on macOS, DPAPI on
 * Windows, libsecret on Linux). The encrypted bytes are then stored to disk
 * at userData/credentials.bin. We do NOT keep the plaintext key in memory;
 * decrypt only when the translator needs it.
 */

let _userDataDir: string | null = null
let _hasKeyCached: boolean | null = null

function credPath(): string {
  if (!_userDataDir) throw new Error('settings: initSettings(userDataDir) not called')
  return join(_userDataDir, 'credentials.bin')
}

export function initSettings(userDataDir: string): void {
  mkdirSync(userDataDir, { recursive: true })
  _userDataDir = userDataDir
  _hasKeyCached = existsSync(credPath())
}

export function encryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

export function hasApiKey(): boolean {
  if (_hasKeyCached !== null) return _hasKeyCached
  _hasKeyCached = existsSync(credPath())
  return _hasKeyCached
}

export function setApiKey(plainText: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS encryption unavailable on this system')
  }
  const trimmed = plainText.trim()
  if (trimmed.length === 0) {
    throw new Error('API key cannot be empty')
  }
  const encrypted = safeStorage.encryptString(trimmed)
  writeFileSync(credPath(), encrypted)
  _hasKeyCached = true
}

export function getApiKey(): string | null {
  if (!hasApiKey()) return null
  try {
    const buf = readFileSync(credPath())
    return safeStorage.decryptString(buf)
  } catch {
    return null
  }
}

export function clearApiKey(): void {
  if (existsSync(credPath())) {
    unlinkSync(credPath())
  }
  _hasKeyCached = false
}
