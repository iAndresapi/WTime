# Instrucciones para colaboradores -WTime

Cuando alguien clona este repositorio, no encontrará la carpeta node_modules/ porque está excluida mediante .gitignore. Este comportamiento es estándar en proyectos basados en Node.js y evita subir miles de archivos innecesarios.

Para reconstruir todas las dependencias necesarias, cualquier colaborador solo debe ejecutar:

## Instalación de dependencias

Con npm:

  ```bash 
  npm install
  ```

## Estos comandos realizan automáticamente lo siguiente:

Leen las dependencias definidas en package.json.

Descargan todas las librerías necesarias desde el registro de npm.

Crean la carpeta node_modules/ localmente.

Aseguran que el entorno sea idéntico al del proyecto original gracias al archivo package-lock.json o yarn.lock.

No es necesario hacer nada más. Una vez completada la instalación, el proyecto estará listo para ejecutarse conforme a las instrucciones de desarrollo definidas en este repositorio.

## Para abrir el proyecto en web:

  ```bash
   npx expo start
   ```

Luego presiona la tecla "W"
