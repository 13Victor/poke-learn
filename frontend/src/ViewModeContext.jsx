import { createContext, useContext, useState } from "react";

const ViewModeContext = createContext();

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState("pokemon"); // Estado global

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);
