// src/services/apiService.js

// URL base para las llamadas API
const API_BASE_URL = "http://localhost:5000";

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

  // Crear equipo
  async createTeam(teamData) {
    return this.fetchData("/teams", {
      method: "POST",
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

  // MÉTODOS DE DATOS POKÉMON

  // Obtener pokémon disponibles
  async getAvailablePokemons() {
    return this.fetchData("/data/availablePokemons", {
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
}

// Exportar una única instancia para usar en toda la aplicación
const apiService = new ApiService();
export default apiService;
