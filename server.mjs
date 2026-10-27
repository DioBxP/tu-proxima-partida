import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openCatalog } from './lib/catalog.mjs';
import { labels, parsePreferences, recommend } from './lib/recommend.mjs';

const publicRoot = fileURLToPath(new URL('./public', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };

export function createApp({ catalog = openCatalog() } = {}) {
  const server = createServer(async (request,response) => {
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const send = (status,value) => {
      response.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
      response.end(request.method === 'HEAD' ? undefined : JSON.stringify(value));
    };
    if (!['GET','HEAD'].includes(request.method)) {
      response.setHeader('Allow','GET, HEAD');
      return send(405,{ error:'Método no permitido.' });
    }
    try {
      const url = new URL(request.url,'http://localhost');
      if (url.pathname === '/api/health') return send(200,{ status:'ok',database:'sqlite',games:catalog.all().length });
      if (url.pathname === '/api/games') return send(200,{ games:catalog.all(),labels });
      if (url.pathname === '/api/recommendations') {
        try { return send(200,recommend(catalog.all(),parsePreferences(url.searchParams))); }
        catch (error) { if(error instanceof RangeError) return send(400,{ error:error.message }); throw error; }
      }
      if(url.pathname.startsWith('/api/')) return send(404,{ error:'Ruta no encontrada.' });
      let path;
      try { path = decodeURIComponent(url.pathname); } catch { return send(400,{ error:'Ruta no válida.' }); }
      if(path.includes('\0') || path.includes('\\')) return send(400,{ error:'Ruta no válida.' });
      const file = resolve(publicRoot,path === '/' ? 'index.html' : `.${path}`);
      if(!file.startsWith(publicRoot+sep)) return send(403,{ error:'Acceso no permitido.' });
      const body = await readFile(file);
      response.writeHead(200,{ 'Content-Type':types[extname(file)] ?? 'application/octet-stream','Cache-Control':extname(file) === '.jpg' ? 'public, max-age=86400' : 'no-cache' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch(error) {
      if(['ENOENT','EISDIR'].includes(error.code)) return send(404,{ error:'Archivo no encontrado.' });
      console.error('Error al atender una solicitud:',error.message);
      send(500,{ error:'No pudimos completar la solicitud. Inténtalo de nuevo.' });
    }
  });
  server.on('close',()=>catalog.close());
  return server;
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApp();
  server.listen(Number(process.env.PORT || 4173),process.env.HOST || '0.0.0.0',()=>
    console.log(`Tu próxima partida: http://localhost:${server.address().port}`));
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
}

