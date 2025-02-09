import { useEffect, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function App() {
  return (
    <div>
      <h1>React + Node.js</h1>
      <Login />
      <Register />
    </div>
  );
}

export default App;