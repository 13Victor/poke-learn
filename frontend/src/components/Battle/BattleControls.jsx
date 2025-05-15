// src/components/Battle/BattleControls.jsx
import React from "react";
import { MoveButton } from "./MoveButton";
import { SwitchButton } from "./SwitchButton";

export function BattleControls({ requestData, playerForceSwitch, cpuForceSwitch, isProcessingCommand, onSendCommand }) {
  // Verificar si los controles deben estar deshabilitados
  const areControlsDisabled = cpuForceSwitch || isProcessingCommand;

  return (
    <div className="player-section">
      <h3>Controles del Jugador</h3>

      {/* Mostrar mensaje sobre qué acción se requiere */}
      <div className="action-required">
        {playerForceSwitch
          ? "Debes elegir un nuevo Pokémon"
          : cpuForceSwitch
          ? "Debes realizar la acción para la CPU"
          : "Elige tu próxima acción"}
      </div>

      {/* Botones de team preview si estamos en esa fase */}
      {requestData && requestData.teamPreview && (
        <div className="control-row">
          <button onClick={() => onSendCommand(">p1 team 123456")}>Team Preview (123456)</button>
        </div>
      )}

      {/* Botones de movimientos solo si no estamos forzados a cambiar */}
      {!playerForceSwitch && requestData?.active?.[0]?.moves && (
        <>
          <h4>Movimientos</h4>
          <div className="control-row">
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
      <h4>Cambiar Pokémon</h4>
      <div className="control-row">
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
