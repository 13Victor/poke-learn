import React, { createContext, useContext, useState } from "react";

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [selectedSlot, setSelectedSlot] = useState(0);

  return (
    <TeamContext.Provider value={{ selectedSlot, setSelectedSlot }}>
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
