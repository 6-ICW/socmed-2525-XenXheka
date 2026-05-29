import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";

function App() {
  return (
    // BrowserRouter zorgt voor client-side navigatie zonder pagina te herladen
    <BrowserRouter>
      {/* Routes bekijkt de huidige URL en rendert de bijpassende pagina */}
      <Routes>
        {/* Startpagina toont de loginpagina */}
        <Route path="/" element={<Login />} />

        {/* Registratiepagina voor nieuwe gebruikers */}
        <Route path="/register" element={<Register />} />

        {/* Hoofdfeed na het inloggen */}
        <Route path="/home" element={<Home />} />

        {/* Profielpagina — :username is een dynamische parameter uit de URL */}
        <Route path="/profile/:username" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
