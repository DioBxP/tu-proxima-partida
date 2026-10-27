# Tu próxima partida

Recomendador de videojuegos de PC según el tiempo disponible, el ánimo, la compañía y el presupuesto. Proyecto educativo de [DioBxP](https://github.com/DioBxP), preparado para Azure App Service.

## Funciones

- Cuestionario con cuatro preferencias y un género opcional.
- Hasta tres recomendaciones con motivos y advertencias de coincidencia parcial.
- Catálogo de 18 juegos, búsqueda por nombre, filtro por género y juegos gratuitos.
- Fichas con enlace oficial a Steam.
- Favoritos guardados en el navegador, conservados al recargar.
- Diseño adaptable, controles de teclado y ventanas de detalles accesibles.
- Catálogo SQLite consultado desde una API en Node.js.

## Ejecutar en tu computadora

Instala [Node.js 24 LTS](https://nodejs.org/). En la carpeta del proyecto:

```sh
npm run build
npm start
```

Abre http://localhost:4173. No se requieren paquetes externos ni claves de API. No abras index.html directamente: la aplicación necesita su servidor para consultar el catálogo.

```sh
npm test
```

Las pruebas comprueban condiciones obligatorias, puntuación, resultados parciales, validación, SQLite, API, portadas y protección de rutas.

## Organización

```text
public/               Interfaz HTML, CSS, JavaScript y portadas
data/games.json       Catálogo editorial original
data/catalog.sqlite   Base SQLite generada por npm run build
lib/catalog.mjs       Creación y lectura de la base
lib/recommend.mjs     Motor de recomendaciones
server.mjs            Servidor y API
scripts/build-db.mjs  Preparación del catálogo
test/                 Pruebas automáticas
docs/                 Publicación, explicación académica y fuentes
.github/workflows/    Verificación automática en GitHub
```

## Cómo recomienda

1. Descarta juegos que superen el tiempo disponible.
2. Respeta la modalidad y el presupuesto gratuito.
3. Asigna 60 puntos si el ánimo coincide.
4. Asigna 40 puntos si el género opcional coincide.
5. Ordena por puntuación, duración de sesión y nombre. Devuelve hasta tres.

Sin género elegido, la puntuación máxima es 60. Con género, es 100. Son puntos de afinidad editorial, no una probabilidad ni una valoración del juego. Las diferencias se muestran como coincidencias parciales. Las condiciones obligatorias nunca se amplían silenciosamente.

Los tiempos son estimaciones por sesión o punto de pausa. Por ejemplo, guardar una partida de cartas permite continuar después; 15 minutos no representan la duración completa del juego.

## API

- GET /api/health: estado y cantidad de juegos.
- GET /api/games: catálogo y nombres de categorías.
- GET /api/recommendations?mood=competir&time=15&mode=amigos&budget=free&genre=any

Valores de tiempo: 15, 30, 60 y 120. La interfaz llama «Sin prisa» a 120 minutos.
Los parámetros inválidos devuelven 400. Los métodos de escritura devuelven 405.

## GitHub y Azure

Sigue [la guía de publicación](docs/PUBLICAR.md). El destino es **Azure App Service con Node.js 24 sobre Linux**, porque este proyecto tiene servidor y base SQLite. El catálogo se genera durante la preparación y se abre en modo lectura. No utiliza una base de datos administrada externa.

Repositorio del proyecto: https://github.com/DioBxP/tu-proxima-partida. La publicación en Azure se completa con la conexión de despliegue de tu cuenta; incluir esta guía no significa que el servicio ya esté publicado.

## Alcance y fuentes

Los favoritos permanecen en el dispositivo; no se sincronizan entre cuentas. El catálogo es una selección editorial y no se actualiza automáticamente desde Steam. Los requisitos y precios vigentes se consultan en la tienda.

Las portadas y las marcas pertenecen a sus titulares. Se incluyen para identificar los juegos en una demostración educativa; este proyecto no está afiliado a Steam. Consulta [las fuentes por juego](docs/fuentes.json) y [la explicación para exponerlo](docs/PROYECTO.md).

