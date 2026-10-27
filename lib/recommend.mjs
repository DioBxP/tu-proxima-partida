export const labels = {
  moods: { relajar:'Relajarme', explorar:'Explorar', reto:'Superar un reto', competir:'Competir' },
  genres: { accion:'Acción', aventura:'Aventura', estrategia:'Estrategia', puzles:'Puzles', simulacion:'Simulación', roguelike:'Roguelike', plataformas:'Plataformas' }
};

export function parsePreferences(params) {
  const mood = params.get('mood') ?? 'relajar';
  const time = Number(params.get('time') ?? 30);
  const mode = params.get('mode') ?? 'solo';
  const budget = params.get('budget') ?? 'any';
  const genre = params.get('genre') ?? 'any';
  if (!Object.hasOwn(labels.moods,mood) || ![15,30,60,120].includes(time) ||
    !['solo','amigos','any'].includes(mode) || !['any','free'].includes(budget) ||
    !(genre === 'any' || Object.hasOwn(labels.genres,genre)))
    throw new RangeError('Las preferencias no son válidas. Revisa las opciones e intenta de nuevo.');
  return { mood, time, mode, budget, genre };
}

// Las condiciones de tiempo, compañía y presupuesto nunca se relajan.
// Ánimo: 60 puntos. Género elegido: 40 puntos. Desempate por sesión y nombre.
export function recommend(games, preferences, limit = 3) {
  const { mood, time, mode, budget, genre } = preferences;
  const maximum = genre === 'any' ? 60 : 100;
  const ranked = games.filter(game => game.session <= time &&
    (mode === 'any' || game.modes.includes(mode)) &&
    (budget !== 'free' || game.free)).map(game => {
    let score = 0;
    const reasons = [], caveats = [];
    if (game.moods.includes(mood)) {
      score += 60;
      const intentions = { relajar:'relajarte', explorar:'explorar', reto:'superar un reto', competir:'competir' };
      reasons.push(`Encaja con tus ganas de ${intentions[mood]}.`);
    } else caveats.push('El ánimo de este juego es diferente al que elegiste.');
    if (genre !== 'any') {
      if (game.genres.includes(genre)) {
        score += 40;
        reasons.push(`Incluye ${labels.genres[genre].toLocaleLowerCase('es')}, el género que buscas.`);
      } else caveats.push('Su género es diferente al que elegiste.');
    }
    reasons.push(`Sesiones orientativas desde ${game.session} minutos.`);
    if (mode !== 'any') reasons.push(mode === 'solo' ? 'Tiene una modalidad para jugar por tu cuenta.' : 'Permite jugar con amigos.');
    if (budget === 'free') reasons.push('Puedes empezar sin comprar el juego base.');
    return { ...game, score, maximum, fit:score === maximum ? 'Gran coincidencia' : score > 0 ? 'Coincidencia parcial' : 'Otra posibilidad', reasons, caveats };
  }).sort((a,b) => b.score-a.score || a.session-b.session || a.title.localeCompare(b.title,'es'));
  return { preferences, total:ranked.length, games:ranked.slice(0,limit) };
}

