import React, { useState } from "react";
import PokeSlot from "./PokeSlot";
import "./TeamMaker.css";
import PokemonTable from "./PokemonTable";

const TeamMaker = () => {
  const [team, setTeam] = useState([
    {
      name: "Pokemon 1",
      level: 0,
      image: "0000.png", // Placeholder por si no hay imagen
      types: [],
    },
    {
      name: "Pokemon 2",
      level: 0,
      image: "0000.png",
      types: [],
    },
    {
      name: "Pokemon 3",
      level: 0,
      image: "0000.png",
      types: [],
    },
    {
      name: "Pokemon 4",
      level: 0,
      image: "0000.png",
      types: [],
    },
    {
      name: "Pokemon 5",
      level: 0,
      image: "0000.png",
      types: [],
    },
    {
      name: "Pokemon 6",
      level: 0,
      image: "0000.png",
      types: [],
    },
  ]);

  const handlePokemonSelect = (pokemon) => {
    console.log("🔄 Actualizando slot 1 con:", pokemon);
    setTeam((prevTeam) => {
      const newTeam = [...prevTeam];
      newTeam[0] = pokemon; // Reemplazamos solo el primer slot
      return newTeam;
    });
  };

  return (
    <>
      <div className="teamContainer">
        {team.map((pokemon, index) => (
          <PokeSlot key={index} pokemon={pokemon} index={index} />
        ))}
      </div>
      <PokemonTable onPokemonSelect={handlePokemonSelect} />
    </>
  );
};

export default TeamMaker;
