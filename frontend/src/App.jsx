import { BrowserRouter as AppRoutes } from "react-router-dom";
import AuthRoutes from "./components/AuthRoutes";
import { ViewModeProvider } from "./ViewModeContext";
import "./App.css";

function App() {
  return (
    <AppRoutes>
      <ViewModeProvider>
        <AuthRoutes />
      </ViewModeProvider>
    </AppRoutes>
  );
}

export default App;
