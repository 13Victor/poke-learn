import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase.config";

function Register() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });

  const navigate = useNavigate();

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
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validación de contraseña
    const allValid = Object.values(passwordErrors).every((valid) => valid);
    if (!allValid) {
      setError("La contraseña no cumple con todos los requisitos de seguridad");
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

      // 3. Registrar en tu base de datos
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          email,
          password,
          firebase_uid: user.uid, // Guarda el UID de Firebase
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en el registro del servidor");
      }

      setSuccess("Registro exitoso. Por favor verifica tu correo electrónico");
    } catch (error) {
      console.error("Error en registro:", error);

      // Manejo de errores específicos de Firebase
      if (error.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado");
      } else if (error.code === "auth/invalid-email") {
        setError("Formato de correo inválido");
      } else if (error.code === "auth/weak-password") {
        setError("La contraseña es demasiado débil");
      } else if (error.code === "auth/network-request-failed") {
        setError("Error de conexión. Verifica tu internet");
      } else if (error.message && error.message.includes("fetch")) {
        setError("Error al conectar con el servidor");
      } else {
        setError(error.message || "Error desconocido en el registro");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="register-container">
        <h3>Regístrate</h3>
        {!verificationSent ? (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="username">Nombre de usuario</label>
              <input
                id="username"
                type="text"
                placeholder="Nombre de usuario"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                disabled={isLoading}
              />
              <small>Mínimo 3 caracteres, solo letras, números y guiones bajos</small>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
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
              disabled={isLoading || !Object.values(passwordErrors).every((v) => v)}
            >
              {isLoading ? "Registrando..." : "Registrarse"}
            </button>
          </form>
        ) : (
          <div className="verification-message">
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
        {success && <p className="success-message">{success}</p>}
      </div>
      <div className="login-link">
        ¿Ya tienes una cuenta? <Link to="/auth/login">Inicia sesión</Link>
      </div>
    </>
  );
}

export default Register;
