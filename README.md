# Metadata Removal

**Lossless, local metadata removal for photos, video, and audio.**

[![Tests](https://github.com/validprivacy/metadata-removal/actions/workflows/test.yml/badge.svg)](https://github.com/validprivacy/metadata-removal/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-silver.svg)](LICENSE)

Photos, videos, and audio files carry hidden details: where they were made, on what device, and when. Metadata Removal strips them out locally, on your own device, without re-encoding anything. The picture, video, and audio stay byte for byte the same.

Use it now at **[validprivacy.github.io/metadata-removal.html](https://validprivacy.github.io/metadata-removal.html)**, or download [`metadata-removal-offline.html`](metadata-removal-offline.html) and open it in any browser with no internet connection at all.

## What It Removes

| File type | Removed | Kept exactly as it was |
|---|---|---|
| JPEG | EXIF (GPS, device, dates, serial numbers, owner), XMP, IPTC, comments, maker data, hidden preview images, data hidden after the image | Every compressed byte of the picture, the color profile, and the rotation |
| HEIC | EXIF and XMP, blanked in place | The photo, rotation, depth data, and file size |
| PNG | Text fields, EXIF, XMP, timestamps | Every pixel and the color information |
| WebP | EXIF and XMP | The picture, animation, and color profile |
| MP4, MOV, M4A | Location, device, software, tags, comments, XMP, recording dates, the encoder name, and the GPS and sensor tracks that action cameras and drones record, such as GoPro and DJI | Every byte of the audio and video streams |
| MP3 | ID3 and APE tags, including cover art | Every audio frame |
| WAV | INFO tags, broadcast details, ID3, XMP | The audio data and format |
| FLAC | Vorbis comments and embedded pictures | The audio frames and seek points |

It also reports what each file was carrying before you save, including GPS coordinates when a photo has them.

**Coming soon:** AVIF, GIF, TIFF, RAW camera files, PDFs, and Word, Excel, and PowerPoint documents. Until then, those files are left out and listed as not supported, so nothing is ever passed through unclean.

## How It Works

Each format is edited at the container level, following its published specification:

* **JPEG, PNG, WebP:** metadata segments and chunks are cut out and the image data is copied untouched. JPEG rotation is kept as a minimal EXIF block with only the orientation tag
* **HEIC:** the EXIF and XMP items are overwritten in place with empty, valid versions, so no offsets move and the file size does not change
* **MP4 and MOV:** metadata boxes are turned into `free` boxes of the same size, recording dates are zeroed, and GPS and sensor tracks are turned into `free` boxes with their samples blanked in place. Nothing moves, so no chunk offsets need rewriting and the video is never re-muxed
* **MP3, WAV, FLAC:** tags are dropped or blanked, and the audio data is copied untouched

Large files are handled as slices of the original, so a multi-gigabyte video does not have to fit in memory. Files that cannot be read safely are left out instead of being passed through.

## Privacy

Everything runs in the browser. Nothing is uploaded. The web page and the offline file both set a Content Security Policy that blocks every network connection, so even a bug could not send a file anywhere. The zip it produces uses a fixed date for every entry, so the archive itself reveals nothing.

## Use It in Your Own Project

The engine is a single file with zero dependencies: [`src/metadata-removal-engine.js`](src/metadata-removal-engine.js). It works in modern browsers and in Node 20 or newer.

```html
<script src="metadata-removal-engine.js"></script>
<script type="module">
  const result = await ValidMetadataRemoval.clean(file)
</script>
```

```js
import './src/metadata-removal-engine.js'
const result = await globalThis.ValidMetadataRemoval.clean(file)
```

`clean(file)` takes a `File` or `Blob` and returns:

* `kind`: the detected type, such as `JPEG image`
* `found`: a list of what was removed, such as `Location (GPS)`
* `location`: `{ lat, lon }` when GPS coordinates were found
* `output`: a `Blob` of the clean file
* `skipped`: a reason, when the file was left out

`zip(entries)` takes `[{ name, blob }]` and returns a zip `Blob` with fixed timestamps.

## Development

No dependencies to install.

```bash
npm test
npm run build
```

`npm run build` regenerates `metadata-removal-offline.html` from `src/`. The tests run every fixture in `test/fixtures` and check that the test values are gone and the media data is unchanged. Every push runs the tests and checks that the offline file matches its source.

## Limits

* It cannot remove what is in the picture or recording itself: faces, signs, reflections, voices, or background sounds
* Encoder settings written inside a video stream stay, because removing them would mean re-encoding
* Some drones save GPS in a separate `.SRT` file next to the video. Leave that file out when you share
* When you save a file, your computer gives the copy a new date of its own

## Valid Privacy

Metadata Removal is a free service from [Valid Privacy](https://validprivacy.github.io).

* **Valid Network:** https://github.com/validprivacy/valid-network
* **Valid Vault:** https://github.com/validprivacy/valid-vault
* **Valid Symphony:** https://github.com/validprivacy/valid-symphony
* **Discord:** https://discord.gg/XSgqs4uuBa

## License

MIT License. See [LICENSE](LICENSE).
