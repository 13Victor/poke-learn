import { BrowserRouter as AppRoutes } from "react-router-dom";
import AuthRoutes from "./components/AuthRoutes";
import { TeamProvider } from "./contexts/TeamContext";
import { PokemonDataProvider } from "./contexts/PokemonDataContext";
import "./styles/App.css";

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
