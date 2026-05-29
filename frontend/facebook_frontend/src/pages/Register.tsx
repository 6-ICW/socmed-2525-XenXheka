import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  // State voor de drie invoervelden en een eventuele foutmelding
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  // Registratieverzoek versturen naar de backend
  const handleRegister = async (): Promise<void> => {
    const response = await fetch(
      "http://localhost:8000/api/accounts/register/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Geen credentials: "include" nodig — registreren vereist geen sessie
        body: JSON.stringify({ username, email, password }),
      },
    );

    const data = await response.json();

    if (response.ok) {
      // Gebruiker informeren en doorsturen naar de loginpagina
      alert("Account aangemaakt! Je kan nu inloggen.");
      navigate("/");
    } else {
      setError(data.error); // Foutmelding van de server tonen (bv. gebruikersnaam bestaat al)
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>Registreren</h2>

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

        {/* E-mailadres invoer */}
        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
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

        <button style={styles.button} onClick={handleRegister}>
          Registreren
        </button>

        {/* Link naar de loginpagina voor gebruikers die al een account hebben */}
        <p>
          Al een account? <a href="/">Inloggen</a>
        </p>
      </div>
    </div>
  );
}

// Stijlen als object — identiek aan Login voor een consistente look
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
  title: { textAlign: "center", color: "#1877f2" },
  input: {
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#1877f2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: { color: "red", textAlign: "center" },
};

export default Register;
