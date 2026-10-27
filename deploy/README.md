# Paquete para publicación manual en Azure

Descarga **tu-proxima-partida-azure.zip** usando el botón de descarga del archivo. En Azure, abre el Centro de implementación de la aplicación **partidaprueba**, selecciona Implementación manual y Publicar archivos, y carga este ZIP.

El paquete contiene package.json y server.mjs directamente en la raíz, además de la base SQLite ya preparada con 18 juegos y las portadas. Funciona con Node.js 24 sobre Linux y no requiere paquetes externos ni acceso de Azure a una organización de GitHub.

Al terminar la implementación, verifica la página principal, /api/health y las recomendaciones. Si la aplicación no inicia automáticamente, configura el comando de inicio **npm start** en la configuración de App Service y revisa los registros.

Este ZIP es una instantánea del código del commit 4766dd1075c2fc50946b204aa82864cca04eef0e, preparada el 27 de octubre de 2026. Si el código cambia después, hay que regenerar el paquete.
