# Maply Services 2026 6°2 Grupo 6
Especialidad en Computación, Escuela Técnica N°32 D.E. 14
Docentes: Damian Olaso, Gonzalo Consorti
6to2da: Prácticas Profesionalizantes



# Descripción del Proyecto
Este proyecto consiste en el desarrollo de una página web colaborativa orientada a brindar información en tiempo real sobre distintos lugares y servicios.

La plataforma permitirá que los usuarios publiquen y consulten reportes relacionados con situaciones cotidianas, como demoras, lugares llenos, cambios de recorrido, cierres temporales y otras novedades importantes.

El objetivo principal es ayudar a las personas a organizarse mejor, ahorrar tiempo y acceder a información actualizada antes de trasladarse a un lugar.

# Funcionalidades
* Registro e inicio de sesión de usuarios
* Búsqueda de lugares
* Publicación de reportes en tiempo real
* Visualización de comentarios recientes
* Sistema de denuncias
* Administración básica de contenido
* Guardado de lugares favoritos
* Visualización de ubicaciones
* Panel de administración

# Acceso al Proyecto
El proyecto se encuentra actualmente en etapa de desarrollo y documentación.

# Tecnologías Utilizadas
***React / React Native***
***MySQL***
***SQL***
***XAMPP***
***Java*** (posible implementación backend)
***Expo Go (app)***

# Guía de Inicio de Proyecto

### Estructura de Entorno y Despliegue con Expo Go
Esta guía detalla el procedimiento técnico estándar para la preparación del entorno de desarrollo, inicialización de dependencias y visualización en tiempo real del proyecto **Maply Services**.

### 1. Requisitos Iniciales del Sistema
Antes de comenzar con la configuración, es obligatorio contar con las siguientes herramientas instaladas:

* ***Node.js:** Se requiere la instalación de la versión **LTS (Long Term Support)** desde su sitio oficial. Durante el asistente de instalación, avance presionando sucesivamente el botón *Next* para asegurar la configuración por defecto de las variables de entorno globales.
* ***Visual Studio Code:** Utilizado como el entorno de desarrollo integrado (IDE) principal para la edición y depuración del código fuente.

### 2. Preparación del Entorno en VS Code
Para evitar fallos de permisos o de políticas de ejecución dentro del sistema operativo Windows, siga estrictamente estos pasos:

1. Cree la carpeta de trabajo en el directorio local de su preferencia y ábrala desde el menú superior de Visual Studio Code (`File > Open Folder`).
2. Despliegue una nueva consola desde el menú superior seleccionando `Terminal > New Terminal`.
3. Por defecto, el editor suele inicializar una sesión de PowerShell. Para garantizar la compatibilidad de comandos, modifique el tipo de terminal haciendo clic en la flecha de opciones (o el ícono `+`) ubicada en el extremo derecho del panel inferior de la consola y seleccione **"Command Prompt" (cmd)**.

---

### Paso 1: Verificación de Requisitos Previos
1. Asegúrate de tener instalado Node.js en tu computadora. Puedes verificarlo buscando "Node.js" en el buscador de Windows o abriendo una terminal y ejecutando `node -v`.
2. Abrir el proyecto en Visual Studio Code.

### Paso 2: Configuración de la Base de Datos en XAMPP
1. Abrí el panel de control de XAMPP.
2. Iniciá los servicios de Apache y MySQL haciendo clic en el botón Start de cada uno.
3. Hacé clic en el botón Admin de MySQL para abrir phpMyAdmin en tu navegador (o ingresá directamente a `http://localhost/phpmyadmin`).
4. En el menú de la izquierda, hacé clic en "Nueva".
5. Nombrá la base de datos como `maply_services` y dale clic a Crear.
6. Seleccioná la base de datos recién creada, andá a la pestaña Importar arriba, seleccioná el archivo SQL de tu proyecto y ejecutalo.

### Paso 3: Variables de Entorno (.env)
En la raíz de tu carpeta del backend, asegurate de tener un archivo llamado `.env` y confirmá que contenga exactamente las siguientes líneas:


DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=maply_services
DB_PORT=3306

#  Personas Contribuyentes

## Equipo de trabajo:

-  Juan Pablo Llanos 
-  Lucca Martinez 
-  Felipe Kuo Lee 

---

#  Personas Desarrolladoras del Proyecto

## Scrum Master:
-  Brunella Figallo

## Product Owner:
-  Valentina Palacios

