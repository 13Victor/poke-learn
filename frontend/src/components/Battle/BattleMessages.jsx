import React, { useEffect, useRef } from "react";
import { BattleMessageParser } from "../../utils/BattleMessageParser";

export function BattleMessages({ logs, isTeamPreview }) {
  const messagesEndRef = useRef(null);
  const parser = useRef(new BattleMessageParser());

  // Auto-scroll hacia el final cuando haya nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // No mostrar mensajes durante team preview
  if (isTeamPreview) {
    return (
      <div className="battle-messages">
        <div className="messages-header">
          <h4>📜 Registro de Batalla</h4>
        </div>
        <div className="messages-content">
          <div className="message team-preview-message">
            🔍 <strong>Vista Previa de Equipos</strong>
            <br />
            <span className="message-detail">Selecciona el orden de tu equipo para comenzar la batalla.</span>
          </div>
        </div>
      </div>
    );
  }

  // Parsear los logs para obtener mensajes legibles
  const parsedMessages = parser.current.parseMessages(logs);

  return (
    <div className="battle-messages">
      <div className="messages-header">
        <h4>📜 Registro de Batalla</h4>
        <span className="messages-count">
          {parsedMessages.length} evento{parsedMessages.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="messages-content">
        {parsedMessages.length === 0 ? (
          <div className="message welcome-message">
            🎮 <strong>Batalla iniciada</strong>
            <br />
            <span className="message-detail">Los eventos de la batalla aparecerán aquí.</span>
          </div>
        ) : (
          parsedMessages.map((message, index) => {
            // Determinar el tipo de mensaje para aplicar estilos
            const messageType = getMessageType(message);

            return (
              <div key={index} className={`message ${messageType}`}>
                <span className="message-text" dangerouslySetInnerHTML={{ __html: formatMessage(message) }} />
              </div>
            );
          })
        )}

        {/* Elemento invisible para hacer scroll automático */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// Función auxiliar para determinar el tipo de mensaje
function getMessageType(message) {
  if (message.includes("===") && message.includes("TURNO")) return "turn-start";
  if (message.includes("🏆")) return "victory";
  if (message.includes("🤝")) return "tie";
  if (message.includes("💀")) return "faint";
  if (message.includes("⚔️")) return "move";
  if (message.includes("🔄") || message.includes("💨")) return "switch";
  if (message.includes("💥")) return "damage";
  if (message.includes("💚")) return "heal";
  if (message.includes("💫")) return "critical";
  if (message.includes("⚡")) return "super-effective";
  if (message.includes("🛡️") && message.includes("No es muy efectivo")) return "not-very-effective";
  if (message.includes("🚫")) return "blocked";
  if (message.includes("❌")) return "failed";
  if (message.includes("📈")) return "stat-boost";
  if (message.includes("📉")) return "stat-drop";
  if (message.includes("🔥")) return "status-effect";
  if (message.includes("✨")) return "status-cure";
  if (message.includes("🌦️") || message.includes("🌤️")) return "weather";
  if (message.includes("🌍")) return "field-effect";
  if (message.includes("🛡️")) return "side-effect";

  return "normal";
}

// Función auxiliar para formatear el mensaje
function formatMessage(message) {
  // Convertir texto en negrita de markdown a HTML
  return message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
}
