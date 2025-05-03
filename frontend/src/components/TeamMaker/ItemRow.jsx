import React, { memo } from "react";

const ItemRow = memo(({ item, onClick, isEven }) => {
  return (
    <tr onClick={() => onClick(item)} className={isEven ? "even-row" : "odd-row"}>
      <td>
        <div className="item-sprite-container">
          {item.key ? (
            <img src={`/assets/items/${item.key}.webp`} alt={item.name} className="item-image" />
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
