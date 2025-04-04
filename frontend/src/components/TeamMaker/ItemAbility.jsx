import React, { memo } from "react";
import { useTeam } from "../../TeamContext";

const ItemAbility = memo(
  ({ item, ability, itemSpriteNum, slotIndex, onAbilityChange, pokemon }) => {
    const { setViewMode, setSelectedSlot, FLOW_STAGES, setFlowStage } =
      useTeam();

    const handleItemClick = (e) => {
      e.stopPropagation();
      setSelectedSlot(slotIndex);

      // Si no hay un Pokémon seleccionado, mostrar la vista de Pokémon
      if (!pokemon.name) {
        setViewMode("pokemon");
        setFlowStage(FLOW_STAGES.POKEMON);
      } else {
        setViewMode("items");
        setFlowStage(FLOW_STAGES.ITEM);
      }
    };

    // Función para calcular la posición del sprite
    const getSpritePosition = (spritenum) => {
      // Asumiendo que la cuadrícula es de X ítems por fila
      const itemsPerRow = 16;

      // Calcular fila y columna
      const row = Math.floor(spritenum / itemsPerRow);
      const col = spritenum % itemsPerRow;

      // Retornar posición como string CSS para background-position
      return `-${col * 24}px -${row * 24}px`;
    };

    return (
      <div className="item-abilityContainer">
        <div className="itemContainer">
          {itemSpriteNum !== null && itemSpriteNum !== undefined ? (
            <div
              className="item-sprite small-icon"
              style={{
                backgroundImage: 'url("/assets/items.png")',
                backgroundPosition: getSpritePosition(itemSpriteNum),
              }}
            />
          ) : (
            <i className="fa-solid fa-cube"></i>
          )}
          <button className="item-button" onClick={handleItemClick}>
            {item || "Select Item"}
          </button>
        </div>
        <input
          type="text"
          name="ability"
          className="abilityInput"
          value={ability || ""}
          onChange={onAbilityChange}
          placeholder="Ability"
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Solo re-renderizar cuando cambia el item, la habilidad o el spriteNum
    return (
      prevProps.item === nextProps.item &&
      prevProps.ability === nextProps.ability &&
      prevProps.itemSpriteNum === nextProps.itemSpriteNum &&
      prevProps.pokemon.name === nextProps.pokemon.name
    );
  }
);

ItemAbility.displayName = "ItemAbility";

export default ItemAbility;
