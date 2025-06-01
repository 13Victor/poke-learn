import React from "react";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  icon = "fa-search",
  disabled = false,
  onClear = null,
}) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      // Create a synthetic event to maintain consistency
      const syntheticEvent = {
        target: { value: "" },
      };
      onChange("");
    }
  };

  return (
    <div className={`search-input-container ${className}`}>
      <div className="search-input-wrapper">
        <i className={`fas ${icon} search-icon`}></i>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="search-input"
          disabled={disabled}
        />
        {value && (
          <button type="button" className="clear-button" onClick={handleClear} aria-label="Clear search">
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
