// app/api/twitter/upload-media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Twitter from 'twitter-api-v2';

export async function POST(request: NextRequest) {
  // console.log("beforeee")

  try {
    const { media_data } = await request.json();

    // console.log(media_data);

    if (!media_data) {
      return NextResponse.json(
        { error: 'Missing media_data' },
        { status: 400 }
      );
    }
    // console.log("heyaaaa")

    const client = new Twitter({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });
    // console.log("heyaaaa", client)

    // Upload media
    const mediaId = await client.v1.uploadMedia(
      Buffer.from(media_data, 'base64'),
      { mimeType: 'image/png' }
    );

    return NextResponse.json({ media_id_string: mediaId });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}