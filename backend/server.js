const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();

const path = require("path");

app.use(cors());
app.use(express.json({ limit: "100kb" }));

mongoose
    .connect(
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/MatchMate"
    )
    .then(() => console.log("MongoDB connected successfully"))
    .catch(error =>
        console.error("MongoDB connection error:", error.message)
    );

// ==================== DATABASE SCHEMAS ====================

const tournamentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    game: { type: String, required: true, trim: true },
    maxTeams: { type: Number, required: true, min: 2 },
    registeredTeams: { type: Number, default: 0, min: 0 },
    status: {
        type: String,
        enum: ["Open", "Closed", "Completed"],
        default: "Open"
    }
});

const Tournament = mongoose.model("Tournament", tournamentSchema);

const scoreSchema = new mongoose.Schema({
    teamName: { type: String, required: true, trim: true },
    game: { type: String, required: true, trim: true },
    points: { type: Number, default: 0, min: 0 },
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 }
});

const Score = mongoose.model("Score", scoreSchema);

const matchSchema = new mongoose.Schema({
    tournament: { type: String, required: true, trim: true },
    game: { type: String, required: true, trim: true },
    teamA: { type: String, required: true, trim: true },
    teamB: { type: String, required: true, trim: true },
    matchDate: { type: Date, required: true },
    venue: { type: String, default: "Online", trim: true },
    status: {
        type: String,
        enum: ["Upcoming", "Live", "Completed"],
        default: "Upcoming"
    }
});

const Match = mongoose.model("Match", matchSchema);

const registrationSchema = new mongoose.Schema({
    playerName: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    teamName: { type: String, required: true, trim: true },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tournament",
        required: true
    },
    tournamentName: { type: String, required: true },
    game: { type: String, required: true },
    registeredAt: { type: Date, default: Date.now }
});

const Registration = mongoose.model(
    "Registration",
    registrationSchema
);

// ==================== ADMIN AUTHENTICATION ====================

// Tokens expire after 8 hours. Set both secrets in Render.
function createAdminToken() {
    const payload = Buffer.from(
        JSON.stringify({
            exp: Date.now() + 8 * 60 * 60 * 1000
        })
    ).toString("base64url");

    const signature = crypto
        .createHmac("sha256", process.env.ADMIN_TOKEN_SECRET)
        .update(payload)
        .digest("base64url");

    return `${payload}.${signature}`;
}

function requireAdmin(req, res, next) {
    const secret = process.env.ADMIN_TOKEN_SECRET;
    const authorization = req.headers.authorization || "";
    const parts = authorization.match(/^Bearer ([^.]+\.[^.]+)$/);

    if (!secret || !parts) {
        return res.status(401).json({
            error: "Admin authentication required."
        });
    }

    const [payload, suppliedSignature] = parts[1].split(".");

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest();

    let receivedSignature;

    try {
        receivedSignature = Buffer.from(
            suppliedSignature,
            "base64url"
        );
    } catch {
        return res.status(401).json({
            error: "Invalid admin session."
        });
    }

    if (
        receivedSignature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(
            receivedSignature,
            expectedSignature
        )
    ) {
        return res.status(401).json({
            error: "Invalid admin session."
        });
    }

    try {
        const decoded = JSON.parse(
            Buffer.from(payload, "base64url").toString("utf8")
        );

        if (!decoded.exp || decoded.exp <= Date.now()) {
            return res.status(401).json({
                error: "Admin session expired. Please log in again."
            });
        }
    } catch {
        return res.status(401).json({
            error: "Invalid admin session."
        });
    }

    next();
}

app.post("/api/admin/login", (req, res) => {
    const configuredPassword = process.env.ADMIN_PASSWORD;
    const configuredSecret = process.env.ADMIN_TOKEN_SECRET;
    const suppliedPassword = req.body?.password;

    if (!configuredPassword || !configuredSecret) {
        return res.status(503).json({
            error: "Admin login is not configured on the server."
        });
    }

    if (typeof suppliedPassword !== "string") {
        return res.status(400).json({
            error: "Enter the admin password."
        });
    }

    const expected = Buffer.from(configuredPassword);
    const supplied = Buffer.from(suppliedPassword);

    if (
        expected.length !== supplied.length ||
        !crypto.timingSafeEqual(expected, supplied)
    ) {
        return res.status(401).json({
            error: "Incorrect admin password."
        });
    }

    res.json({
        message: "Admin login successful.",
        token: createAdminToken()
    });
});

// ==================== PUBLIC ROUTES ====================

app.get("/", (req, res) => {
    res.send("MatchMate API is running");
});

app.get("/api/tournaments", async (req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ name: 1 });
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ error: "Unable to load tournaments." });
    }
});

app.get("/api/scores", async (req, res) => {
    try {
        const scores = await Score.find().sort({
            points: -1,
            wins: -1
        });
        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: "Unable to load scores." });
    }
});

app.get("/api/matches", async (req, res) => {
    try {
        const matches = await Match.find().sort({ matchDate: 1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: "Unable to load matches." });
    }
});

// ==================== ADMIN RESOURCE ROUTES ====================

const adminResources = {
    tournaments: {
        model: Tournament,
        fields: [
            "name",
            "game",
            "maxTeams",
            "registeredTeams",
            "status"
        ],
        sort: { name: 1 }
    },
    matches: {
        model: Match,
        fields: [
            "tournament",
            "game",
            "teamA",
            "teamB",
            "matchDate",
            "venue",
            "status"
        ],
        sort: { matchDate: 1 }
    },
    scores: {
        model: Score,
        fields: [
            "teamName",
            "game",
            "points",
            "wins",
            "losses"
        ],
        sort: { points: -1, wins: -1 }
    }
};

function pickAllowedFields(body, fields) {
    const result = {};

    for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            result[field] = body[field];
        }
    }

    return result;
}

function validateAdminBody(resource, body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Invalid request body.";
    }

    if (resource === "tournaments") {
        if (
            typeof body.name !== "string" ||
            !body.name.trim() ||
            typeof body.game !== "string" ||
            !body.game.trim()
        ) {
            return "Tournament name and game are required.";
        }

        if (
            !Number.isInteger(Number(body.maxTeams)) ||
            Number(body.maxTeams) < 2
        ) {
            return "Maximum teams must be an integer of at least 2.";
        }

        if (
            body.registeredTeams !== undefined &&
            (!Number.isInteger(Number(body.registeredTeams)) ||
                Number(body.registeredTeams) < 0)
        ) {
            return "Registered teams must be a non-negative integer.";
        }

        if (
            body.status !== undefined &&
            !["Open", "Closed", "Completed"].includes(body.status)
        ) {
            return "Invalid tournament status.";
        }
    }

    if (resource === "matches") {
        for (const field of ["tournament", "game", "teamA", "teamB"]) {
            if (
                typeof body[field] !== "string" ||
                !body[field].trim()
            ) {
                return `${field} is required.`;
            }
        }

        if (
            !body.matchDate ||
            Number.isNaN(new Date(body.matchDate).getTime())
        ) {
            return "Enter a valid match date and time.";
        }

        if (
            body.status !== undefined &&
            !["Upcoming", "Live", "Completed"].includes(body.status)
        ) {
            return "Invalid match status.";
        }
    }

    if (resource === "scores") {
        if (
            typeof body.teamName !== "string" ||
            !body.teamName.trim() ||
            typeof body.game !== "string" ||
            !body.game.trim()
        ) {
            return "Team name and game are required.";
        }

        for (const field of ["points", "wins", "losses"]) {
            if (
                body[field] !== undefined &&
                (!Number.isFinite(Number(body[field])) ||
                    Number(body[field]) < 0)
            ) {
                return `${field} must be a non-negative number.`;
            }
        }
    }

    return null;
}

for (const [resource, config] of Object.entries(adminResources)) {
    app.get(`/api/admin/${resource}`, requireAdmin, async (req, res) => {
        try {
            const records = await config.model
                .find()
                .sort(config.sort);

            res.json(records);
        } catch (error) {
            res.status(500).json({ error: "Unable to load records." });
        }
    });

    app.post(`/api/admin/${resource}`, requireAdmin, async (req, res) => {
        try {
            const validationError = validateAdminBody(resource, req.body);

            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            const data = pickAllowedFields(req.body, config.fields);
            const record = await config.model.create(data);

            res.status(201).json(record);
        } catch (error) {
            res.status(400).json({
                error: error.name === "ValidationError"
                    ? error.message
                    : "Unable to create record."
            });
        }
    });

    app.put(
        `/api/admin/${resource}/:id`,
        requireAdmin,
        async (req, res) => {
            try {
                if (!mongoose.isValidObjectId(req.params.id)) {
                    return res.status(400).json({
                        error: "Invalid record ID."
                    });
                }

                const validationError = validateAdminBody(
                    resource,
                    req.body
                );

                if (validationError) {
                    return res.status(400).json({
                        error: validationError
                    });
                }

                const data = pickAllowedFields(
                    req.body,
                    config.fields
                );

                const record = await config.model.findByIdAndUpdate(
                    req.params.id,
                    { $set: data },
                    { new: true, runValidators: true }
                );

                if (!record) {
                    return res.status(404).json({
                        error: "Record not found."
                    });
                }

                res.json(record);
            } catch (error) {
                res.status(400).json({
                    error: error.name === "ValidationError"
                        ? error.message
                        : "Unable to update record."
                });
            }
        }
    );

    app.delete(
        `/api/admin/${resource}/:id`,
        requireAdmin,
        async (req, res) => {
            try {
                if (!mongoose.isValidObjectId(req.params.id)) {
                    return res.status(400).json({
                        error: "Invalid record ID."
                    });
                }

                const record = await config.model.findByIdAndDelete(
                    req.params.id
                );

                if (!record) {
                    return res.status(404).json({
                        error: "Record not found."
                    });
                }

                res.json({ message: "Record deleted successfully." });
            } catch (error) {
                res.status(500).json({
                    error: "Unable to delete record."
                });
            }
        }
    );
}

// Registrations are visible to admins only.
app.get(
    "/api/admin/registrations",
    requireAdmin,
    async (req, res) => {
        try {
            const registrations = await Registration.find()
                .sort({ registeredAt: -1 });

            res.json(registrations);
        } catch (error) {
            res.status(500).json({
                error: "Unable to load registrations."
            });
        }
    }
);

// ==================== PUBLIC REGISTRATION ====================

app.post("/api/registrations", async (req, res) => {
    let reservedTournamentId = null;

    try {
        const { playerName, email, teamName, tournamentId } = req.body;

        if (
            typeof playerName !== "string" ||
            !playerName.trim() ||
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            typeof teamName !== "string" ||
            !teamName.trim() ||
            !mongoose.isValidObjectId(tournamentId)
        ) {
            return res.status(400).json({
                error: "Enter a valid name, email, team name, and tournament."
            });
        }

        const tournament = await Tournament.findOneAndUpdate(
            {
                _id: tournamentId,
                status: "Open",
                $expr: {
                    $lt: [
                        { $ifNull: ["$registeredTeams", 0] },
                        "$maxTeams"
                    ]
                }
            },
            { $inc: { registeredTeams: 1 } },
            { new: true, runValidators: true }
        );

        if (!tournament) {
            const existing = await Tournament.findById(tournamentId);

            if (!existing) {
                return res.status(404).json({
                    error: "Tournament not found."
                });
            }

            return res.status(409).json({
                error: "This tournament is closed or has reached its team limit."
            });
        }

        reservedTournamentId = tournament._id;

        const registration = await Registration.create({
            playerName: playerName.trim(),
            email: email.trim().toLowerCase(),
            teamName: teamName.trim(),
            tournamentId: tournament._id,
            tournamentName: tournament.name,
            game: tournament.game
        });

        res.status(201).json({
            message: "Registration successful!",
            registration
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        if (reservedTournamentId) {
            await Tournament.updateOne(
                { _id: reservedTournamentId },
                { $inc: { registeredTeams: -1 } }
            ).catch(rollbackError =>
                console.error("Registration rollback failed:", rollbackError)
            );
        }

        res.status(500).json({
            error: "Unable to complete registration. Please try again."
        });
    }
});

// ==================== SERVE REACT UI ====================

const frontendDist = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendDist));

app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
        return next();
    }

    res.sendFile(
        path.join(frontendDist, "index.html"),
        error => {
            if (error) next();
        }
    );
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`MatchMate backend running on port ${PORT}`);
});
