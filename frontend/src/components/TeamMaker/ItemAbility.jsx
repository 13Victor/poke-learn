import React, { memo } from "react";
import { useTeam } from "../../contexts/TeamContext";

const ItemAbility = memo(
  ({ item, ability, itemSpriteNum, slotIndex, abilityType, pokemon }) => {
    const { setViewMode, setSelectedSlot, FLOW_STAGES, setFlowStage, flowStage, selectedSlot } = useTeam();

    // Determine if this item or ability is currently selected based on the flow stage and selected slot
    const isItemSelected = flowStage === FLOW_STAGES.ITEM && selectedSlot === slotIndex;
    const isAbilitySelected = flowStage === FLOW_STAGES.ABILITY && selectedSlot === slotIndex;

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

    const handleAbilityClick = (e) => {
      e.stopPropagation();
      setSelectedSlot(slotIndex);

      // Si no hay un Pokémon seleccionado, mostrar la vista de Pokémon
      if (!pokemon.name) {
        setViewMode("pokemon");
        setFlowStage(FLOW_STAGES.POKEMON);
      } else {
        setViewMode("abilities");
        setFlowStage(FLOW_STAGES.ABILITY);
      }
    };

    // Get the item key from the item name or use a fallback
    const getItemKey = () => {
      // This assumes that the item variable holds the name, and that
      // you have some way to convert the name to a key
      // You might need to adjust this logic based on your actual data structure
      if (!item) return null;

      // Convert item name to key format (lowercase, no spaces)
      // This is an example - modify according to your actual key format
      return item.toLowerCase().replace(/\s+/g, "");
    };

    const itemKey = getItemKey();

    return (
      <div className="item-abilityContainer">
        <div className="itemContainer">
          {item ? (
            <img src={`/assets/items/${itemKey}.webp`} alt={item} className="item-sprite small-icon" />
          ) : (
            <i className="fa-solid fa-cube item-sprite small-icon"></i>
          )}
          <button className={`item-button ${isItemSelected ? "selected-item" : ""}`} onClick={handleItemClick}>
            {item || "Select Item"}
          </button>
        </div>
        <button
          className={`ability-button ${isAbilitySelected ? "selected-ability" : ""}`}
          onClick={handleAbilityClick}
        >
          {ability || "Select Ability"}
        </button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Solo re-renderizar cuando cambia el item, la habilidad, el spriteNum o abilityType
    return (
      prevProps.item === nextProps.item &&
      prevProps.ability === nextProps.ability &&
      prevProps.abilityType === nextProps.abilityType &&
      prevProps.itemSpriteNum === nextProps.itemSpriteNum &&
      prevProps.pokemon.name === nextProps.pokemon.name
    );
  }
);

ItemAbility.displayName = "ItemAbility";

export default ItemAbility;
