// ViewModeContext.js
import { createContext, useContext, useState } from "react";

const ViewModeContext = createContext();

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState("pokemon");
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [selectedMove, setSelectedMove] = useState({ slot: 0, moveIndex: 0 }); // Añadir selectedMove aquí

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        selectedSlot,
        setSelectedSlot,
        selectedMove, // Asegúrate de proporcionar selectedMove
        setSelectedMove, // Añadir setSelectedMove
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);
