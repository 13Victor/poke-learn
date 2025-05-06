import React from "react";

// Function to get color based on Pokémon type
const getTypeColor = (type) => {
  if (!type) return "var(--white-smoke)";

  const typeColors = {
    normal: "var(--type-normal-bs)",
    fire: "var(--type-fire-bs)",
    water: "var(--type-water-bs)",
    electric: "var(--type-electric-bs)",
    grass: "var(--type-grass-bs)",
    ice: "var(--type-ice-bs)",
    fighting: "var(--type-fighting-bs)",
    poison: "var(--type-poison-bs)",
    ground: "var(--type-ground-bs)",
    flying: "var(--type-flying-bs)",
    psychic: "var(--type-psychic-bs)",
    bug: "var(--type-bug-bs)",
    rock: "var(--type-rock-bs)",
    ghost: "var(--type-ghost-bs)",
    dragon: "var(--type-dragon-bs)",
    dark: "var(--type-dark-bs)",
    steel: "var(--type-steel-bs)",
    fairy: "var(--type-fairy-bs)",
  };

  // Convert to lowercase for case-insensitive comparison
  const typeLower = type.toLowerCase();
  return typeColors[typeLower] || "var(--white-smoke)";
};

const TypeBackgroundPokeball = ({ types = [], className = "" }) => {
  // Use black for missing or empty slots
  const primaryColor = types && types.length > 0 ? getTypeColor(types[0]) : "var(--white-smoke)";
  // Use the primary color again if there's no secondary type
  const secondaryColor = types && types.length > 1 ? getTypeColor(types[1]) : primaryColor;

  return (
    <div className={`type-background-pokeball ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1, transform: "rotate(135deg)" }}
      >
        <g>
          {/* Top half of the pokeball - primary type color */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 7.15 10.286 L 0.122 10.286 C 0.953 4.47 5.955 0 12 0 C 18.045 0 23.047 4.47 23.879 10.286 L 16.85 10.286 C 16.144 8.288 14.239 6.857 12 6.857 C 9.761 6.857 7.856 8.288 7.15 10.286 Z"
            fill={secondaryColor}
          />
          {/* Center circle of the pokeball */}
          <path
            d="M14.8571 12C14.8571 13.578 13.578 14.8571 12 14.8571C10.422 14.8571 9.14286 13.578 9.14286 12C9.14286 10.422 10.422 9.14286 12 9.14286C13.578 9.14286 14.8571 10.422 14.8571 12Z"
            fill={primaryColor}
          />
          {/* Bottom half of the pokeball - secondary type color */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 12 24 C 18.045 24 23.047 19.53 23.879 13.714 L 16.85 13.714 C 16.144 15.712 14.239 17.143 12 17.143 C 9.761 17.143 7.856 15.712 7.15 13.714 L 0.122 13.714 C 0.953 19.53 5.955 24 12 24 Z"
            fill={primaryColor}
          />
        </g>
      </svg>
    </div>
  );
};

export default TypeBackgroundPokeball;
