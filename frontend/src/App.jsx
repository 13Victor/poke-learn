import { BrowserRouter as AppRoutes } from "react-router-dom";
import LoginRoutes from './components/LoginRoutes';
import './App.css';

function App() {
    return (
      <AppRoutes>
        <LoginRoutes />
      </AppRoutes>
    );
}

export default App;
