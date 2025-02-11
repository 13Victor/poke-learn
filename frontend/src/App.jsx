import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import User from './components/User'; 
import './App.css';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/auth/login" />;
}

function App() {
    return (
      <Router>
        <div>
          <Routes>
            <Route path="/auth" element={<Home />} /> 
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/user" element={<PrivateRoute><User /></PrivateRoute>} />
          </Routes>
        </div>
      </Router>
    );
}

export default App;
