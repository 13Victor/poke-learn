// src/components/Battle/BattleControls.jsx
import React from "react";
import { MoveButton } from "./MoveButton";
import { SwitchButton } from "./SwitchButton";

export function BattleControls({
  requestData,
  playerForceSwitch,
  cpuForceSwitch,
  isProcessingCommand,
  onSendCommand,
  isTeamPreview,
}) {
  // Si estamos en team preview, no mostrar controles normales
  if (isTeamPreview || requestData?.teamPreview) {
    return null;
  }

  // Verificar si los controles deben estar deshabilitados
  const areControlsDisabled = cpuForceSwitch || isProcessingCommand;

  return (
    <div className="player-section">
      {/* Botones de movimientos solo si no estamos forzados a cambiar */}
      {!playerForceSwitch && requestData?.active?.[0]?.moves && (
        <>
          <h4>Moves</h4>
          <div className="control-row moves-setup-row">
            {requestData.active[0].moves.map((move, index) => (
              <MoveButton
                key={index}
                move={move}
                index={index}
                disabled={areControlsDisabled}
                isProcessing={isProcessingCommand}
                onExecute={onSendCommand}
              />
            ))}
          </div>
        </>
      )}

      {/* Botones de cambio siempre visibles, pero inhabilitados según el estado */}
      <h4 className="switch-title">Switch Pokémon</h4>
      <div className="control-row switch-setup-row">
        {requestData?.side?.pokemon?.map((pokemon, index) => (
          <SwitchButton
            key={index}
            pokemon={pokemon}
            index={index}
            disabled={areControlsDisabled && !playerForceSwitch}
            isProcessing={isProcessingCommand}
            onExecute={onSendCommand}
          />
        ))}
      </div>
    </div>
  );
}
