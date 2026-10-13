
const mongoose = require("mongoose");

const tournaments = [
  { name: "Valorant Champions Cup", game: "Valorant", maxTeams: 16, registeredTeams: 12, status: "Open" },
  { name: "BGMI Battle Royale", game: "BGMI", maxTeams: 20, registeredTeams: 20, status: "Full" },
  { name: "CS2 Pro League", game: "Counter-Strike 2", maxTeams: 16, registeredTeams: 8, status: "Open" },
  { name: "Free Fire Clash", game: "Free Fire MAX", maxTeams: 12, registeredTeams: 6, status: "Open" }
];

const scores = [
  { teamName: "Team Phoenix", game: "Valorant", points: 950, wins: 10, losses: 2 },
  { teamName: "Shadow Hunters", game: "BGMI", points: 870, wins: 9, losses: 3 },
  { teamName: "Cyber Wolves", game: "Counter-Strike 2", points: 820, wins: 8, losses: 4 },
  { teamName: "Storm Breakers", game: "Free Fire MAX", points: 760, wins: 8, losses: 5 },
  { teamName: "Nova Esports", game: "Valorant", points: 710, wins: 7, losses: 4 },
  { teamName: "Elite Warriors", game: "BGMI", points: 650, wins: 6, losses: 5 }
];

const matches = [
  { tournament: "Valorant Champions Cup", game: "Valorant", teamA: "Team Phoenix", teamB: "Nova Esports", matchDate: new Date("2026-10-03T10:00:00+05:30"), venue: "Arena 1", status: "Upcoming" },
  { tournament: "BGMI Battle Royale", game: "BGMI", teamA: "Shadow Hunters", teamB: "Elite Warriors", matchDate: new Date("2026-10-03T13:00:00+05:30"), venue: "Arena 2", status: "Upcoming" },
  { tournament: "CS2 Pro League", game: "Counter-Strike 2", teamA: "Cyber Wolves", teamB: "Storm Breakers", matchDate: new Date("2026-10-04T11:00:00+05:30"), venue: "Arena 3", status: "Upcoming" },
  { tournament: "Free Fire Clash", game: "Free Fire MAX", teamA: "Storm Breakers", teamB: "Shadow Hunters", matchDate: new Date("2026-10-04T15:00:00+05:30"), venue: "Arena 4", status: "Upcoming" },
  { tournament: "Valorant Champions Cup", game: "Valorant", teamA: "Nova Esports", teamB: "Cyber Wolves", matchDate: new Date("2026-10-05T12:00:00+05:30"), venue: "Arena 1", status: "Upcoming" },
  { tournament: "BGMI Battle Royale", game: "BGMI", teamA: "Elite Warriors", teamB: "Team Phoenix", matchDate: new Date("2026-10-05T16:00:00+05:30"), venue: "Arena 2", status: "Upcoming" }
];

async function seedCollection(db, name, data) {
  const collection = db.collection(name);
  const count = await collection.countDocuments();

  if (count === 0) {
    await collection.insertMany(data);
    console.log(`${name}: inserted ${data.length} records`);
  } else {
    console.log(`${name}: already contains ${count} records; skipped`);
  }
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI to your MongoDB Atlas connection string first.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully");

  const db = mongoose.connection.db;

  await seedCollection(db, "tournaments", tournaments);
  await seedCollection(db, "scores", scores);
  await seedCollection(db, "matches", matches);

  await mongoose.disconnect();
  console.log("Seed operation completed");
}

seed().catch(async error => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});