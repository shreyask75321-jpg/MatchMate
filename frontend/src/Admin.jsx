
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const emptyForms = {
    tournaments: {
        name: "",
        game: "Valorant",
        maxTeams: 16,
        status: "Open"
    },
    matches: {
        tournament: "",
        game: "Valorant",
        teamA: "",
        teamB: "",
        matchDate: "",
        venue: "Online",
        status: "Upcoming"
    },
    scores: {
        teamName: "",
        game: "Valorant",
        points: 0,
        wins: 0,
        losses: 0
    }
};

const games = [
    "Valorant",
    "BGMI",
    "Counter-Strike 2",
    "Free Fire MAX",
    "Street Fighter",
    "Age of Empires"
];

const fields = {
    tournaments: [
        ["name", "Tournament name", "text"],
        ["game", "Game", "game"],
        ["maxTeams", "Maximum teams", "number"],
        ["status", "Status", "tournamentStatus"]
    ],
    matches: [
        ["tournament", "Tournament", "text"],
        ["game", "Game", "game"],
        ["teamA", "Team A", "text"],
        ["teamB", "Team B", "text"],
        ["matchDate", "Match date", "datetime-local"],
        ["venue", "Venue", "text"],
        ["status", "Status", "matchStatus"]
    ],
    scores: [
        ["teamName", "Team name", "text"],
        ["game", "Game", "game"],
        ["points", "Points", "number"],
        ["wins", "Wins", "number"],
        ["losses", "Losses", "number"]
    ]
};

const titleCase = (value) =>
    value.charAt(0).toUpperCase() + value.slice(1);

const getErrorMessage = (error, fallback) => {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }

    if (error.response?.status === 401 ||
        error.response?.status === 403) {
        return "Your admin session is invalid or expired. Please log in again.";
    }

    if (!error.response) {
        return "Cannot connect to the backend. Check the API URL and server status.";
    }

    return fallback;
};

export default function Admin() {
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [section, setSection] = useState("tournaments");
    const [data, setData] = useState([]);
    const [form, setForm] = useState({ ...emptyForms.tournaments });
    const [editing, setEditing] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

    const loadData = useCallback(async () => {
        if (!token || !API) return;

        setLoading(true);

        try {
            const response = await axios.get(
                `${API}/api/admin/${section}`,
                { headers }
            );

            setData(Array.isArray(response.data) ? response.data : []);
            setMessage("");
        } catch (error) {
            setData([]);
            setMessage(getErrorMessage(
                error,
                "Unable to load records. Please try again."
            ));

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                setToken("");
                setPassword("");
            }
        } finally {
            setLoading(false);
        }
    }, [token, section]);

    useEffect(() => {
        setForm({ ...(emptyForms[section] || {}) });
        setEditing(null);
        setData([]);
        setMessage("");

        if (token) {
            loadData();
        }
    }, [section, token, loadData]);

    const login = async (event) => {
        event.preventDefault();
        setMessage("");

        if (!API) {
            setMessage("Backend API URL is not configured.");
            return;
        }

        try {
            const response = await axios.post(
                `${API}/api/admin/login`,
                { password }
            );

            if (!response.data?.token) {
                setMessage("Login failed: the server did not return a token.");
                return;
            }

            setToken(response.data.token);
            setPassword("");
            setMessage("Login successful.");
        } catch (error) {
            setMessage(getErrorMessage(error, "Admin login failed."));
        }
    };

    const logout = () => {
        setToken("");
        setPassword("");
        setData([]);
        setEditing(null);
        setForm({ ...emptyForms[section] });
        setMessage("Logged out successfully.");
    };

    const updateField = (key, value, type) => {
        setForm((previous) => ({
            ...previous,
            [key]: type === "number" && value !== ""
                ? Number(value)
                : value
        }));
    };

    const save = async (event) => {
        event.preventDefault();
        setMessage("");

        if (!token) {
            setMessage("Please log in to continue.");
            return;
        }

        setSaving(true);

        try {
            const payload = { ...form };

            if (section === "matches") {
                const date = new Date(form.matchDate);

                if (!form.matchDate || Number.isNaN(date.getTime())) {
                    setMessage("Please enter a valid match date and time.");
                    setSaving(false);
                    return;
                }

                payload.matchDate = date.toISOString();
            }

            if (editing) {
                await axios.put(
                    `${API}/api/admin/${section}/${editing}`,
                    payload,
                    { headers }
                );

                setMessage("Record updated successfully.");
            } else {
                await axios.post(
                    `${API}/api/admin/${section}`,
                    payload,
                    { headers }
                );

                setMessage("Record created successfully.");
            }

            setEditing(null);
            setForm({ ...(emptyForms[section] || {}) });
            await loadData();
        } catch (error) {
            setMessage(getErrorMessage(
                error,
                "Unable to save the record. Check the form and try again."
            ));
        } finally {
            setSaving(false);
        }
    };

    const edit = (item) => {
        const next = { ...(emptyForms[section] || {}) };

        Object.keys(next).forEach((key) => {
            if (item[key] !== undefined && item[key] !== null) {
                next[key] = item[key];
            }
        });

        if (section === "matches") {
            if (item.matchDate) {
                const date = new Date(item.matchDate);

                next.matchDate = Number.isNaN(date.getTime())
                    ? ""
                    : new Date(
                        date.getTime() -
                        date.getTimezoneOffset() * 60000
                    ).toISOString().slice(0, 16);
            } else {
                next.matchDate = "";
            }
        }

        setEditing(item._id);
        setForm(next);
        setMessage("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditing(null);
        setForm({ ...(emptyForms[section] || {}) });
        setMessage("");
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this record permanently?")) {
            return;
        }

        setMessage("");

        try {
            await axios.delete(
                `${API}/api/admin/${section}/${id}`,
                { headers }
            );

            setMessage("Record deleted successfully.");
            await loadData();
        } catch (error) {
            setMessage(getErrorMessage(error, "Delete failed."));
        }
    };

    const renderField = ([key, label, type]) => (
        <label className="admin-field" key={key}>
            {label}

            {type === "game" ? (
                <select
                    value={form[key] ?? ""}
                    onChange={(event) =>
                        updateField(key, event.target.value, type)
                    }
                    required
                >
                    {games.map((game) => (
                        <option key={game} value={game}>
                            {game}
                        </option>
                    ))}
                </select>
            ) : type === "tournamentStatus" ||
              type === "matchStatus" ? (
                <select
                    value={form[key] ?? ""}
                    onChange={(event) =>
                        updateField(key, event.target.value, type)
                    }
                    required
                >
                    {(type === "tournamentStatus"
                        ? ["Open", "Closed", "Completed"]
                        : ["Upcoming", "Live", "Completed"]
                    ).map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={form[key] ?? ""}
                    onChange={(event) =>
                        updateField(key, event.target.value, type)
                    }
                    required={key !== "venue"}
                    min={type === "number" ? 0 : undefined}
                    step={type === "number" ? 1 : undefined}
                />
            )}
        </label>
    );

    if (!API) {
        return (
            <main className="admin-page">
                <section className="admin-login">
                    <span className="hero-tag">MATCHMATE CONTROL</span>
                    <h1>Admin configuration error</h1>
                    <p>
                        VITE_API_URL is missing from this frontend build.
                        Check the Netlify environment variable and rebuild
                        the frontend.
                    </p>
                </section>
            </main>
        );
    }

    if (!token) {
        return (
            <main className="admin-page">
                <form className="admin-login" onSubmit={login}>
                    <span className="hero-tag">MATCHMATE CONTROL</span>
                    <h1>Admin Login</h1>
                    <p>Sign in to manage the MatchMate platform.</p>

                    <label htmlFor="admin-password">
                        Admin password
                    </label>

                    <input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        autoComplete="current-password"
                        required
                    />

                    <button
                        className="primary-button"
                        type="submit"
                    >
                        Sign In
                    </button>

                    {message && (
                        <p role="status" className="admin-message">
                            {message}
                        </p>
                    )}
                </form>
            </main>
        );
    }

    return (
        <main className="admin-page">
            <header className="admin-heading">
                <div>
                    <span className="hero-tag">MATCHMATE CONTROL</span>
                    <h1>Admin Dashboard</h1>
                    <p>Manage your esports platform.</p>
                </div>

                <button type="button" onClick={logout}>
                    Log out
                </button>
            </header>

            <nav className="admin-tabs" aria-label="Admin sections">
                {[
                    "tournaments",
                    "matches",
                    "scores",
                    "registrations"
                ].map((item) => (
                    <button
                        key={item}
                        type="button"
                        className={section === item ? "active" : ""}
                        aria-current={section === item ? "page" : undefined}
                        onClick={() => setSection(item)}
                    >
                        {titleCase(item)}
                    </button>
                ))}
            </nav>

            {message && (
                <p role="status" className="admin-message">
                    {message}
                </p>
            )}

            {section !== "registrations" && (
                <form className="admin-form" onSubmit={save}>
                    <h2>
                        {editing
                            ? "Edit record"
                            : `Add ${section === "scores"
                                ? "score"
                                : section.slice(0, -1)}`}
                    </h2>

                    <div className="admin-form-grid">
                        {fields[section].map(renderField)}
                    </div>

                    <div className="admin-actions">
                        <button
                            className="primary-button"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editing
                                    ? "Save Changes"
                                    : "Add Record"}
                        </button>

                        {editing && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            )}

            <section className="admin-records">
                <div className="admin-records-heading">
                    <h2>{titleCase(section)}</h2>

                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>

                {loading ? (
                    <p>Loading records...</p>
                ) : data.length === 0 ? (
                    <p>No records found.</p>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Record</th>
                                    <th>Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            {item.name ||
                                             item.teamName ||
                                             item.playerName ||
                                             (
                                                 `${item.teamA || ""} vs ` +
                                                 `${item.teamB || ""}`
                                             ).trim()}
                                        </td>

                                        <td>
                                            {section === "registrations" ? (
                                                <>
                                                    <strong>Email:</strong>{" "}
                                                    {item.email}
                                                    <br />
                                                    <strong>Team:</strong>{" "}
                                                    {item.teamName}
                                                    <br />
                                                    <strong>Tournament:</strong>{" "}
                                                    {item.tournamentName}
                                                </>
                                            ) : (
                                                Object.entries(item)
                                                    .filter(([key]) =>
                                                        !["_id", "__v"].includes(key)
                                                    )
                                                    .map(([key, value]) => (
                                                        <div key={key}>
                                                            <strong>
                                                                {titleCase(key)}:
                                                            </strong>{" "}
                                                            {value == null
                                                                ? ""
                                                                : typeof value === "object"
                                                                    ? JSON.stringify(value)
                                                                    : String(value)}
                                                        </div>
                                                    ))
                                            )}
                                        </td>

                                        <td>
                                            {section !== "registrations" && (
                                                <div className="admin-row-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => edit(item)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => remove(item._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
