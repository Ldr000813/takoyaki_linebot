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
        let responseMessage: line.messagingApi.Message;

        if (event.message.text === 'クーポン') {
          responseMessage = {
            type: 'flex',
            altText: 'バーガークーポン',
            contents: {
              type: "bubble",
              hero: {
                type: "image",
                url: "https://developers-resource.landpress.line.me/fx/img/01_2_restaurant.png",
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover",
                action: {
                  type: "uri",
                  uri: "https://line.me/"
                }
              },
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                action: {
                  type: "uri",
                  uri: "https://line.me/"
                },
                contents: [
                  {
                    type: "text",
                    text: "バーガークーポン",
                    size: "xl",
                    weight: "bold"
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          {
                            type: "icon",
                            url: "https://developers-resource.landpress.line.me/fx/img/restaurant_regular_32.png"
                          },
                          {
                            type: "text",
                            text: "30円引き",
                            weight: "bold",
                            margin: "sm",
                            flex: 0
                          },
                          {
                            type: "text",
                            text: "30円引き",
                            size: "sm",
                            align: "end",
                            color: "#aaaaaa"
                          }
                        ]
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          {
                            type: "icon",
                            url: "https://developers-resource.landpress.line.me/fx/img/restaurant_large_32.png"
                          },
                          {
                            type: "text",
                            text: "30円引き",
                            weight: "bold",
                            margin: "sm",
                            flex: 0
                          },
                          {
                            type: "text",
                            text: "30円引き",
                            size: "sm",
                            align: "end",
                            color: "#aaaaaa"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    type: "text",
                    text: "Sauce, Onions, Pickles, Lettuce & Cheese",
                    wrap: true,
                    color: "#aaaaaa",
                    size: "xxs"
                  }
                ]
              },
              footer: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    color: "#905c44",
                    margin: "xxl",
                    action: {
                      type: "uri",
                      label: "Add to Cart",
                      uri: "https://line.me/"
                    }
                  }
                ]
              }
            } as line.messagingApi.FlexContainer
          };
        } else {
          responseMessage = {
            type: 'text',
            text: 'メッセージありがとうございます',
          };
        }

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
