import { useEffect, useState } from "react";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function Timetable() {
    const [matches, setMatches] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedGame, setSelectedGame] = useState("All Games");
    const [selectedStatus, setSelectedStatus] = useState("All Statuses");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/api/matches`
                );

                if (!response.ok) {
                    throw new Error("Unable to load match schedule.");
                }

                const data = await response.json();
                setMatches(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message || "Failed to load matches.");
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    const games = [
        "All Games",
        ...new Set(
            matches
                .map((match) => match.game)
                .filter(Boolean)
        ),
    ];

    const statuses = [
        "All Statuses",
        "Upcoming",
        "Live",
        "Completed",
    ];

    const filteredMatches = matches.filter((match) => {
        const title = match.title || match.matchName || "";
        const game = match.game || "";
        const team1 = match.team1 || match.teamA || "";
        const team2 = match.team2 || match.teamB || "";
        const status = (match.status || "Upcoming").toLowerCase();

        const matchesSearch = [
            title,
            game,
            team1,
            team2,
        ].some((value) =>
            value.toLowerCase().includes(search.toLowerCase())
        );

        const matchesGame =
            selectedGame === "All Games" ||
            game === selectedGame;

        const matchesStatus =
            selectedStatus === "All Statuses" ||
            status === selectedStatus.toLowerCase();

        return matchesSearch && matchesGame && matchesStatus;
    });

    const formatDate = (value) => {
        if (!value) return "Date not announced";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="container match-schedule-page">
            <section
                className="schedule-hero"
                style={{
                    backgroundImage: "url('/images/timetable.png')",
                }}
            >
                <div className="schedule-hero-content">
                    <span className="hero-tag">
                        EVERY MATCH. EVERY MOMENT.
                    </span>

                    <h1>Match Timetable</h1>

                    <p>
                        Keep track of upcoming battles, live matches,
                        and completed games in the MatchMate arena.
                    </p>
                </div>
            </section>

            <div className="schedule-filters">
                <input
                    type="text"
                    placeholder="Search matches, teams, or games..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search matches"
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

                <select
                    value={selectedStatus}
                    onChange={(event) =>
                        setSelectedStatus(event.target.value)
                    }
                    aria-label="Filter by match status"
                >
                    {statuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>

            <div className="schedule-summary">
                <span>
                    {filteredMatches.length} matches found
                </span>

                <span>
                    {selectedGame} · {selectedStatus}
                </span>
            </div>

            {loading ? (
                <p>Loading match schedule...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : filteredMatches.length === 0 ? (
                <div className="empty-state">
                    <h2>No matches found</h2>
                    <p>
                        Try changing your search or filter settings.
                    </p>
                </div>
            ) : (
                <div className="match-list">
                    {filteredMatches.map((match, index) => {
                        const team1 =
                            match.team1 ||
                            match.teamA ||
                            "Team 1";

                        const team2 =
                            match.team2 ||
                            match.teamB ||
                            "Team 2";

                        const status = (
                            match.status || "Upcoming"
                        ).toLowerCase();

                        return (
                            <article
                                className="match-card"
                                key={
                                    match._id ||
                                    match.id ||
                                    `${match.title || match.matchName || "match"}-${index}`
                                }
                            >
                                <div className="match-card-heading">
                                    <div>
                                        <span className="match-game">
                                            {match.game || "Esports"}
                                        </span>

                                        <h2>
                                            {match.title ||
                                                match.matchName ||
                                                `${team1} vs ${team2}`}
                                        </h2>
                                    </div>

                                    <span
                                        className={`match-status ${
                                            ["upcoming", "live", "completed"].includes(status)
                                                ? status
                                                : ""
                                        }`}
                                    >
                                        {status.charAt(0).toUpperCase() +
                                            status.slice(1)}
                                    </span>
                                </div>

                                <div className="match-versus">
                                    <div className="match-team">
                                        <span>TEAM A</span>
                                        <strong>{team1}</strong>
                                    </div>

                                    <span className="versus-label">
                                        VS
                                    </span>

                                    <div className="match-team match-team-right">
                                        <span>TEAM B</span>
                                        <strong>{team2}</strong>
                                    </div>
                                </div>

                                <div className="match-details">
                                    <div>
                                        <span>Date & Time</span>
                                        <strong>
                                            {formatDate(
                                                match.date ||
                                                match.matchDate ||
                                                match.startTime
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Venue</span>
                                        <strong>
                                            {match.venue || "Online"}
                                        </strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Timetable;