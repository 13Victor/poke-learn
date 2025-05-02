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
                <img className="type-icon" src={`/assets/type-icons/${move.type}_banner.png`} />
              </div>
            }
            placement="top"
            animation="scale"
            theme={`type-tooltip-${move.type.toLowerCase()} transparent`}
            delay={[300, 100]}
            arrow={true}
          >
            <img className="type-icon" src={`/assets/type-icons/${move.type}2.png`} />
          </Tippy>
        </div>
      </td>
      <td>
        <div className="category-cell">
          <Tippy
            content={
              <div className="category-tooltip-content">
                <img src={`/assets/move-category/${move.category}.png`} />
                <p>{move.category}</p>
              </div>
            }
            placement="top"
            animation="scale"
            theme={`category-tooltip-${move.category.toLowerCase()}`}
            delay={[300, 100]}
            arrow={true}
          >
            <img
              src={`/assets/move-category/${move.category}.png`}
              title={move.category}
              className={`category-icon category-${move.category.toLowerCase()}`}
            />
          </Tippy>
        </div>
      </td>
      <td>{move.basePower || "-"}</td>
      <td>{move.accuracy || "-"}</td>
      <td>{move.pp}</td>
    </tr>
  );
});

MoveRow.displayName = "MoveRow";

export default MoveRow;
