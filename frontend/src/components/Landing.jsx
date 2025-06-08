// src/components/Landing/Landing.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";
import "./User";
import User from "./User";

const Landing = () => {
  const navigate = useNavigate();

  const cardData = [
    {
      id: 1,
      title: "Team Maker",
      subtitle: "Create your perfect team",
      pokemonImage: "./assets/trio/0383 Groudon.png",
      backgroundImage: "./assets/backgrounds/fire.jpg",
      route: "/teams",
    },
    {
      id: 2,
      title: "Battle Simulator",
      subtitle: "Test your strategies",
      pokemonImage: "./assets/trio/0384 Rayquaza.png",
      backgroundImage: "./assets/backgrounds/air.jpg",
      route: "/battle",
    },
    {
      id: 3,
      title: "Pokédex",
      subtitle: "Explore all Pokémon",
      pokemonImage: "./assets/trio/0382 Kyogre.png",
      backgroundImage: "./assets/backgrounds/water.jpg",
      route: "/pokedex",
    },
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <div className="landing-container" style={{}}>
      <User />
      <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
      <h8 className="landing-title">Explore every corner of Poke Learn</h8>

      <div className="landing-grid">
        {cardData.map((card) => (
          <div key={card.id} className="card" onClick={() => handleCardClick(card.route)}>
            <div
              className="card-background"
              style={{
                backgroundImage: `url(${card.backgroundImage})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
              }}
            ></div>
            <div className="background-titles">
              <h7 className="card-title">{card.title}</h7>
              <h2 className="card-subtitle">{card.subtitle}</h2>
            </div>
            <img
              src={card.pokemonImage}
              className="card-pokemon-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/200x200?text=Pokemon";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
