# Publicar en GitHub y Azure

## 1. Crear el repositorio

En tu cuenta DioBxP, crea un repositorio llamado **tu-proxima-partida**. Puedes usar [este formulario](https://github.com/new?name=tu-proxima-partida&description=Recomendador%20de%20videojuegos%20de%20PC%20para%20Azure).

Si vas a subirlo con Git desde tu computadora, créalo vacío y ejecuta desde la carpeta del proyecto:

```sh
git init -b main
git add .
git commit -m "Crear recomendador de videojuegos de PC"
git remote add origin https://github.com/DioBxP/tu-proxima-partida.git
git push -u origin main
```

Si Git solicita iniciar sesión, completa la ventana oficial de GitHub. Las credenciales no van dentro de los archivos del proyecto.

Otra opción es usar **Add file > Upload files** en GitHub y subir el contenido de la carpeta. Comprueba que package.json, server.mjs y public/ estén directamente en la raíz, sin una carpeta adicional envolviéndolos. Conserva también .github/workflows/ para ejecutar las pruebas.

## 2. Crear la aplicación en Azure

En el portal de Azure, busca **App Services** y crea una **Aplicación web / Web App**.

| Campo | Valor |
| --- | --- |
| Suscripción | Azure for Students activa |
| Grupo de recursos | Crear uno llamado rg-tu-proxima-partida |
| Nombre de aplicación | Un nombre disponible, por ejemplo tu-proxima-partida-diobxp |
| Publicar | Código |
| Pila de entorno | Node 24 LTS |
| Sistema operativo | Linux |
| Región | Una región permitida por tu suscripción |
| Plan de precios | Free F1 |

Antes de crear, revisa que el resumen muestre **F1 / Free**. El plan gratuito tiene cuotas para aprendizaje, entre ellas 60 minutos de CPU diarios. Si tu cuenta o región no permite F1, prueba otra región permitida o revisa el acceso de tu cuenta antes de elegir un plan de pago.

Este proyecto funciona con SQLite incluida: no necesita crear Azure SQL, Cosmos DB ni otro recurso de base de datos. Puedes omitir Application Insights y otros recursos adicionales para esta demostración.

Fuente: [Inicio rápido de Node.js](https://learn.microsoft.com/azure/app-service/quickstart-nodejs) y [plan gratuito F1](https://azure.microsoft.com/pricing/details/app-service/linux/).

## 3. Conectar GitHub con Azure

En la aplicación creada, abre **Centro de implementación / Deployment Center**. Elige GitHub y selecciona tu cuenta, el repositorio tu-proxima-partida y la rama main. Completa la autorización oficial y guarda la configuración.

Azure puede crear el flujo de GitHub Actions y la autenticación para implementar. Mantén el archivo de verificación que ya viene en .github/workflows/verificar.yml; el flujo de despliegue tendrá otro nombre.

La aplicación utiliza:

- Comando de preparación: npm run build
- Comando de inicio: npm start
- Versión de Node: 24
- Puerto: el valor PORT que proporciona Azure

En Linux, si necesitas establecer un comando de inicio en la configuración de App Service, usa **npm start**. El flujo debe preparar y publicar el contenido desde la raíz del repositorio, incluida data/catalog.sqlite generada. Si Azure usa su preparación automática desde el código fuente, npm run build también genera la base.

Consulta [Implementar desde GitHub Actions](https://learn.microsoft.com/azure/app-service/deploy-github-actions).

## 4. Comprobar la entrega

Espera a que el flujo de implementación termine correctamente. Abre el dominio que te muestre Azure; no basta con que el recurso exista.

Comprueba:

1. La página abre y muestra las portadas.
2. Buscar competir, 15 minutos, con amigos y solo gratuitos devuelve Brawlhalla y Super Auto Pets.
3. El catálogo filtra por nombre y género.
4. Un favorito se conserva al recargar el mismo navegador.
5. La ruta /api/health devuelve status: ok y games: 18.

Para entregar, copia el enlace real del repositorio y el enlace real que te dé Azure. Añade capturas del recurso y del despliegue exitoso si tu profesor las pide. El enlace localhost es únicamente para probar en tu computadora.

## Si aparece un error

- **No hay F1 en la región:** revisa las regiones permitidas y la cuota de la suscripción.
- **No reconoce node:sqlite:** confirma que esté seleccionado Node 24.
- **No encuentra catalog.sqlite:** confirma que se ejecutó npm run build y que data/ fue publicada.
- **Solo funciona la página, pero no la API:** despliega como App Service para Node, no como alojamiento de archivos estáticos.
- **El repositorio no aparece en Azure:** revisa qué repositorios autorizaste en la integración de GitHub.
- **La app tarda en despertar:** el nivel gratuito puede detener aplicaciones inactivas; espera a que arranque antes de la exposición.

