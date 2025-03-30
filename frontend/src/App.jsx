import { BrowserRouter as AppRoutes } from "react-router-dom";
import AuthRoutes from "./components/AuthRoutes";
import { ViewModeProvider } from "./ViewModeContext";
import { TeamProvider } from "./TeamContext"; // Asegúrate de importar el TeamProvider
import "./App.css";

function App() {
  return (
    <AppRoutes>
      <ViewModeProvider>
        <TeamProvider>
          <AuthRoutes />
        </TeamProvider>
      </ViewModeProvider>
    </AppRoutes>
  );
}

export default App;
