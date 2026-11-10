export const HEADER_BYTES = 10;
const MAGIC_0 = 0x53;
const MAGIC_1 = 0x54;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for(let n = 0; n < 256; n++) {
    let c = n;
    for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for(let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function capacityBytes(width: number, height: number): number {
  return Math.max(0, Math.floor((width * height * 3) / 8) - HEADER_BYTES);
}

export function utf8Encode(text: string): Uint8Array {
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
  if (payload.length > capacityBytes(width, height)) throw new Error("Zpráva je příliš dlouhá.");

  const data = new Uint8Array(HEADER_BYTES + payload.length);
  const view = new DataView(data.buffer);
  data[0] = MAGIC_0;
  data[1] = MAGIC_1;
  view.setUint32(2, payload.length, false);
  view.setUint32(6, crc32(payload), false);
  data.set(payload, HEADER_BYTES);

  const out = rgba.slice();
  const totalBits = data.length * 8;
  let bit = 0;

  for (let p = 0; p < out.length && bit < totalBits; p += 4) {
    for (let c = 0; c < 3 && bit < totalBits; c++, bit++) {
      out[p + c] = (out[p + c] & 0xfe) | ((data[bit >> 3] >> (7 - (bit & 7))) & 1);
    }
  }
  return out;
}

function readBytes(rgba: Uint8Array, byteOffset: number, count: number): Uint8Array {
  const out = new Uint8Array(count);
  const totalBits = count * 8;
  let pixel = Math.floor((byteOffset * 8) / 3);
  let channel = (byteOffset * 8) % 3;

  for(let n = 0; n < totalBits; n++) {
    out[n >> 3] |= (rgba[pixel * 4 + channel] & 1) << (7 - (n & 7));
    if(++channel === 3) {
      channel = 0;
      pixel++;
    }
  }
  return out;
}

export function extractMessage(rgba: Uint8Array, width: number, height: number): string {
  const header = readBytes(rgba, 0, HEADER_BYTES);
  if(header[0] !== MAGIC_0 || header[1] !== MAGIC_1) {
    throw new Error("V obrázku nebyla nalezena žádná zpráva.")
  }

  const view = new DataView(header.buffer);
  const length = view.getUint32(2, false);
  const expectedCrc = view.getUint32(6, false);

  if(length === 0 || length > capacityBytes(width, height)) {
    throw new Error("Hlavička zprávy je neplatná.");
  }

  const payload = readBytes(rgba, HEADER_BYTES, length);
  if(crc32(payload) !== expectedCrc) {
    throw new Error("Zpráva je poškozená (nesedí kontrolní součet).");
  }

  try {
    return utf8Decode(payload);
  } catch {
    throw new Error("Data v obrázku nesjou platný text.");
  }
}

export function psnr(a: Uint8Array, b: Uint8Array): number {
  let sum = 0;
  let n = 0;
  for(let i = 0; i < a.length; i++) {
    if (i % 4 === 3) continue;
    const d = a[i] - b[i];
    sum += d * d;
    n++;
  }
  const mse = sum / n;
  return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
}

export function diffMap(a: Uint8Array, b: Uint8Array,): { pixels: Uint8Array; changedPct: number } {
  const out = new Uint8Array(a.length);
  let changed = 0;
  const total = a.length / 4;
  for(let i = 0; i < a.length; i += 4) {
    const diff = a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2];
    if (diff) changed++;
    out[i] = diff ? 239 : 0;
    out[i + 1] = diff ? 35 : 20;
    out[i + 2] = diff ? 60 : 10;
    out[i + 3] = 255;
  }
  return { pixels: out, changedPct: (changed / total) * 100 };
}

export function lsbPlane(a: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for(let i = 0; i < a.length; i += 4) {
    out[i] = (a[i] & 1) * 255;
    out[i + 1] = (a[i + 1] & 1) * 255;
    out[i + 2] = (a[i + 2] & 1) * 255;
    out[i + 3] = 255;
  }
  return out;
}

const FILLER = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ";

export function makeTestMessage(targetBytes: number): string {
  const start = "[ZAČÁTEK] "
  const end = " [KONEC]"
  const overhead = utf8Encode(start).length + utf8Encode(end).length;
  const bodyLen = Math.max(0, targetBytes - overhead);
  const body = FILLER.repeat(Math.ceil(bodyLen / FILLER.length)).slice(0, bodyLen);
  return start + body + end;
}