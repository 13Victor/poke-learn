import React, { memo } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

// Este componente representa una estadística individual
const Stat = memo(({ label, value, baseValue, maxValue, fullname }) => {
  // Calculamos el porcentaje relativo a un valor máximo esperado para una estadística
  const percentage = Math.min(100, (value / maxValue) * 100);

  // Función para interpolar colores basados en el porcentaje
  const getGradientColor = (percent) => {
    // Definimos los colores para nuestro gradiente (de bajo a alto)
    const colors = [
      { percent: null, color: { r: 77, g: 77, b: 255 } }, // Null (#c3c3c3)
      { percent: 0, color: { r: 255, g: 77, b: 77 } }, // Rojo (#ff4d4d)
      { percent: 20, color: { r: 255, g: 140, b: 0 } }, // Naranja (#ff8c00)
      { percent: 40, color: { r: 255, g: 215, b: 0 } }, // Amarillo (#ffd700)
      { percent: 60, color: { r: 50, g: 205, b: 50 } }, // Verde (#32cd32)
      { percent: 80, color: { r: 0, g: 195, b: 255 } }, // Cian (#00c3ff)
    ];

    // Encontrar los dos colores entre los que interpolar
    let colorLow, colorHigh;
    for (let i = 0; i < colors.length - 1; i++) {
      if (percent >= colors[i].percent && percent <= colors[i + 1].percent) {
        colorLow = colors[i].color;
        colorHigh = colors[i + 1].color;

        // Calcular qué tan lejos estamos entre los dos puntos (0-1)
        const range = colors[i + 1].percent - colors[i].percent;
        const adjustedPercent = (percent - colors[i].percent) / range;

        // Interpolar entre los dos colores
        const r = Math.round(colorLow.r + adjustedPercent * (colorHigh.r - colorLow.r));
        const g = Math.round(colorLow.g + adjustedPercent * (colorHigh.g - colorLow.g));
        const b = Math.round(colorLow.b + adjustedPercent * (colorHigh.b - colorLow.b));

        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    // Si es mayor que el último umbral, devolver el color más alto
    return `rgb(${colors[colors.length - 1].color.r}, ${colors[colors.length - 1].color.g}, ${
      colors[colors.length - 1].color.b
    })`;
  };

  // Obtenemos el color basado en el porcentaje
  const statColor = getGradientColor(percentage);

  return (
    <Tippy content={fullname} placement="top" animation="scale" theme="light-border" delay={[300, 100]}>
      <div className="statContainer">
        <div
          className="statLabel"
          style={{
            backgroundColor: statColor,
          }}
        >
          <p>{label}</p>
        </div>

        <div className="statValue">{value}</div>
      </div>
    </Tippy>
  );
});

export default Stat;
