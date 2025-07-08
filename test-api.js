// 測試 API 功能
async function testAPI() {
  console.log('測試 API 呼叫...');
  
  const testData = {
    packId: 'Pikachu'
  };
  
  try {
    console.log(`發送請求: ${JSON.stringify(testData)}`);
    
    const res = await fetch('https://ptcg-pocket-simulator.vercel.app/api/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    console.log(`HTTP 狀態: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      console.error('API 回傳錯誤');
      const errorText = await res.text();
      console.error('錯誤詳情:', errorText);
      return;
    }
    
    const cards = await res.json();
    console.log(`\n成功！收到 ${cards.length} 張卡片:`);
    
    cards.forEach((card, index) => {
      console.log(`${index + 1}. ${card.label.eng} (${card.rarity}) - ${card.imageName}`);
      
      // 驗證圖片 URL
      const imageUrl = `https://raw.githubusercontent.com/flibustier/pokemon-tcg-exchange/refs/heads/main/public/images/cards/${card.imageName}`;
      console.log(`   圖片 URL: ${imageUrl}`);
    });
    
    console.log('\n完整 API 回傳資料:');
    console.log(JSON.stringify(cards, null, 2));
    
  } catch (error) {
    console.error('測試失敗:', error.message);
  }
}

// 測試圖片 URL 是否可以存取
async function testImageURL(imageUrl) {
  try {
    const res = await fetch(imageUrl, { method: 'HEAD' });
    console.log(`圖片 URL 狀態: ${res.status} ${res.statusText}`);
    return res.ok;
  } catch (error) {
    console.error('圖片 URL 測試失敗:', error.message);
    return false;
  }
}

// 執行測試
testAPI().then(async () => {
  console.log('\n--- 測試圖片 URL ---');
  const testImageUrl = 'https://raw.githubusercontent.com/flibustier/pokemon-tcg-exchange/refs/heads/main/public/images/cards/cPK_10_001950_00_PUKURINex_RR.webp';
  await testImageURL(testImageUrl);
});
