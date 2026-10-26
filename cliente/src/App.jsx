import { useState, useRef, useEffect } from 'react';
import { useChat } from './useChat';
import './App.css';

function App() {
  const [nombre, setNombre] = useState('');
  const [inputNombre, setInputNombre] = useState('');
  const [textoMensaje, setTextoMensaje] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { mensajes, usuarios, conectado, enviar } = useChat(nombre);
  const finDelChatRef = useRef(null);

  useEffect(() => {
    finDelChatRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (mensajes.length > 0) {
      const ultimo = mensajes[mensajes.length - 1];
      if (ultimo.nombre !== nombre && ultimo.tipo !== 'sistema') {
        const audio = new Audio('/notificacion.mp3');
        audio.play().catch(() => {});
      }
    }
  }, [mensajes, nombre]);

  if (!nombre) {
    return (
      <div className={`login-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="login-card">
          <h2>Ingresa a la sala</h2>
          <input
            type="text"
            value={inputNombre}
            onChange={(e) => setInputNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setNombre(inputNombre)}
            placeholder="Tu apodo..."
          />
          <button onClick={() => setNombre(inputNombre)}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-layout ${isDarkMode ? 'dark' : ''}`}>
      <div className="chat-container">
        <header>
          <div className="header-info">
            <h2>Club Social Te Boté Remix</h2>
            <div className="conectados-mini">
              <span className={conectado ? 'status-online' : 'status-offline'}>
                {conectado ? '🟢' : '🔴'}
              </span>
              <span className="lista-nombres">
                {usuarios?.length > 0 ? usuarios.join(', ') : 'Esperando usuarios...'}
              </span>
            </div>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn-theme">
            {isDarkMode ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
        </header>

        <main className="mensajes-lista">
          {mensajes.map((msg, index) => {
            if (msg.tipo === "sistema") {
              return <div key={index} className="mensaje-sistema">{msg.texto}</div>;
            }

            const esMio = msg.nombre === nombre;
            
            return (
              <div key={index} className={`mensaje-wrapper ${esMio ? 'mio' : 'ajeno'}`}>
                {!esMio && (
                  <img 
                    className="avatar" 
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${msg.nombre}`} 
                    alt="avatar" 
                  />
                )}
                
                <div className="contenido-mensaje">
                  {!esMio && <span className="emisor">{msg.nombre}</span>}
                  <div className="burbuja">{msg.texto}</div>
                  <span className="hora">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={finDelChatRef} />
        </main>

        <footer className="chat-input">
          <input
            type="text"
            value={textoMensaje}
            onChange={(e) => setTextoMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textoMensaje.trim() !== '') {
                enviar(textoMensaje);
                setTextoMensaje('');
              }
            }}
            placeholder="Escribe un mensaje..."
          />
          <button onClick={() => {
            if (textoMensaje.trim() !== '') {
              enviar(textoMensaje);
              setTextoMensaje('');
            }
          }}>Enviar</button>
        </footer>
      </div>
    </div>
  );
}

export default App;