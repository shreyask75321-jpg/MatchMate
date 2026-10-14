
import { useEffect, useState } from "react";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const emptyForms = {
    tournaments: {
        name: "",
        game: "Valorant",
        maxTeams: 16,
        registeredTeams: 0,
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

export default function Admin() {
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [section, setSection] = useState("tournaments");
    const [data, setData] = useState([]);
    const [form, setForm] = useState(emptyForms.tournaments);
    const [editing, setEditing] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

    const login = async (event) => {
        event.preventDefault();
        setMessage("");

        try {
            const response = await axios.post(
                `${API}/api/admin/login`,
                { password }
            );

            setToken(response.data.token);
            setPassword("");
            setMessage("Login successful.");
        } catch (error) {
            setMessage(
                error.response?.data?.error || "Admin login failed."
            );
        }
    };

    const logout = () => {
        setToken("");
        setData([]);
        setEditing(null);
        setMessage("Logged out.");
    };

    const loadData = async () => {
        if (!token) return;

        setLoading(true);
        setMessage("");

        try {
            const response = await axios.get(
                `${API}/api/admin/${section}`,
                { headers }
            );

            setData(response.data);
        } catch (error) {
            setMessage(
                error.response?.data?.error ||
                "Unable to load data. Please log in again if your session expired."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setForm(emptyForms[section] || {});
        setEditing(null);
        if (token) loadData();
    }, [section, token]);

    const save = async (event) => {
        event.preventDefault();
        setMessage("");

        try {
            const payload = { ...form };

            if (section === "matches") {
                payload.matchDate = new Date(form.matchDate).toISOString();
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
            setForm(emptyForms[section]);
            await loadData();
        } catch (error) {
            setMessage(
                error.response?.data?.error ||
                "Unable to save record. Check the form and try again."
            );
        }
    };

    const edit = (item) => {
        setEditing(item._id);

        const next = { ...item };

        if (section === "matches") {
            next.matchDate = item.matchDate
                ? new Date(item.matchDate).toISOString().slice(0, 16)
                : "";
        }

        setForm(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this record permanently?")) return;

        try {
            await axios.delete(
                `${API}/api/admin/${section}/${id}`,
                { headers }
            );
            setMessage("Record deleted.");
            await loadData();
        } catch (error) {
            setMessage(
                error.response?.data?.error || "Delete failed."
            );
        }
    };

    if (!API) {
        return <main className="admin-page">VITE_API_URL is not configured.</main>;
    }

    if (!token) {
        return (
            <main className="admin-page">
                <form className="admin-login" onSubmit={login}>
                    <span className="hero-tag">MATCHMATE CONTROL</span>
                    <h1>Admin Login</h1>
                    <label htmlFor="admin-password">Admin password</label>
                    <input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                    <button className="primary-button" type="submit">
                        Sign In
                    </button>
                    {message && <p role="status">{message}</p>}
                </form>
            </main>
        );
    }

    const fields = {
        tournaments: [
            ["name", "Tournament name", "text"],
            ["game", "Game", "game"],
            ["maxTeams", "Maximum teams", "number"],
            ["registeredTeams", "Registered teams", "number"],
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

    const games = [
        "Valorant",
        "BGMI",
        "Counter-Strike 2",
        "Free Fire MAX",
        "Street Fighter",
        "Age of Empires"
    ];

    const renderField = ([key, label, type]) => (
        <label className="admin-field" key={key}>
            {label}

            {type === "game" ? (
                <select
                    value={form[key] ?? ""}
                    onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                    }
                    required
                >
                    {games.map((game) => (
                        <option key={game}>{game}</option>
                    ))}
                </select>
            ) : type === "tournamentStatus" ||
              type === "matchStatus" ? (
                <select
                    value={form[key] ?? ""}
                    onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                    }
                >
                    {(type === "tournamentStatus"
                        ? ["Open", "Closed", "Completed"]
                        : ["Upcoming", "Live", "Completed"]
                    ).map((status) => (
                        <option key={status}>{status}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={form[key] ?? ""}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            [key]:
                                type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value
                        })
                    }
                    required={
                        !["registeredTeams", "venue"].includes(key)
                    }
                    min={type === "number" ? 0 : undefined}
                />
            )}
        </label>
    );

    return (
        <main className="admin-page">
            <header className="admin-heading">
                <div>
                    <span className="hero-tag">MATCHMATE CONTROL</span>
                    <h1>Admin Dashboard</h1>
                    <p>Manage your esports platform.</p>
                </div>
                <button onClick={logout}>Log out</button>
            </header>

            <nav className="admin-tabs">
                {["tournaments", "matches", "scores", "registrations"].map(
                    (item) => (
                        <button
                            key={item}
                            className={section === item ? "active" : ""}
                            onClick={() => setSection(item)}
                        >
                            {item[0].toUpperCase() + item.slice(1)}
                        </button>
                    )
                )}
            </nav>

            {message && <p role="status" className="admin-message">{message}</p>}

            {section !== "registrations" && (
                <form className="admin-form" onSubmit={save}>
                    <h2>{editing ? "Edit record" : `Add ${section.slice(0, -1)}`}</h2>
                    <div className="admin-form-grid">
                        {fields[section].map(renderField)}
                    </div>
                    <div className="admin-actions">
                        <button className="primary-button" type="submit">
                            {editing ? "Save Changes" : "Add Record"}
                        </button>
                        {editing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(null);
                                    setForm(emptyForms[section]);
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            )}

            <section className="admin-records">
                <div className="admin-records-heading">
                    <h2>{section[0].toUpperCase() + section.slice(1)}</h2>
                    <button onClick={loadData} disabled={loading}>
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
                                             `${item.teamA || ""} vs ${item.teamB || ""}`}
                                        </td>
                                        <td>
                                            {section === "registrations" ? (
                                                <>
                                                    {item.email}<br />
                                                    Team: {item.teamName}<br />
                                                    Tournament: {item.tournamentName}
                                                </>
                                            ) : (
                                                Object.entries(item)
                                                    .filter(([key]) =>
                                                        !["_id", "__v"].includes(key)
                                                    )
                                                    .map(([key, value]) => (
                                                        <div key={key}>
                                                            <strong>{key}:</strong>{" "}
                                                            {value == null
                                                                ? ""
                                                                : String(value)}
                                                        </div>
                                                    ))
                                            )}
                                        </td>
                                        <td>
                                            {section !== "registrations" && (
                                                <div className="admin-row-actions">
                                                    <button onClick={() => edit(item)}>
                                                        Edit
                                                    </button>
                                                    <button
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
