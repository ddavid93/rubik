# Rubik Kids Solver (Vue 3 + Tailwind + PrimeVue)

Aplicación web gratuita para escanear y resolver cubos de Rubik 3x3 desde tu navegador. Pensada para niñas y niños: interfaz simple, botones grandes, y pasos claros.

Características principales:
- Escaneo con la cámara de las 6 caras del cubo.
- Detección automática de colores por cada cuadrito (9 por cara) con posibilidad de corrección manual.
- Vista previa en vivo de colores con guía 3x3 y captura más robusta (promedio multi‑frame) para mejorar la lectura.
- Validación básica de que el cubo es válido.
- Generación de instrucciones paso a paso para resolverlo (usando la librería min2phase).
- Interfaz amigable para peques: botones grandes, colores llamativos, tutorial básico y celebración final con confetti.
- Diseño responsive para móviles y tablets (botones full‑width en móviles, cuadrícula adaptable).
- Soporte opcional de linterna/torch cuando el dispositivo lo permite.

Tecnologías:
- Vue 3 (Composition API con <script setup> y TypeScript) + Vite
- PrimeVue + PrimeIcons
- TailwindCSS
- @vueuse/core (para manejar cámara y otros composables)

## Requisitos previos
- Node.js 18+ y npm 9+

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Generar build de producción
npm run build

# Previsualizar la build
npm run preview
```

Si el solucionador no arranca, asegúrate de que la dependencia `min2phase` se instaló correctamente (viene listada en package.json). Algunas redes corporativas bloquean su descarga.

## Uso
1. Abre la aplicación en el navegador (preferible en móvil).
2. Pulsa "Empezar" y permite el acceso a la cámara.
3. Escanea las 6 caras en el orden indicado: U, R, F, D, L, B.
   - Coloca el cubo centrado en el recuadro.
   - Toca "Capturar".
   - Si algún cuadrito no coincide, tócelo para cambiar el color manualmente.
4. Al terminar, valida el cubo y pulsa "Resolver".
5. Sigue las instrucciones paso a paso. Verás un contador de pasos y botones grandes para avanzar o retroceder.
6. Al completar la solución, ¡aparecerá una celebración visual! 🎉

### Idiomas (i18n)
- Soporta Español (ES), Inglés (EN), Italiano (IT) y Alemán (DE).
- Cambia de idioma desde el selector con el icono del globo en la cabecera.
- La app recuerda tu elección en localStorage y ajusta el atributo HTML `lang` automáticamente.

Notas sobre el escaneo y colores:
- El color del centro de cada cara define ese color en todo el cubo. La app aprende los tonos de tu cubo a partir de los centros.
- Procura buena iluminación y evita sombras o reflejos.

## Arquitectura del código
- `src/App.vue`: Flujo de pantallas (Inicio → Escanear → Validar/Resolver → Instrucciones).
- `src/components/CameraScanner.vue`: Uso de la cámara (getUserMedia), captura y muestreo en cuadrícula 3x3, correcciones manuales, y progreso de caras.
- `src/components/CubeNet.vue`: Visualización 2D del cubo escaneado (en formato net).
- `src/components/SolutionPlayer.vue`: Reproductor paso a paso con contador y confetti.
- `src/components/TutorialDialog.vue`: Tutorial básico de movimientos.
- `src/composables/useCubeScan.js`: Estado reactivo del cubo escaneado.
- `src/utils/color.js`: Utilidades de color (RGB→HSV, distancias, muestreo de promedio en canvas).
- `src/utils/validation.js`: Validación básica (conteo de colores, centros correctos).
- `src/utils/solver.js`: Wrapper del solucionador `min2phase`.
- `src/utils/constants.js`: Constantes de colores y nombres.

## Detalles técnicos del solucionador
- El wrapper genera un string de 54 caracteres en el orden `URFDLB` (9 stickers por cara) usando las etiquetas `U R F D L B`.
- Se usa la librería `min2phase` (implementación del algoritmo de Kociemba) en el navegador. Si el módulo expone una API distinta (por versión), el wrapper intenta varias convenciones comunes.
- Si el cubo ya está resuelto, el resultado puede ser una lista vacía de pasos.

## Despliegue
Al ser una SPA con Vite:
- Puedes desplegar la carpeta `dist` en cualquier hosting estático (Netlify, Vercel, GitHub Pages, Firebase Hosting, Nginx, etc.).
- Asegúrate de servir sobre HTTPS para poder usar la cámara en móviles.

## Accesibilidad y experiencia para peques
- Botones grandes y etiquetas claras.
- Instrucciones simples y textos en español.
- Animaciones y colores vivos.

## Roadmap (ideas futuras)
- Modo oscuro.
- 3D preview del cubo y animación de movimientos.
- Más validaciones (paridad, orientación/permutación de piezas).
- Soporte para otros tamaños (2x2, 4x4) o scrambles.

## Licencia
Libre para uso educativo y personal. Verifica licencias de dependencias de terceros (PrimeVue, min2phase, etc.).
