import React from "react";

const AbilityRow = React.memo(({ ability, abilityType, onClick, isEven }) => {
  const abilityTypeLabel = abilityType === "H" ? "H" : abilityType;

  // Ahora ability es un array con [nombre, descripción, id]
  const abilityName = ability[0];
  const abilityDesc = ability[1] || "No description available";
  const abilityId = ability[2]; // El ID de la habilidad

  return (
    <tr onClick={() => onClick(abilityName, abilityId, abilityType)} className={isEven ? "even-row" : "odd-row"}>
      <td className="ability-type">{abilityTypeLabel}</td>
      <td>{abilityName}</td>
      <td>{abilityDesc}</td>
    </tr>
  );
});

AbilityRow.displayName = "AbilityRow";

export default AbilityRow;
