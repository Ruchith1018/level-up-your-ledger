import CryptoJS from 'crypto-js';

// In a real production app, this key should be managed more securely (e.g., environment variables, key management service).
// However, for a client-side only local-first app, we use a hardcoded key to prevent casual editing.
const SECRET_KEY = "finance-quest-secure-export-key-v1";

export const encryptData = (data: any): string => {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
};

export const decryptData = (ciphertext: string): any => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Invalid encrypted file or wrong key");
    }
};
