import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import nodePath from 'node:path'
import os from 'node:os'

const MIME_MAP = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif',
  pdf: 'application/pdf',
}

function dashpadFsPlugin() {
  return {
    name: 'dashpad-fs',
    configureServer(server) {
      server.middlewares.use('/__fs', (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const action = url.pathname.replace(/^\//, '')
        const filePath = url.searchParams.get('path') || ''

        const json = (data, status = 200) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }

        try {
          if (action === 'home') {
            const home = os.homedir()
            let roots
            if (process.platform === 'win32') {
              roots = ['C:\\', 'D:\\', 'E:\\', 'F:\\'].filter(d => {
                try { fs.accessSync(d); return true } catch { return false }
              })
            } else {
              roots = ['/']
            }
            json({ home, roots })

          } else if (action === 'list') {
            if (!filePath) return json({ error: 'No path' }, 400)
            const dirents = fs.readdirSync(filePath, { withFileTypes: true })
            const entries = []
            for (const d of dirents) {
              try {
                const fullPath = nodePath.join(filePath, d.name)
                let isDir = d.isDirectory()
                if (!isDir && d.isSymbolicLink()) {
                  try { isDir = fs.statSync(fullPath).isDirectory() } catch {}
                }
                let size = null
                if (!isDir) {
                  try { size = fs.statSync(fullPath).size } catch {}
                }
                entries.push({ name: d.name, path: fullPath, kind: isDir ? 'directory' : 'file', size })
              } catch { /* skip unreadable entries */ }
            }
            entries.sort((a, b) => {
              if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            json(entries)

          } else if (action === 'read') {
            if (!filePath) return json({ error: 'No path' }, 400)
            const stat = fs.statSync(filePath)
            if (stat.size > 500_000) return json({ error: 'too_large' })
            const content = fs.readFileSync(filePath, 'utf8')
            json({ content })

          } else if (action === 'file') {
            if (!filePath) { res.statusCode = 400; res.end(); return }
            const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
            const mime = MIME_MAP[ext] || 'application/octet-stream'
            const data = fs.readFileSync(filePath)
            res.setHeader('Content-Type', mime)
            res.end(data)

          } else {
            res.statusCode = 404
            res.end()
          }
        } catch (e) {
          json({ error: e.message }, 500)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dashpadFsPlugin()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
      },
    },
  },
})
