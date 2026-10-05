// ============================================================
// Minimal ZIP writer — produces valid PKZIP archives in the browser
// No external dependencies. Supports STORE (no compression).
// ============================================================

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  // Build CRC table once
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
  crc: number;
}

export class ZipWriter {
  private entries: ZipEntry[] = [];

  addFile(path: string, content: string): void {
    // Normalize: no leading /, no ..
    const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.includes('..')) throw new Error(`Path traversal rejected: ${path}`);
    const data = new TextEncoder().encode(content);
    this.entries.push({ path: normalized, data, crc: crc32(data) });
  }

  generate(): Uint8Array {
    // Calculate total size for single allocation
    let totalSize = 0;
    for (const entry of this.entries) {
      const pathBytes = new TextEncoder().encode(entry.path);
      totalSize += 30 + pathBytes.length + entry.data.length; // local file header + data
      totalSize += 46 + pathBytes.length; // central directory entry
    }
    totalSize += 22; // end of central directory

    const buf = new Uint8Array(totalSize);
    const view = new DataView(buf.buffer);
    let offset = 0;
    const centralEntries: { path: Uint8Array; entry: ZipEntry; localOffset: number }[] = [];

    // Local file headers + data
    for (const entry of this.entries) {
      const pathBytes = new TextEncoder().encode(entry.path);
      centralEntries.push({ path: pathBytes, entry, localOffset: offset });

      // Local file header signature
      view.setUint32(offset, 0x04034b50, true); offset += 4;
      // Version needed
      view.setUint16(offset, 20, true); offset += 2;
      // General purpose bit flag (bit 11 = UTF-8)
      view.setUint16(offset, 0x0800, true); offset += 2;
      // Compression method (0 = STORE)
      view.setUint16(offset, 0, true); offset += 2;
      // Mod time / date (zero)
      view.setUint32(offset, 0, true); offset += 4;
      // CRC-32
      view.setUint32(offset, entry.crc, true); offset += 4;
      // Compressed size
      view.setUint32(offset, entry.data.length, true); offset += 4;
      // Uncompressed size
      view.setUint32(offset, entry.data.length, true); offset += 4;
      // File name length
      view.setUint16(offset, pathBytes.length, true); offset += 2;
      // Extra field length
      view.setUint16(offset, 0, true); offset += 2;
      // File name
      buf.set(pathBytes, offset); offset += pathBytes.length;
      // File data
      buf.set(entry.data, offset); offset += entry.data.length;
    }

    // Central directory
    const centralStart = offset;
    for (const { path: pathBytes, entry, localOffset } of centralEntries) {
      // Central directory header signature
      view.setUint32(offset, 0x02014b50, true); offset += 4;
      // Version made by
      view.setUint16(offset, 20, true); offset += 2;
      // Version needed
      view.setUint16(offset, 20, true); offset += 2;
      // General purpose bit flag
      view.setUint16(offset, 0x0800, true); offset += 2;
      // Compression method
      view.setUint16(offset, 0, true); offset += 2;
      // Mod time / date
      view.setUint32(offset, 0, true); offset += 4;
      // CRC-32
      view.setUint32(offset, entry.crc, true); offset += 4;
      // Compressed size
      view.setUint32(offset, entry.data.length, true); offset += 4;
      // Uncompressed size
      view.setUint32(offset, entry.data.length, true); offset += 4;
      // File name length
      view.setUint16(offset, pathBytes.length, true); offset += 2;
      // Extra field length
      view.setUint16(offset, 0, true); offset += 2;
      // File comment length
      view.setUint16(offset, 0, true); offset += 2;
      // Disk number start
      view.setUint16(offset, 0, true); offset += 2;
      // Internal file attributes
      view.setUint16(offset, 0, true); offset += 2;
      // External file attributes
      view.setUint32(offset, 0, true); offset += 4;
      // Relative offset of local header
      view.setUint32(offset, localOffset, true); offset += 4;
      // File name
      buf.set(pathBytes, offset); offset += pathBytes.length;
    }

    const centralEnd = offset;
    const centralSize = centralEnd - centralStart;

    // End of central directory record
    view.setUint32(offset, 0x06054b50, true); offset += 4;
    // Disk number
    view.setUint16(offset, 0, true); offset += 2;
    // Disk where central directory starts
    view.setUint16(offset, 0, true); offset += 2;
    // Number of central directory records on this disk
    view.setUint16(offset, this.entries.length, true); offset += 2;
    // Total number of central directory records
    view.setUint16(offset, this.entries.length, true); offset += 2;
    // Size of central directory
    view.setUint32(offset, centralSize, true); offset += 4;
    // Offset of start of central directory
    view.setUint32(offset, centralStart, true); offset += 4;
    // Comment length
    view.setUint16(offset, 0, true); offset += 2;

    return buf.slice(0, offset);
  }

  get fileCount(): number {
    return this.entries.length;
  }

  getPaths(): string[] {
    return this.entries.map(e => e.path);
  }
}
