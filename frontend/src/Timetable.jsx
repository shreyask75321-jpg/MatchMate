import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function Timetable() {
    const [matches, setMatches] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedGame, setSelectedGame] = useState("All Games");
    const [selectedStatus, setSelectedStatus] = useState("All Matches");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/matches`
                );
                setMatches(response.data);
            } catch {
                setError("Unable to load matches. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    const games = useMemo(
        () => [
            "All Games",
            ...new Set(matches.map((match) => match.game).filter(Boolean))
        ],
        [matches]
    );

    const filteredMatches = useMemo(() => {
        return matches
            .filter((match) => {
                const searchText = [
                    match.tournament,
                    match.game,
                    match.teamA,
                    match.teamB,
                    match.venue
                ]
                    .join(" ")
                    .toLowerCase();

                const matchesSearch = searchText.includes(search.toLowerCase());

                const matchesGame =
                    selectedGame === "All Games" ||
                    match.game === selectedGame;

                const matchesStatus =
                    selectedStatus === "All Matches" ||
                    (match.status || "Upcoming") === selectedStatus;

                return matchesSearch && matchesGame && matchesStatus;
            })
            .sort(
                (a, b) =>
                    new Date(a.matchDate).getTime() -
                    new Date(b.matchDate).getTime()
            );
    }, [matches, search, selectedGame, selectedStatus]);

    const formatDate = (dateValue) => {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date to be announced";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatTime = (dateValue) => {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <main className="container match-schedule-page">
            <section className="schedule-hero">
                <span className="hero-tag">YOUR NEXT MATCH AWAITS</span>
                <h1>Match Schedule</h1>
                <p>
                    Explore upcoming fixtures, check match details, and follow
                    the action across MatchMate tournaments.
                </p>
            </section>

            <section className="schedule-filters">
                <input
                    type="search"
                    aria-label="Search matches"
                    placeholder="Search teams, tournaments, or venues..."
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

                <select
                    aria-label="Filter by match status"
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                >
                    <option value="All Matches">All Matches</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                </select>
            </section>

            {loading && <p role="status">Loading match schedule...</p>}

            {error && <p role="alert">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="schedule-summary">
                        <span>
                            {filteredMatches.length} match
                            {filteredMatches.length !== 1 ? "es" : ""} found
                        </span>
                        <span>All times shown in your browser's local time zone</span>
                    </div>

                    {filteredMatches.length > 0 ? (
                        <section className="match-list">
                            {filteredMatches.map((match) => (
                                <article className="match-card" key={match._id}>
                                    <div className="match-card-heading">
                                        <div>
                                            <span className="match-game">
                                                {match.game}
                                            </span>
                                            <h2>{match.tournament}</h2>
                                        </div>

                                        <span
                                            className={`match-status ${
                                                (match.status || "Upcoming")
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")
                                            }`}
                                        >
                                            {match.status || "Upcoming"}
                                        </span>
                                    </div>

                                    <div className="match-versus">
                                        <div className="match-team">
                                            <span>TEAM A</span>
                                            <strong>{match.teamA}</strong>
                                        </div>

                                        <span className="versus-label">VS</span>

                                        <div className="match-team match-team-right">
                                            <span>TEAM B</span>
                                            <strong>{match.teamB}</strong>
                                        </div>
                                    </div>

                                    <div className="match-details">
                                        <div>
                                            <span>Date</span>
                                            <strong>
                                                {formatDate(match.matchDate)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Time</span>
                                            <strong>
                                                {formatTime(match.matchDate) || "TBA"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Venue</span>
                                            <strong>{match.venue || "Online"}</strong>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>
                    ) : (
                        <div className="empty-state">
                            <h2>No matches found</h2>
                            <p>
                                There are no matching fixtures yet. Try changing
                                your filters or check back later.
                            </p>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default Timetable;