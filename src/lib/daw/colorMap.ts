export interface TrackCategoryInfo {
  category: 'drums' | 'bass' | 'guitars' | 'keys' | 'vocals' | 'fx' | 'utility' | 'other';
  colorHex: string;
  reaperColor: number; // OS color integer for REAPER
  abletonColor: number; // Ableton palette index 0-69
}

export function detectTrackCategory(filename: string): TrackCategoryInfo {
  const name = filename.toLowerCase();

  // Drums & Percussion
  if (
    /kick|snare|hat|hihat|tom|overhead|oh|room|cymb|perc|tamb|shaker|clap|snap|808|loop|drum/.test(
      name
    )
  ) {
    return {
      category: 'drums',
      colorHex: '#3b82f6', // Blue
      reaperColor: 0x01f6823b, // BGR + 0x01000000
      abletonColor: 13,
    };
  }

  // Bass
  if (/bass|sub|synth\s*bass|808\s*bass|low/.test(name)) {
    return {
      category: 'bass',
      colorHex: '#eab308', // Yellow
      reaperColor: 0x0108b3ea,
      abletonColor: 25,
    };
  }

  // Guitars
  if (/guit|gtr|egtr|agtr|acoustic|electric|strat|tele|les\s*paul|lead\s*g|rhythm\s*g/.test(name)) {
    return {
      category: 'guitars',
      colorHex: '#22c55e', // Green
      reaperColor: 0x015ec522,
      abletonColor: 19,
    };
  }

  // Keys, Synths, Piano, Organ, Strings
  if (/key|piano|organ|rhodes|wurl|synth|pad|lead\s*synth|string|violin|cello|brass|horn/.test(name)) {
    return {
      category: 'keys',
      colorHex: '#a855f7', // Purple
      reaperColor: 0x01f755a8,
      abletonColor: 38,
    };
  }

  // Vocals
  if (/vox|vocal|lead\s*v|bgv|harm|choir|talk|speech|backing|adlib/.test(name)) {
    return {
      category: 'vocals',
      colorHex: '#ec4899', // Pink / Coral
      reaperColor: 0x019948ec,
      abletonColor: 57,
    };
  }

  // Utility (Click, Guide, Count, Metronome)
  if (/click|guide|cues|count|slate|tempo|bpm/.test(name)) {
    return {
      category: 'utility',
      colorHex: '#71717a', // Gray
      reaperColor: 0x017a7171,
      abletonColor: 68,
    };
  }

  // FX & Atmosphere
  if (/fx|sfx|riser|impact|downlifter|sweep|reverb|delay|atmos|noise/.test(name)) {
    return {
      category: 'fx',
      colorHex: '#06b6d4', // Cyan
      reaperColor: 0x01d4b606,
      abletonColor: 42,
    };
  }

  // Default / Other
  return {
    category: 'other',
    colorHex: '#f97316', // Orange
    reaperColor: 0x011673f9,
    abletonColor: 21,
  };
}
