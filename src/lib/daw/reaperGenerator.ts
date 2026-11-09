import { DawProjectOptions } from './types';
import { detectTrackCategory } from './colorMap';

function generateGuid(): string {
  // Generate valid REAPER GUID: {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
      .toUpperCase();
  return `{${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}}`;
}

export function generateReaperProject(options: DawProjectOptions): string {
  const bpm = options.bpm && options.bpm > 20 && options.bpm < 300 ? options.bpm : 120;
  const num = options.timeSignatureNumerator || 4;
  const den = options.timeSignatureDenominator || 4;
  const timestamp = Math.floor(Date.now() / 1000);

  const lines: string[] = [];
  lines.push(`<REAPER_PROJECT 0.1 "7.0" ${timestamp}`);
  lines.push('  RIPPLE 0');
  lines.push('  GROUPOVERRIDE 0 0 0');
  lines.push('  AUTOXFADE 1');
  lines.push('  ENVATTACH 1');
  lines.push('  POOLEDENVATTACH 0');
  lines.push('  MIXERFLAG 11');
  lines.push(`  TEMPO ${bpm} ${num} ${den}`);
  lines.push('  PLAYRATE 1 0 0.25 0.05 0');
  lines.push('  RECORD_PATH "" ""');

  options.tracks.forEach((track, index) => {
    const trackGuid = generateGuid();
    const itemGuid = generateGuid();
    const cat = detectTrackCategory(track.name);
    const duration = track.durationSeconds && track.durationSeconds > 0 ? track.durationSeconds : 240.0;
    const cleanFilename = track.filename.replace(/["\\]/g, '');
    const cleanName = track.name.replace(/["\\]/g, '');

    lines.push(`  <TRACK ${trackGuid}`);
    lines.push(`    NAME "${cleanName}"`);
    lines.push(`    PEAKCOL ${cat.reaperColor}`);
    lines.push('    BEAT -1');
    lines.push('    VOLPAN 1 0 -1 -1 1');
    lines.push('    MUTESOLO 0 0 0');
    lines.push('    IPHASE 0');
    lines.push('    ISBUS 0 0');
    lines.push('    BUSCOMP 0 0 0 0 0');
    lines.push('    SHOWINMIX 1 0.6667 0.5 1 0.5 0 0 0');
    lines.push('    FREEMODE 0');
    lines.push('    SEL 0');
    lines.push('    REC 0 0 0 0 0 0 0 0');
    lines.push('    VU 2');
    lines.push('    TRACKHEIGHT 0 0 0 0 0 0');
    lines.push('    INQ 0 0 0 0.5 0.5 0 0');
    lines.push('    NCHAN 2');
    lines.push('    FX 1');
    lines.push('    TRACKID ' + (index + 1));
    lines.push('    <ITEM');
    lines.push('      POSITION 0.00000000000000');
    lines.push('      SNAPOFFS 0.00000000000000');
    lines.push(`      LENGTH ${duration.toFixed(8)}`);
    lines.push('      LOOP 0');
    lines.push('      ALLTAKES 0');
    lines.push('      FADEIN 1 0.00500000 0 1 0 0 0');
    lines.push('      FADEOUT 1 0.00500000 0 1 0 0 0');
    lines.push('      MUTE 0 0');
    lines.push(`      IGUID ${itemGuid}`);
    lines.push(`      IID ${index + 1}`);
    lines.push(`      NAME "${cleanFilename}"`);
    lines.push('      VOLPAN 1 0 1 -1');
    lines.push('      SOFFS 0.00000000000000');
    lines.push('      PLAYRATE 1 1 0 -1 0 0.0025');
    lines.push('      CHANMODE 0');
    lines.push(`      <SOURCE WAVE`);
    lines.push(`        FILE "${cleanFilename}"`);
    lines.push('      >');
    lines.push('    >');
    lines.push('  >');
  });

  lines.push('>');
  return lines.join('\n');
}
