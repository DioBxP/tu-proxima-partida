# Propuesta académica

## Título

**Tu próxima partida: sistema web de recomendación explicable de videojuegos de PC basado en preferencias de sesión, con despliegue en Microsoft Azure.**

## Problema

Elegir qué jugar puede consumir parte del tiempo libre. Los catálogos suelen organizarse por género o popularidad, mientras que una decisión cotidiana también depende del ánimo, el tiempo disponible, el presupuesto y la compañía.

## Objetivo general

Desarrollar una aplicación web que recomiende juegos de PC según esas preferencias y explique las coincidencias, usando GitHub para guardar el código y Azure para publicar el servicio.

## Objetivos específicos

- Organizar un catálogo de videojuegos en SQLite.
- Capturar las preferencias mediante un cuestionario web.
- Filtrar condiciones obligatorias y puntuar afinidades.
- Presentar hasta tres resultados explicados.
- Permitir explorar el catálogo y guardar favoritos en el navegador.
- Verificar el comportamiento y preparar el despliegue en Azure App Service.

## Arquitectura

Navegador (HTML, CSS, JavaScript) → API HTTP en Node.js → Catálogo SQLite de lectura.

El navegador guarda favoritos localmente. El servidor consulta juegos desde SQLite y calcula las recomendaciones. GitHub conserva las fuentes del catálogo, la aplicación y las pruebas. Azure App Service ejecuta el servidor cuando se complete la publicación.

SQLite es una base embebida que se ejecuta junto al servidor, no un servicio de base de datos administrado de Azure. Se reconstruye desde los datos del repositorio durante la preparación. Como el usuario no modifica el catálogo, puede regenerarse sin perder información personal.

## Algoritmo

Se aplica filtrado por contenido mediante reglas y puntuación ponderada. Tiempo, compañía y presupuesto son condiciones obligatorias. Ánimo aporta 60 puntos y género opcional 40. Los empates se resuelven por sesiones cortas y nombre. Los resultados parciales indican sus diferencias.

Esta versión no utiliza aprendizaje automático: el mecanismo es determinista y sus decisiones se pueden explicar.

## Demostración sugerida

1. Explica el problema y abre la aplicación.
2. Busca un juego para relajarte con 30 minutos disponibles.
3. Cambia a competir, 15 minutos, con amigos y gratis.
4. Abre una ficha y muestra por qué se recomendó.
5. Guarda un juego y recarga para comprobar el favorito.
6. Busca por nombre en el catálogo.
7. Muestra el repositorio y el recurso de Azure una vez publicados.

## Alcance

18 juegos iniciales, sin registro de cuentas y sin precios en tiempo real. Las portadas, modalidades y clasificación de juego base gratuito se documentan mediante enlaces a Steam. El ánimo y la duración de sesión son etiquetas editoriales. La aplicación no asegura que un juego corra en una PC determinada; la ficha enlaza a los requisitos oficiales.

## Mejoras futuras

Ampliar el catálogo; permitir excluir juegos ya jugados; agregar accesibilidad e idioma; sincronizar favoritos con una cuenta; permitir administrar el catálogo; evaluar la utilidad de los resultados con usuarios.

