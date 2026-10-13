import { useEffect, useState } from "react";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function Scoreboard() {
    const [scores, setScores] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedGame, setSelectedGame] = useState("All Games");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchScores = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/api/scores`
                );

                if (!response.ok) {
                    throw new Error("Unable to load leaderboard.");
                }

                const data = await response.json();
                setScores(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message || "Failed to load leaderboard.");
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, []);

    const games = [
        "All Games",
        ...new Set(
            scores
                .map((score) => score.game)
                .filter(Boolean)
        ),
    ];

    const filteredScores = scores
        .filter((score) => {
            const teamName = score.teamName || score.team || "";
            const gameName = score.game || "";

            return (
                teamName.toLowerCase().includes(search.toLowerCase()) &&
                (
                    selectedGame === "All Games" ||
                    gameName === selectedGame
                )
            );
        })
        .sort((a, b) => {
            const pointsDifference =
                (Number(b.points) || 0) -
                (Number(a.points) || 0);

            if (pointsDifference !== 0) {
                return pointsDifference;
            }

            return (
                (Number(b.wins) || 0) -
                (Number(a.wins) || 0)
            );
        });

    return (
        <div className="container leaderboard-page">
            <section
                className="leaderboard-hero"
                style={{
                    backgroundImage: "url('/images/leaderboard.png')",
                }}
            >
                <div className="leaderboard-hero-content">
                    <span className="hero-tag">
                        THE BEST OF THE BEST
                    </span>

                    <h1>Leaderboard</h1>

                    <p>
                        Track team rankings, compare points, and see
                        who dominates the MatchMate arena.
                    </p>
                </div>
            </section>

            <div className="leaderboard-filters">
                <input
                    type="text"
                    placeholder="Search for a team..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search teams"
                />

                <select
                    value={selectedGame}
                    onChange={(event) =>
                        setSelectedGame(event.target.value)
                    }
                    aria-label="Filter by game"
                >
                    {games.map((game) => (
                        <option key={game} value={game}>
                            {game}
                        </option>
                    ))}
                </select>
            </div>

            <div className="leaderboard-summary">
                <span>
                    {filteredScores.length} teams ranked
                </span>

                <span>Ranked by points, then wins</span>
            </div>

            {loading ? (
                <p>Loading leaderboard...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : filteredScores.length === 0 ? (
                <div className="empty-state">
                    <h2>No teams found</h2>
                    <p>
                        Try another team name or select a different game.
                    </p>
                </div>
            ) : (
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
                            {filteredScores.map((score, index) => {
                                const teamName =
                                    score.teamName ||
                                    score.team ||
                                    "Unknown Team";

                                return (
                                    <tr
                                        key={
                                            score._id ||
                                            score.id ||
                                            `${teamName}-${index}`
                                        }
                                    >
                                        <td>
                                            <span
                                                className={`rank-badge rank-${index + 1}`}
                                            >
                                                {index + 1}
                                            </span>
                                        </td>

                                        <td className="leaderboard-team">
                                            {teamName}
                                        </td>

                                        <td>
                                            {score.game || "—"}
                                        </td>

                                        <td>
                                            {Number(score.wins) || 0}
                                        </td>

                                        <td>
                                            {Number(score.losses) || 0}
                                        </td>

                                        <td className="leaderboard-points">
                                            {Number(score.points) || 0}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Scoreboard;