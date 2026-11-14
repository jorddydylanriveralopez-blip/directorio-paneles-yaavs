# Tablero Marketing YAAVS

Accesos a solicitudes, NPS y reportes de Marketing, con **centro de control** para editarlos desde el navegador.

https://directorio-paneles-yaavs.onrender.com/

## En vivo (Render)

- Público: https://directorio-paneles-yaavs.onrender.com/
- Admin: https://directorio-paneles-yaavs.onrender.com/admin

## Local

```bash
npm install
npm start
```

Abre: http://localhost:3010  
Admin: http://localhost:3010/admin

Contraseña local por defecto: `YaavsDir-Local` (cámbiala con `ADMIN_PASSWORD` en `.env`).

## Centro de control

En `/admin` puedes:

- Crear, editar, ocultar y eliminar paneles
- Reordenar
- Exportar / importar JSON (respaldo; útil en Render free porque el disco se reinicia en redeploy)

Los datos viven en `data/panels.json` (no se sube a git). Si el archivo no existe, se siembra desde los paneles por defecto del servidor.

## Variables de entorno (Render)

| Variable | Descripción |
|---|---|
| `ADMIN_PASSWORD` | Contraseña del centro de control (**obligatoria en producción**) |
| `ADMIN_SESSION_SECRET` | Opcional; firma de cookie de sesión |
| `DATA_DIR` | Opcional; carpeta persistente para `panels.json` |
| `PORT` | Puerto (Render lo asigna) |

## Paneles incluidos (semilla)

Si no hay `data/panels.json`, se cargan BTL, Lonas/Toldos, NPS, Proyectos Marketing, NPS Activación, Reporte diario y Trade Marketing.
