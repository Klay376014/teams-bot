const restify = require('restify');
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } = require('botbuilder');

require('dotenv').config();

// 建立憑證工廠
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.MicrosoftAppId,
  MicrosoftAppPassword: process.env.MicrosoftAppPassword,
  MicrosoftAppType: process.env.MicrosoftAppType,
  MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

// 建立驗證設定
const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

// 建立 Adapter
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Bot 邏輯
adapter.onTurnError = async (context, error) => {
  console.error('Bot 發生錯誤:', error);
  await context.sendActivity('抱歉，發生了錯誤');
};

const bot = async (context) => {
  if (context.activity.type === 'message') {
    const message = context.activity.text.trim();
    const match = message.match(/^抽\s(.+)$/);
    if (!match) {
      await context.sendActivity('請使用格式：抽 [卡包名稱]');
      return;
    }

    const [, packId] = match;

    // 呼叫 Nuxt API
    console.log(`正在呼叫 API: packId=${packId}`);
    
    try {
      const res = await fetch('https://ptcg-pocket-simulator.vercel.app/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      });

      if (!res.ok) {
        console.error(`API 回傳錯誤: ${res.status} ${res.statusText}`);
        await context.sendActivity(`API 呼叫失敗: ${res.status} ${res.statusText}`);
        return;
      }

      const cards = await res.json();
      console.log(`API 回傳 ${cards.length} 張卡片:`, JSON.stringify(cards, null, 2));

      // 回傳圖片列表
      for (const card of cards) {
        // 構建圖片 URL
        const imageUrl = `https://raw.githubusercontent.com/flibustier/pokemon-tcg-exchange/refs/heads/main/public/images/cards/${card.imageName}`;
        console.log(`發送卡片: ${card.label.eng} (${card.rarity}) - ${imageUrl}`);
        
        await context.sendActivity({ attachments: [
          {
            contentType: 'image/webp',
            contentUrl: imageUrl,
            name: card.imageName
          }
        ]});
      }
      
      // 發送卡片資訊摘要
      const summary = cards.map(card => `${card.label.eng} (${card.rarity})`).join('\n');
      await context.sendActivity(`抽到了 ${cards.length} 張卡片:\n${summary}`);
      
    } catch (error) {
      console.error('API 呼叫發生錯誤:', error);
      await context.sendActivity('抽卡時發生錯誤，請稍後再試');
    }
  }
};

// 建立 Server
const server = restify.createServer();
server.listen(process.env.PORT, () => {
  console.log(`Bot is running on port ${process.env.PORT}`);
});

server.post('/api/messages', (req, res) => {
  adapter.process(req, res, bot);
});
