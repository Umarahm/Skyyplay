import { NextResponse } from 'next/server';

// Sports categories with their TheSportsDB league IDs
const SPORTS_CONFIG = [
    {
        name: "Football",
        id: "football",
        leagues: [4328, 4335, 4331, 4332, 4334, 4480] // EPL, La Liga, Bundesliga, Serie A, Ligue 1, MLS
    },
    {
        name: "Basketball",
        id: "basketball",
        leagues: [4387, 4388] // NBA, EuroLeague
    },
    {
        name: "American Football",
        id: "american-football",
        leagues: [4391] // NFL
    },
    {
        name: "Hockey",
        id: "hockey",
        leagues: [4380] // NHL
    },
    {
        name: "Baseball",
        id: "baseball",
        leagues: [4424] // MLB
    },
    {
        name: "Motor Sports",
        id: "motorsports",
        leagues: [4370, 4371] // F1, MotoGP
    },
    {
        name: "Fight (UFC, Boxing)",
        id: "fighting",
        leagues: [4443, 4489] // UFC, Boxing
    },
    {
        name: "Tennis",
        id: "tennis",
        leagues: [4464] // ATP
    },
    {
        name: "Cricket",
        id: "cricket",
        leagues: [4676, 4677] // IPL, T20 WC
    },
    {
        name: "Rugby",
        id: "rugby",
        leagues: [4401, 4405] // Six Nations, Super Rugby
    },
    {
        name: "Golf",
        id: "golf",
        leagues: [4509] // PGA
    },
];

export async function GET() {
    // Return the sports categories
    return NextResponse.json(SPORTS_CONFIG.map(s => ({ name: s.name, id: s.id })));
}
