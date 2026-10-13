import {
    NavLink,
    Routes,
    Route,
    Navigate,
    useLocation
} from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Tournaments from "./Tournaments";
import Scoreboard from "./Scoreboard";
import Timetable from "./Timetable";
import "./App.css";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function Home() {
    const [tournaments, setTournaments] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                if (!API_BASE_URL) {
                    throw new Error("VITE_API_URL is not configured.");
                }

                const [tournamentResponse, matchResponse] =
                    await Promise.all([
                        axios.get(`${API_BASE_URL}/api/tournaments`),
                        axios.get(`${API_BASE_URL}/api/matches`)
                    ]);

                setTournaments(
                    Array.isArray(tournamentResponse.data)
                        ? tournamentResponse.data
                        : []
                );

                setMatches(
                    Array.isArray(matchResponse.data)
                        ? matchResponse.data
                        : []
                );
            } catch (err) {
                console.error("Failed to load home page data:", err);
                setTournaments([]);
                setMatches([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    const featuredTournaments = tournaments
        .filter((tournament) => {
            const remaining =
                Number(tournament.maxTeams || 0) -
                Number(tournament.registeredTeams || 0);

            return tournament.status === "Open" && remaining > 0;
        })
        .slice(0, 3);

    const upcomingMatches = matches
        .filter((match) => {
            return (
                (match.status || "Upcoming") === "Upcoming" &&
                new Date(match.matchDate).getTime() >= Date.now()
            );
        })
        .sort(
            (a, b) =>
                new Date(a.matchDate).getTime() -
                new Date(b.matchDate).getTime()
        )
        .slice(0, 3);

    return (
        <main className="home-page">
            <section className="home-hero">
                <span className="hero-tag">WELCOME TO MATCHMATE</span>

                <h1>
                    ENTER THE ARENA.
                    <br />
                    <span>MAKE YOUR MARK.</span>
                </h1>

                <p>
                    Discover esports tournaments, bring your team together,
                    and follow your journey from registration to the leaderboard.
                </p>

                <div className="home-hero-actions">
                    <NavLink to="/tournaments" className="primary-button">
                        Explore Tournaments
                    </NavLink>

                    <NavLink to="/register" className="secondary-button">
                        Join the Competition
                    </NavLink>
                </div>
            </section>

            <section className="home-section">
                <div className="home-section-heading">
                    <div>
                        <span className="hero-tag">FIND YOUR CHALLENGE</span>
                        <h2>Featured Tournaments</h2>
                    </div>

                    <NavLink to="/tournaments">View All →</NavLink>
                </div>

                {loading ? (
                    <p role="status">Loading tournaments...</p>
                ) : featuredTournaments.length > 0 ? (
                    <div className="home-card-grid">
                        {featuredTournaments.map((tournament) => (
                            <article
                                className="home-feature-card"
                                key={tournament._id}
                            >
                                <span className="home-card-game">
                                    {tournament.game}
                                </span>

                                <h3>{tournament.name}</h3>

                                <p>
                                    {Math.max(
                                        0,
                                        Number(tournament.maxTeams || 0) -
                                        Number(tournament.registeredTeams || 0)
                                    )}{" "}
                                    team spots remaining
                                </p>

                                <NavLink
                                    to="/register"
                                    state={{
                                        tournamentId: tournament._id
                                    }}
                                    className="primary-button"
                                >
                                    Join Tournament
                                </NavLink>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p>
                        No open tournaments are available right now. Check the
                        tournament catalogue again soon.
                    </p>
                )}
            </section>

            <section className="home-section">
                <div className="home-section-heading">
                    <div>
                        <span className="hero-tag">STAY IN THE GAME</span>
                        <h2>Upcoming Matches</h2>
                    </div>

                    <NavLink to="/timetable">Full Schedule →</NavLink>
                </div>

                {loading ? (
                    <p role="status">Loading match schedule...</p>
                ) : upcomingMatches.length > 0 ? (
                    <div className="home-card-grid">
                        {upcomingMatches.map((match) => (
                            <article
                                className="home-feature-card"
                                key={match._id}
                            >
                                <span className="home-card-game">
                                    {match.game}
                                </span>

                                <h3>{match.tournament}</h3>

                                <div className="home-match-versus">
                                    <strong>{match.teamA}</strong>
                                    <span>VS</span>
                                    <strong>{match.teamB}</strong>
                                </div>

                                <p>
                                    {new Date(match.matchDate).toLocaleString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }
                                    )}
                                </p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p>
                        No upcoming matches are scheduled yet. Visit the
                        schedule page for updates.
                    </p>
                )}
            </section>

            <section className="home-bottom-cta">
                <h2>Your Team. Your Game. Your Moment.</h2>
                <p>
                    Find your next competition and start your MatchMate journey.
                </p>
                <NavLink to="/tournaments" className="primary-button">
                    Find a Tournament
                </NavLink>
            </section>
        </main>
    );
}

function About() {
    return (
        <div className="container">
            <h1>About MatchMate</h1>

            <p>
                MatchMate is an esports tournament platform where players can
                explore competitions, register tournaments, view team scores,
                and check upcoming matches.
            </p>
        </div>
    );
}

function Register() {
    const location = useLocation();
    const selectedTournamentId = location.state?.tournamentId || "";

    const [tournaments, setTournaments] = useState([]);
    const [selectedId, setSelectedId] = useState(selectedTournamentId);
    const [playerName, setPlayerName] = useState("");
    const [email, setEmail] = useState("");
    const [teamName, setTeamName] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                if (!API_BASE_URL) {
                    throw new Error("VITE_API_URL is not configured.");
                }

                const response = await axios.get(
                    `${API_BASE_URL}/api/tournaments`
                );

                const data = Array.isArray(response.data)
                    ? response.data
                    : [];

                setTournaments(data);

                if (
                    selectedTournamentId &&
                    !data.some(
                        (tournament) =>
                            tournament._id === selectedTournamentId
                    )
                ) {
                    setSelectedId("");
                }
            } catch (err) {
                console.error(
                    "Failed to load registration tournaments:",
                    err
                );

                setError(
                    "Unable to load tournaments. Please try again later."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, [selectedTournamentId]);

    const availableTournaments = tournaments.filter((tournament) => {
        const remaining =
            Number(tournament.maxTeams || 0) -
            Number(tournament.registeredTeams || 0);

        return tournament.status === "Open" && remaining > 0;
    });

    const selectedTournament = availableTournaments.find(
        (tournament) => tournament._id === selectedId
    );

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!API_BASE_URL) {
            setError(
                "The API URL is not configured. Please try again later."
            );
            return;
        }

        if (!selectedTournament) {
            setError("Please select an available tournament.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/registrations`,
                {
                    playerName,
                    email,
                    teamName,
                    tournamentId: selectedId
                }
            );

            setMessage(
                response.data?.message || "Registration successful!"
            );

            setPlayerName("");
            setEmail("");
            setTeamName("");

            const updated = await axios.get(
                `${API_BASE_URL}/api/tournaments`
            );

            setTournaments(
                Array.isArray(updated.data) ? updated.data : []
            );
        } catch (err) {
            console.error(
                "Registration or tournament refresh failed:",
                err
            );

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container client-register-page">
            <section
                className="register-hero"
                style={{
                    backgroundImage: "url('/images/join.png')"
                }}
            >
                <div className="register-hero-content">
                    <span className="hero-tag">
                        YOUR NEXT MATCH STARTS HERE
                    </span>

                    <h1>Join the Competition</h1>

                    <p>
                        Choose your tournament, register your team, and get
                        ready to compete in the MatchMate arena.
                    </p>
                </div>
            </section>

            <section className="register-panel">
                <div className="register-panel-heading">
                    <h2>Player Registration</h2>
                    <p>Complete your details to reserve a team spot.</p>
                </div>

                {loading ? (
                    <p role="status">Loading available tournaments...</p>
                ) : (
                    <form
                        className="registration-form client-registration-form"
                        onSubmit={handleSubmit}
                    >
                        <label htmlFor="playerName">Player Name</label>
                        <input
                            id="playerName"
                            name="playerName"
                            value={playerName}
                            onChange={(event) =>
                                setPlayerName(event.target.value)
                            }
                            placeholder="Enter your full name"
                            autoComplete="name"
                            maxLength={100}
                            required
                        />

                        <label htmlFor="playerEmail">Email Address</label>
                        <input
                            id="playerEmail"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="you@example.com"
                            autoComplete="email"
                            maxLength={254}
                            required
                        />

                        <label htmlFor="teamName">Team Name</label>
                        <input
                            id="teamName"
                            name="teamName"
                            value={teamName}
                            onChange={(event) =>
                                setTeamName(event.target.value)
                            }
                            placeholder="Enter your team name"
                            maxLength={100}
                            required
                        />

                        <label htmlFor="tournamentId">
                            Select Tournament
                        </label>

                        <select
                            id="tournamentId"
                            value={selectedId}
                            onChange={(event) =>
                                setSelectedId(event.target.value)
                            }
                            required
                        >
                            <option value="">
                                Choose a tournament
                            </option>

                            {availableTournaments.map((tournament) => (
                                <option
                                    key={tournament._id}
                                    value={tournament._id}
                                >
                                    {tournament.name} — {tournament.game}
                                </option>
                            ))}
                        </select>

                        {selectedTournament && (
                            <div className="selected-tournament-info">
                                <span>YOUR SELECTED TOURNAMENT</span>
                                <h3>{selectedTournament.name}</h3>
                                <p>Game: {selectedTournament.game}</p>
                                <p>
                                    Remaining spots:{" "}
                                    {Math.max(
                                        0,
                                        Number(selectedTournament.maxTeams) -
                                        Number(
                                            selectedTournament.registeredTeams
                                        )
                                    )}
                                </p>
                            </div>
                        )}

                        {availableTournaments.length === 0 && (
                            <p>
                                No tournaments are currently open for
                                registration.
                            </p>
                        )}

                        <button
                            className="primary-button"
                            type="submit"
                            disabled={
                                submitting ||
                                availableTournaments.length === 0
                            }
                        >
                            {submitting
                                ? "Submitting..."
                                : "Confirm Registration"}
                        </button>

                        {message && (
                            <p className="success-message" role="status">
                                {message}
                            </p>
                        )}

                        {error && (
                            <p className="error-message" role="alert">
                                {error}
                            </p>
                        )}
                    </form>
                )}
            </section>
        </div>
    );
}

function App() {
    return (
        <>
            <header className="site-header">
                <NavLink to="/" className="brand">
                    MATCHMATE
                </NavLink>

                <nav className="main-nav">
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/tournaments">
                        Browse Tournaments
                    </NavLink>
                    <NavLink to="/register">Join Tournament</NavLink>
                    <NavLink to="/scoreboard">Leaderboard</NavLink>
                    <NavLink to="/timetable">Match Schedule</NavLink>
                    <NavLink to="/about">About</NavLink>
                </nav>
            </header>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/tournaments"
                    element={<Tournaments />}
                />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/scoreboard"
                    element={<Scoreboard />}
                />
                <Route
                    path="/timetable"
                    element={<Timetable />}
                />
                <Route path="/about" element={<About />} />
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </>
    );
}

export default App;