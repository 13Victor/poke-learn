// src/components/Battle/BattleMessages.jsx - CORRECCIÓN
import React, { useEffect, useRef, useState } from "react";
import { BattleMessageParser } from "../../utils/BattleMessageParser";
import { TiPinOutline } from "react-icons/ti";
import { IoChevronDownOutline } from "react-icons/io5";
import { TiPin } from "react-icons/ti";

export function BattleMessages({ logs, isTeamPreview }) {
  const messagesEndRef = useRef(null);
  const parser = useRef(new BattleMessageParser());
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("all");
  const messagesContainerRef = useRef(null);

  // Auto-scroll to the end when there are new messages (if enabled)
  useEffect(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Handle manual scrolling to disable auto-scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  };

  // Don't show messages during team preview
  if (isTeamPreview) {
    return (
      <div className="battle-messages">
        <div className="messages-header">
          <h4>📜 Battle Log</h4>
          <div className="messages-status">Team Preview</div>
        </div>
        <div className="messages-content">
          <div className="message team-preview-message">
            <div className="message-icon">🔍</div>
            <div className="message-content">
              <strong>Team Preview Phase</strong>
              <div className="message-detail">Select your team order to begin the battle.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Parse logs to get readable messages
  const parsedMessages = parser.current.parseMessages(logs);

  // Filter messages based on selected filter
  const filteredMessages = parsedMessages.filter((message) => {
    if (filter === "all") return true;

    const messageType = getMessageType(message);
    switch (filter) {
      case "moves":
        return [
          "move",
          "damage",
          "heal",
          "critical",
          "super-effective",
          "not-very-effective",
          "blocked",
          "failed",
        ].includes(messageType);
      case "switches":
        return ["switch", "faint"].includes(messageType);
      case "status":
        return ["status-effect", "status-cure", "stat-boost", "stat-drop"].includes(messageType);
      case "field":
        return ["weather", "field-effect", "side-effect"].includes(messageType);
      case "important":
        return ["turn-start", "victory", "tie", "faint", "critical", "super-effective"].includes(messageType);
      default:
        return true;
    }
  });

  // Get turn statistics
  const getTurnStats = () => {
    const turnMessages = parsedMessages.filter((msg) => msg.includes("TURN"));
    const currentTurn = turnMessages.length;
    const totalMessages = parsedMessages.length;
    return { currentTurn, totalMessages };
  };

  const { currentTurn, totalMessages } = getTurnStats();

  return (
    <div className="battle-messages">
      <div className="messages-header">
        <div className="messages-title">
          <h4>Battle Log</h4>
          <div className="messages-stats">Turn {currentTurn}</div>
        </div>

        <div className="messages-controls">
          <div className="scroll-controls">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`auto-scroll-btn ${autoScroll ? "active" : ""}`}
              title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
            >
              {autoScroll ? <TiPin /> : <TiPinOutline />}
            </button>

            <button
              onClick={() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                  setAutoScroll(true);
                }
              }}
              className="scroll-to-bottom-btn"
              title="Scroll to bottom"
            >
              <IoChevronDownOutline />
            </button>
          </div>
        </div>
      </div>

      <div className="messages-content" ref={messagesContainerRef} onScroll={handleScroll}>
        {filteredMessages.length === 0 ? (
          <div className="message welcome-message">
            <div className="message-icon">🎮</div>
            <div className="message-content">
              <strong>Battle Ready</strong>
              <div className="message-detail">
                {filter === "all"
                  ? "Battle events will appear here."
                  : `No ${filter} events to show. Try changing the filter.`}
              </div>
            </div>
          </div>
        ) : (
          filteredMessages.map((message, index) => {
            const messageType = getMessageType(message);
            const { icon, className } = getMessageTypeInfo(messageType);

            return (
              <div key={index} className={`message ${className}`}>
                <div className="message-content">
                  <div className="message-text" dangerouslySetInnerHTML={{ __html: formatMessage(message) }} />
                  {messageType === "turn-start" && <div className="turn-separator"></div>}
                </div>
              </div>
            );
          })
        )}

        {/* Invisible element for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom status bar */}
      <div className="messages-footer">
        <div className="current-conditions">
          {parser.current.activeWeather && <span className="condition weather">☁️ {parser.current.activeWeather}</span>}
          {parser.current.fieldConditions.map((condition) => (
            <span key={condition} className="condition field">
              🌍 {condition}
            </span>
          ))}
          {/* CORRECCIÓN: Mostrar nombres de usuarios en lugar de P1/P2 */}
          {parser.current.sideConditions.p1.map((condition) => (
            <span key={`p1-${condition}`} className="condition side-p1">
              🛡️ {parser.current.p1Name}: {condition}
            </span>
          ))}
          {parser.current.sideConditions.p2.map((condition) => (
            <span key={`p2-${condition}`} className="condition side-p2">
              🛡️ {parser.current.p2Name}: {condition}
            </span>
          ))}
        </div>

        <div className="scroll-indicator">
          {!autoScroll && <span className="new-messages-indicator">📬 New messages below</span>}
        </div>
      </div>
    </div>
  );
}

// Enhanced helper function to determine message type
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
  if (message.includes("⭐")) return "ability";
  if (message.includes("🎒")) return "item";
  if (message.includes("🌟")) return "transformation";
  if (message.includes("👤")) return "player-info";
  if (message.includes("📊") || message.includes("🎮") || message.includes("🏆") || message.includes("📋"))
    return "game-info";

  return "normal";
}

// Get message type information for styling
function getMessageTypeInfo(messageType) {
  const typeMap = {
    "turn-start": { icon: "🎯", className: "turn-start" },
    victory: { icon: "🏆", className: "victory" },
    tie: { icon: "🤝", className: "tie" },
    faint: { icon: "💀", className: "faint" },
    move: { icon: "⚔️", className: "move" },
    switch: { icon: "🔄", className: "switch" },
    damage: { icon: "💥", className: "damage" },
    heal: { icon: "💚", className: "heal" },
    critical: { icon: "💫", className: "critical" },
    "super-effective": { icon: "⚡", className: "super-effective" },
    "not-very-effective": { icon: "🛡️", className: "not-very-effective" },
    blocked: { icon: "🚫", className: "blocked" },
    failed: { icon: "❌", className: "failed" },
    "stat-boost": { icon: "📈", className: "stat-boost" },
    "stat-drop": { icon: "📉", className: "stat-drop" },
    "status-effect": { icon: "🔥", className: "status-effect" },
    "status-cure": { icon: "✨", className: "status-cure" },
    weather: { icon: "🌦️", className: "weather" },
    "field-effect": { icon: "🌍", className: "field-effect" },
    "side-effect": { icon: "🛡️", className: "side-effect" },
    ability: { icon: "⭐", className: "ability" },
    item: { icon: "🎒", className: "item" },
    transformation: { icon: "🌟", className: "transformation" },
    "player-info": { icon: "👤", className: "player-info" },
    "game-info": { icon: "📋", className: "game-info" },
    normal: { icon: "📝", className: "normal" },
  };

  return typeMap[messageType] || typeMap.normal;
}

// Helper function to format the message with enhanced formatting
function formatMessage(message) {
  // Convert markdown bold text to HTML
  let formatted = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert line breaks
  formatted = formatted.replace(/\n/g, "<br/>");

  // Add special formatting for turn headers
  if (formatted.includes("===") && formatted.includes("TURN")) {
    formatted = formatted.replace(/(TURN \d+)/g, '<span class="turn-number">$1</span>');
  }

  // Add highlighting for damage numbers and percentages
  formatted = formatted.replace(/(\d+%)/g, '<span class="percentage">$1</span>');
  formatted = formatted.replace(/HP: (\d+\/\d+)/g, 'HP: <span class="hp-fraction">$1</span>');

  return formatted;
}
