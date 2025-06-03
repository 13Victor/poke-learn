// src/components/Battle/BattleControls.jsx
import React from "react";
import { MoveButton } from "./MoveButton";
import { SwitchButton } from "./SwitchButton";
import { TeamPreview } from "./TeamPreview";

export function BattleControls({
  requestData,
  playerForceSwitch,
  cpuForceSwitch,
  isProcessingCommand,
  onSendCommand,
  isTeamPreview,
  teamPreviewPokemon,
}) {
  // Si estamos en team preview, mostrar el componente de team preview
  if (isTeamPreview || requestData?.teamPreview) {
    return (
      <TeamPreview
        requestData={requestData}
        teamPreviewPokemon={teamPreviewPokemon}
        onSendCommand={onSendCommand}
        isProcessingCommand={isProcessingCommand}
      />
    );
  }

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
