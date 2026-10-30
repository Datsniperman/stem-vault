/**
 * Sanitizes and renames audio filenames for storage while preserving readability:
 * 1. Keeps leading track-number prefix if present (e.g. 01, 02)
 * 2. Replaces spaces and illegal/problem characters with underscores
 * 3. Collapses repeated underscores
 * 4. Trims leading/trailing underscores/dots
 * 5. Keeps extension lowercase
 * 6. Disallows hashing/UUID-renaming
 * 7. Resolves collisions by appending -2, -3, etc.
 */
export function sanitizeTrackFilename(
  originalFilename: string,
  existingNames: Set<string>
): string {
  const cleanPath = originalFilename.replace(/^.*[\\\/]/, '');
  const lastDot = cleanPath.lastIndexOf('.');
  const ext = lastDot !== -1 ? cleanPath.slice(lastDot).toLowerCase() : '';
  const rawBase = lastDot !== -1 ? cleanPath.slice(0, lastDot) : cleanPath;

  // Check for leading track number (e.g., '01', '02', '1', '003') followed by space, dot, underscore, or hyphen
  const prefixMatch = rawBase.match(/^(\d+)[\s._\-]*(.*)$/);

  let prefix = '';
  let rest = rawBase;

  if (prefixMatch) {
    prefix = prefixMatch[1]; // e.g. "01"
    rest = prefixMatch[2];   // e.g. "Kick Drum (Final)"
  }

  // Sanitize the rest part: replace illegal/special chars with underscores
  const sanitizedRest = rest
    .replace(/[^\w\-]+/g, '_')         // replace any non-alphanumeric/non-dash with underscore
    .replace(/_+/g, '_')               // collapse repeated underscores
    .replace(/^[_\.]+|[_\.]+$/g, '');  // trim leading/trailing underscores and dots

  let baseName = '';
  if (prefix && sanitizedRest) {
    baseName = `${prefix}_${sanitizedRest}`;
  } else if (prefix && !sanitizedRest) {
    baseName = prefix;
  } else if (sanitizedRest) {
    baseName = sanitizedRest;
  } else {
    baseName = 'track';
  }

  // Collapse any remaining repeated underscores and trim
  baseName = baseName.replace(/_+/g, '_').replace(/^[_\.]+|[_\.]+$/g, '') || 'track';

  let candidate = `${baseName}${ext}`;

  // Collision handling: append -2, -3, etc.
  if (existingNames.has(candidate.toLowerCase())) {
    let index = 2;
    while (existingNames.has(`${baseName}-${index}${ext}`.toLowerCase())) {
      index++;
    }
    candidate = `${baseName}-${index}${ext}`;
  }

  return candidate;
}
