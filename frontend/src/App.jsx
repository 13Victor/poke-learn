import { BrowserRouter as AppRoutes } from "react-router-dom";
import AuthRoutes from "./components/AuthRoutes";
import { TeamProvider } from "./TeamContext";
import "./App.css";

function App() {
  return (
    <AppRoutes>
      <TeamProvider>
        <AuthRoutes />
      </TeamProvider>
    </AppRoutes>
  );
}

export default App;
