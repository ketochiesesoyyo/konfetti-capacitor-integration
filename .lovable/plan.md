
Objetivo
- Restaurar visibilidad para usuarios normales (invitados) en /matchmaking y /dashboard (Home) para que vuelvan a aparecer eventos y, al entrar a un evento, perfiles.
- Mantener el bloqueo de usuarios (compliance 1.2) sin romper el acceso normal.

Diagnóstico (lo que ya se ve en el código y por qué puede fallar)
- En Matchmaking.tsx, la lista de eventos del usuario se carga con una consulta “relacional”:
  - event_attendees.select("event_id, events(...)").eq("user_id", ...)
- En Home.tsx se hace algo muy similar:
  - event_attendees.select("event_id, events(*)").eq("user_id", ...)
- Este patrón depende de que la API de la base de datos resuelva correctamente la relación event_attendees -> events. Si por cualquier motivo esa relación no se resuelve bien (o se vuelve “frágil” tras cambios de esquema), el resultado puede terminar siendo vacío para todos, aunque existan filas en event_attendees.
- Además, perfiles (profiles) se ven mediante RLS basado en “comparten evento”, que a su vez depende de event_attendees. Si event_attendees no se está pudiendo leer correctamente desde el cliente, se “cae en cascada” y parece que no hay gente.

Enfoque de solución (robusto, siguiendo el patrón ya usado en Admin “hardening”)
1) Hardening de queries en el frontend (principal fix)
   A. Matchmaking.tsx: cargar eventos en 2 pasos (sin join relacional)
   - Paso 1: obtener event_ids del usuario desde event_attendees (solo columnas simples).
   - Paso 2: con esos ids, consultar events con .in("id", eventIds) y ordenar por date en el cliente (o con order directo en events).
   - Paso 3: calcular el profileCount por evento como ya se hace.
   - Beneficio: se elimina la dependencia del join event_attendees -> events, que es el punto más probable del “no veo eventos”.

   B. Home.tsx: mismo hardening (2 pasos)
   - Paso 1: event_attendees (event_id) del usuario.
   - Paso 2: events donde id IN (eventIds).
   - Luego aplicar el filtro existente (ocultar eventos cerrados por close_date, ocultar eventos donde el usuario es host, etc.).
   - Beneficio: /dashboard volverá a listar eventos de asistencia de forma confiable.

2) Bloqueo de usuarios: evitar que el “filtro bidireccional” rompa visibilidad por RLS
   - En Matchmaking.tsx actualmente se intenta leer:
     - blocked_users donde blocker_id = userId (esto sí funciona con la política “Users can view their own blocks”).
     - blocked_users donde blocked_id = userId (esto NO debería ser visible por RLS actual, y suele devolver vacío).
   - Eso no debería dejar la app sin eventos, pero sí conviene “blindar”:
     - Manejar explícitamente errores/denegaciones del segundo query (blocked_id = userId) y tratarlo como “vacío” sin bloquear el resto del flujo.
   - Si realmente quieres ocultamiento bidireccional perfecto (que también desaparezca quien te bloqueó), la forma correcta y segura es:
     - Crear una función backend (SECURITY DEFINER) que devuelva “ids a ocultar” para el usuario (unión de bloqueados por mí + usuarios que me bloquearon), y consultarla vía rpc.
     - Esto respeta RLS sin abrir SELECT directo de blocked_users por blocked_id.

3) Verificación/ajuste de RLS (solo si sigue fallando tras el hardening)
   - Si después de eliminar los joins sigue sin aparecer nada, el siguiente paso es revisar políticas RLS clave:
     - event_attendees: SELECT para authenticated que permita al usuario ver filas de sus eventos.
     - events: SELECT para authenticated que permita ver eventos donde el usuario es attendee o host.
     - profiles: SELECT para authenticated usando users_share_event o matches.
   - Aplicar la práctica probada:
     - Asegurar que las policies indiquen explícitamente TO authenticated (y TO anon con USING(false) si quieres negar anónimos).
   - Importante: no se tocará el modelo de roles (user_roles) ni se meterán roles en profiles/users.

4) UX/Debug (para que no vuelva a pasar “en silencio”)
   - Cuando attendeeData venga vacío:
     - Mostrar un estado con CTA claro (Join Event) y, opcionalmente, un bloque “Diagnostics” (solo visible para admin o en modo debug) con:
       - userId
       - cantidad de event_attendees encontrados
       - último error (si existió)
   - Esto reduce tiempo de diagnóstico si vuelve a ocurrir.

Secuencia de implementación (orden recomendado)
1. Cambiar Matchmaking.tsx: loadEvents() a fetch en 2 pasos (event_attendees -> events).
2. Cambiar Home.tsx: fetch en 2 pasos (event_attendees -> events).
3. Blindar el manejo del query bidireccional de bloqueos para que nunca rompa el flujo de perfiles.
4. Probar end-to-end con 3 cuentas:
   - invitado (no admin)
   - host (creador)
   - admin
5. Si todavía no aparecen eventos:
   - Ajustar RLS con TO authenticated en tables involucradas.
6. (Opcional) Implementar RPC “get_blocked_user_ids_for_user()” para ocultamiento bidireccional correcto sin relajar RLS.

Plan de pruebas (muy importante para Apple y para evitar regresiones)
- En web (Published) y en iOS (build):
  1) Login con invitado -> /dashboard debe listar al menos 1 evento (si está unido).
  2) Ir a /matchmaking -> debe listar eventos disponibles.
  3) Seleccionar evento activo -> debe cargar perfiles (si hay otros invitados).
  4) Bloquear a alguien desde chat -> ese usuario desaparece de:
     - chats
     - liked
     - matchmaking
  5) Confirmar que el reporte/audit se creó (para “notify developer/admin”).

Entrega esperada
- Los usuarios vuelven a ver eventos y, dentro de eventos activos, vuelven a ver perfiles.
- El feature de “Block User” sigue funcionando y no bloquea carga de eventos/perfiles.
- Menos fragilidad en producción porque dejamos de depender de joins relacionales sensibles.

Archivos que se tocarán
- src/pages/Matchmaking.tsx (carga de eventos + robustez del filtro de blocked)
- src/pages/Home.tsx (carga de eventos)
- (Opcional si hace falta bidireccional perfecto) migración + rpc backend para “blocked ids”
- (Opcional si hace falta) migración para ajustar policies RLS con TO authenticated
