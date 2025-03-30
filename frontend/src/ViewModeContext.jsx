import { createContext, useContext, useState } from "react";

const ViewModeContext = createContext();

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState("pokemon");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(null);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        selectedSlot,
        setSelectedSlot,
        selectedMoveIndex,
        setSelectedMoveIndex,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);
