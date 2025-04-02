import { BrowserRouter as AppRoutes } from "react-router-dom";
import AuthRoutes from "./components/AuthRoutes";
import { TeamProvider } from "./TeamContext";
import { PokemonDataProvider } from "./PokemonDataContext";
import "./App.css";

function App() {
  return (
    <AppRoutes>
      <TeamProvider>
        <PokemonDataProvider>
          <AuthRoutes />
        </PokemonDataProvider>
      </TeamProvider>
    </AppRoutes>
  );
}

export default App;
