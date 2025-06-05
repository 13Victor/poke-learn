import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase.config";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import GoogleButton from "react-google-button";
import "../styles/Register.css";

function Register() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });

  // Estados para la animación de imágenes
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationInterval = useRef(null);

  // Generar array de rutas de las imágenes de la animación (000 a 155)
  const animationFrames = Array.from({ length: 156 }, (_, i) => {
    const frameNumber = i.toString().padStart(3, "0");
    return `/assets/anim/Mega Rayquaza_${frameNumber}.jpg`;
  });

  const { setError, clearError, isAuthenticated, setManualLoginInProgress } = useAuth();
  const navigate = useNavigate();

  // Efecto para la animación de imágenes
  useEffect(() => {
    if (animationFrames.length > 1) {
      animationInterval.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % animationFrames.length);
      }, 60); // 60ms entre frames = ~16.6 FPS

      return () => {
        if (animationInterval.current) {
          clearInterval(animationInterval.current);
        }
      };
    }
  }, [animationFrames.length]);

  // Limpiar errores al montar el componente
  useEffect(() => {
    clearError();

    // Limpieza al desmontar
    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para redirigir al usuario si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Usuario ya autenticado, redirigiendo a /user");
      navigate("/user", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Función para validar la contraseña en tiempo real
  const validatePassword = (password) => {
    setPasswordErrors({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
    });
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    clearError();
    setSuccess("");
    setIsLoading(true);

    // Validación de contraseña
    const allValid = Object.values(passwordErrors).every((valid) => valid);
    if (!allValid) {
      setLocalError("La contraseña no cumple con todos los requisitos de seguridad");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Registrar usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Enviar email de verificación
      await sendEmailVerification(user);
      setVerificationSent(true);

      // 3. Registrar en tu base de datos usando apiService
      const userData = {
        user_name: userName,
        email,
        password,
        firebase_uid: user.uid,
      };

      const response = await apiService.register(userData);

      if (!response.success) {
        throw new Error(response.message || "Error en el registro del servidor");
      }

      setSuccess("Registro exitoso. Por favor verifica tu correo electrónico");
    } catch (error) {
      console.error("Error en registro:", error);

      // Manejo de errores específicos de Firebase
      if (error.code === "auth/email-already-in-use") {
        setLocalError("Este correo ya está registrado");
      } else if (error.code === "auth/invalid-email") {
        setLocalError("Formato de correo inválido");
      } else if (error.code === "auth/weak-password") {
        setLocalError("La contraseña es demasiado débil");
      } else if (error.code === "auth/network-request-failed") {
        setLocalError("Error de red. Verifica tu conexión a internet");
      } else if (error.message && error.message.includes("fetch")) {
        setLocalError("Error al conectar con el servidor");
      } else {
        setLocalError(error.message || "Error desconocido en el registro");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLocalError("");
    clearError();
    setSuccess("");
    setGoogleLoading(true);

    // Indicar que se está realizando un login manual
    setManualLoginInProgress(true);

    try {
      const provider = new GoogleAuthProvider();
      // Configurar para mostrar la pantalla de selección de cuenta cada vez
      provider.setCustomParameters({ prompt: "select_account" });

      // Iniciar sesión con Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Con Google, el correo ya viene verificado, así que podemos proceder directamente

      // Generar un nombre de usuario basado en el email o displayName
      const suggestedUsername = user.displayName
        ? user.displayName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 1000)
        : user.email.split("@")[0] + Math.floor(Math.random() * 1000);

      // Obtener token de ID
      const idToken = await user.getIdToken();

      // Verificar si el usuario ya existe en nuestro backend
      try {
        // Intentar iniciar sesión con Firebase
        const loginResponse = await apiService.loginWithFirebase(
          {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
          idToken
        );

        if (loginResponse.success) {
          // Si el inicio de sesión es exitoso, significa que el usuario ya existe
          // Guardar token y redirigir a la página principal
          localStorage.setItem("token", loginResponse.data.token);
          setSuccess("¡Has iniciado sesión con Google! Redirigiendo...");

          // Esperar para asegurar que el token se almacenó correctamente
          setTimeout(() => {
            // Actualizar estado de usuario en AuthContext
            apiService
              .checkAuth()
              .then(() => {
                // Finalizar login manual solo después de que se haya verificado el token
                setManualLoginInProgress(false);
                // Ahora redirigir al usuario
                navigate("/user");
              })
              .catch((err) => {
                console.error("Error verificando auth después de login con Google:", err);
                setManualLoginInProgress(false);
                navigate("/user");
              });
          }, 1000);

          return;
        }
      } catch (loginError) {
        // Si falla el inicio de sesión, asumimos que el usuario no existe y procedemos con el registro
        console.log("El usuario no existe en el backend, procediendo con el registro...");
      }

      // Registrar en tu base de datos
      const userData = {
        user_name: suggestedUsername,
        email: user.email,
        password: Math.random().toString(36).slice(-12), // Contraseña aleatoria (no se usará)
        firebase_uid: user.uid,
        google_auth: true,
      };

      const registerResponse = await apiService.register(userData);

      if (!registerResponse.success) {
        throw new Error(registerResponse.message || "Error en el registro del servidor");
      }

      // Iniciar sesión después del registro exitoso
      const loginAfterRegister = await apiService.loginWithFirebase(
        {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        idToken
      );

      if (loginAfterRegister.success) {
        localStorage.setItem("token", loginAfterRegister.data.token);
        setSuccess("Registro con Google exitoso. Redirigiendo...");

        // Esperar para asegurar que el token se almacenó correctamente
        setTimeout(() => {
          // Actualizar estado de usuario en AuthContext
          apiService
            .checkAuth()
            .then(() => {
              // Finalizar login manual solo después de que se haya verificado el token
              setManualLoginInProgress(false);
              // Ahora redirigir al usuario
              navigate("/user");
            })
            .catch((err) => {
              console.error("Error verificando auth después de registro con Google:", err);
              setManualLoginInProgress(false);
              navigate("/user");
            });
        }, 1000);
      } else {
        throw new Error("Error al iniciar sesión después del registro");
      }
    } catch (error) {
      console.error("Error en registro con Google:", error);
      setManualLoginInProgress(false); // Finalizar login manual en caso de error

      // Si el usuario canceló el popup, no mostrar error
      if (error.code === "auth/popup-closed-by-user") {
        // No hacer nada
      }
      // Si ya existe una cuenta con el mismo email pero otro método
      else if (error.code === "auth/account-exists-with-different-credential") {
        setLocalError("Ya existe una cuenta con este email. Intenta otro método de inicio de sesión.");
      }
      // Otros errores
      else {
        setLocalError(`Error al registrarse con Google: ${error.message || "Error desconocido"}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="form-container">
          <div className="logo-container">
            <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
            <h2>Únete a la aventura</h2>
            <p className="subtitle">¡Crea tu cuenta de entrenador!</p>
          </div>

          {!verificationSent ? (
            <>
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label htmlFor="username">Nombre de usuario</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Tu nombre de entrenador"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                    disabled={isLoading || googleLoading}
                  />
                  <small className="input-help">Mínimo 3 caracteres, solo letras, números y guiones bajos</small>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="trainer@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isLoading || googleLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading || googleLoading}
                  />

                  <div className="password-requirements">
                    <p>La contraseña debe tener:</p>
                    <ul>
                      <li className={passwordErrors.length ? "valid" : "invalid"}>Al menos 8 caracteres</li>
                      <li className={passwordErrors.uppercase ? "valid" : "invalid"}>Al menos una letra mayúscula</li>
                      <li className={passwordErrors.lowercase ? "valid" : "invalid"}>Al menos una letra minúscula</li>
                      <li className={passwordErrors.number ? "valid" : "invalid"}>Al menos un número</li>
                      <li className={passwordErrors.symbol ? "valid" : "invalid"}>
                        Al menos un símbolo especial (!@#$%^&*...)
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  type="submit"
                  className="register-button"
                  disabled={isLoading || googleLoading || !Object.values(passwordErrors).every((v) => v)}
                >
                  {isLoading ? "Registrando..." : "Crear cuenta"}
                </button>
              </form>

              {/* Separador entre métodos de registro */}
              <div className="register-separator">
                <span>O</span>
              </div>

              {/* Botón de registro con Google */}
              <div className="google-register-container">
                <GoogleButton
                  onClick={handleGoogleRegister}
                  disabled={isLoading || googleLoading}
                  label={googleLoading ? "Procesando..." : "Registrarse con Google"}
                  type="light"
                />
              </div>
            </>
          ) : (
            <div className="verification-message">
              <div className="verification-icon">✉️</div>
              <h4>¡Gracias por registrarte!</h4>
              <p>
                Te hemos enviado un correo de verificación a <strong>{email}</strong>
              </p>
              <p>Por favor, verifica tu correo antes de iniciar sesión.</p>
              <p className="verification-note">
                Si no encuentras el correo, revisa tu carpeta de spam. El correo puede tardar unos minutos en llegar.
              </p>
              <button onClick={() => navigate("/auth/login")} className="goto-login-button">
                Ir a Login
              </button>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}
          {success && !verificationSent && <p className="success-message">{success}</p>}

          <div className="login-link">
            ¿Ya tienes una cuenta? <Link to="/auth/login">Inicia sesión</Link>
          </div>
        </div>
      </div>

      <div className="background-container">
        {/* Overlay con animación de imágenes */}
        <div className="overlay">
          <div className="animated-overlay">
            <img
              src={animationFrames[currentFrame]}
              alt="Pokémon Animation"
              className="animation-frame"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
        <div className="background-text">
          <h3>¡Conviértete en un maestro!</h3>
          <p>Únete a miles de entrenadores y demuestra que tienes lo necesario para ser el mejor de todos.</p>
        </div>
      </div>
    </div>
  );
}

export default Register;
