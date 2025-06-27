
import CryptoJS from 'crypto-js'

class SecurityManager {
  private static instance: SecurityManager
  private encryptionKey: string

  private constructor() {
    // Use a combination of user session and environment for key derivation
    this.encryptionKey = this.deriveEncryptionKey()
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  private deriveEncryptionKey(): string {
    // In production, this should use proper key derivation
    const baseKey = 'ytdm-encryption-key-v1'
    const userSalt = localStorage.getItem('user_salt') || this.generateSalt()
    
    if (!localStorage.getItem('user_salt')) {
      localStorage.setItem('user_salt', userSalt)
    }
    
    return CryptoJS.PBKDF2(baseKey, userSalt, {
      keySize: 256/32,
      iterations: 10000
    }).toString()
  }

  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString()
  }

  encryptApiKey(apiKey: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(apiKey, this.encryptionKey).toString()
      return encrypted
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt API key')
    }
  }

  decryptApiKey(encryptedKey: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedKey, this.encryptionKey)
      return decrypted.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt API key')
    }
  }

  sanitizeErrorMessage(error: any): string {
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{32,}/g, // OpenAI keys
      /Bearer\s+[a-zA-Z0-9]+/g, // Bearer tokens
      /token[=:]\s*[a-zA-Z0-9]+/gi, // Generic tokens
      /api[_-]?key[=:]\s*[a-zA-Z0-9]+/gi, // API keys
      /password[=:]\s*\S+/gi // Passwords
    ]

    let message = typeof error === 'string' ? error : error?.message || 'Unknown error'
    
    sensitivePatterns.forEach(pattern => {
      message = message.replace(pattern, '[REDACTED]')
    })
    
    return message
  }

  generateCSRFToken(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString()
  }

  validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length === 32
  }
}

export const securityManager = SecurityManager.getInstance()
