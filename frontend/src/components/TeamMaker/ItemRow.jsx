import React, { memo } from "react";

const ItemRow = memo(({ item, onClick, isEven }) => {
  // Cálculo de la posición en el sprite sheet
  const getSpritePosition = (spritenum) => {
    // Asumiendo que la cuadrícula es de X ítems por fila (necesitamos saber este valor)
    // Por ejemplo, si hay 16 ítems por fila:
    const itemsPerRow = 16;

    // Calcular fila y columna
    const row = Math.floor(spritenum / itemsPerRow);
    const col = spritenum % itemsPerRow;

    // Retornar posición como string CSS para background-position
    return `-${col * 24}px -${row * 24}px`;
  };

  return (
    <tr onClick={() => onClick(item)} className={isEven ? "even-row" : "odd-row"}>
      <td>
        <div className="item-sprite-container">
          {item.spritenum !== undefined ? (
            <div
              className="item-sprite"
              style={{
                width: "24px",
                height: "24px",
                backgroundImage: 'url("/assets/items.png")',
                backgroundPosition: getSpritePosition(item.spritenum),
                backgroundRepeat: "no-repeat",
              }}
            />
          ) : (
            <div className="item-placeholder" />
          )}
        </div>
      </td>
      <td>{item.name}</td>
      <td>{item.shortDesc || item.desc || "No description available"}</td>
    </tr>
  );
});

ItemRow.displayName = "ItemRow";

export default ItemRow;
