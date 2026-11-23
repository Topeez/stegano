import { utf8Encode } from "@/lib/stego-core"
import { gcm } from "@noble/ciphers/aes.js"
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { getRandomBytes } from "expo-crypto"

const SALT_LEN = 16;
const NONCE_LEN = 12;
const TAG_LEN = 16;
const ITERATIONS = 150_000;

function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  return pbkdf2Async(sha256, utf8Encode(password), salt, { c: ITERATIONS, dkLen: 32 });
}

export async function encryptBytes(passowrd: string, plain: Uint8Array): Promise<Uint8Array> {
  const salt = getRandomBytes(SALT_LEN);
  const nonce = getRandomBytes(NONCE_LEN);
  const key = await deriveKey(passowrd, salt);
  const sealed = gcm(key, nonce).encrypt(plain);

  const out = new Uint8Array(SALT_LEN + NONCE_LEN + sealed.length);
  out.set(salt, 0);
  out.set(nonce, SALT_LEN);
  out.set(sealed, SALT_LEN + NONCE_LEN);
  return out;
}

export async function decryptBytes(password: string, blob: Uint8Array): Promise<Uint8Array> {
  if(blob.length < SALT_LEN + NONCE_LEN + TAG_LEN) throw new Error("Šifrovaná data jsou příliš krátká.");

  const salt = blob.slice(0, SALT_LEN);
  const nonce = blob.slice(SALT_LEN, SALT_LEN + NONCE_LEN);
  const sealed = blob.slice(SALT_LEN + NONCE_LEN);
  const key = await deriveKey(password, salt);

  try {
    return gcm(key, nonce).decrypt(sealed);
  } catch {
    throw new Error("Špatné heslo nebo poškozená data.");
  }
}