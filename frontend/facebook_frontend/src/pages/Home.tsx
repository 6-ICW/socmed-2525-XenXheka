import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Type voor een post uit de feed
interface Post {
  id: number;
  username: string;
  content: string;
  created_at: string;
  likes: number;
  liked_by_me: boolean; // Of de ingelogde gebruiker al geliked heeft
}

// Type voor een comment onder een post
interface Comment {
  id: number;
  username: string;
  content: string;
  created_at: string;
}

function Home() {
  const navigate = useNavigate();

  // Gebruikersnaam ophalen uit localStorage (ingesteld bij login)
  const username: string | null = localStorage.getItem("username");

  // State voor de lijst van posts, nieuwe post tekst en foutmelding
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Comments worden bijgehouden per post-id als sleutel
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});

  // Bijhouden welke comment-secties open zijn (per post-id)
  const [openComments, setOpenComments] = useState<{ [key: number]: boolean }>(
    {},
  );

  // Bijhouden wat de gebruiker typt in het commentaarinvoerveld (per post-id)
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});

  // State voor de zoekbalk en de zoekresultaten
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Alle posts ophalen van de backend
  const fetchPosts = async (): Promise<void> => {
    const response = await fetch("http://localhost:8000/api/posts/", {
      credentials: "include", // Stuur cookies mee voor authenticatie
    });
    const data = await response.json();
    setPosts([...data]);
  };

  // Posts laden zodra de pagina wordt geopend
  useEffect(() => {
    fetchPosts();
  }, []);

  // Nieuwe post versturen naar de backend
  const handlePost = async (): Promise<void> => {
    if (!newPost.trim()) return; // Lege posts weigeren

    const response = await fetch("http://localhost:8000/api/posts/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newPost }),
    });

    if (response.ok) {
      setNewPost(""); // Invoerveld leegmaken
      setError(""); // Eventuele foutmelding wissen
      fetchPosts(); // Feed herladen met de nieuwe post
    } else {
      setError("Post mislukt, ben je ingelogd?");
    }
  };

  // Like of unlike een post; update de teller direct in de UI
  const handleLike = async (postId: number): Promise<void> => {
    const response = await fetch(
      `http://localhost:8000/api/posts/${postId}/like/`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (response.ok) {
      const data = await response.json();
      // Alleen de gelikte post updaten, de rest ongemoeid laten
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: data.likes, liked_by_me: data.liked }
            : post,
        ),
      );
    }
  };

  // Comments voor een specifieke post ophalen
  const fetchComments = async (postId: number): Promise<void> => {
    const response = await fetch(
      `http://localhost:8000/api/posts/${postId}/comments/`,
      {
        credentials: "include",
      },
    );
    const data = await response.json();
    // Sla de comments op onder de bijbehorende post-id
    setComments((prev) => ({ ...prev, [postId]: data }));
  };

  // Comment-sectie in- of uitklappen en comments laden indien nodig
  const toggleComments = (postId: number): void => {
    const isOpen = openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen) fetchComments(postId); // Alleen laden als we openen
  };

  // Nieuw comment insturen voor een bepaalde post
  const handleComment = async (postId: number): Promise<void> => {
    const content = newComment[postId];
    if (!content?.trim()) return; // Lege comments weigeren

    const response = await fetch(
      `http://localhost:8000/api/posts/${postId}/comments/create/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      },
    );

    if (response.ok) {
      setNewComment((prev) => ({ ...prev, [postId]: "" })); // Invoer wissen
      fetchComments(postId); // Comments herladen
    }
  };

  // Gebruiker uitloggen en terugsturen naar de loginpagina
  const handleLogout = async (): Promise<void> => {
    await fetch("http://localhost:8000/api/accounts/logout/", {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("username"); // Lokale sessie wissen
    navigate("/");
  };

  // Zoeken naar gebruikers terwijl de gebruiker typt (live search)
  const handleSearch = async (query: string): Promise<void> => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]); // Lege zoekopdracht → resultaten verbergen
      return;
    }
    const response = await fetch(
      `http://localhost:8000/api/accounts/search/?q=${query}`,
      {
        credentials: "include",
      },
    );
    const data = await response.json();
    setSearchResults(data);
  };

  return (
    <div style={styles.container}>
      {/* ── Navigatiebalk bovenaan ── */}
      <div style={styles.navbar}>
        <h2 style={styles.logo}>facebook</h2>

        {/* Zoekbalk met live dropdown voor gebruikers */}
        <div style={{ position: "relative" }}>
          <input
            style={styles.searchInput}
            placeholder="🔍 Zoek gebruikers..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleSearch(e.target.value)
            }
          />
          {/* Dropdown verschijnt alleen als er resultaten zijn */}
          {searchResults.length > 0 && (
            <div style={styles.searchDropdown}>
              {searchResults.map((user) => (
                <div
                  key={user.username}
                  style={styles.searchItem}
                  onClick={() => {
                    navigate(`/profile/${user.username}`);
                    // Zoekveld en resultaten sluiten na selectie
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  {/* Profielfoto of initiaal als fallback */}
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt=""
                      style={styles.searchAvatar}
                    />
                  ) : (
                    <div style={styles.searchAvatarFallback}>
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  <span>{user.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigatieknoppen rechtsboven */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            style={styles.logoutBtn}
            onClick={() => navigate(`/profile/${username}`)}
          >
            Mijn Profiel
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Uitloggen
          </button>
        </div>
      </div>

      {/* ── Hoofdfeed ── */}
      <div style={styles.feed}>
        {/* Vak om een nieuwe post aan te maken */}
        <div style={styles.card}>
          <textarea
            style={styles.textarea}
            placeholder={`Waar denk je aan, ${username}?`}
            value={newPost}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNewPost(e.target.value)
            }
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.postBtn} onClick={handlePost}>
            Posten
          </button>
        </div>

        {/* Alle posts één voor één renderen */}
        {posts.map((post, index) => (
          <div key={post.id} style={styles.card}>
            {/* Postkaart header: avatar + gebruikersnaam + datum */}
            <div style={styles.postHeader}>
              <div style={styles.avatar}>{post.username[0].toUpperCase()}</div>
              <div>
                <b
                  style={{ cursor: "pointer", color: "#1877f2" }}
                  onClick={() => navigate(`/profile/${post.username}`)}
                >
                  {post.username}
                </b>
                <p style={styles.date}>{post.created_at}</p>
              </div>
            </div>

            <p style={styles.postContent}>{post.content}</p>
            <hr style={{ border: "none", borderTop: "1px solid #eee" }} />

            {/* Like- en commentaarknop */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => handleLike(post.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  // Blauw als al geliked, grijs anders
                  color: post.liked_by_me ? "#1877f2" : "#888",
                  fontWeight: post.liked_by_me ? "bold" : "normal",
                  fontSize: "1rem",
                  padding: "0.25rem 0",
                }}
              >
                👍 {post.likes} {post.likes === 1 ? "Like" : "Likes"}
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                  fontSize: "1rem",
                  padding: "0.25rem 0",
                }}
              >
                {/* Label wisselt naargelang de sectie open of dicht is */}
                💬 {openComments[post.id] ? "Verberg" : "Comments"}
              </button>
            </div>

            {/* Commentaarsectie (alleen zichtbaar als open) */}
            {openComments[post.id] && (
              <div style={{ marginTop: "1rem" }}>
                {/* Bestaande comments weergeven */}
                {(comments[post.id] || []).map((comment) => (
                  <div key={comment.id} style={styles.comment}>
                    <b
                      style={{ cursor: "pointer", color: "#1877f2" }}
                      onClick={() => navigate(`/profile/${comment.username}`)}
                    >
                      {comment.username}
                    </b>
                    <span
                      style={{
                        color: "#888",
                        fontSize: "0.75rem",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {comment.created_at}
                    </span>
                    <p style={{ margin: "0.25rem 0 0 0" }}>{comment.content}</p>
                  </div>
                ))}

                {/* Invoerveld voor een nieuw comment */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <input
                    style={styles.commentInput}
                    placeholder="Schrijf een comment..."
                    value={newComment[post.id] || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewComment((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    // Enter-toets werkt als alternatief voor de knop
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleComment(post.id)
                    }
                  />
                  <button
                    style={styles.commentBtn}
                    onClick={() => handleComment(post.id)}
                  >
                    Stuur
                  </button>
                </div>
              </div>
            )}

            {/* Advertentieblok na de 2de post (index 1) */}
            {index === 1 && (
              <div style={styles.adCard}>
                <p style={styles.adLabel}>Gesponsord</p>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>📦 PakketBox Pro</h3>
                <p style={{ margin: 0, color: "#444" }}>
                  Nooit meer een pakket missen! Onze slimme pakketbox staat
                  altijd klaar. Veilig, slim en altijd bereikbaar. Door Xheka
                  industries 🚀
                </p>
                <button
                  style={styles.adBtn}
                  onClick={() =>
                    window.open("https://pakket-viewer.vercel.app", "_blank")
                  }
                >
                  Meer info
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Lege staat: bericht als er nog geen posts zijn */}
        {posts.length === 0 && (
          <div style={styles.card}>
            <p style={{ textAlign: "center", color: "#888" }}>
              Nog geen posts. Wees de eerste!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stijlen als object zodat ze makkelijk herbruikbaar zijn ──
const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: "#f0f2f5", minHeight: "100vh" },
  navbar: {
    backgroundColor: "white",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    position: "sticky", // Balk blijft zichtbaar bij scrollen
    top: 0,
    zIndex: 100,
  },
  logo: { color: "#1877f2", fontFamily: "Georgia, serif", margin: 0 },
  logoutBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#1877f2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  feed: {
    maxWidth: "600px",
    margin: "2rem auto",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "0 1rem",
  },
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.75rem",
    fontSize: "1rem",
    resize: "vertical", // Gebruiker kan hoogte aanpassen
    boxSizing: "border-box",
  },
  postBtn: {
    marginTop: "0.5rem",
    padding: "0.5rem 1.5rem",
    backgroundColor: "#1877f2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    float: "right", // Knop staat rechtsonder in het kaartje
  },
  postHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%", // Ronde avatar
    backgroundColor: "#1877f2",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "1.2rem",
  },
  date: { color: "#888", fontSize: "0.8rem", margin: 0 },
  postContent: { margin: 0, lineHeight: "1.5" },
  error: { color: "red", fontSize: "0.9rem" },
  comment: {
    backgroundColor: "#f0f2f5",
    borderRadius: "6px",
    padding: "0.5rem 0.75rem",
    marginBottom: "0.5rem",
  },
  commentInput: {
    flex: 1, // Neemt beschikbare breedte in naast de knop
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  commentBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#1877f2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  adCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    border: "1px solid #e7f3ff", // Lichtblauwe rand om advertentie te onderscheiden
  },
  adLabel: { color: "#888", fontSize: "0.75rem", margin: "0 0 0.5rem 0" },
  adBtn: {
    marginTop: "0.75rem",
    padding: "0.5rem 1.5rem",
    backgroundColor: "#42b72a", // Groene knop voor call-to-action
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default Home;
