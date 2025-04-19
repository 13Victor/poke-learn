const { BattleStream, Teams } = require("pokemon-showdown");
const readline = require("readline");

// Configurar la interfaz para leer desde la consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Crear una batalla directa (sin usar getPlayerStreams)
const battleStream = new BattleStream();

// Escuchar los eventos de la batalla
(async () => {
  for await (const chunk of battleStream) {
    console.log("\n===== MENSAJE DEL SIMULADOR =====");
    console.log(chunk);
    console.log("=================================\n");
  }
})();

// Función para enviar comandos directamente
function sendCommand(command) {
  console.log(`Enviando: ${command}`);
  battleStream.write(command);
}

// Iniciar la batalla con un formato y equipos aleatorios
sendCommand(`>start {"formatid":"gen7randombattle"}`);
sendCommand(`>player p1 {"name":"Jugador 1","team":${JSON.stringify(Teams.pack(Teams.generate("gen7randombattle")))}}`);
sendCommand(`>player p2 {"name":"Jugador 2","team":${JSON.stringify(Teams.pack(Teams.generate("gen7randombattle")))}}`);

// Función interactiva para ingresar comandos
function promptCommand() {
  rl.question('Ingresa un comando EXACTO o "exit" para salir: ', (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    sendCommand(input);
    promptCommand();
  });
}

// Iniciar el bucle después de un breve retraso
setTimeout(() => {
  console.log("\n=== Batalla iniciada ===");
  console.log("Por favor ingresa comandos exactos, incluyendo el prefijo '>' cuando sea necesario.");
  console.log("Ejemplos:");
  console.log("> Team preview: '>p1 team 123456' y '>p2 team 123456'");
  console.log("> Movimientos: '>p1 move 1' y '>p2 move 1'");
  promptCommand();
}, 1000);
