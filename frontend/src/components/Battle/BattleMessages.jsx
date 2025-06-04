import React, { useEffect, useRef } from "react";
import { BattleMessageParser } from "../../utils/BattleMessageParser";

export function BattleMessages({ logs, isTeamPreview }) {
  const messagesEndRef = useRef(null);
  const parser = useRef(new BattleMessageParser());

  // Auto-scroll to the end when there are new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Don't show messages during team preview
  if (isTeamPreview) {
    return (
      <div className="battle-messages">
        <div className="messages-header">
          <h4>📜 Battle Log</h4>
        </div>
        <div className="messages-content">
          <div className="message team-preview-message">
            🔍 <strong>Team Preview</strong>
            <br />
            <span className="message-detail">Select your team order to begin the battle.</span>
          </div>
        </div>
      </div>
    );
  }

  // Parse logs to get readable messages
  const parsedMessages = parser.current.parseMessages(logs);

  return (
    <div className="battle-messages">
      <div className="messages-header">
        <h4>📜 Battle Log</h4>
        <span className="messages-count">
          {parsedMessages.length} event{parsedMessages.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="messages-content">
        {parsedMessages.length === 0 ? (
          <div className="message welcome-message">
            🎮 <strong>Battle started</strong>
            <br />
            <span className="message-detail">Battle events will appear here.</span>
          </div>
        ) : (
          parsedMessages.map((message, index) => {
            // Determine message type for styling
            const messageType = getMessageType(message);

            return (
              <div key={index} className={`message ${messageType}`}>
                <span className="message-text" dangerouslySetInnerHTML={{ __html: formatMessage(message) }} />
              </div>
            );
          })
        )}

        {/* Invisible element for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// Helper function to determine message type
function getMessageType(message) {
  if (message.includes("===") && message.includes("TURN")) return "turn-start";
  if (message.includes("🏆")) return "victory";
  if (message.includes("🤝")) return "tie";
  if (message.includes("💀")) return "faint";
  if (message.includes("⚔️")) return "move";
  if (message.includes("🔄") || message.includes("💨")) return "switch";
  if (message.includes("💥")) return "damage";
  if (message.includes("💚")) return "heal";
  if (message.includes("💫")) return "critical";
  if (message.includes("⚡")) return "super-effective";
  if (message.includes("🛡️") && message.includes("not very effective")) return "not-very-effective";
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

// Helper function to format the message
function formatMessage(message) {
  // Convert markdown bold text to HTML
  return message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
}
