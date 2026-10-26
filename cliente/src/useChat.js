import { useEffect, useRef, useState } from "react";

// Dirección del servidor: viene de la variable VITE_WS_URL (ver .env.example)
const URL_WS = import.meta.env.VITE_WS_URL ?? "ws://10.83.124.157:8000";

// Hook que encapsula TODA la lógica de WebSocket.
// Devuelve el estado de la conexión y una función para enviar mensajes.
export function useChat(nombre) {
  const [mensajes, setMensajes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!nombre) return; // aún no ha elegido nombre
    let cerradoPorNosotros = false;
    let reintento;

    function conectar() {
      const ws = new WebSocket(URL_WS);
      socketRef.current = ws;

      ws.onopen = () => {
        setConectado(true);
        ws.send(JSON.stringify({ tipo: "entrar", nombre }));
      };

      ws.onmessage = (evento) => {
        const d = JSON.parse(evento.data);
        if (d.tipo === "historial") setMensajes(d.mensajes);
        else if (d.tipo === "usuarios") setUsuarios(d.lista);
        else setMensajes((previos) => [...previos, d]); // "mensaje" o "sistema"
      };

      ws.onclose = () => {
        setConectado(false);
        if (!cerradoPorNosotros) reintento = setTimeout(conectar, 2000);
      };
    }

    conectar();
    return () => {
      cerradoPorNosotros = true;
      clearTimeout(reintento);
      socketRef.current?.close();
    };
  }, [nombre]);

  function enviar(texto) {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ tipo: "mensaje", texto }));
    }
  }

  return { mensajes, usuarios, conectado, enviar };
}
