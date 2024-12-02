// app/api/twitter/create-tweet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Twitter from 'twitter-api-v2';

export async function POST(request: NextRequest) {
  try {
    const { text, media } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Missing tweet text' },
        { status: 400 }
      );
    }

    const client = new Twitter({
      appKey: process.env.NEXT_PUBLIC_TWITTER_API_KEY!,
      appSecret: process.env.NEXT_PUBLIC_TWITTER_API_SECRET!,
      accessToken: process.env.NEXT_PUBLIC_TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.NEXT_PUBLIC_TWITTER_ACCESS_TOKEN_SECRET!,
    });

    // Create tweet
    const tweet = await client.v2.tweet({
      text,
      media: {
        media_ids: media.media_ids
      }
    });

    return NextResponse.json(tweet);
  } catch (error) {
    console.error('Error creating tweet:', error);
    return NextResponse.json(
      { error: 'Failed to create tweet' },
      { status: 500 }
    );
  }
}