import { BrowserRouter as AppRoutes } from "react-router-dom";
import AuthRoutes from './components/AuthRoutes';
import './App.css';

function App() {
    return (
      <AppRoutes>
        <AuthRoutes />
      </AppRoutes>
    );
}

export default App;
