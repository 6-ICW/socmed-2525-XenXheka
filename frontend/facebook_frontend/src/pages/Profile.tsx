import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // zorgt ervoor dat wnr je switcht tussen pages je nie heel de pag laat herladen.

// Structuur van de profieldata die de backend teruggeeft
interface ProfileData {
  username: string;
  email: string;
  bio: string;
  profile_pic: string | null; // null als er geen foto is geüpload
}

function Profile() {
  // Gebruikersnaam uit de URL halen (bv. /profile/jan)
  const { username } = useParams<{ username: string }>();
  const [friends, setFriends] = useState<string[]>([]);
  const navigate = useNavigate();

  // Controleren of de bezoeker zijn eigen profiel bekijkt
  const currentUser = localStorage.getItem("username");
  const isOwnProfile = currentUser === username;

  // Vriendschapsstatus: "none" | "pending" | "friends"
  const [friendStatus, setFriendStatus] = useState<string>("");
  const [friendRequests, setFriendRequests] = useState<any[]>([]); // anu wegens alle soort namen te kunnen mee vrtienden zijn

  // Profieldata en bewerkingsstate
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bio, setBio] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // Lokale preview vóór opslaan
  const [editing, setEditing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Profieldata ophalen van de backend
  const fetchProfile = async (): Promise<void> => {
    const response = await fetch(
      `http://localhost:8000/api/accounts/profile/${username}/`,
      { credentials: "include" },
    );
    const data = await response.json();
    setProfile(data);
    setBio(data.bio); // Bio apart bijhouden zodat het bewerkbaar is
  };

  // Huidige vriendschapsstatus ophalen tussen ingelogde gebruiker en dit profiel
  const fetchFriendStatus = async (): Promise<void> => {
    const response = await fetch(
      `http://localhost:8000/api/friends/status/${username}/`,
      { credentials: "include" },
    );
    const data = await response.json();
    setFriendStatus(data.status);
    console.log("friend status:", data);
  };

  // Inkomende vriendschapsverzoeken ophalen (alleen voor eigen profiel)
  const fetchFriendRequests = async (): Promise<void> => {
    const response = await fetch(
      "http://localhost:8000/api/friends/requests/",
      { credentials: "include" },
    );
    const data = await response.json();
    setFriendRequests(data);
    console.log(data);
  };

  // Vriendenlijst van dit profiel ophalen
  const fetchFriends = async (): Promise<void> => {
    const response = await fetch(
      `http://localhost:8000/api/friends/list/${username}/`,
      { credentials: "include" },
    );
    const data = await response.json();
    console.log("vrienden:", data);
    setFriends(data);
  };

  // Alle data laden zodra de pagina opent of de username in de URL verandert
  useEffect(() => {
    fetchProfile();
    fetchFriendStatus();
    fetchFriends();
    if (isOwnProfile) fetchFriendRequests(); // Verzoeken alleen laden voor eigen profiel
  }, [username]);

  // Gekozen afbeelding instellen en een lokale preview aanmaken
  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file)); // Tijdelijke URL voor directe preview
    }
  };

  // Gewijzigd profiel (bio + foto) opslaan via multipart/form-data
  const handleSave = async (): Promise<void> => {
    const formData = new FormData();
    formData.append("bio", bio);

    if (profilePic) formData.append("profile_pic", profilePic); // Alleen meesturen als er een nieuwe foto is

    const response = await fetch(
      "http://localhost:8000/api/accounts/update-profile/",
      { method: "POST", credentials: "include", body: formData },
    );
    const response2 = await fetch(
      "http://localhost:8000/api/accounts/update_email/",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );

    if (response.ok && response2.ok) {
      setMessage("Profiel opgeslagen!");
      setEditing(false);
      fetchProfile(); // Profiel herladen met de nieuwe data
    }
  };

  // Vriendschapsverzoek sturen en status direct optimistisch updaten
  const sendFriendRequest = async (): Promise<void> => {
    const response = await fetch(
      `http://localhost:8000/api/friends/send/${username}/`,
      { method: "POST", credentials: "include" },
    );
    if (response.ok) setFriendStatus("pending"); // Knop direct uitschakelen
  };

  // Vriendschapsverzoek accepteren of weigeren
  const handleFriendRequest = async (
    requestId: number,
    action: string, // "accept" of "reject"
  ): Promise<void> => {
    const response = await fetch(
      `http://localhost:8000/api/friends/handle/${requestId}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      },
    );
    if (response.ok) {
      fetchFriendRequests(); // Lijst herladen zonder het behandelde verzoek
      fetchFriendStatus(); // Status bijwerken (bv. "friends" na accepteren)
    }
  };

  // Laadscherm tonen zolang de profieldata nog niet beschikbaar is
  if (!profile)
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Laden...</p>;

  return (
    <div style={styles.container}>
      {/* Navigatiebalk met terugknop */}
      <div style={styles.navbar}>
        <h2 style={styles.logo} onClick={() => navigate("/home")}>
          facebook
        </h2>
        <button style={styles.btn} onClick={() => navigate("/home")}>
          ← Terug
        </button>
      </div>

      <div style={styles.profileBox}>
        {/* Profielfoto of initiaal als fallback */}
        <div style={styles.picWrapper}>
          {preview || profile.profile_pic ? (
            <img
              src={preview || profile.profile_pic!}
              alt="profiel"
              style={styles.profilePic}
            />
          ) : (
            // Geen foto → eerste letter van de gebruikersnaam tonen
            <div style={styles.avatarBig}>
              {profile.username[0].toUpperCase()}
            </div>
          )}
          {/* Bestandskiezer alleen zichtbaar tijdens bewerken van eigen profiel */}
          {isOwnProfile && editing && (
            <input
              type="file"
              accept="image/*"
              onChange={handlePicChange}
              style={{ marginTop: "0.5rem" }}
            />
          )}
        </div>

        <h2 style={{ margin: "0.5rem 0" }}>{profile.username}</h2>
        <p style={{ color: "#888", margin: 0 }}>{profile.email}</p>

        {/* Bio: bewerkbaar tekstvak in bewerkmodus, anders gewone tekst */}
        {editing ? (
          <>
            <textarea
              style={styles.bioInput}
              value={bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBio(e.target.value)
              }
              placeholder="Schrijf iets over jezelf..."
            />
            <input
              style={styles.Input}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="Geef nieuwe email"
            />

            <button style={styles.btn} onClick={handleSave}>
              Opslaan
            </button>
          </>
        ) : (
          <>
            <p style={styles.bio}>{profile.bio || "Geen bio yet."}</p>
            {/* Bewerkknop alleen zichtbaar op eigen profiel */}
            {isOwnProfile && (
              <button style={styles.btn} onClick={() => setEditing(true)}>
                Profiel bewerken
              </button>
            )}
          </>
        )}

        {/* Vriendschapsknop — uiterlijk afhankelijk van huidige status */}
        {!isOwnProfile && friendStatus === "none" && (
          <button style={styles.btn} onClick={sendFriendRequest}>
            ➕ Vriendschapsverzoek sturen
          </button>
        )}
        {!isOwnProfile && friendStatus === "pending" && (
          // Uitgeschakeld: verzoek is al verstuurd
          <button style={{ ...styles.btn, backgroundColor: "#888" }} disabled>
            ⏳ Verzoek verstuurd
          </button>
        )}
        {!isOwnProfile && friendStatus === "friends" && (
          // Uitgeschakeld: al vrienden
          <button
            style={{ ...styles.btn, backgroundColor: "#42b72a" }}
            disabled
          >
            ✅ Vrienden
          </button>
        )}

        {/* Inkomende vriendschapsverzoeken — alleen zichtbaar op eigen profiel */}
        {isOwnProfile && friendRequests.length > 0 && (
          <div style={{ width: "100%", marginTop: "1rem" }}>
            <h3 style={{ textAlign: "center" }}>Vriendschapsverzoeken</h3>
            {friendRequests.map((req) => (
              <div key={req.id} style={styles.requestBox}>
                <b>{req.from_user}</b> wil bevriend zijn
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <button
                    style={styles.acceptBtn}
                    onClick={() => handleFriendRequest(req.id, "accept")}
                  >
                    ✅ Accepteren
                  </button>
                  <button
                    style={styles.rejectBtn}
                    onClick={() => handleFriendRequest(req.id, "reject")}
                  >
                    ❌ Weigeren
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bevestigingsbericht na opslaan */}
        {message && <p style={{ color: "green" }}>{message}</p>}
      </div>

      {/* Vriendenlijst als klikbare chips onderaan het profiel */}
      {friends.length > 0 && (
        <div style={{ width: "100%", marginTop: "1rem" }}>
          <h3 style={{ textAlign: "center" }}>Vrienden ({friends.length})</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            {friends.map((friend) => (
              <div
                key={friend}
                style={styles.friendChip}
                onClick={() => navigate(`/profile/${friend}`)}
              >
                {friend}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stijlen als object — gescheiden van de logica
const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: "#f0f2f5", minHeight: "100vh" },
  navbar: {
    backgroundColor: "white",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  logo: {
    color: "#1877f2",
    fontFamily: "Georgia, serif",
    margin: 0,
    cursor: "pointer", // Klikbaar om naar de feed te gaan
  },
  profileBox: {
    maxWidth: "600px",
    margin: "2rem auto",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  picWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  profilePic: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover", // Foto bijsnijden zonder vervorming
    border: "3px solid #1877f2",
  },
  avatarBig: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    backgroundColor: "#1877f2",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    fontWeight: "bold",
  },
  bio: { color: "#444", textAlign: "center" },
  bioInput: {
    width: "100%",
    minHeight: "80px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.75rem",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  btn: {
    padding: "0.5rem 1.5rem",
    backgroundColor: "#1877f2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  requestBox: {
    backgroundColor: "#f0f2f5",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "0.5rem",
    width: "100%",
    boxSizing: "border-box",
  },
  acceptBtn: {
    padding: "0.4rem 1rem",
    backgroundColor: "#42b72a", // Groen voor accepteren
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  rejectBtn: {
    padding: "0.4rem 1rem",
    backgroundColor: "#fa3e3e", // Rood voor weigeren
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  friendChip: {
    backgroundColor: "#e7f3ff",
    color: "#1877f2",
    padding: "0.4rem 1rem",
    borderRadius: "20px", // Pilvorm voor de chip
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Profile;
