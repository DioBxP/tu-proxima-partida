import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { once } from 'node:events';
import { buildDatabase, openCatalog } from '../lib/catalog.mjs';
import { createApp } from '../server.mjs';

test('SQLite y API responden con datos reales y rutas seguras',async()=>{
  const temp=mkdtempSync(join(tmpdir(),'tpp-test-'));
  const path=join(temp,'catalog.sqlite');
  buildDatabase(path);
  const catalog=openCatalog(path);
  assert.equal(catalog.all().length,18);
  const server=createApp({catalog});
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const root=`http://127.0.0.1:${server.address().port}`;
  try {
    const health=await fetch(root+'/api/health');
    assert.equal(health.status,200);
    assert.equal((await health.json()).database,'sqlite');
    const games=await (await fetch(root+'/api/games')).json();
    assert.equal(games.games.length,18);
    const page=await fetch(root+'/');
    assert.equal(page.status,200);
    const html=await page.text();
    assert.match(html,/<h1\b[^>]*>[^]*?<\/h1>/);
    assert.match(html,/id="preferences"/);
    const recommendations=await (await fetch(root+'/api/recommendations?budget=free&time=15&mode=amigos&mood=competir')).json();
    assert.equal(recommendations.games[0].title,'Brawlhalla');
    assert.ok(recommendations.games.every(game=>game.free && game.session<=15));
    assert.equal((await fetch(root+'/api/recommendations?time=999')).status,400);
    assert.equal((await fetch(root+'/data/games.json')).status,404);
    assert.equal((await fetch(root+'/%2e%2e%2fpackage.json')).status,403);
    assert.equal((await fetch(root+'/api/games',{method:'POST'})).status,405);
    assert.equal((await fetch(root+'/api/unknown')).status,404);
    for(const game of games.games) {
      assert.ok(existsSync(new URL('../public'+game.image,import.meta.url)),`Falta portada: ${game.title}`);
      assert.equal((await fetch(root+game.image)).status,200);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
    assert.ok(resolve(temp).startsWith(resolve(tmpdir())+sep));
    rmSync(temp,{recursive:true,force:true});
  }
});

