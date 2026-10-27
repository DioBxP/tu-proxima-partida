import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePreferences, recommend } from '../lib/recommend.mjs';
const games = JSON.parse(readFileSync(new URL('../data/games.json',import.meta.url),'utf8'));
const base = {mood:'relajar',time:30,mode:'solo',budget:'any',genre:'any'};

test('el presupuesto gratuito nunca incluye juegos de pago',()=>{
  const result=recommend(games,{...base,budget:'free'},100);
  assert.ok(result.games.length>0);
  assert.ok(result.games.every(game=>game.free));
});
test('respeta tiempo y compañía en todas las combinaciones',()=>{
  for(const time of [15,30,60,120]) for(const mode of ['solo','amigos']) {
    const result=recommend(games,{...base,time,mode},100);
    assert.ok(result.games.every(game=>game.session<=time && game.modes.includes(mode)));
  }
});
test('coincidencias completas preceden a las parciales y se explican',()=>{
  const result=recommend(games,{...base,genre:'aventura'},100);
  assert.equal(result.games[0].score,100);
  assert.equal(result.games[0].caveats.length,0);
  for(let i=1;i<result.games.length;i++) assert.ok(result.games[i-1].score>=result.games[i].score);
  assert.ok(result.games.filter(game=>game.score<100).every(game=>game.caveats.length>0));
});
test('no recomienda fuera de las condiciones cuando no existen candidatos',()=>{
  const impossible=games.filter(game=>game.session>60);
  assert.deepEqual(recommend(impossible,{...base,time:15}).games,[]);
});
test('el resultado es determinista y devuelve hasta tres juegos',()=>{
  const result=recommend(games,base);
  assert.equal(result.games.length,3);
  assert.deepEqual(result,recommend([...games].reverse(),base));
});
test('un género no seleccionado no penaliza el resultado',()=>{
  const result=recommend(games,base);
  assert.equal(result.games[0].maximum,60);
  assert.equal(result.games[0].score,60);
});
test('rechaza preferencias manipuladas',()=>{
  for(const query of ['time=-1','time=NaN','time=9999','mode=invalido','budget=paid','mood=__proto__','mood=toString','genre=constructor'])
    assert.throws(()=>parsePreferences(new URLSearchParams(query)),RangeError);
});

