import React from "react";
import TeamSlot from "./PokeSlot";
import "./TeamMaker.css";
import PokemonTable from "./PokemonTable";

const TeamMaker = () => {
  const team = [
    {
      name: "Nidoking",
      level: 100,
      image: "../../../src/assets/pokemon-hd/0000.png",
      types: [
        {
          name: "Ground",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png",
        },
        {
          name: "Poison",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png",
        },
      ],
    },
    {
      name: "Nidoking",
      level: 100,
      image: "../../../src/assets/pokemon-hd/0034.png",
      types: [
        {
          name: "Ground",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png",
        },
        {
          name: "Poison",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png",
        },
      ],
    },
    {
      name: "Nidoking",
      level: 100,
      image: "../../../src/assets/pokemon-hd/0034.png",
      types: [
        {
          name: "Ground",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png",
        },
        {
          name: "Poison",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png",
        },
      ],
    },
    {
      name: "Nidoking",
      level: 100,
      image: "../../../src/assets/pokemon-hd/0034.png",
      types: [
        {
          name: "Ground",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png",
        },
        {
          name: "Poison",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png",
        },
      ],
    },
    {
      name: "Nidoking",
      level: 100,
      image: "../../../src/assets/pokemon-hd/0034.png",
      types: [
        {
          name: "Ground",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png",
        },
        {
          name: "Poison",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png",
        },
      ],
    },
    {
      name: "Nidoking",
      level: 100,
      image: "../../../src/assets/pokemon-hd/0034.png",
      types: [
        {
          name: "Ground",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png",
        },
        {
          name: "Poison",
          icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png",
        },
      ],
    },
    /* Agrega aquí los otros 5 Pokémon */
  ];

  console.log("teammaker");

  return (
    <>
      <div className="teamContainer">
        {team.map((pokemon, index) => (
          <TeamSlot key={index} pokemon={pokemon} index={index} />
        ))}
      </div>
      <PokemonTable />
    </>
  );
};

export default TeamMaker;
