import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Monta api/*.js dentro del servidor de desarrollo de Vite,
// para que `npm run dev` funcione igual que en Vercel.
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const name = url.pathname.replace(/^\//, '').split('/')[0];
        if (!['coach', 'save', 'admin'].includes(name)) return next();
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const raw = Buffer.concat(chunks).toString('utf8');
        try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
        req.query = Object.fromEntries(url.searchParams);
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(obj));
        };
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          await mod.default(req, res);
        } catch (e) {
          console.error(e);
          res.status(500).json({ error: 'Error interno en la API de desarrollo.' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [react(), devApi(env)] };
});
