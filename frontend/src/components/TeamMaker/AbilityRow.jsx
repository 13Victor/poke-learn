import React from "react";

const AbilityRow = React.memo(({ ability, abilityType, onClick }) => {
  // Determine the label for ability type (0, 1, or H for Hidden)
  const abilityTypeLabel = abilityType === "H" ? "H" : abilityType;

  return (
    <tr onClick={() => onClick(ability, abilityType)}>
      <td className="ability-type">{abilityTypeLabel}</td>
      <td>{ability[0]}</td>
      <td>{ability[1] || "No description available"}</td>
    </tr>
  );
});

AbilityRow.displayName = "AbilityRow";

export default AbilityRow;
