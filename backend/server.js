
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
    .connect(
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/MatchMate"
    )
    .then(() => console.log("MongoDB connected successfully"))
    .catch(error =>
        console.error("MongoDB connection error:", error)
    );

const tournamentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    game: { type: String, required: true, trim: true },
    maxTeams: { type: Number, required: true, min: 2 },
    registeredTeams: { type: Number, default: 0, min: 0 },
    status: { type: String, default: "Open" }
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
    venue: { type: String, default: "Online" },
    status: { type: String, default: "Upcoming" }
});

const Match = mongoose.model("Match", matchSchema);

const registrationSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    teamName: {
        type: String,
        required: true,
        trim: true
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tournament",
        required: true
    },
    tournamentName: {
        type: String,
        required: true
    },
    game: {
        type: String,
        required: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    }
});

const Registration = mongoose.model("Registration", registrationSchema);

app.get("/", (req, res) => {
    res.send("MatchMate API is running");
});

app.get("/api/tournaments", async (req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ name: 1 });
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/tournaments", async (req, res) => {
    try {
        const tournament = await Tournament.create(req.body);
        res.status(201).json(tournament);
    } catch (error) {
        res.status(400).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/scores", async (req, res) => {
    try {
        const score = await Score.create(req.body);
        res.status(201).json(score);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/matches", async (req, res) => {
    try {
        const matches = await Match.find().sort({ matchDate: 1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/matches", async (req, res) => {
    try {
        const match = await Match.create(req.body);
        res.status(201).json(match);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/registrations", async (req, res) => {
    try {
        const registrations = await Registration.find()
            .sort({ registeredAt: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/registrations", async (req, res) => {
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
            {
                $inc: { registeredTeams: 1 }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!tournament) {
            const existingTournament =
                await Tournament.findById(tournamentId);

            if (!existingTournament) {
                return res.status(404).json({
                    error: "Tournament not found."
                });
            }

            return res.status(409).json({
                error: "This tournament is closed or has reached its team limit."
            });
        }

        try {
            const registration = await Registration.create({
                playerName: playerName.trim(),
                email: email.trim().toLowerCase(),
                teamName: teamName.trim(),
                tournamentId: tournament._id,
                tournamentName: tournament.name,
                game: tournament.game
            });

            return res.status(201).json({
                message: "Registration successful!",
                registration
            });
        } catch (error) {
            await Tournament.updateOne(
                { _id: tournament._id },
                { $inc: { registeredTeams: -1 } }
            );

            throw error;
        }
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            error: "Unable to complete registration. Please try again."
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`MatchMate backend running on port ${PORT}`);
});