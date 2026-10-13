# Portal de revisión de desempeño

Aplicación para validar un correo corporativo, recopilar las funciones del
último año, generar preguntas de seguimiento con OpenAI y evaluar las
respuestas en relación con las funciones habituales del cargo.

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

## Excel de ejemplo

Los dos libros de ejemplo están en `src/assets/example-data/` y se leen en el
servidor mediante ExcelJS:

- [`contexto_entrevista.xlsx`](./src/assets/example-data/contexto_entrevista.xlsx):
  temas y contexto de la compañía, señales a explorar y ejemplos de preguntas
  neutrales.
- [`funciones_por_cargo.xlsx`](./src/assets/example-data/funciones_por_cargo.xlsx):
  cargos, áreas y funciones habituales asociadas a cada cargo.

Los registros son ficticios. Los nombres de cargo coinciden con los valores de
`position` en la lista de acceso para relacionar las fuentes. OpenAI usa las
funciones declaradas, el libro de funciones del cargo y el contexto para
generar de 3 a 5 preguntas sobre las actividades descritas. Las respuestas
son exclusivamente números enteros de 0 a 1000: la persona distribuye 1000
puntos entre las preguntas según el tiempo o esfuerzo que dedicó a cada
actividad.

## OpenAI y entorno

Configura `OPENAI_API_KEY` en el archivo `.env` de la raíz del proyecto. El
archivo local `.env` está ignorado por Git para evitar publicar la clave.
`.env.example` documenta las variables esperadas. No escribas la clave en
ninguna variable `VITE_*`: el navegador nunca debe recibirla.

```dotenv
OPENAI_API_KEY=tu_clave_de_openai
OPENAI_MODEL=gpt-5-nano
PORT=3001
```

El servidor expone `POST /api/interview/questions` y
`POST /api/interview/answers`. En desarrollo, Vite reenvía `/api` al servidor
Node. El formulario no permite enviar hasta que todas las respuestas sean
enteros de 0 a 1000 y su suma sea exactamente 1000; el servidor vuelve a
validar esas mismas reglas antes de aceptar la distribución. Los puntos
representan la distribución que elige la persona, no una evaluación
automatizada de su desempeño. Las respuestas no se persisten: solo se
muestran en la sesión actual.

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
