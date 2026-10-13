import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedGame, setSelectedGame] = useState("All Games");
    const [loading, setLoading] = useState(true);
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

                setTournaments(
                    Array.isArray(response.data) ? response.data : []
                );
            } catch (err) {
                console.error("Failed to load tournaments:", err);
                setError(
                    "Unable to load tournaments. Please try again later."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, []);

    const games = useMemo(
        () => [
            "All Games",
            ...new Set(
                tournaments
                    .map((tournament) => tournament.game)
                    .filter(Boolean)
            )
        ],
        [tournaments]
    );

    const filteredTournaments = useMemo(() => {
        return tournaments.filter((tournament) => {
            const matchesSearch = [
                tournament.name,
                tournament.game
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(search.toLowerCase())
            );

            const matchesGame =
                selectedGame === "All Games" ||
                tournament.game === selectedGame;

            return matchesSearch && matchesGame;
        });
    }, [tournaments, search, selectedGame]);

    const getAvailability = (tournament) => {
        const maximum = Number(tournament.maxTeams) || 0;
        const registered = Number(tournament.registeredTeams) || 0;
        const remaining = Math.max(0, maximum - registered);

        if (tournament.status !== "Open") {
            return {
                label: tournament.status || "Closed",
                available: false,
                remaining
            };
        }

        return {
            label: remaining > 0 ? "Registration Open" : "Full",
            available: remaining > 0,
            remaining
        };
    };

    return (
        <main className="container tournaments-page">
            
        <section
        className="catalogue-hero"
        style={{
            backgroundImage: "url('/images/browse.png')"
        }}
        >
        <div className="catalogue-hero-content">
            <p className="hero-eyebrow">FIND YOUR NEXT CHALLENGE</p>
            <h1>Explore Tournaments</h1>
            <p>
            Discover competitions, find your game, and get your team
            ready for the arena.
            </p>
        </div>
        </section>


            <section className="tournament-filters">
                <input
                    type="search"
                    aria-label="Search tournaments"
                    placeholder="Search tournaments or games..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    aria-label="Filter by game"
                    value={selectedGame}
                    onChange={(event) => setSelectedGame(event.target.value)}
                >
                    {games.map((game) => (
                        <option key={game} value={game}>
                            {game}
                        </option>
                    ))}
                </select>
            </section>

            {loading && (
                <p role="status">Loading tournaments...</p>
            )}

            {error && (
                <p role="alert">{error}</p>
            )}

            {!loading && !error && (
                <>
                    <div className="catalogue-summary">
                        <span>
                            {filteredTournaments.length} tournament
                            {filteredTournaments.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    {filteredTournaments.length > 0 ? (
                        <section className="tournament-list">
                            {filteredTournaments.map((tournament) => {
                                const availability =
                                    getAvailability(tournament);

                                const maximum =
                                    Number(tournament.maxTeams) || 0;

                                const registered =
                                    Number(tournament.registeredTeams) || 0;

                                const capacityPercentage =
                                    maximum > 0
                                        ? Math.min(
                                              100,
                                              (registered / maximum) * 100
                                          )
                                        : 0;

                                return (
                                    <article
                                        className="tournament-card"
                                        key={tournament._id}
                                    >
                                        <div className="tournament-card-top">
                                            <span className="game-label">
                                                {tournament.game}
                                            </span>

                                            <span
                                                className={
                                                    availability.available
                                                        ? "availability-badge open"
                                                        : "availability-badge closed"
                                                }
                                            >
                                                {availability.label}
                                            </span>
                                        </div>

                                        <h2>{tournament.name}</h2>

                                        <div className="tournament-stats">
                                            <div>
                                                <span>TEAM CAPACITY</span>
                                                <strong>{maximum}</strong>
                                            </div>

                                            <div>
                                                <span>REGISTERED</span>
                                                <strong>{registered}</strong>
                                            </div>

                                            <div>
                                                <span>SPOTS LEFT</span>
                                                <strong>
                                                    {availability.remaining}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="capacity-track">
                                            <div
                                                className="capacity-fill"
                                                style={{
                                                    width: `${capacityPercentage}%`
                                                }}
                                            />
                                        </div>

                                        {availability.available ? (
                                            <NavLink
                                                to="/register"
                                                state={{
                                                    tournamentId: tournament._id
                                                }}
                                                className="primary-button join-button"
                                            >
                                                Join Tournament
                                            </NavLink>
                                        ) : (
                                            <button
                                                type="button"
                                                className="primary-button join-button"
                                                disabled
                                            >
                                                Registration Unavailable
                                            </button>
                                        )}
                                    </article>
                                );
                            })}
                        </section>
                    ) : (
                        <div className="empty-state">
                            <h2>No tournaments found</h2>
                            <p>
                                Try another search term or select a different
                                game.
                            </p>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default Tournaments;