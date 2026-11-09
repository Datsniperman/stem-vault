import zlib from 'zlib';
import { DawProjectOptions } from './types';
import { detectTrackCategory } from './colorMap';

export function generateAbletonLiveSetXml(options: DawProjectOptions): string {
  const bpm = options.bpm && options.bpm > 20 && options.bpm < 300 ? options.bpm : 120;
  const num = options.timeSignatureNumerator || 4;
  const den = options.timeSignatureDenominator || 4;

  let tracksXml = '';
  options.tracks.forEach((track, i) => {
    const cat = detectTrackCategory(track.name);
    const cleanName = track.name.replace(/[<>&'"]/g, '');
    const cleanFilename = track.filename.replace(/[<>&'"]/g, '');
    const duration = track.durationSeconds && track.durationSeconds > 0 ? track.durationSeconds : 240.0;
    const beatsLength = (duration * (bpm / 60)).toFixed(4);

    tracksXml += `      <AudioTrack Id="${i + 10}">
        <Name>
          <EffectiveName Value="${cleanName}" />
          <UserName Value="${cleanName}" />
        </Name>
        <Color Value="${cat.abletonColor}" />
        <DeviceChain>
          <MainSequencer>
            <ClipTimeable>
              <ArrangerAutomation>
                <Events>
                  <AudioClip Id="${i + 100}" Time="0">
                    <CurrentStart Value="0" />
                    <CurrentEnd Value="${beatsLength}" />
                    <Loop>
                      <LoopStart Value="0" />
                      <LoopEnd Value="${beatsLength}" />
                      <StartRelative Value="0" />
                      <LoopOn Value="false" />
                    </Loop>
                    <Name Value="${cleanFilename}" />
                    <SampleRef>
                      <FileRef>
                        <Name Value="${cleanFilename}" />
                        <Path Value="${cleanFilename}" />
                      </FileRef>
                    </SampleRef>
                  </AudioClip>
                </Events>
              </ArrangerAutomation>
            </ClipTimeable>
          </MainSequencer>
        </DeviceChain>
      </AudioTrack>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Ableton MajorVersion="5" MinorVersion="11.0_438" SchemaChangeCount="3" Creator="The Mixing Vault">
  <LiveSet>
    <MasterTrack>
      <DeviceChain>
        <Mixer>
          <Tempo>
            <Manual Value="${bpm}" />
          </Tempo>
          <TimeSignature>
            <TimeSignatures>
              <RemoteableTimeSignature>
                <Numerator Value="${num}" />
                <Denominator Value="${den}" />
              </RemoteableTimeSignature>
            </TimeSignatures>
          </TimeSignature>
        </Mixer>
      </DeviceChain>
    </MasterTrack>
    <Tracks>
${tracksXml}    </Tracks>
  </LiveSet>
</Ableton>`;
}

export function generateAbletonProject(options: DawProjectOptions): Buffer {
  const xml = generateAbletonLiveSetXml(options);
  return zlib.gzipSync(Buffer.from(xml, 'utf-8'));
}
