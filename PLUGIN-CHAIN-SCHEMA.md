# Mixing Vault Plugin Chain JSON Schema (v1)

> **Status**: DAW plugin support coming later — export/import schema ready.
> **Schema Version**: `1.0.0`

This specification defines the versioned, portable JSON interchange format for digital audio workstation (DAW) plugin chains within **The Mixing Vault**. It serves as the data foundation for community chain sharing, web import/export, and future VST3 / AU / AAX plugin client sync.

---

## Specification: Version `1.0.0`

### 1. Root Object Properties

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | `string` | **Yes** | Semantic version string for this schema. Must be `"1.0.0"` for v1. |
| `name` | `string` | **Yes** | Human-readable name of the signal chain (e.g., *"Lead Vocal Polish"*, *"Drum Bus Crush"*). Max 255 chars. |
| `daw` | `string` | **Yes** | Digital Audio Workstation context (e.g., *"Pro Tools"*, *"Logic Pro"*, *"Ableton Live"*, *"FL Studio"*, *"Studio One"*, *"Reaper"*). |
| `description` | `string` \| `null` | No | Optional notes explaining the overall intent, routing, or mix style. |
| `created_at` | `string` | No | ISO 8601 UTC timestamp of chain creation. |
| `exported_at` | `string` | No | ISO 8601 UTC timestamp of export generation. |
| `author` | `string` \| `null` | No | Display name or handle of original creator. |
| `plugins` | `Array<PluginItem>` | **Yes** | Ordered array of plugin slots in the signal chain. Must contain at least 1 item. |

---

### 2. `PluginItem` Object Properties

| Field | Type | Required | Description |
|---|---|---|---|
| `position` | `integer` | **Yes** | 1-based sequential order in the chain (`1, 2, 3...`). |
| `plugin_name` | `string` | **Yes** | Name of the audio plugin (e.g., *"Pro-Q 3"*, *"CLA-76"*, *"Decapitator"*). |
| `vendor` | `string` \| `null` | No | Developer/vendor name (e.g., *"FabFilter"*, *"Waves"*, *"Soundtoys"*, *"Universal Audio"*). |
| `category` | `string` \| `null` | No | Functional category / slot (e.g., *"Preamp"*, *"EQ"*, *"Dynamic EQ"*, *"Compressor"*, *"Multiband"*, *"De-Esser"*, *"Saturation"*, *"Modulation"*, *"Delay"*, *"Reverb"*, *"Bus"*, *"Master"*). |
| `notes` | `string` \| `null` | No | Plain-text settings, routing advice, threshold/ratio notes, or preset instructions. (Binary DAW preset parsing intentionally deferred to post-v1). |

---

## Example Payload (`v1.0.0`)

```json
{
  "schema_version": "1.0.0",
  "name": "Modern Pop Vocal Chain",
  "daw": "Logic Pro",
  "description": "Crisp and upfront lead vocal chain used on pop tracks. Low latency tracking or mixdown.",
  "created_at": "2026-10-30T15:00:00Z",
  "exported_at": "2026-10-30T15:35:00Z",
  "author": "Connor Brown",
  "plugins": [
    {
      "position": 1,
      "plugin_name": "Pro-Q 3",
      "vendor": "FabFilter",
      "category": "EQ",
      "notes": "HPF at 85Hz 18dB/oct, notch 320Hz mud, +1.5dB high shelf at 12kHz."
    },
    {
      "position": 2,
      "plugin_name": "Pro-DS",
      "vendor": "FabFilter",
      "category": "De-Esser",
      "notes": "Single vocal mode, bandpass around 6.5kHz, threshold -22dB."
    },
    {
      "position": 3,
      "plugin_name": "1176LN Classic",
      "vendor": "Universal Audio",
      "category": "Compressor",
      "notes": "4:1 ratio, Attack 3, Release 7. Catching 3-5dB peak gain reduction."
    },
    {
      "position": 4,
      "plugin_name": "ValhallaVintageVerb",
      "vendor": "Valhalla DSP",
      "category": "Reverb",
      "notes": "Concert Hall algorithm, 1.8s decay, 20ms predelay, mix 18%."
    }
  ]
}
```

---

## API Integration Endpoints

### 1. Export Chain
- **Method**: `GET /api/plugin-chains/:id/export`
- **Response**: `200 OK` with JSON conforming to this schema, plus `Content-Disposition: attachment; filename="<chain-name>-chain.json"`.

### 2. Import Chain
- **Method**: `POST /api/plugin-chains/import`
- **Auth**: Authenticated session required.
- **Body**: JSON matching the schema above.
- **Validation**:
  - `schema_version` must be `"1.0.0"`.
  - `name` and `daw` must be non-empty strings.
  - `plugins` must be a non-empty array with `plugin_name` for each item.
- **Response**: `201 Created` with `{ success: true, chain: { id, name, ... } }`.

---

## Future DAW Plugin Architecture Hook

A future lightweight VST3 / AU / AAX plugin wrapper will integrate with this API:
1. User logs in with personal Mixing Vault token within the DAW plugin.
2. The DAW plugin queries the user's saved chains via `GET /api/plugin-chains`.
3. Selecting a chain fetches the JSON specification via `GET /api/plugin-chains/:id/export`.
4. The host plugin matches installed VST3/AU identifiers on the local machine and instantiates slots sequentially, providing quick setup of vocal, drum, and mix bus templates directly inside any major DAW.
