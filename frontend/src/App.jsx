import { BrowserRouter as Router } from "react-router-dom";
import AuthRoutes from "./components/AuthRoutes";
import { TeamProvider } from "./contexts/TeamContext";
import { PokemonDataProvider } from "./contexts/PokemonDataContext";
import { AuthProvider } from "./contexts/AuthContext";
import "./styles/App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <TeamProvider>
          <PokemonDataProvider>
            <AuthRoutes />
          </PokemonDataProvider>
        </TeamProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
