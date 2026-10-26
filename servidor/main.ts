// Servidor de chat grupal con WebSocket — Deno
// Ejecutar local:  deno run --allow-net --allow-env main.ts
// Protocolo (todo viaja como JSON):
//   cliente -> servidor: { tipo: "entrar",  nombre: "Ana" }
//   cliente -> servidor: { tipo: "mensaje", texto: "Hola a todos" }
//   servidor -> clientes: { tipo: "mensaje", nombre, texto, hora }
//   servidor -> clientes: { tipo: "sistema", texto, hora }
//   servidor -> clientes: { tipo: "usuarios", lista: ["Ana", "Pedro"] }
//   servidor -> cliente nuevo: { tipo: "historial", mensajes: [...] }

type Mensaje = {
  tipo: "mensaje" | "sistema";
  nombre?: string;
  texto: string;
  hora: string;
};

const MAX_TEXTO = 300;
const MAX_NOMBRE = 20;
const MAX_HISTORIAL = 30;

// Cada conexión abierta (cada estudiante) vive en este Map: socket -> nombre
const clientes = new Map<WebSocket, string>();
const historial: Mensaje[] = [];

const ahora = () =>
  new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  });

function enviar(socket: WebSocket, dato: unknown) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(dato));
}

// Broadcast: el corazón del chat grupal — reenviar a TODOS los conectados
function difundir(dato: unknown) {
  for (const [socket] of clientes) enviar(socket, dato);
}

function guardar(m: Mensaje) {
  historial.push(m);
  if (historial.length > MAX_HISTORIAL) historial.shift();
}

function difundirUsuarios() {
  difundir({ tipo: "usuarios", lista: [...clientes.values()] });
}

function limpiar(texto: unknown, max: number): string {
  return String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function manejarSocket(socket: WebSocket) {
  socket.onmessage = (evento) => {
    let datos: { tipo?: string; nombre?: string; texto?: string };
    try {
      datos = JSON.parse(evento.data);
    } catch {
      return; // ignoramos lo que no sea JSON válido
    }

    if (datos.tipo === "entrar") {
      const nombre = limpiar(datos.nombre, MAX_NOMBRE) || "Anónimo";
      if (clientes.has(socket)) return; // ya había entrado
      clientes.set(socket, nombre);
      enviar(socket, { tipo: "historial", mensajes: historial });
      const aviso: Mensaje = {
        tipo: "sistema",
        texto: `${nombre} se unió al chat`,
        hora: ahora(),
      };
      guardar(aviso);
      difundir(aviso);
      difundirUsuarios();
      return;
    }

    if (datos.tipo === "mensaje") {
      const nombre = clientes.get(socket);
      if (!nombre) return; // primero hay que "entrar"
      const texto = limpiar(datos.texto, MAX_TEXTO);
      if (!texto) return;
      const m: Mensaje = { tipo: "mensaje", nombre, texto, hora: ahora() };
      guardar(m);
      difundir(m);
    }
  };

  const salir = () => {
    const nombre = clientes.get(socket);
    if (nombre === undefined) return;
    clientes.delete(socket);
    const aviso: Mensaje = {
      tipo: "sistema",
      texto: `${nombre} salió del chat`,
      hora: ahora(),
    };
    guardar(aviso);
    difundir(aviso);
    difundirUsuarios();
  };
  socket.onclose = salir;
  socket.onerror = salir;
}

const puerto = Number(Deno.env.get("PORT") ?? 8000);

Deno.serve({ port: puerto }, (req) => {
  // Petición HTTP normal (navegador, health check): respondemos texto simple
  if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response(
      `Servidor de chat TICS316 activo. Conectados: ${clientes.size}\n`,
      { headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }
  // Petición de "upgrade": el cliente pide pasar de HTTP a WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req, {
    idleTimeout: 30, // Deno envía pings y cierra conexiones muertas
  });
  manejarSocket(socket);
  return response;
});
