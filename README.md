# Tablero Marketing YAAVS

Accesos a solicitudes, NPS y reportes de Marketing, con **centro de control**, vistas previas y configuración remota de textos del formulario.

https://directorio-paneles-yaavs.hostingersite.com/

## En vivo

- Público: https://directorio-paneles-yaavs.hostingersite.com/
- Admin: https://directorio-paneles-yaavs.hostingersite.com/admin
- Render (backup): https://directorio-paneles-yaavs.onrender.com/

## Local

```bash
npm install
npm start
```

Abre: http://localhost:3010  
Admin: http://localhost:3010/admin

Contraseña local por defecto: `YaavsDir-Local` (cámbiala con `ADMIN_PASSWORD`).

## Centro de control

En `/admin` puedes:

- Crear, editar, ocultar y eliminar paneles
- Reordenar y ver preview (iframe o imagen)
- Editar **contenido del formulario** (`formConfig`: hero, lede, botón enviar…)
- Exportar / importar JSON

## API de config remota (para formularios)

```
GET /api/panels/:id/config
```

CORS abierto. Ejemplo piloto Lonas:

https://directorio-paneles-yaavs.hostingersite.com/api/panels/solicitud-lonas-toldos/config

Respuesta:

```json
{
  "ok": true,
  "id": "solicitud-lonas-toldos",
  "title": "…",
  "formUrl": "…",
  "resultsUrl": "…",
  "formConfig": {
    "heroTitle": "…",
    "heroLede": "…",
    "submitLabel": "…",
    "resultsBoardLabel": "…",
    "materialHints": {}
  },
  "updatedAt": "…"
}
```

Para enganchar otro formulario: en su `app.js` haz `fetch` a esa URL y aplica los campos; define `DIRECTORY_CONFIG_URL` en el hosting del formulario.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `ADMIN_PASSWORD` | Contraseña del centro de control |
| `ADMIN_SESSION_SECRET` | Opcional; firma de cookie |
| `DATA_DIR` | Opcional; carpeta para `panels.json` |
| `PORT` | Puerto |

## Nota Render free / Hostinger

El disco puede reiniciarse en redeploy: usa **Exportar JSON** como respaldo.
