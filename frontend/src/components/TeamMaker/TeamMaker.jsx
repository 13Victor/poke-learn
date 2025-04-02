import React, { memo } from "react";
import TeamContainer from "./TeamContainer";
import TableView from "./TableView";
import { usePokemonData } from "../../PokemonDataContext";

// Loading indicator component
const LoadingIndicator = memo(({ label }) => (
  <div className="loading-indicator">
    <div className="spinner"></div>
    <p>⏳ Loading {label}...</p>
  </div>
));

// Main TeamMaker component - simplified to only handle rendering decisions
const TeamMaker = memo(() => {
  const { isAllDataLoaded, isLoading } = usePokemonData();

  console.log("🔴 TeamMaker component rendered");

  return (
    <>
      <TeamContainer />

      {isLoading && !isAllDataLoaded ? (
        <LoadingIndicator label="data" />
      ) : (
        <TableView />
      )}
    </>
  );
});

export default TeamMaker;
