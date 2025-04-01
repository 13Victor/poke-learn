import React, { memo } from "react";

const ItemAbility = memo(
  ({ item, ability, onItemChange, onAbilityChange }) => {
    return (
      <div className="item-abilityContainer">
        <div className="itemContainer">
          <img
            className="small-icon"
            src="/assets/items/item-placeholder.png" // Cambiado para usar un placeholder local
            alt="Item"
          />
          <input
            type="text"
            name="item"
            value={item || ""}
            onChange={onItemChange}
          />
        </div>
        <input
          type="text"
          name="ability"
          className="abilityInput"
          value={ability || ""}
          onChange={onAbilityChange}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Solo re-renderizar cuando cambia el item o la habilidad
    return (
      prevProps.item === nextProps.item &&
      prevProps.ability === nextProps.ability
    );
  }
);

export default ItemAbility;
