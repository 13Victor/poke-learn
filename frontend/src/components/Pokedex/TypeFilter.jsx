import React from "react";
import { ALL_TYPES, shouldHaveShrinkClass } from "../../utils/filterUtils";

const TypeFilter = ({ onFilterClick, activeFilters }) => {
  return (
    <ul className="nav-list">
      <li className="nav-item">
        <button
          className={`btn btn-header show-all ${shouldHaveShrinkClass(activeFilters, "show-all") ? "shrink" : ""}`}
          id="show-all"
          onClick={() => onFilterClick("show-all")}
          style={{ boxShadow: "var(--type-show-all-bs) 0px 0px 0px 3px" }}
        >
          <img src="./assets/pokeball.svg" alt="pokeball" />
        </button>
      </li>
      {ALL_TYPES.map((type) => (
        <li key={type} className="nav-item">
          <button
            className={`btn btn-header ${type} ${shouldHaveShrinkClass(activeFilters, type) ? "shrink" : ""}`}
            id={type}
            onClick={() => onFilterClick(type)}
            style={{
              boxShadow: `var(--type-${type}-bs) 0px 0px 0px 3px`,
              background: `var(--type-${type})`,
            }}
          >
            <img
              src={`./assets/type-icons/${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}_icon.png`}
              alt={type}
            />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default TypeFilter;
