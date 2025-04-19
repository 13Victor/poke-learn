// test-simulator.js
const { BattleStream, Teams } = require("pokemon-showdown");

async function runBattleTest() {
  // Crear stream de batalla
  const stream = new BattleStream();

  // Mostrar salida
  (async () => {
    for await (const chunk of stream) {
      console.log("OUTPUT:", chunk);
    }
  })();

  // Iniciar batalla
  console.log("Iniciando batalla...");
  stream.write('>start {"formatid":"gen7randombattle"}');
  await new Promise((r) => setTimeout(r, 500));

  // Configurar jugadores con equipos aleatorios
  const p1spec = {
    name: "Player 1",
    team: Teams.pack(Teams.generate("gen7randombattle")),
  };

  const p2spec = {
    name: "Player 2",
    team: Teams.pack(Teams.generate("gen7randombattle")),
  };

  stream.write(`>player p1 ${JSON.stringify(p1spec)}`);
  await new Promise((r) => setTimeout(r, 500));

  stream.write(`>player p2 ${JSON.stringify(p2spec)}`);
  await new Promise((r) => setTimeout(r, 1000));

  // Enviar comandos de team preview
  console.log("Enviando team preview...");
  stream.write(">p1 team 123456");
  await new Promise((r) => setTimeout(r, 500));

  stream.write(">p2 team 123456");
  await new Promise((r) => setTimeout(r, 1000));

  // Enviar movimientos
  console.log("Enviando movimiento p1...");
  stream.write(">p1 move 1");
  await new Promise((r) => setTimeout(r, 500));

  console.log("Enviando movimiento p2...");
  stream.write(">p2 move 1");
  await new Promise((r) => setTimeout(r, 1000));

  console.log("Test completado");
}

runBattleTest().catch(console.error);
