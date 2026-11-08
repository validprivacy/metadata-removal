import fs from 'node:fs'
import crypto from 'node:crypto'

const OUT = 'metadata-removal-offline.html'
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
const hash = (text) => "'sha256-" + crypto.createHash('sha256').update(text).digest('base64') + "'"

const version = JSON.parse(read('./package.json')).version
const engine = '\n' + read('./src/metadata-removal-engine.js').trim() + '\n'
const ui = '\n' + read('./src/metadata-removal-ui.js').trim() + '\n'
const html = read('./src/offline.html')
  .replace('{{SCRIPT_HASHES}}', () => hash(engine) + ' ' + hash(ui))
  .replace('{{CSS}}', () => read('./src/offline.css').trim())
  .replace('{{VERSION}}', () => version)
  .replace('<script>\n{{ENGINE}}\n</script>', () => '<script>' + engine + '</script>')
  .replace('<script>\n{{UI}}\n</script>', () => '<script>' + ui + '</script>')

fs.writeFileSync(new URL('./' + OUT, import.meta.url), html)
console.log('Wrote ' + OUT)
