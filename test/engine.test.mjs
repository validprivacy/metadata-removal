import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import '../src/metadata-removal-engine.js'

const api = globalThis.ValidMetadataRemoval
const FIXTURES = new URL('./fixtures/', import.meta.url)
const SECRETS = ['TestCam', 'TestSoftware', 'TestOwner', 'SERIAL12345', 'TestXmp', 'TestJpegComment', 'TestPng', 'TestVideo', 'TestMov', 'TestM4a', 'TestMp3', 'TestWav', 'TestFlac', 'TestGpsData', '+36.1540', '2026:01:02', '2026-01-02', 'GPSLatitude']
const LOCATION = 'Location (GPS)'
const DEVICE = 'Camera or device details'
const TAGS = 'Title, artist, and album tags'
const TRACK = 'GPS and sensor data track'

function load(name) {
  return new File([fs.readFileSync(new URL(name, FIXTURES))], name)
}

async function run(name) {
  const input = new Uint8Array(fs.readFileSync(new URL(name, FIXTURES)))
  const result = await api.clean(load(name))
  const output = result.output ? new Uint8Array(await result.output.arrayBuffer()) : null
  return { ...result, input, output }
}

function text(bytes) {
  return Buffer.from(bytes).toString('latin1')
}

function assertNoSecrets(name, bytes) {
  const body = text(bytes)
  for (const secret of SECRETS) assert.ok(!body.includes(secret), name + ' still contains ' + secret)
}

function boxes(bytes) {
  const out = []
  const view = Buffer.from(bytes)
  for (let p = 0; p + 8 <= bytes.length;) {
    let size = view.readUInt32BE(p)
    if (size === 1) size = Number(view.readBigUInt64BE(p + 8))
    if (size === 0) size = bytes.length - p
    out.push({ type: text(bytes.subarray(p + 4, p + 8)), start: p, end: p + size })
    p += size
  }
  return out
}

function jpegScan(bytes) {
  for (let p = 2; p < bytes.length;) {
    if (bytes[p + 1] === 0xda) return bytes.subarray(p)
    p += 2 + ((bytes[p + 2] << 8) | bytes[p + 3])
  }
  return null
}

function pngChunks(bytes, type) {
  const view = Buffer.from(bytes)
  const parts = []
  for (let p = 8; p + 12 <= bytes.length;) {
    const len = view.readUInt32BE(p)
    if (text(bytes.subarray(p + 4, p + 8)) === type) parts.push(bytes.subarray(p + 8, p + 8 + len))
    p += 12 + len
  }
  return Buffer.concat(parts)
}

function assertChangesOnlyInside(name, input, output, allowed) {
  assert.equal(output.length, input.length, name + ' changed size')
  for (let i = 0; i < input.length; i++) {
    if (input[i] === output[i]) continue
    const inside = allowed.some((r) => i >= r.start && i < r.end)
    assert.ok(inside || output[i] === 0, name + ' changed media bytes at ' + i)
  }
}

let crcTable = null
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

test('JPEG: GPS, device, dates, XMP, and comments removed, image data and rotation kept', async () => {
  const r = await run('photo.jpg')
  assert.equal(r.kind, 'JPEG image')
  assert.ok(r.found.includes(LOCATION) && r.found.includes(DEVICE))
  assert.ok(Math.abs(r.location.lat - 36.154) < 0.001 && Math.abs(r.location.lon + 95.9928) < 0.001)
  assertNoSecrets('photo.jpg', r.output)
  assert.deepEqual(jpegScan(r.output), jpegScan(r.input))
  assert.ok(text(r.output).includes('Exif\0\0II*'), 'rotation tag kept')
})

test('JPEG: progressive images keep their image data', async () => {
  const r = await run('progressive.jpg')
  assertNoSecrets('progressive.jpg', r.output)
  assert.deepEqual(jpegScan(r.output), jpegScan(r.input))
})

test('HEIC: EXIF and XMP blanked in place, same size, image data untouched', async () => {
  const r = await run('photo.heic')
  assert.equal(r.kind, 'HEIC photo')
  assert.ok(r.found.includes(LOCATION))
  assertNoSecrets('photo.heic', r.output)
  const meta = boxes(r.input).find((b) => b.type === 'meta')
  const mdat = boxes(r.input).find((b) => b.type === 'mdat')
  assertChangesOnlyInside('photo.heic', r.input, r.output, [meta, mdat])
  assert.deepEqual(r.output.subarray(meta.start, meta.end), r.input.subarray(meta.start, meta.end))
})

test('PNG: text, EXIF, and XMP removed, pixel data kept', async () => {
  const r = await run('image.png')
  assertNoSecrets('image.png', r.output)
  assert.deepEqual(pngChunks(r.output, 'IDAT'), pngChunks(r.input, 'IDAT'))
})

test('PNG: a file with nothing to remove comes back byte for byte', async () => {
  const r = await run('plain.png')
  assert.deepEqual(r.found, [])
  assert.deepEqual(Buffer.from(r.output), Buffer.from(r.input))
})

test('WebP: EXIF and XMP removed, image chunk kept', async () => {
  const r = await run('image.webp')
  assertNoSecrets('image.webp', r.output)
  const find = (bytes) => { const i = text(bytes).indexOf('VP8L'); return bytes.subarray(i, i + 8 + Buffer.from(bytes).readUInt32LE(i + 4)) }
  assert.deepEqual(find(r.output), find(r.input))
})

for (const name of ['video.mp4', 'clip.mov', 'song.m4a']) {
  test(name + ': tags, location, and dates removed, media data untouched', async () => {
    const r = await run(name)
    assertNoSecrets(name, r.output)
    const moov = boxes(r.input).find((b) => b.type === 'moov')
    assertChangesOnlyInside(name, r.input, r.output, [moov])
    const mdat = boxes(r.input).find((b) => b.type === 'mdat')
    assert.deepEqual(r.output.subarray(mdat.start, mdat.end), r.input.subarray(mdat.start, mdat.end))
  })
}

test('GoPro style video: GPS data track removed and its samples blanked, video and audio untouched', async () => {
  const r = await run('gopro.mov')
  assert.ok(r.found.includes(TRACK))
  assertNoSecrets('gopro.mov', r.output)
  const moov = boxes(r.input).find((b) => b.type === 'moov')
  assertChangesOnlyInside('gopro.mov', r.input, r.output, [moov])
  assert.equal(text(r.output).split('trak').length, 3, 'two media tracks remain')
})

test('fragmented MP4 is cleaned', async () => {
  const r = await run('frag.mp4')
  assert.ok(r.output)
  assertNoSecrets('frag.mp4', r.output)
})

test('MP3: ID3v2 and ID3v1 tags removed, audio frames kept', async () => {
  const r = await run('song.mp3')
  assert.ok(r.found.includes(TAGS))
  assertNoSecrets('song.mp3', r.output)
  assert.ok(Buffer.from(r.input).includes(Buffer.from(r.output)))
})

test('WAV: INFO tags removed, audio data kept', async () => {
  const r = await run('take.wav')
  assertNoSecrets('take.wav', r.output)
  const data = (bytes) => { const i = text(bytes).indexOf('data'); return bytes.subarray(i, i + 8 + Buffer.from(bytes).readUInt32LE(i + 4)) }
  assert.deepEqual(data(r.output), data(r.input))
  assert.equal(Buffer.from(r.output).readUInt32LE(4), r.output.length - 8)
})

test('FLAC: comments and cover art blanked, audio frames kept', async () => {
  const r = await run('track.flac')
  assert.ok(r.found.includes(TAGS))
  assertNoSecrets('track.flac', r.output)
  assert.equal(r.output.length, r.input.length)
  assert.deepEqual(r.output.subarray(r.output.length - 4096), r.input.subarray(r.input.length - 4096))
})

test('damaged and unsupported files are left out instead of passed through', async () => {
  for (const name of ['truncated.jpg', 'fake.heic', 'notes.txt']) {
    const r = await run(name)
    assert.equal(r.output, null, name + ' should be left out')
    assert.ok(r.skipped, name + ' should say why')
  }
})

test('zip output is valid, with fixed timestamps', async () => {
  const entries = []
  for (const name of ['photo.jpg', 'video.mp4', 'song.mp3']) {
    const r = await api.clean(load(name))
    entries.push({ name: 'folder/' + name, blob: r.output })
  }
  const zip = Buffer.from(await (await api.zip(entries)).arrayBuffer())
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  assert.equal(zip.readUInt16LE(end + 10), 3)
  let p = zip.readUInt32LE(end + 16)
  for (let i = 0; i < 3; i++) {
    assert.equal(zip.readUInt32LE(p), 0x02014b50)
    assert.equal(zip.readUInt16LE(p + 12), 0)
    assert.equal(zip.readUInt16LE(p + 14), 0x21)
    const size = zip.readUInt32LE(p + 20)
    const nameLength = zip.readUInt16LE(p + 28)
    const local = zip.readUInt32LE(p + 42)
    const localNameLength = zip.readUInt16LE(local + 26)
    const data = zip.subarray(local + 30 + localNameLength, local + 30 + localNameLength + size)
    assert.equal(crc32(data), zip.readUInt32LE(p + 16))
    p += 46 + nameLength
  }
})
