# Portal de revisión de desempeño

Aplicación para validar un correo corporativo, recopilar las funciones del
último año, generar preguntas de seguimiento con OpenAI y relacionar las
actividades con funciones de referencia de los cargos.

## Lista de acceso

Los registros se cargan desde [`src/assets/allowed-emails.json`](./src/assets/allowed-emails.json).
Cada entrada debe incluir `email`, `name` y `position`. Los datos incluidos
son ficticios y sirven como ejemplo; reemplázalos por la lista de la compañía.

La validación actual se ejecuta en el navegador y está pensada como prototipo.
No es un mecanismo de control de acceso seguro para producción, ya que el JSON
se distribuye con la aplicación. Para restringir el acceso en producción,
valida los correos en un servicio de backend.

## Estructura de interfaz

La interfaz sigue Atomic Design dentro de `src/`:

- `components/atoms`: elementos base como marca, botones y rótulo de paso.
- `components/molecules`: composiciones pequeñas como campos, perfil y
  encabezado de contenido.
- `components/organisms`: formularios completos, progreso, encabezado y pie.
- `components/templates`: estructura compartida de la revisión.
- `pages`: pantallas de acceso, funciones del último año y confirmación.

`App.tsx` conserva el estado del flujo y selecciona la pantalla correspondiente.

## Árbol de procesos y preguntas

El archivo [`arbol_procesos_grupo_eterna.xlsx`](./src/assets/example-data/arbol_procesos_grupo_eterna.xlsx)
conserva las hojas del libro recibido. La aplicación lee `Detalle` como
jerarquía `Macroproceso → Proceso → Subproceso → Actividades`. Cada proceso
funciona como una posición/rol y cada actividad como una función.

Se añadió una hoja `Preguntas` con una pregunta numérica por actividad,
asociada al código del macroproceso, proceso, subproceso y actividad. El ID de
pregunta se forma con la jerarquía para permanecer único incluso si un código
de actividad se repite en otro proceso. La descripción de la función conserva
el texto del libro; la pregunta usa una plantilla fija, no una redacción de
OpenAI. OpenAI únicamente selecciona de 3 a 5 `question_id` existentes. El
servidor resuelve sus textos y códigos desde el libro tanto al mostrar las
preguntas como al guardar las respuestas.

`allowed-emails.json` conserva las cuatro personas anteriores y añade perfiles
de ejemplo para cubrir los 21 procesos. Cada `position` coincide con el nombre
de proceso del Excel; `processId` conserva su código y `previousPosition`
conserva el cargo original cuando existía. Los perfiles y asignaciones son de
demostración: confirma las correspondencias de personas con Recursos Humanos
antes de usar datos reales.

Las respuestas son exclusivamente números enteros de 0 a 1000: la persona
distribuye 1000 puntos entre las preguntas según el tiempo o esfuerzo que
dedicó a cada actividad. La selección puede incluir preguntas relacionadas
con otros cargos; la interfaz las señala como posibles actividades de otro
rol, no como una conclusión definitiva.

## OpenAI y entorno

Configura `OPENAI_API_KEY` en el archivo `.env` de la raíz del proyecto. El
archivo local `.env` está ignorado por Git para evitar publicar la clave.
`.env.example` documenta las variables esperadas. No escribas la clave en
ninguna variable `VITE_*`: el navegador nunca debe recibirla.

```dotenv
OPENAI_API_KEY=tu_clave_de_openai
OPENAI_MODEL=gpt-5-nano
PORT=3001
OPENAI_QUESTIONS_SYSTEM_PROMPT='Eres un selector neutral y respetuoso. Selecciona entre 3 y 5 preguntas del banco...'
```

El prompt selecciona preguntas del banco; no controla ni reescribe el texto de
las preguntas. Puedes ajustar los criterios de selección en
`OPENAI_QUESTIONS_SYSTEM_PROMPT`; la salida debe conservar el formato JSON con
`question_ids`.

El servidor expone `POST /api/interview/questions` y
`POST /api/interview/answers`. En desarrollo, Vite reenvía `/api` al servidor
Node. El formulario no permite enviar hasta que todas las respuestas sean
enteros de 0 a 1000 y su suma sea exactamente 1000; el servidor vuelve a
validar esas mismas reglas antes de guardar la distribución. Cada envío se
agrega a `server/data/interview-responses.xlsx`, en una fila por actividad.
El libro registra el ID y nombre del proceso de la persona, su nombre y
`position`, el `question_id` estable, el código de función, macroproceso y
subproceso asociados, la actividad exacta, el rol asociado a ella y el número
asignado. El servidor resuelve las respuestas contra los códigos y textos
originales del Excel, sin confiar en textos o relaciones enviados por el
navegador. Los puntos representan la distribución que elige la persona, no
una evaluación automatizada de su desempeño.

El límite por IP reduce solicitudes accidentales o abusivas, pero la lista de
correos incluida en el frontend no es autenticación. Antes de producción,
añade autenticación real, protección de API y almacenamiento autorizado para
los resultados.

## Desarrollo

```sh
npm install
npm run dev
```

Para compilar y ejecutar el servidor con la aplicación estática:

```sh
npm run build
npm start
```

Verifica los cambios con:

```sh
npm test
npm run build
```
