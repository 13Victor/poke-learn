import React, { memo } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

const MoveRow = memo(({ move, onClick, isEven }) => {
  return (
    <tr onClick={() => onClick(move)} className={isEven ? "even-row" : "odd-row"}>
      <td>{move.name}</td>
      <td>
        <div className="types-cell">
          <Tippy
            content={
              <div className="type-tooltip-content">
                <img className="type-icon" src={`/assets/type-icons/${move.type}_banner.png`} alt={move.type} />
              </div>
            }
            placement="top"
            animation="scale"
            theme={`type-tooltip-${move.type.toLowerCase()} transparent`}
            delay={[300, 100]}
            arrow={true}
          >
            <img className="type-icon" src={`/assets/type-icons/${move.type}2.png`} alt={move.type} />
          </Tippy>
        </div>
      </td>
      <td>
        <img
          src={`/assets/move-category/${move.category}.png`}
          title={move.category}
          className={`category-icon category-${move.category.toLowerCase()}`}
        />
      </td>
      <td>{move.basePower || "-"}</td>
      <td>{move.accuracy || "-"}</td>
      <td>{move.pp}</td>
    </tr>
  );
});

MoveRow.displayName = "MoveRow";

export default MoveRow;
