import React, { memo } from "react";
import TeamContainer from "./TeamContainer";
import TableView from "./TableView";
import LoadingIndicator from "./LoadingIndicator";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/TeamMaker.css";
import SaveTeamButton from "./SaveTeamButton";
import TeamAnalysis from "./TeamAnalysis";

const TeamMaker = memo(() => {
  const { isAllDataLoaded, isLoading } = usePokemonData();

  console.log("🔴 TeamMaker component rendered");

  return (
    <div className="teammaker-page">
      <div className="teammaker-header">
        <h1>Team Maker</h1>
        <p>Build your perfect team!</p>
        <SaveTeamButton />
      </div>
      <div className="teammaker-container">
        <TeamContainer />

        <div className="table-section">
          {isLoading && !isAllDataLoaded ? <LoadingIndicator label="data" /> : <TableView />}
        </div>

        <TeamAnalysis />
      </div>
    </div>
  );
});

export default TeamMaker;
