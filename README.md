# HispanApp

HispanApp — La aplicación para dominar el compás flamenco. Entrenamiento interactivo de palmas, metrónomo visual de alta precisión y herramientas profesionales para la percusión flamenca.

Hecha con React 19, Vite, Tailwind CSS, Web Audio API y Firebase Firestore.

## Cómo se publica

Cada cambio que entra en la rama `main` se compila y se publica solo en GitHub Pages
(`.github/workflows/deploy.yml`). Ya no hay que subir `index.html` a mano.

Si la app también está conectada a Netlify, `netlify.toml` le indica cómo compilarla (`npm run build`, carpeta `dist`).

## Trabajar en local

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:3000
npm run lint     # comprobar tipos
npm run build    # compilar a dist/index.html (un único archivo)
```

## Estructura

```
├── public/                 # manifest.json e icono (se copian tal cual)
├── src/
│   ├── App.tsx             # vista principal
│   ├── audio/              # motor de audio y samples
│   ├── components/         # partitura, reloj, modales…
│   ├── data/rhythms.ts     # los 8 ritmos del método
│   ├── services/firebase.ts
│   └── config.ts           # enlaces (Hotmart, Lemon Squeezy, Patreon, WhatsApp) y códigos PRO
├── index.html
└── vite.config.ts
```
