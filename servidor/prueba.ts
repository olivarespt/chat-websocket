// Prueba automática: dos clientes conversan contra el servidor local
const URL_WS = Deno.args[0] ?? "ws://localhost:8000";

function cliente(nombre: string) {
  const ws = new WebSocket(URL_WS);
  const recibidos: any[] = [];
  ws.onmessage = (e) => recibidos.push(JSON.parse(e.data));
  const abierto = new Promise<void>((r) => (ws.onopen = () => r()));
  return { ws, recibidos, abierto, nombre };
}
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ana = cliente("Ana");
const pedro = cliente("Pedro");
await Promise.all([ana.abierto, pedro.abierto]);
ana.ws.send(JSON.stringify({ tipo: "entrar", nombre: "Ana" }));
await espera(200);
pedro.ws.send(JSON.stringify({ tipo: "entrar", nombre: "Pedro" }));
await espera(200);
ana.ws.send(JSON.stringify({ tipo: "mensaje", texto: "Hola desde Ana" }));
await espera(200);
pedro.ws.send(JSON.stringify({ tipo: "mensaje", texto: "  Hola   Ana,   soy Pedro  " }));
pedro.ws.send(JSON.stringify({ tipo: "mensaje", texto: "   " })); // vacío: se ignora
pedro.ws.send("no es json"); // se ignora
await espera(200);
pedro.ws.close();
await espera(200);

const verifica = (c: boolean, m: string) => {
  console.log(c ? "OK  " : "FALLA", m);
  if (!c) Deno.exitCode = 1;
};
const msgsAna = ana.recibidos.filter((m) => m.tipo === "mensaje");
verifica(msgsAna.length === 2, "Ana recibe 2 mensajes (el suyo y el de Pedro)");
verifica(msgsAna[1]?.texto === "Hola Ana, soy Pedro", "Texto normalizado");
verifica(
  pedro.recibidos.some((m) => m.tipo === "historial"),
  "Pedro recibe historial al entrar",
);
verifica(
  pedro.recibidos.filter((m) => m.tipo === "mensaje").length === 2,
  "Pedro recibe ambos mensajes",
);
verifica(
  ana.recibidos.some((m) => m.tipo === "sistema" && m.texto.includes("Pedro salió")),
  "Ana ve que Pedro salió",
);
const ult = ana.recibidos.filter((m) => m.tipo === "usuarios").at(-1);
verifica(JSON.stringify(ult?.lista) === '["Ana"]', "Lista de usuarios final = [Ana]");
ana.ws.close();
