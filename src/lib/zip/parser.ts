import { inflate } from 'fflate';

export interface ZipAudioEntry {
  filename: string;
  ext: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  localOffset: number;
}

const ALLOWED_AUDIO_EXTENSIONS = new Set(['.wav', '.flac', '.mp3', '.aiff', '.aif', '.ogg']);

/**
 * Fast, memory-safe ZIP Central Directory parser.
 * Reads only the last ~1MB to find the Central Directory via File.slice().
 * Supports standard ZIP and ZIP64 (files > 2GB and > 4GB).
 * Never loads the entire file into memory.
 */
export async function parseZipEntries(file: File): Promise<ZipAudioEntry[]> {
  const fileSize = file.size;
  if (fileSize < 22) {
    throw new Error('File is too small to be a valid ZIP archive.');
  }

  // 1. Read the tail (up to 1MB) to locate End of Central Directory (EOCD)
  const searchSize = Math.min(fileSize, 1024 * 1024);
  const tailStart = fileSize - searchSize;
  const tailBlob = file.slice(tailStart, fileSize);
  const tailBuffer = await tailBlob.arrayBuffer();
  const tailView = new DataView(tailBuffer);
  const tailBytes = new Uint8Array(tailBuffer);

  // Search backwards for EOCD signature: 0x06054b50 (PK\x05\x06)
  let eocdIndexInTail = -1;
  for (let i = tailBytes.length - 22; i >= 0; i--) {
    if (
      tailBytes[i] === 0x50 &&
      tailBytes[i + 1] === 0x4b &&
      tailBytes[i + 2] === 0x05 &&
      tailBytes[i + 3] === 0x06
    ) {
      eocdIndexInTail = i;
      break;
    }
  }

  if (eocdIndexInTail === -1) {
    throw new Error('Could not parse ZIP archive. Please ensure it is a valid ZIP file.');
  }

  let cdOffset = 0;
  let cdSize = 0;

  // Check for ZIP64 End of Central Directory Locator (20 bytes before EOCD): 0x07064b50 (PK\x06\x07)
  const locatorIndexInTail = eocdIndexInTail - 20;
  let isZip64 = false;

  if (
    locatorIndexInTail >= 0 &&
    tailBytes[locatorIndexInTail] === 0x50 &&
    tailBytes[locatorIndexInTail + 1] === 0x4b &&
    tailBytes[locatorIndexInTail + 2] === 0x06 &&
    tailBytes[locatorIndexInTail + 3] === 0x07
  ) {
    isZip64 = true;
    const zip64EocdOffset = Number(tailView.getBigUint64(locatorIndexInTail + 8, true));

    // Read ZIP64 EOCD Record (56 bytes minimum, signature 0x06064b50)
    const zip64Blob = file.slice(zip64EocdOffset, zip64EocdOffset + 56);
    const zip64Buffer = await zip64Blob.arrayBuffer();
    const zip64View = new DataView(zip64Buffer);

    if (
      zip64View.getUint8(0) === 0x50 &&
      zip64View.getUint8(1) === 0x4b &&
      zip64View.getUint8(2) === 0x06 &&
      zip64View.getUint8(3) === 0x06
    ) {
      cdSize = Number(zip64View.getBigUint64(40, true));
      cdOffset = Number(zip64View.getBigUint64(48, true));
    }
  }

  if (!isZip64 || cdSize === 0) {
    cdSize = tailView.getUint32(eocdIndexInTail + 12, true);
    cdOffset = tailView.getUint32(eocdIndexInTail + 16, true);
  }

  if (cdSize <= 0 || cdOffset < 0 || cdOffset + cdSize > fileSize) {
    throw new Error('Invalid Central Directory structure in ZIP archive.');
  }

  // 2. Read only the Central Directory bytes
  const cdBlob = file.slice(cdOffset, cdOffset + cdSize);
  const cdBuffer = await cdBlob.arrayBuffer();
  const cdView = new DataView(cdBuffer);
  const cdBytes = new Uint8Array(cdBuffer);

  const audioEntries: ZipAudioEntry[] = [];
  const textDecoder = new TextDecoder('utf-8');
  let pos = 0;

  while (pos + 46 <= cdBytes.length) {
    // Signature check: 0x02014b50 (PK\x01\x02)
    if (
      cdBytes[pos] !== 0x50 ||
      cdBytes[pos + 1] !== 0x4b ||
      cdBytes[pos + 2] !== 0x01 ||
      cdBytes[pos + 3] !== 0x02
    ) {
      break;
    }

    const compressionMethod = cdView.getUint16(pos + 10, true);
    let compressedSize = cdView.getUint32(pos + 20, true);
    let uncompressedSize = cdView.getUint32(pos + 24, true);
    const nameLen = cdView.getUint16(pos + 28, true);
    const extraLen = cdView.getUint16(pos + 30, true);
    const commentLen = cdView.getUint16(pos + 32, true);
    let localOffset = cdView.getUint32(pos + 42, true);

    const filenameBytes = cdBytes.subarray(pos + 46, pos + 46 + nameLen);
    const rawPath = textDecoder.decode(filenameBytes);

    // Parse Extra Field for ZIP64 (tag 0x0001)
    if (extraLen > 0) {
      let extraPos = pos + 46 + nameLen;
      const extraEnd = extraPos + extraLen;
      while (extraPos + 4 <= extraEnd) {
        const tag = cdView.getUint16(extraPos, true);
        const size = cdView.getUint16(extraPos + 2, true);
        let sub = extraPos + 4;
        if (tag === 0x0001) {
          if (uncompressedSize === 0xffffffff && sub + 8 <= extraEnd) {
            uncompressedSize = Number(cdView.getBigUint64(sub, true));
            sub += 8;
          }
          if (compressedSize === 0xffffffff && sub + 8 <= extraEnd) {
            compressedSize = Number(cdView.getBigUint64(sub, true));
            sub += 8;
          }
          if (localOffset === 0xffffffff && sub + 8 <= extraEnd) {
            localOffset = Number(cdView.getBigUint64(sub, true));
            sub += 8;
          }
        }
        extraPos += 4 + size;
      }
    }

    const name = rawPath.replace(/^.*[\\\/]/, '');
    const isIgnored =
      name.startsWith('._') ||
      name === '.DS_Store' ||
      rawPath.includes('__MACOSX') ||
      rawPath.endsWith('/') ||
      rawPath.endsWith('\\');

    if (!isIgnored) {
      const lastDot = name.lastIndexOf('.');
      const ext = lastDot !== -1 ? name.slice(lastDot).toLowerCase() : '';
      if (ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
        audioEntries.push({
          filename: name,
          ext,
          compressedSize,
          uncompressedSize,
          compressionMethod,
          localOffset,
        });
      }
    }

    pos += 46 + nameLen + extraLen + commentLen;
  }

  return audioEntries;
}

/**
 * Extract an individual audio file blob from the ZIP file using slice.
 */
export async function extractZipEntry(file: File, entry: ZipAudioEntry): Promise<Blob> {
  const headerBlob = file.slice(entry.localOffset, entry.localOffset + 30);
  const headerBuf = await headerBlob.arrayBuffer();
  const headerView = new DataView(headerBuf);

  const fnLen = headerView.getUint16(26, true);
  const exLen = headerView.getUint16(28, true);
  const dataStart = entry.localOffset + 30 + fnLen + exLen;
  const dataEnd = dataStart + entry.compressedSize;

  const rawChunk = file.slice(dataStart, dataEnd);

  if (entry.compressionMethod === 0) {
    return rawChunk;
  }

  if (entry.compressionMethod === 8) {
    // 1. Try native DecompressionStream if available
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const stream = rawChunk.stream().pipeThrough(new DecompressionStream('deflate-raw'));
        const blob = await new Response(stream).blob();
        if (blob && blob.size > 0) return blob;
      } catch (streamErr) {
        console.warn('Native DecompressionStream error, falling back to fflate:', streamErr);
      }
    }

    // 2. Fall back to fflate inflate
    try {
      const arrayBuffer = await rawChunk.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      return await new Promise<Blob>((resolve, reject) => {
        inflate(uint8, (err, uncomp) => {
          if (err) {
            reject(new Error(`Failed to decompress entry ${entry.filename}: ${err.message}`));
          } else {
            resolve(new Blob([uncomp as Uint8Array<ArrayBuffer>], { type: 'audio/wav' }));
          }
        });
      });
    } catch (fflateErr: any) {
      console.error(`Decompression failed for ${entry.filename}:`, fflateErr);
      throw new Error(`Failed to decompress audio track "${entry.filename}": ${fflateErr?.message || 'Decompression error'}`);
    }
  }

  throw new Error(`Unsupported compression method ${entry.compressionMethod} for "${entry.filename}".`);
}
