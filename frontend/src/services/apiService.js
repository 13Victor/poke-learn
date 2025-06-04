// src/services/apiService.js

// URL base para las llamadas API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Clase para gestionar todas las llamadas a la API
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Método para obtener el token de autenticación
  getAuthToken() {
    return localStorage.getItem("token");
  }

  // Método para establecer headers comunes
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Verificar si estamos autenticados
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Método genérico para realizar peticiones
  async fetchData(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    // Si la petición requiere autenticación y no hay token, rechazar inmediatamente
    if (options.requiresAuth !== false && !this.getAuthToken()) {
      console.log(`Petición a ${endpoint} cancelada: no hay token de autenticación`);
      return Promise.reject(new Error("Token no proporcionado"));
    }

    try {
      const response = await fetch(url, options);

      // Si la respuesta no es 2xx, lanzar un error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la petición");
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en petición a ${endpoint}:`, error);
      throw error;
    }
  }

  // NUEVO: Método para obtener descripción de la Pokédex desde PokeAPI
  async getPokedexEntry(pokedexNumber) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokedexNumber}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("No se pudo obtener el Pokémon");

      const data = await response.json();

      // Filtrar las entradas en inglés
      const entriesEn = data.flavor_text_entries.filter((entry) => entry.language.name === "en");
      if (entriesEn.length === 0) return "No English entry available";

      // Tomar la última entrada (última en el array filtrado)
      const lastEntry = entriesEn[entriesEn.length - 1].flavor_text;

      // Limpiar saltos de línea y caracteres raros
      const cleaned = lastEntry.replace(/\f/g, " ").replace(/\n/g, " ").trim();
      return cleaned;
    } catch (error) {
      console.error("Error fetching Pokédex entry:", error);
      throw new Error("Error al obtener la entrada de la Pokédex");
    }
  }

  // MÉTODOS DE AUTENTICACIÓN

  // Registro tradicional
  async register(userData) {
    return this.fetchData("/auth/register", {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify(userData),
      requiresAuth: false,
    });
  }

  // Login tradicional
  async login(email, password) {
    return this.fetchData("/auth/login", {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    });
  }

  // Login con Firebase
  async loginWithFirebase(userInfo, firebaseToken) {
    return this.fetchData("/auth/login-firebase", {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({
        user_info: userInfo,
        firebase_token: firebaseToken,
      }),
      requiresAuth: false,
    });
  }

  // Verificar estado de autenticación
  async checkAuth() {
    return this.fetchData("/auth/check", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // MÉTODOS DE USUARIO

  // Obtener perfil de usuario
  async getUserProfile() {
    return this.fetchData("/user", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // MÉTODOS DE EQUIPOS

  // Obtener equipos
  async getTeams() {
    return this.fetchData("/teams", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener un equipo específico por ID
  async getTeamById(teamId) {
    return this.fetchData(`/teams/${teamId}`, {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Crear equipo
  async createTeam(teamData) {
    return this.fetchData("/teams", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(teamData),
      requiresAuth: true,
    });
  }

  // Actualizar equipo existente
  async updateTeam(teamId, teamData) {
    return this.fetchData(`/teams/${teamId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(teamData),
      requiresAuth: true,
    });
  }

  // Eliminar equipo
  async deleteTeam(teamId) {
    return this.fetchData(`/teams/${teamId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Alternar estado de favorito de equipo
  async toggleTeamFavorite(teamId, isFavorite) {
    return this.fetchData(`/teams/${teamId}/favorite`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify({ is_favorite: isFavorite }),
      requiresAuth: true,
    });
  }

  // MÉTODOS DE DATOS POKÉMON

  // Obtener pokémon disponibles para competitivo
  async getAvailablePokemons() {
    return this.fetchData("/data/availablePokemons", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener TODOS los pokémon para la Pokédex
  async getAllPokemons() {
    return this.fetchData("/data/allPokemons", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener movimientos
  async getMoves() {
    return this.fetchData("/data/moves", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener descripciones de movimientos
  async getMovesDesc() {
    return this.fetchData("/data/moves-desc", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener learnsets
  async getLearnsets() {
    return this.fetchData("/data/learnsets", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener objetos
  async getItems() {
    return this.fetchData("/data/items", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener habilidades
  async getAbilities() {
    return this.fetchData("/data/abilities", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener tipos
  async getTypes() {
    return this.fetchData("/data/types", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // MÉTODOS DE BATALLA - ACTUALIZADOS PARA INCLUIR DIFICULTAD

  async startBattle(battleData) {
    return this.fetchData("/battle/start", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        format: battleData.format || "gen9ou",
        playerTeam: battleData.playerTeamShowdown || null,
        rivalTeamExport: battleData.rivalTeamExport || null,
        useCustomTeams: battleData.playerTeamShowdown && battleData.rivalTeamExport,
        difficulty: battleData.difficulty || "easy", // Include difficulty
      }),
      requiresAuth: true,
    });
  }

  // Inicializar batalla
  async initializeBattle(battleId) {
    return this.fetchData(`/battle/initialize/${battleId}`, {
      method: "POST",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Enviar comando a batalla
  async sendBattleCommand(battleId, command) {
    return this.fetchData(`/battle/command/${battleId}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ command }),
      requiresAuth: true,
    });
  }

  // Obtener estado de batalla
  async getBattleStatus(battleId) {
    return this.fetchData(`/battle/status/${battleId}`, {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Finalizar batalla
  async endBattle(battleId) {
    return this.fetchData(`/battle/end/${battleId}`, {
      method: "POST",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }

  // Obtener formatos disponibles
  async getBattleFormats() {
    return this.fetchData("/battle/formats", {
      method: "GET",
      headers: this.getHeaders(),
      requiresAuth: true,
    });
  }
}

// Exportar una única instancia para usar en toda la aplicación
const apiService = new ApiService();
export default apiService;
