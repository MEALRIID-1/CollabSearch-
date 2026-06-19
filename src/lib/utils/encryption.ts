import CryptoJS from 'crypto-js';

/**
 * Génère une clé aléatoire pour le chiffrement
 */
export function generateEncryptionKey(): string {
  const randomKey = CryptoJS.lib.WordArray.random(32); // 256 bits
  return randomKey.toString();
}

/**
 * Chiffre un fichier (ArrayBuffer) avec une clé
 */
export function encryptFile(
  fileData: ArrayBuffer,
  encryptionKey: string
): { encrypted: string; iv: string } {
  // Convertir ArrayBuffer en WordArray
  const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(fileData));

  // Générer un IV aléatoire
  const iv = CryptoJS.lib.WordArray.random(16); // 128 bits pour CBC

  // Chiffrer avec AES-256-CBC
  const encrypted = CryptoJS.AES.encrypt(wordArray, CryptoJS.enc.Utf8.parse(encryptionKey), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encrypted: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64),
  };
}

/**
 * Déchiffre un fichier chiffré avec une clé
 */
export function decryptFile(
  encryptedData: string,
  encryptionKey: string,
  iv: string
): ArrayBuffer {
  try {
    // Créer l'objet CipherParams à partir des données base64
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedData),
      iv: CryptoJS.enc.Base64.parse(iv),
    });

    // Déchiffrer
    const decrypted = CryptoJS.AES.decrypt(cipherParams, CryptoJS.enc.Utf8.parse(encryptionKey), {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Convertir WordArray en Uint8Array puis en ArrayBuffer
    const uint8Array = new Uint8Array(
      decrypted
        .toString(CryptoJS.enc.Hex)
        .match(/.{1,2}/g)!
        .map((byte) => parseInt(byte, 16))
    );

    return uint8Array.buffer;
  } catch (error) {
    throw new Error('Déchiffrement échoué. Vérifiez la clé.');
  }
}

/**
 * Formate une clé pour affichage/partage (plus lisible)
 */
export function formatKeyForDisplay(key: string): string {
  // Prendre les premiers 32 caractères et les espacer tous les 4 caractères
  const shortened = key.substring(0, 32);
  return shortened.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Vérifie qu'une clé a le bon format
 */
export function validateEncryptionKey(key: string): boolean {
  // Une clé générée par generateEncryptionKey() est une chaîne hexadécimale
  return /^[a-f0-9]{64}$/.test(key.replace(/\s/g, ''));
}
