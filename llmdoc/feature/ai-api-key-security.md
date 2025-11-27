# AI API Key Security and Storage

## 1. Purpose

Implements secure API key storage with platform-specific encryption strategies. In browser mode, uses Web Crypto API (AES-GCM) to encrypt sensitive API keys before storing in localStorage. In desktop mode (Tauri), delegates to OS-level credential management. This ensures API keys are never stored in plaintext while maintaining compatibility across deployment scenarios.

## 2. How It Works

### Browser Mode (Web Deployment)

**Encryption Strategy**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)

- Generates a unique 256-bit encryption key on first use via `crypto.subtle.generateKey()`
- Key is stored as JWK (JSON Web Key) in localStorage under `ai_encryption_key`
- Each API key is encrypted with a random 12-byte IV (Initialization Vector)
- Encrypted payload structure: `{ iv: number[], data: number[], v: 1 }`
- Version marker (`v: 1`) enables future encryption algorithm changes

**Storage Format**:
```typescript
// Raw API key before encryption
const apiKey = "sk-..."

// After encryption, stored as:
{
  "iv": [1, 2, 3, ...],           // Random IV for this encryption
  "data": [255, 127, 64, ...],    // Encrypted key bytes
  "v": 1                          // Version for compatibility
}
```

**Key Functions**:
- `getOrCreateEncryptionKey()`: Creates or retrieves encryption key from localStorage
- `encryptAPIKey(apiKey)`: Encrypts using AES-GCM with random IV
- `decryptAPIKey(encrypted)`: Decrypts using stored encryption key
- `isEncryptedValue(value)`: Checks if stored value is encrypted (has `iv` and `data` fields)

### Desktop Mode (Tauri)

- Delegates to Tauri's `save_api_key`, `get_api_key`, `delete_api_key` commands
- Commands interface with OS credential managers (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- No encryption needed; OS handles secure storage natively

### Migration Strategy

**Automatic Key Encryption** in `getAPIKeySecurely()`:
1. Checks if stored value is encrypted (via `isEncryptedValue()`)
2. If encrypted, decrypts and returns key
3. If unencrypted (old key format), automatically encrypts and saves
4. Returns unencrypted value as fallback if migration fails
5. Removes corrupted keys on decryption failure

### API Changes

#### Provider Parameter

Changed from `AIProvider` type to `string` to support:
- Built-in providers: `"openai"`, `"anthropic"`
- Custom providers: Provider ID (e.g., `"custom_123456789"`)

```typescript
// Before: Limited to built-in providers
await saveAPIKeySecurely("openai", key);

// After: Supports any provider ID
await saveAPIKeySecurely(provider.id, key);  // Works for custom providers
```

#### Updated Functions

- `saveAPIKeySecurely(provider: string, apiKey: string)`: Save encrypted key
- `getAPIKeySecurely(provider: string)`: Retrieve and auto-decrypt key
- `deleteAPIKeySecurely(provider: string)`: Remove key from storage
- `hasAPIKeyStored(provider: string)`: Check if key exists

### AI Settings Panel Integration

**Changes in `ai-settings-panel.tsx`**:
- Custom provider selection uses unique values: `custom:${providerId}`
- Parse value in `onValueChange` to extract provider type and custom ID
- Auto-select first model when switching to custom provider
- Fixed preset provider button click handlers with proper event handling
- Corrected custom provider API key save logic to call secure storage functions

**Key Handler Update**:
```typescript
// Save custom provider API key securely
setAPIKey(provider.id, key);              // Zustand state
await saveAPIKeySecurely(provider.id, key); // Secure storage
```

### Zustand Store Integration

`ai-chat-store.ts` changes:
- `setAPIKey(provider: string, key: string)`: Updated signature for string provider IDs
- API keys stored in `settings.apiKeys` record (not persisted to localStorage)
- On app load, keys retrieved from secure storage via `getAPIKeySecurely()`

## 3. Relevant Code Modules

- `/lib/tauri-bridge-ai.ts`: Encryption functions and secure storage API
- `/components/ai-sidebar/ai-settings-panel.tsx`: UI for API key management
- `/lib/ai-chat-store.ts`: State management for API key references
- `/lib/ai-service.ts`: Uses API keys from store for provider initialization

## 4. Attention

- Encryption key stored in localStorage; browser local storage is not as secure as OS keychains but provides protection against casual inspection
- Corrupted encryption keys trigger automatic regeneration; old keys are lost (user must re-enter)
- Custom provider selection requires unique compound values (`custom:${id}`) to distinguish from built-in providers
- API key migration is automatic but one-way; cannot downgrade from encrypted to plaintext
- Each browser origin has independent encryption key; keys not portable across origins
