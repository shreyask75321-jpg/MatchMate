import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function Scoreboard() {
    const [scores, setScores] = useState([]);
    const [selectedGame, setSelectedGame] = useState("All Games");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchScores = async () => {
            try {
                if (!API_BASE_URL) {
                    throw new Error("VITE_API_URL is not configured.");
                }

                const response = await axios.get(
                    `${API_BASE_URL}/api/scores`
                );

                setScores(
                    Array.isArray(response.data) ? response.data : []
                );
            } catch (err) {
                console.error("Failed to load leaderboard:", err);
                setError(
                    "Unable to load leaderboard. Please try again later."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, []);

    const games = useMemo(
        () => [
            "All Games",
            ...new Set(
                scores.map((score) => score.game).filter(Boolean)
            )
        ],
        [scores]
    );

    const filteredScores = useMemo(() => {
        return scores
            .filter((score) => {
                const matchesGame =
                    selectedGame === "All Games" ||
                    score.game === selectedGame;

                const matchesSearch = String(score.teamName || "")
                    .toLowerCase()
                    .includes(search.toLowerCase());

                return matchesGame && matchesSearch;
            })
            .sort(
                (a, b) =>
                    Number(b.points || 0) - Number(a.points || 0) ||
                    Number(b.wins || 0) - Number(a.wins || 0)
            );
    }, [scores, selectedGame, search]);

    return (
        <main className="container leaderboard-page">
            <section className="leaderboard-hero">
                <span className="hero-tag">PROVE YOUR PLACE</span>
                <h1>Global Leaderboard</h1>
                <p>
                    Track team performance, compare points, and see who is
                    climbing the MatchMate rankings.
                </p>
            </section>

            <section className="leaderboard-filters">
                <input
                    type="search"
                    placeholder="Search for a team..."
                    aria-label="Search teams"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    aria-label="Filter leaderboard by game"
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

            {loading && <p role="status">Loading leaderboard...</p>}

            {error && <p role="alert">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="leaderboard-summary">
                        <span>{filteredScores.length} teams ranked</span>
                        <span>Ranked by points, then wins</span>
                    </div>

                    {filteredScores.length > 0 ? (
                        <div className="leaderboard-table-wrapper">
                            <table className="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team</th>
                                        <th>Game</th>
                                        <th>Wins</th>
                                        <th>Losses</th>
                                        <th>Points</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredScores.map((score, index) => (
                                        <tr key={score._id}>
                                            <td>
                                                <span
                                                    className={
                                                        index < 3
                                                            ? `rank-badge rank-${index + 1}`
                                                            : "rank-badge"
                                                    }
                                                >
                                                    #{index + 1}
                                                </span>
                                            </td>
                                            <td className="leaderboard-team">
                                                {score.teamName}
                                            </td>
                                            <td>{score.game}</td>
                                            <td>{score.wins || 0}</td>
                                            <td>{score.losses || 0}</td>
                                            <td className="leaderboard-points">
                                                {score.points || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h2>No rankings available</h2>
                            <p>
                                No teams match your search, or scores have not
                                been added yet.
                            </p>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default Scoreboard;