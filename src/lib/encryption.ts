
import CryptoJS from 'crypto-js';

// In a real production app, this should be in an environment variable (e.g., import.meta.env.VITE_ENCRYPTION_SALT)
const ENCRYPTION_SALT = "BUDGLIO_FAMILY_CHAT_SECURE_SALT_2025";

/**
 * Derives a consistent encryption key for a family.
 * @param familyId The unique ID of the family.
 * @returns A derived key string.
 */
const getDerivedKey = (familyId: string) => {
    return CryptoJS.HmacSHA256(familyId, ENCRYPTION_SALT).toString();
};

/**
 * Encrypts a message using AES.
 * @param message The plain text message.
 * @param familyId The family ID to derive the key from.
 * @returns The encrypted ciphertext.
 */
export const encryptMessage = (message: string, familyId: string): string => {
    try {
        if (!message) return "";
        const key = getDerivedKey(familyId);
        return CryptoJS.AES.encrypt(message, key).toString();
    } catch (error) {
        console.error("Encryption failed", error);
        return message; // Fallback to plain text if encryption fails (shouldn't happen)
    }
};

/**
 * Decrypts a message using AES.
 * @param ciphertext The encrypted message.
 * @param familyId The family ID to derive the key from.
 * @returns The decrypted plain text, or the original text if decryption fails (backwards compatibility).
 */
export const decryptMessage = (ciphertext: string, familyId: string): string => {
    try {
        if (!ciphertext) return "";
        const key = getDerivedKey(familyId);
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        // If decryption results in empty string but ciphertext wasn't, it might be separate encoding or wrong key.
        // However, crypto-js usually throws or returns malformed data if key is wrong.
        // If the message was NOT encrypted (legacy data), trying to decrypt might result in empty string or garbage.
        // To safely handle legacy plain-text:
        // We can assume if it doesn't look like standard Base64 AES output, it's plain text.
        // But simpler: check if `originalText` is valid.

        if (!originalText) {
            // Decryption produced nothing, likely wasn't encrypted.
            return ciphertext;
        }
        return originalText;
    } catch (error) {
        // Fallback for legacy plain-text messages
        return ciphertext;
    }
};
