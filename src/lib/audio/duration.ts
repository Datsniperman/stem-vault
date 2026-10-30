/**
 * Audio duration extractor (WAV, MP3, etc.)
 * Safely parses headers without external native binaries. Returns seconds or null.
 */

export function extractAudioDuration(buffer: Buffer, format: string): number | null {
  try {
    const fmt = format.toLowerCase();
    if (fmt.includes('wav')) {
      return parseWavDuration(buffer);
    }
    if (fmt.includes('mp3')) {
      return parseMp3Duration(buffer);
    }
    return null;
  } catch {
    return null;
  }
}

function parseWavDuration(buf: Buffer): number | null {
  if (buf.length < 44) return null;

  // Check RIFF header
  const riff = buf.toString('ascii', 0, 4);
  const wave = buf.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') return null;

  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ' && offset + 8 + 16 <= buf.length) {
      // byteRate is at offset + 8 + 8 (offset 28 in standard WAV)
      byteRate = buf.readUInt32LE(offset + 8 + 8);
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
  }

  if (byteRate > 0 && dataSize > 0) {
    const seconds = dataSize / byteRate;
    if (isFinite(seconds) && seconds > 0 && seconds < 86400) {
      return Math.round(seconds * 10) / 10;
    }
  }

  return null;
}

function parseMp3Duration(buf: Buffer): number | null {
  if (buf.length < 128) return null;

  // Search for MPEG Audio Frame Header (sync bits 11 set: 0xFF 0xE0)
  for (let i = 0; i < Math.min(buf.length - 4, 8192); i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      const versionBits = (buf[i + 1] >> 3) & 0x03;
      const layerBits = (buf[i + 1] >> 1) & 0x03;
      const bitrateIndex = (buf[i + 2] >> 4) & 0x0f;
      const samplingRateIndex = (buf[i + 2] >> 2) & 0x03;

      if (versionBits === 3 && layerBits === 1 && bitrateIndex > 0 && bitrateIndex < 15) {
        // MPEG 1 Layer 3 bitrates (kbps)
        const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
        const bitrateKbps = bitrates[bitrateIndex];
        if (bitrateKbps) {
          const seconds = (buf.length * 8) / (bitrateKbps * 1000);
          if (isFinite(seconds) && seconds > 0 && seconds < 86400) {
            return Math.round(seconds * 10) / 10;
          }
        }
      }
    }
  }
  return null;
}
