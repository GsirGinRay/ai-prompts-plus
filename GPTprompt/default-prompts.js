/**
 * 預設提示詞模板
 * 根據用戶語言自動載入對應版本
 */

const DefaultPrompts = {
  'zh-TW': [
    {
      id: 'seo_article_zh',
      name: 'SEO 文章撰寫',
      category: '寫作',
      content: `請幫我撰寫一篇關於 [主題] 的 SEO 優化文章。

目標關鍵字：[關鍵字]
目標受眾：[受眾]
文章長度：約 [字數] 字
語氣風格：[語氣]

請確保文章包含：
1. 吸引人的標題（包含關鍵字）
2. 清晰的段落結構（使用 H2、H3 標題）
3. 適當的關鍵字密度（2-3%）
4. 實用的內容價值
5. 明確的 Call-to-Action`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'code_review_zh',
      name: '程式碼審查',
      category: '程式設計',
      content: `請幫我審查以下 [程式語言] 程式碼，重點關注：

1. 程式碼品質和可讀性
2. 潛在的 bug 或錯誤
3. 效能優化建議
4. 安全性問題
5. 最佳實踐建議
6. 是否符合 [程式語言] 的慣例

程式碼：
[程式碼內容]

請提供具體的改善建議和修改後的程式碼。`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'social_media_post_zh',
      name: '社群媒體貼文',
      category: '行銷',
      content: `請為 [平台] 撰寫一則關於 [主題] 的社群媒體貼文。

目標受眾：[受眾]
貼文語氣：[語氣]
字數限制：[字數]

請包含：
- 吸引人的開頭（前 3 秒抓住注意力）
- 清晰的價值主張
- 3-5 個相關標籤建議
- 強而有力的行動呼籲（CTA）

如果是 Instagram，請加上表情符號增加視覺吸引力。`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'email_writer_zh',
      name: '商業郵件撰寫',
      category: '商務',
      content: `請幫我撰寫一封專業的商業郵件。

收件人：[收件人]
主旨：[主旨]
目的：[郵件目的]
語氣：[正式/友善/說服]

背景資訊：
[背景說明]

請確保郵件：
1. 主旨明確且吸引人
2. 開頭有禮貌的問候
3. 內容清晰、簡潔、有條理
4. 包含明確的行動要求
5. 結尾專業且友善`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'data_analysis_zh',
      name: '數據分析報告',
      category: '分析',
      content: `請幫我分析以下數據並撰寫報告。

數據主題：[主題]
數據期間：[時間範圍]
關注指標：[關鍵指標]

數據：
[貼上數據或描述]

請提供：
1. 數據摘要（主要發現）
2. 趨勢分析（上升/下降/穩定）
3. 異常值說明
4. 可能的原因分析
5. 具體的行動建議
6. 視覺化建議（圖表類型）`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'translation_polish_zh',
      name: '翻譯與潤飾',
      category: '語言',
      content: `請將以下 [來源語言] 文字翻譯成 [目標語言]，並進行潤飾。

翻譯類型：[商業/技術/文學/日常]
語氣要求：[正式/口語/專業]

原文：
[原文內容]

要求：
1. 保持原意準確
2. 符合目標語言的習慣用法
3. 注意文化差異
4. 術語翻譯一致
5. 提供翻譯說明（如有特殊處理）`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'learning_tutor_zh',
      name: '學習輔導教師',
      category: '教育',
      content: `請擔任 [科目] 的學習輔導教師，幫我理解以下主題。

主題：[主題名稱]
我的程度：[初學者/中級/進階]
學習目標：[具體目標]

我的問題：
[具體問題]

請：
1. 用簡單易懂的方式解釋
2. 提供實際例子
3. 指出常見錯誤
4. 給予練習建議
5. 推薦延伸學習資源`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'brainstorm_zh',
      name: '創意發想助手',
      category: '創意',
      content: `我需要針對 [主題] 進行創意發想。

專案類型：[產品/服務/活動/內容]
目標受眾：[受眾]
限制條件：[預算/時間/資源限制]
期望方向：[創新/實用/有趣]

請幫我：
1. 產生 10 個創意點子
2. 每個點子都要有簡短說明
3. 標註執行難度（簡單/中等/困難）
4. 列出潛在優勢
5. 指出可能的挑戰

請優先考慮創新且可執行的想法。`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'meeting_summary_zh',
      name: '會議記錄整理',
      category: '商務',
      content: `請幫我整理以下會議記錄。

會議主題：[主題]
會議日期：[日期]
參與人員：[人員]

會議原始記錄：
[貼上會議記錄或錄音逐字稿]

請整理成：
1. 會議摘要（100 字內）
2. 討論重點（條列式）
3. 決議事項（明確的行動）
4. 待辦事項（負責人 + 期限）
5. 下次會議議程建議`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'product_description_zh',
      name: '產品描述文案',
      category: '行銷',
      content: `請為以下產品撰寫吸引人的描述文案。

產品名稱：[產品名稱]
產品類型：[類型]
目標客群：[客群]
主要功能：[核心功能]
競爭優勢：[優勢]

請撰寫：
1. 產品標題（吸引眼球）
2. 簡短描述（30 字內）
3. 詳細說明（100-150 字）
4. 3-5 個核心賣點（bullet points）
5. 購買理由（為什麼現在就該買）
6. Call-to-Action 文案`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    }
  ],

  'en': [
    {
      id: 'seo_article_en',
      name: 'SEO Article Writing',
      category: 'Writing',
      content: `Please write an SEO-optimized article about [topic].

Target Keyword: [keyword]
Target Audience: [audience]
Word Count: approximately [word_count] words
Tone: [tone]

Please ensure the article includes:
1. Compelling title (with keyword)
2. Clear paragraph structure (use H2, H3 headings)
3. Appropriate keyword density (2-3%)
4. Valuable and practical content
5. Clear Call-to-Action`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'code_review_en',
      name: 'Code Review',
      category: 'Programming',
      content: `Please review the following [programming_language] code, focusing on:

1. Code quality and readability
2. Potential bugs or errors
3. Performance optimization suggestions
4. Security issues
5. Best practice recommendations
6. Compliance with [programming_language] conventions

Code:
[code_content]

Please provide specific improvement suggestions and refactored code.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'social_media_post_en',
      name: 'Social Media Post',
      category: 'Marketing',
      content: `Please write a social media post about [topic] for [platform].

Target Audience: [audience]
Post Tone: [tone]
Character Limit: [character_limit]

Please include:
- Attention-grabbing opening (hook in first 3 seconds)
- Clear value proposition
- 3-5 relevant hashtag suggestions
- Strong Call-to-Action (CTA)

For Instagram, add emojis for visual appeal.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'email_writer_en',
      name: 'Business Email Writer',
      category: 'Business',
      content: `Please help me write a professional business email.

Recipient: [recipient]
Subject: [subject]
Purpose: [purpose]
Tone: [formal/friendly/persuasive]

Background Information:
[background]

Please ensure the email:
1. Has a clear and compelling subject line
2. Opens with a polite greeting
3. Is clear, concise, and well-organized
4. Contains a specific call-to-action
5. Closes professionally and courteously`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'data_analysis_en',
      name: 'Data Analysis Report',
      category: 'Analysis',
      content: `Please analyze the following data and write a report.

Data Topic: [topic]
Time Period: [time_range]
Key Metrics: [metrics]

Data:
[paste data or description]

Please provide:
1. Data summary (key findings)
2. Trend analysis (rising/declining/stable)
3. Outlier explanations
4. Potential cause analysis
5. Specific actionable recommendations
6. Visualization suggestions (chart types)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'translation_polish_en',
      name: 'Translation & Polish',
      category: 'Language',
      content: `Please translate the following text from [source_language] to [target_language] and polish it.

Translation Type: [business/technical/literary/casual]
Tone Requirement: [formal/conversational/professional]

Original Text:
[original_content]

Requirements:
1. Maintain accurate meaning
2. Follow target language conventions
3. Consider cultural differences
4. Ensure consistent terminology
5. Provide translation notes (if any special handling)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'learning_tutor_en',
      name: 'Learning Tutor',
      category: 'Education',
      content: `Please act as a tutor for [subject] and help me understand the following topic.

Topic: [topic_name]
My Level: [beginner/intermediate/advanced]
Learning Goal: [specific_goal]

My Question:
[specific_question]

Please:
1. Explain in simple, understandable terms
2. Provide practical examples
3. Point out common mistakes
4. Suggest practice exercises
5. Recommend additional learning resources`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'brainstorm_en',
      name: 'Creative Brainstorming',
      category: 'Creativity',
      content: `I need creative ideas for [topic].

Project Type: [product/service/event/content]
Target Audience: [audience]
Constraints: [budget/time/resource_constraints]
Desired Direction: [innovative/practical/fun]

Please help me:
1. Generate 10 creative ideas
2. Provide brief description for each
3. Mark execution difficulty (easy/medium/hard)
4. List potential advantages
5. Identify possible challenges

Please prioritize innovative yet executable ideas.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'meeting_summary_en',
      name: 'Meeting Minutes Summary',
      category: 'Business',
      content: `Please help me organize the following meeting minutes.

Meeting Topic: [topic]
Meeting Date: [date]
Participants: [participants]

Original Meeting Notes:
[paste meeting notes or transcript]

Please organize into:
1. Meeting summary (within 100 words)
2. Discussion highlights (bullet points)
3. Decisions made (specific actions)
4. Action items (assignee + deadline)
5. Next meeting agenda suggestions`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'product_description_en',
      name: 'Product Description Copy',
      category: 'Marketing',
      content: `Please write compelling product description copy for the following product.

Product Name: [product_name]
Product Type: [type]
Target Customer: [customer]
Main Features: [core_features]
Competitive Advantage: [advantage]

Please write:
1. Product title (attention-grabbing)
2. Short description (within 30 words)
3. Detailed description (100-150 words)
4. 3-5 core selling points (bullet points)
5. Reasons to buy (why buy now)
6. Call-to-Action copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    }
  ],

  /**
   * 根據語言獲取預設提示詞
   */
  getDefaultPrompts(lang) {
    // 如果是中文（繁體或簡體），返回中文版本
    if (lang.startsWith('zh')) {
      return this['zh-TW'];
    }
    // 其他語言都返回英文版本
    return this['en'];
  },

  /**
   * 根據瀏覽器語言自動獲取
   */
  getByBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    return this.getDefaultPrompts(browserLang);
  }
};

// 如果在 window 環境中，將其掛載到 window
if (typeof window !== 'undefined') {
  window.DefaultPrompts = DefaultPrompts;
}
