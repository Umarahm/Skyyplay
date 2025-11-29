import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ source: string; id: string }> }
) {
    const params = await props.params;
    const { source, id } = params;

    // Since we're using TheSportsDB which doesn't provide streams,
    // we return a placeholder response directing to external sources

    // For now, return stream info that can be used to construct embed URLs
    // or redirect to external streaming services

    const streamInfo = {
        id,
        source,
        message: 'Stream lookup not available for this source',
        // Provide alternative options
        alternatives: [
            {
                name: 'Search on YouTube',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(id)}+live+stream`
            }
        ]
    };

    return NextResponse.json(streamInfo);
}
