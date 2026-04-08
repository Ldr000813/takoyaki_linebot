import { NextResponse } from 'next/server';
import * as line from '@line/bot-sdk';

// LINE Botの設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// クライアントの初期化
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

export async function POST(req: Request) {
  try {
    // raw textとして取得し、署名検証に使用する
    const text = await req.text();
    const signature = req.headers.get('x-line-signature') || '';

    // 署名検証
    if (!line.validateSignature(text, config.channelSecret, signature)) {
      console.warn('Signature validation failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // JSONとしてパース
    const body = JSON.parse(text);

    // イベント配列が空の場合は200を返す (Webhookの接続確認等)
    if (!body.events || body.events.length === 0) {
      return NextResponse.json({ message: 'No events' }, { status: 200 });
    }

    // イベントを処理
    await Promise.all(
      body.events.map(async (event: line.WebhookEvent) => {
        // メッセージイベントかつテキストメッセージのみ処理
        if (event.type !== 'message' || event.message.type !== 'text') {
          return;
        }

        // 応答メッセージを作成
        const responseMessage: line.messagingApi.TextMessage = {
          type: 'text',
          text: 'メッセージありがとうございます',
        };

        // メッセージを返信
        if (event.replyToken) {
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [responseMessage],
          });
        }
      })
    );

    // 正常終了時は200を返す
    return NextResponse.json({ message: 'Success' }, { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
