export const HEADER_BYTES = 4;

export function capacityBytes(width: number, height: number): number {
  return Math.max(0, Math.floor((width * height * 3) / 8) - HEADER_BYTES);
}

function utf8Encode(text: string): Uint8Array {
  const bin = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, h: string) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function utf8Decode(bytes: Uint8Array): string {
  const escaped = Array.from(bytes, (b) => "%" + b.toString(16).padStart(2, "0")).join("");
  return decodeURIComponent(escaped);
}

export function embedMessage(rgba: Uint8Array, width: number, height: number, message: string): Uint8Array {
  const payload = utf8Encode(message);
  if(payload.length > capacityBytes(width, height)) {
    throw new Error("Zpráva je příliš dlouhá pro tento obrázek.");
  }

  const data = new Uint8Array(HEADER_BYTES + payload.length);
  new DataView(data.buffer).setUint32(0, payload.length, false);
  data.set(payload, HEADER_BYTES);

  const out = rgba.slice();
  const totalBits = data.length * 8;
  let bit = 0;
  for(let i = 0; i < out.length && bit < totalBits; i++) {
    if(i % 4 == 3) continue;
    const value = (data[bit >> 3] >> (7 - (bit & 7))) & 1;
    out[i] = (out[i] & 0xfe) | value;
    bit++;
  }
  return out;
}

function readBytes(rgba: Uint8Array, byteOffset: number, count: number): Uint8Array {
  const out = new Uint8Array(count);
  const startBit = byteOffset * 8;
  for(let n = 0; n < count * 8; n++) {
    const bitIndex = startBit + n;
    const channelIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3);
    out[n >> 3] |= (rgba[channelIndex] & 1) << (7 - (n & 7));
  }
  return out;
}

export function extractMessage(rgba: Uint8Array, width: number, height: number): string {
  const maxLen = capacityBytes(width, height);
  const length = new DataView(readBytes(rgba, 0, HEADER_BYTES).buffer).getUint32(0, false);
  if(length === 0 || length > maxLen) {
    throw new Error("V obrázku nebyla nalezena žádná zpráva.");
  }
  try {
    return utf8Decode(readBytes(rgba, HEADER_BYTES, length));
  } catch {
    throw new Error("Data v obrázku nejsou platný text.");
  }
}