import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  // State voor de invoervelden en een eventuele foutmelding
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  // Loginverzoek versturen naar de backend
  const handleLogin = async (): Promise<void> => {
    const response = await fetch("http://localhost:8000/api/accounts/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Cookies meesturen voor sessiebeheer
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Gebruikersnaam opslaan zodat andere pagina's die kunnen gebruiken
      localStorage.setItem("username", data.username);
      navigate("/home"); // Doorsturen naar de feed
    } else {
      setError(data.error); // Foutmelding van de server tonen
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.logo}>facebook</h1>

        {/* Foutmelding alleen tonen als er één is */}
        {error && <p style={styles.error}>{error}</p>}

        {/* Gebruikersnaam invoer */}
        <input
          style={styles.input}
          placeholder="Gebruikersnaam"
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUsername(e.target.value)
          }
        />

        {/* Wachtwoord invoer — type="password" verbergt de tekst */}
        <input
          style={styles.input}
          placeholder="Wachtwoord"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
        />

        <button style={styles.button} onClick={handleLogin}>
          Inloggen
        </button>

        <hr />

        {/* Alternatieve actie: naar de registratiepagina navigeren */}
        <button
          style={styles.buttonGreen}
          onClick={() => navigate("/register")}
        >
          Nieuw account aanmaken
        </button>
      </div>
    </div>
  );
}

// Stijlen als object — herbruikbaar en gescheiden van de logica
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh", // Vult het volledige scherm
    backgroundColor: "#f0f2f5",
  },
  box: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "350px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem", // Gelijke ruimte tussen alle elementen
  },
  logo: {
    textAlign: "center",
    color: "#1877f2",
    fontSize: "2.5rem",
    fontFamily: "Georgia, serif",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#1877f2", // Facebook-blauw voor de primaire actie
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  buttonGreen: {
    padding: "0.75rem",
    backgroundColor: "#42b72a", // Groen voor de secundaire actie
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: { color: "red", textAlign: "center" },
};

export default Login;
