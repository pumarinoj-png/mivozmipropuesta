# Mi voz, mi propuesta

App web guiada (5 etapas, 5–10 min) para que cada participante prepare una propuesta propia y la defienda ante un comité.
La IA actúa como coach: pregunta, desafía y da feedback; **no redacta la propuesta por la persona**.

- Front: Vite + React.
- Backend: funciones serverless de Vercel en `api/`.
- IA: `api/coach.js` llama a la API de Anthropic (la clave nunca llega al navegador).
- Guardado: `api/save.js` guarda el trabajo de cada persona en Redis (Upstash), con su consentimiento.
- Panel del administrador: `/admin`, protegido con contraseña (`api/admin.js`).
- Sin Redis o sin clave de IA, la app sigue funcionando (guarda solo en el navegador y/o sin coach).

## 1. Subir a GitHub

Desde la carpeta del proyecto (el `.gitignore` ya excluye `.env*` y `node_modules`; **nunca subas claves**):

```bash
git init
git add .
git commit -m "Mi voz, mi propuesta"
git branch -M main
# Crea un repositorio vacío y PRIVADO en github.com y copia su URL:
git remote add origin https://github.com/TU-USUARIO/mi-voz-mi-propuesta.git
git push -u origin main
```

(Con GitHub CLI: `gh repo create mi-voz-mi-propuesta --private --source=. --push`).

## 2. Desplegar en Vercel

1. En vercel.com: **Add New → Project** → importa el repositorio. Vercel detecta Vite solo; no cambies nada y presiona **Deploy**.
2. Crea el almacenamiento: en el proyecto, pestaña **Storage → Create / Connect Database → Upstash Redis** (Marketplace, hay plan gratuito). Conéctalo al proyecto: Vercel agrega solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. En **Settings → Environment Variables** agrega:

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí (para el coach) | Clave de la API de Anthropic |
| `ADMIN_PASSWORD` | Sí (para `/admin`) | Contraseña del panel. Usa una larga (16+ caracteres) |
| `ANTHROPIC_MODEL` | No | Por defecto `claude-sonnet-5-5`. `claude-haiku-5-5` es más rápido y barato |
| `RETENTION_DAYS` | No | Días que se conserva el trabajo (por defecto 90) |
| `COACH_LIMIT_PER_PERSON_HOUR` | No | Consultas al coach por persona y hora (80) |
| `COACH_LIMIT_PER_IP_10MIN` | No | Consultas por IP cada 10 min (1000) |
| `COACH_DAILY_CAP` | No | Tope diario global del coach (6000), para controlar costo |

4. **Redeploy** (Deployments → ⋯ → Redeploy) para que tome las variables.
5. Comprueba: `https://TU-DOMINIO/api/save` → `{"enabled":true}` y `https://TU-DOMINIO/api/coach` → `{"available":true}`.

Comparte `https://TU-DOMINIO/` con los participantes. Cada persona entra por su cuenta y tiene su propio espacio (un identificador aleatorio guardado en su navegador); nadie ve el trabajo de otros.

## 3. Panel del administrador

Entra a `https://TU-DOMINIO/admin` con `ADMIN_PASSWORD`. Ahí puedes:

- Ver quién participa, su avance y todas sus respuestas (se actualiza solo cada 20 s).
- Descargar la ficha PDF de una persona, exportar todo a CSV o JSON, y eliminar a una persona o a todas.

Es lo único que lee los datos guardados. La contraseña se compara en el servidor, hay límite de intentos y el panel no está indexado por buscadores.

## Privacidad

- Se pide consentimiento explícito al comenzar; sin él no se guarda nada en el servidor.
- El nombre se guarda solo para que el administrador identifique el trabajo y **nunca** se envía al servicio de IA.
- Cada persona puede borrar sus datos (navegador y servidor) con "Borrar mis datos".
- Los registros se eliminan automáticamente tras `RETENTION_DAYS` días.
- Se recomienda indicar a los participantes que no escriban información sensible de la empresa.

## Capacidad (≈60 personas simultáneas)

- Vercel escala las funciones automáticamente; los límites se guardan en Redis, por lo que valen para todas las instancias.
- Los límites por IP son holgados para que una oficina completa con una misma red no se bloquee entre sí.
- El coach reintenta una vez ante saturación (429/529) de Anthropic. Si se prevé uso intenso, revisa el límite de tu organización en la consola de Anthropic o usa `claude-haiku-5-5`.

## Ejecutar en local

Requiere Node 18+.

```bash
npm install
cp .env.example .env.local   # completa las variables
npm run dev                  # http://localhost:5173  (panel: /admin)
```

`npm run dev` levanta también `/api/*`. Puedes usar las mismas credenciales de Upstash en local, aunque conviene una base distinta para no mezclar pruebas con datos reales.

## Estructura

```
api/coach.js            Proxy a Anthropic: prompts por tarea, validación y límites
api/save.js             Guardado del trabajo de cada persona (con consentimiento)
api/admin.js            Lectura y borrado para el administrador (con contraseña)
api/_lib/               Cliente Redis REST y límites de uso
src/App.jsx             Flujo, validación, autoguardado local y sincronización
src/components/         Welcome, ProgressBar, Stage1..5, Ficha, Admin, ui
src/data/content.js     Textos, ejemplos y estructura de la presentación
src/lib/                coachApi, sync, storage, text, pdf
```

Para ajustar el tono del coach, edita `BASE` y `TASKS` en `api/coach.js`.
