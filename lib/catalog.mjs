import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const databasePath = fileURLToPath(new URL('../data/catalog.sqlite', import.meta.url));
const seedPath = new URL('../data/games.json', import.meta.url);

export function buildDatabase(path = databasePath) {
  const games = JSON.parse(readFileSync(seedPath, 'utf8'));
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
    genres TEXT NOT NULL, moods TEXT NOT NULL, modes TEXT NOT NULL,
    session INTEGER NOT NULL CHECK(session > 0),
    free INTEGER NOT NULL CHECK(free IN (0,1)), tagline TEXT NOT NULL, year INTEGER NOT NULL
  ); BEGIN IMMEDIATE; DELETE FROM games;`);
  try {
    const insert = db.prepare('INSERT INTO games VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const game of games) insert.run(game.id, game.title, game.description,
      JSON.stringify(game.genres), JSON.stringify(game.moods), JSON.stringify(game.modes),
      game.session, Number(game.free), game.tagline, game.year);
    db.exec('COMMIT;');
  } catch (error) { db.exec('ROLLBACK;'); throw error; }
  finally { db.close(); }
  return games.length;
}

export function openCatalog(path = databasePath) {
  if (!existsSync(path)) buildDatabase(path);
  const db = new DatabaseSync(path, { readOnly: true });
  return {
    all() {
      return db.prepare('SELECT * FROM games ORDER BY title COLLATE NOCASE').all().map(row => ({
        ...row, free: Boolean(row.free), genres: JSON.parse(row.genres),
        moods: JSON.parse(row.moods), modes: JSON.parse(row.modes),
        image: `/images/${row.id}.jpg`,
        storeUrl: `https://store.steampowered.com/app/${row.id}/`
      }));
    },
    close() { db.close(); }
  };
}

