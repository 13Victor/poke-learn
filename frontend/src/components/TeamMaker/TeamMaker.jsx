import React, { memo } from "react";
import TeamContainer from "./TeamContainer";
import TableView from "./TableView";
import LoadingIndicator from "./LoadingIndicator";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/TeamMaker.css";

const TeamMaker = memo(() => {
  const { isAllDataLoaded, isLoading } = usePokemonData();

  console.log("🔴 TeamMaker component rendered");

  return (
    <div className="teammaker-container">
      <div className="team-section">
        <TeamContainer />
      </div>

      <div className="table-section">
        {isLoading && !isAllDataLoaded ? <LoadingIndicator label="data" /> : <TableView />}
      </div>
    </div>
  );
});

export default TeamMaker;
