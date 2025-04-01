import React, { createContext, useContext, useState } from "react";

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  // 🔹 Estado del equipo
  const [team, setTeam] = useState(
    Array(6).fill({
      name: "",
      level: 100,
      item: "",
      ability: "",
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    })
  );

  // 🔹 Estado de la vista
  const [viewMode, setViewMode] = useState("pokemon");

  // 🔹 Estado del slot seleccionado
  const [selectedSlot, setSelectedSlot] = useState(0);

  // 🔹 Estado del movimiento seleccionado
  const [selectedMove, setSelectedMove] = useState({ slot: 0, moveIndex: 0 });

  return (
    <TeamContext.Provider
      value={{
        team,
        setTeam,
        viewMode,
        setViewMode,
        selectedSlot,
        setSelectedSlot,
        selectedMove,
        setSelectedMove,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam debe ser usado dentro de un TeamProvider");
  }
  return context;
};
