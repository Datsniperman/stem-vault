import JSZip from 'jszip';
import { DawProjectOptions } from './types';
import { detectTrackCategory } from './colorMap';

export async function generateDawproject(options: DawProjectOptions): Promise<Uint8Array> {
  const zip = new JSZip();
  const bpm = options.bpm && options.bpm > 20 && options.bpm < 300 ? options.bpm : 120;
  const num = options.timeSignatureNumerator || 4;
  const den = options.timeSignatureDenominator || 4;
  const safeTitle = options.title.replace(/[<>&'"]/g, '');

  const metadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaData version="1.0">
  <Title>${safeTitle}</Title>
  <Artist>The Mixing Vault</Artist>
  <Originator>The Mixing Vault DAW Project Builder</Originator>
</MetaData>`;

  let tracksXml = '';
  options.tracks.forEach((track, i) => {
    const cat = detectTrackCategory(track.name);
    const duration = track.durationSeconds && track.durationSeconds > 0 ? track.durationSeconds : 240.0;
    const cleanFilename = track.filename.replace(/[<>&'"]/g, '');
    const cleanName = track.name.replace(/[<>&'"]/g, '');

    tracksXml += `    <Track id="track-${i + 1}" name="${cleanName}" color="${cat.colorHex}" loaded="true">
      <Channel role="regular" volume="1.0" pan="0.0"/>
      <Arrangement>
        <Lane>
          <Clip time="0.0" duration="${duration.toFixed(3)}" name="${cleanFilename}">
            <Audio file="${cleanFilename}" channels="2"/>
          </Clip>
        </Lane>
      </Arrangement>
    </Track>\n`;
  });

  const projectXml = `<?xml version="1.0" encoding="UTF-8"?>
<Project version="1.0">
  <Application name="The Mixing Vault" version="1.0"/>
  <Transport>
    <Tempo bpm="${bpm}"/>
    <TimeSignature numerator="${num}" denominator="${den}"/>
  </Transport>
  <Structure>
${tracksXml}  </Structure>
</Project>`;

  zip.file('metadata.xml', metadataXml);
  zip.file('project.xml', projectXml);

  const buffer = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
  });

  return buffer;
}
