import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Sports categories with their TheSportsDB league IDs
const SPORTS_CONFIG: Record<string, number[]> = {
    'football': [4328, 4335, 4331, 4332, 4334, 4480], // EPL, La Liga, Bundesliga, Serie A, Ligue 1, MLS
    'basketball': [4387, 4388], // NBA, EuroLeague
    'american-football': [4391], // NFL
    'hockey': [4380], // NHL
    'baseball': [4424], // MLB
    'motorsports': [4370, 4371], // F1, MotoGP
    'fighting': [4443, 4489], // UFC, Boxing
    'tennis': [4464], // ATP
    'cricket': [4676, 4677], // IPL, T20 WC
    'rugby': [4401, 4405], // Six Nations, Super Rugby
    'golf': [4509], // PGA
};

interface TheSportsDBEvent {
    idEvent: string;
    strEvent: string;
    strSport: string;
    strLeague: string;
    strHomeTeam: string;
    strAwayTeam: string;
    strHomeTeamBadge?: string;
    strAwayTeamBadge?: string;
    strTimestamp: string;
    dateEvent: string;
    strTime: string;
    strStatus?: string;
    strThumb?: string;
    strVenue?: string;
    intHomeScore?: string | null;
    intAwayScore?: string | null;
}

interface TransformedMatch {
    id: string;
    title: string;
    category: string;
    date: string;
    time: string;
    timestamp: number;
    teams: {
        home: { name: string; badge?: string };
        away: { name: string; badge?: string };
    };
    venue?: string;
    status: string;
    score?: { home: number | null; away: number | null };
    poster?: string;
    sources?: { source: string; id: string }[];
}

async function fetchLeagueEvents(leagueId: number): Promise<TheSportsDBEvent[]> {
    try {
        const response = await axios.get(
            `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`,
            {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                },
            }
        );

        return response.data?.events || [];
    } catch (error) {
        console.log(`Failed to fetch events for league ${leagueId}:`, error instanceof Error ? error.message : 'Unknown');
        return [];
    }
}

function transformEvent(event: TheSportsDBEvent, sport: string): TransformedMatch {
    const timestamp = new Date(event.strTimestamp || `${event.dateEvent}T${event.strTime}`).getTime();

    return {
        id: event.idEvent,
        title: event.strEvent,
        category: sport,
        date: event.dateEvent,
        time: event.strTime,
        timestamp,
        teams: {
            home: {
                name: event.strHomeTeam,
                badge: event.strHomeTeamBadge
            },
            away: {
                name: event.strAwayTeam,
                badge: event.strAwayTeamBadge
            },
        },
        venue: event.strVenue,
        status: event.strStatus || 'Upcoming',
        score: event.intHomeScore !== null ? {
            home: event.intHomeScore ? parseInt(event.intHomeScore) : null,
            away: event.intAwayScore ? parseInt(event.intAwayScore) : null,
        } : undefined,
        poster: event.strThumb,
        sources: [{ source: 'thesportsdb', id: event.idEvent }],
    };
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ sport: string }> }
) {
    const params = await props.params;
    const sport = params.sport;

    const leagueIds = SPORTS_CONFIG[sport];

    if (!leagueIds || leagueIds.length === 0) {
        console.log(`No league IDs configured for sport: ${sport}`);
        return NextResponse.json([]);
    }

    try {
        // Fetch events from all leagues for this sport in parallel
        const allEventsPromises = leagueIds.map(id => fetchLeagueEvents(id));
        const allEventsArrays = await Promise.all(allEventsPromises);

        // Flatten and transform all events
        const allEvents = allEventsArrays
            .flat()
            .filter(Boolean)
            .map(event => transformEvent(event, sport));

        // Sort by timestamp (upcoming first)
        allEvents.sort((a, b) => a.timestamp - b.timestamp);

        // Limit to 50 events per sport
        const limitedEvents = allEvents.slice(0, 50);

        console.log(`Fetched ${limitedEvents.length} matches for ${sport}`);

        return NextResponse.json(limitedEvents);
    } catch (error) {
        console.error(`Error fetching matches for ${sport}:`, error);
        return NextResponse.json([]);
    }
}
