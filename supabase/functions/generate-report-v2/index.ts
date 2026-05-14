// generate-report-v2/index.ts - 正式版本 v4
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TOPIC_MAP: Record<string, { filePrefix: string; showChart: boolean; reportTopic: string }> = {
  t01: { filePrefix: "destiny", showChart: true,  reportTopic: "三年大運深度解析" },
  t02: { filePrefix: "love2",   showChart: false, reportTopic: "他對你的真實想法" },
  t03: { filePrefix: "year",    showChart: false, reportTopic: "年度行動策略" },
  t04: { filePrefix: "love",    showChart: true,  reportTopic: "你的正緣何時出現" },
  t05: { filePrefix: "fortune", showChart: true,  reportTopic: "財運密碼" },
  t06: { filePrefix: "career",  showChart: true,  reportTopic: "職涯方向" },
  t07: { filePrefix: "aura",    showChart: true,  reportTopic: "氣場能量分析" },
  t08: { filePrefix: "palm",    showChart: false, reportTopic: "手相命盤" },
  t09: { filePrefix: "chakra",  showChart: false, reportTopic: "七大脈輪診斷" },
  t10: { filePrefix: "frequency", showChart: false, reportTopic: "能量頻率分析" },
  t11: { filePrefix: "face",    showChart: false, reportTopic: "面相命運全書" },
  t12: { filePrefix: "soulmate", showChart: false, reportTopic: "靈魂伴侶解析" },
  t13: { filePrefix: "couple",  showChart: false, reportTopic: "雙人合盤分析" },
  t14: { filePrefix: "marry",   showChart: false, reportTopic: "婚前評估報告" },
  t15: { filePrefix: "city",    showChart: false, reportTopic: "移居城市推薦" },
  t16: { filePrefix: "resign",  showChart: true,  reportTopic: "離職留任分析" },
};

const LEGACY_QUIZTYPE_TO_TOPIC_ID: Record<string, string> = {
  destiny: "t01", bazi: "t01", "3year": "t01", threeyear: "t01",
  love2: "t02", loveforecast: "t02", hethink: "t02",
  year: "t03", yearstrategy: "t03", annualstrategy: "t03",
  love: "t04", soulmate_timing: "t04", whenlove: "t04",
  fortune: "t05", wealth: "t05", moneycode: "t05",
  career: "t06", job: "t06", startup: "t06",
  aura: "t07", energy: "t07", auraenergy: "t07",
  palm: "t08", palmistry: "t08", handreading: "t08",
  chakra: "t09", chakras: "t09", sevenchakra: "t09",
  frequency: "t10", energyfreq: "t10", vibration: "t10",
  face: "t11", faceread: "t11", physiognomy: "t11",
  soulmate: "t12", soulmatelook: "t12", twinflame: "t12",
  couple: "t13", compatibility: "t13", coupleanalysis: "t13",
  marry: "t14", marriage: "t14", premarital: "t14",
  city: "t15", relocate: "t15", movecity: "t15",
  resign: "t16", quitjob: "t16", leaveornot: "t16",
};

function normalizeTopicId(raw: string): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (/^t\d{2}$/.test(lower) && TOPIC_MAP[lower]) return lower;
  return LEGACY_QUIZTYPE_TO_TOPIC_ID[lower] || null;
}

const SYSTEM_PROMPT = `你是療療天報告生成引擎。

【核心任務】
根據使用者的八字、紫微斗數命盤、測驗答案，生成高度客製化的報告內容（JSON格式）。

【絕對禁止】
1. 不得自行計算八字或紫微命盤
2. 不得填寫預設分數（如78分、85分）
3. 不得重複使用舊案例的名字（陳曉明、王小美、John等）
4. 不得輸出 HTML、Markdown 或任何非 JSON 格式
5. 資料缺失時，必須填寫 "MISSING_DATA"，不得猜測
6. show_chart=false 時，禁止在文字中提及四柱名稱、主星名稱、宮位名稱，只能轉譯成自然語言

【命盤資料使用規則】
- 命盤資料是最高優先級參考依據
- 必須根據實際命盤特徵生成個人化分析
- 禁止生成套版鼓勵文或每個人內容看起來差不多的分析
- 內容權重：命盤分析（高）> 測驗答案（中高）> 主題專屬規則（高）> 通用鼓勵型空話（低）

【版本規則】
- basic: 核心結論（3-4個重點）
- complete: 核心+展開分析（6-8個欄位）
- deep: 核心+展開+深度策略（10+個欄位）

【品牌語氣】
溫暖、專業、療癒，用繁體中文，避免恐嚇性語言。

【輸出規則】
只輸出純 JSON，不要加任何解釋、不要加 JSON code block 標記、不要加換行前綴。`;

function getAISchema(topicId: string, version: string): string {
  const isBasic = version === "basic";
  const isComplete = version === "complete";

  switch (topicId) {
    case "t01":
      if (isBasic) return JSON.stringify({ overall_score:"（根據命盤實際分析，1-100整數，不得預設）", destiny_main_theme:"本命格局的核心主題（2-3句）", destiny_personality_overview:"性格特質概述（3-4句）", destiny_core_analysis:"三年大運核心走勢（4-5句，必須參考命盤）", turning_point:"關鍵轉折時間點（具體月份說明）" });
      if (isComplete) return JSON.stringify({ overall_score:"（根據命盤實際分析，1-100整數）", destiny_main_theme:"本命格局的核心主題（2-3句）", destiny_personality_overview:"性格特質概述（3-4句）", destiny_core_analysis:"三年大運核心走勢（5-6句）", destiny_year_fortune:"逐年運勢概述（第1/2/3年各2句）", destiny_strength:"命盤最強的優勢（3點）", destiny_challenge:"需要突破的挑戰（2點）", turning_point:"關鍵轉折時間點" });
      return JSON.stringify({ overall_score:"（根據命盤實際分析，1-100整數）", destiny_main_theme:"本命格局的核心主題（2-3句）", destiny_personality_overview:"性格特質深度分析（5-6句）", destiny_core_analysis:"三年大運核心走勢（6-7句）", destiny_year_fortune:"逐年運勢詳析（第1/2/3年各3-4句）", destiny_strength:"命盤最強的優勢（4點）", destiny_challenge:"需要突破的挑戰（3點，含應對策略）", destiny_strategy:"三年行動策略建議（分工作/感情/財富三方向）", turning_point:"關鍵轉折時間點（具體月份+應對方式）" });

    case "t02":
      if (isBasic) return JSON.stringify({ overall_score:"（雙方契合度分析，1-100整數）", love2_core_reading:"對方對你的核心感受（3-4句）", love2_partner_feeling:"對方目前的情感狀態（2-3句）", love2_timing:"最佳互動時機（1-2句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（雙方契合度分析，1-100整數）", love2_core_reading:"對方對你的核心感受（4-5句）", love2_partner_feeling:"對方目前的情感狀態（3-4句）", love2_3month_forecast:"未來3個月感情發展預測", love2_action_advice:"建議的互動行動（3點）", love2_timing:"最佳互動時機" });
      return JSON.stringify({ overall_score:"（雙方契合度分析，1-100整數）", love2_core_reading:"對方對你的核心感受深度解析（5-6句）", love2_partner_feeling:"對方目前的情感狀態與心理（4-5句）", love2_3month_forecast:"未來3個月感情發展詳細預測", love2_action_advice:"建議的互動行動與策略（5點）", love2_timing:"最佳互動時機與方式" });

    case "t03":
      if (isBasic) return JSON.stringify({ overall_score:"（年度整體能量評估，1-100整數）", year_main_strategy:"年度核心策略主軸（3-4句）", year_core_insight:"今年命盤最重要的啟示（2-3句）", month_energy_summary:"全年能量節奏簡述" });
      if (isComplete) return JSON.stringify({ overall_score:"（年度整體能量評估，1-100整數）", year_main_strategy:"年度核心策略主軸（4-5句）", year_core_insight:"今年命盤最重要的啟示（3-4句）", year_q1:"第一季重點與建議", year_q2:"第二季重點與建議", year_q3:"第三季重點與建議", year_q4:"第四季重點與建議", month_energy_summary:"全年能量節奏說明", month_rhythm_table:"月份能量表HTML字串" });
      return JSON.stringify({ overall_score:"（年度整體能量評估，1-100整數）", year_main_strategy:"年度核心策略主軸（5-6句）", year_core_insight:"今年命盤最重要的啟示（4-5句）", year_q1:"第一季深度分析與策略", year_q2:"第二季深度分析與策略", year_q3:"第三季深度分析與策略", year_q4:"第四季深度分析與策略", month_energy_summary:"全年能量節奏深度說明", month_rhythm_table:"月份能量表HTML字串（12個月，含能量指數）" });

    case "t04":
      if (isBasic) return JSON.stringify({ overall_score:"（桃花運勢評估，1-100整數）", love_opening_words:"報告開場白（2-3句個人化內容）", love_peak_timing:"最強桃花高峰期（具體月份）", love_core_analysis:"正緣特質核心分析（3-4句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（桃花運勢評估，1-100整數）", love_opening_words:"報告開場白（3-4句）", love_peak_timing:"最強桃花高峰期（具體月份+原因）", love_core_analysis:"正緣特質核心分析（5-6句）", love_partner_profile:"正緣人特質描述", love_time_windows:"桃花時間窗口列表", love_action_advice:"提升桃花運的行動建議（3點）" });
      return JSON.stringify({ overall_score:"（桃花運勢評估，1-100整數）", love_opening_words:"報告開場白（4-5句）", love_peak_timing:"最強桃花高峰期深度分析", love_core_analysis:"正緣特質深度分析（7-8句）", love_partner_profile:"正緣人全面特質描述", love_time_windows:"完整桃花時間窗口（5-6個）", love_action_advice:"提升桃花運的完整策略（5點）" });

    case "t05":
      if (isBasic) return JSON.stringify({ overall_score:"（財運評估，1-100整數）", fortune_personality_type:"財運人格類型（標題+2句說明）", bazi_short_info:"八字財星特徵摘要（2-3句）", fortune_core_theme:"財運核心主題（3-4句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（財運評估，1-100整數）", fortune_personality_type:"財運人格類型（標題+3-4句）", bazi_short_info:"八字財星特徵摘要（3-4句）", fortune_core_theme:"財運核心主題（4-5句）", fortune_wealth_analysis:"財富積累分析", fortune_investment_style:"適合的投資風格", fortune_peak_period:"財運高峰期", fortune_risk_warning:"財務風險提醒（2點）" });
      return JSON.stringify({ overall_score:"（財運評估，1-100整數）", fortune_personality_type:"財運人格類型深度解析", bazi_short_info:"八字財星特徵深度摘要", fortune_core_theme:"財運核心主題深度分析", fortune_wealth_analysis:"財富積累深度分析", fortune_investment_style:"適合的投資風格與策略", fortune_peak_period:"財運高峰期詳析", fortune_risk_warning:"財務風險提醒與應對（3點）" });

    case "t06":
      if (isBasic) return JSON.stringify({ overall_score:"（職涯能量評估，1-100整數）", career_core_conclusion:"職涯核心結論（3-4句）", career_strength:"命盤顯示的職場優勢（3點）", career_best_direction:"最適合的職涯方向（2個方向）" });
      if (isComplete) return JSON.stringify({ overall_score:"（職涯能量評估，1-100整數）", career_core_conclusion:"職涯核心結論（4-5句）", career_strength:"命盤顯示的職場優勢（4點）", career_challenge:"職場挑戰（2-3點）", career_path_analysis:"職涯路徑分析", career_best_direction:"最適合的職涯方向（3個）", career_timing:"職涯重要時機" });
      return JSON.stringify({ overall_score:"（職涯能量評估，1-100整數）", career_core_conclusion:"職涯核心結論深度分析", career_strength:"職場優勢（5點）", career_challenge:"職場挑戰與突破策略（4點）", career_path_analysis:"職涯路徑深度分析", career_best_direction:"最適合的職涯方向（4個）", career_timing:"職涯重要時機完整分析" });

    case "t07":
      if (isBasic) return JSON.stringify({ overall_score:"（氣場強度評估，1-100整數）", aura_color:"氣場主色調", aura_intro_paragraph:"氣場特質概述（3-4句）", aura_core_theme:"核心能量主題（2-3句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（氣場強度評估，1-100整數）", aura_color:"氣場主色調（顏色+象徵意義）", aura_intro_paragraph:"氣場特質概述（4-5句）", aura_core_theme:"核心能量主題（3-4句）", aura_strength_analysis:"氣場優勢分析（3點）", aura_challenge_analysis:"氣場挑戰分析（2點）", aura_repair_detail:"氣場修復建議（3個方法）", aura_practice_advice:"日常能量練習" });
      return JSON.stringify({ overall_score:"（氣場強度評估，1-100整數）", aura_color:"氣場主色調深度解析", aura_intro_paragraph:"氣場特質深度概述（5-6句）", aura_core_theme:"核心能量主題深度分析", aura_strength_analysis:"氣場優勢深度分析（4點）", aura_challenge_analysis:"氣場挑戰與轉化（3點）", aura_repair_detail:"氣場修復完整方案（5個方法）", aura_practice_advice:"日常能量練習系統" });

    case "t08":
      if (isBasic) return JSON.stringify({ overall_score:"（手相整體評估，1-100整數）", palm_intro_summary:"手相整體概述（3-4句）", palm_key1:"第一個關鍵手相特質", palm_key2:"第二個關鍵手相特質", palm_key3:"第三個關鍵手相特質", life_line_analysis:"生命線解析（2-3句）", heart_line_analysis:"感情線解析（2-3句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（手相整體評估，1-100整數）", palm_intro_summary:"手相整體概述（4-5句）", palm_key1:"第一個關鍵手相特質（標題+3-4句）", palm_key2:"第二個關鍵手相特質（標題+3-4句）", palm_key3:"第三個關鍵手相特質（標題+3-4句）", life_line_analysis:"生命線詳細解析", heart_line_analysis:"感情線詳細解析", fate_line_analysis:"事業線詳細解析", head_line_analysis:"智慧線詳細解析", wealth_line_analysis:"財運線詳細解析", palm_suggest_items:"行動建議HTML列表" });
      return JSON.stringify({ overall_score:"（手相整體評估，1-100整數）", palm_intro_summary:"手相整體深度概述", palm_key1:"第一個關鍵手相特質深度解析", palm_key2:"第二個關鍵手相特質深度解析", palm_key3:"第三個關鍵手相特質深度解析", life_line_analysis:"生命線深度解析", heart_line_analysis:"感情線深度解析", fate_line_analysis:"事業線深度解析", head_line_analysis:"智慧線深度解析", wealth_line_analysis:"財運線深度解析", palm_mirror_analysis:"手形整體分析", palm_other_lines:"其他重要紋路分析", palm_outlook:"未來展望", palm_suggest_items:"完整行動建議HTML列表" });

    case "t09":
      if (isBasic) return JSON.stringify({ overall_score:"（脈輪整體評估，1-100整數）", core_diagnosis:"脈輪核心診斷（2-3句）", top3_chakra_issues:"前三個需要關注的脈輪", chakra_status_cards:"7個脈輪狀態卡片HTML" });
      if (isComplete) return JSON.stringify({ overall_score:"（脈輪整體評估，1-100整數）", core_diagnosis:"脈輪核心診斷（3-4句）", top3_chakra_issues:"前三個需要關注的脈輪（含建議）", chakra_status_cards:"7個脈輪狀態卡片HTML", chakra_personality_type:"外人看你的脈輪人格（3-4句）", chakra_radar_analysis:"脈輪雷達圖分析文字", chakra_crown_analysis:"頂輪心身分析", chakra_crown_soul_whisper:"頂輪靈魂之語", chakra_third_eye_analysis:"眉心輪心身分析", chakra_third_eye_soul_whisper:"眉心輪靈魂之語", chakra_throat_analysis:"喉輪心身分析", chakra_throat_soul_whisper:"喉輪靈魂之語", chakra_heart_analysis:"心輪心身分析", chakra_heart_soul_whisper:"心輪靈魂之語", chakra_solar_analysis:"太陽神經叢輪心身分析", chakra_solar_soul_whisper:"太陽神經叢輪靈魂之語", chakra_sacral_analysis:"臍輪心身分析", chakra_sacral_soul_whisper:"臍輪靈魂之語", chakra_root_analysis:"海底輪心身分析", chakra_root_soul_whisper:"海底輪靈魂之語" });
      return JSON.stringify({ overall_score:"（脈輪整體評估，1-100整數）", core_diagnosis:"脈輪核心診斷深度分析（4-5句）", top3_chakra_issues:"前三個需要關注的脈輪（深度建議）", chakra_status_cards:"7個脈輪狀態卡片HTML（含詳細描述）", chakra_personality_type:"外人看你的脈輪人格深度分析", chakra_radar_analysis:"脈輪雷達圖深度分析文字", chakra_crown_analysis:"頂輪心身深度分析", chakra_crown_soul_whisper:"頂輪靈魂之語（2句）", chakra_third_eye_analysis:"眉心輪心身深度分析", chakra_third_eye_soul_whisper:"眉心輪靈魂之語", chakra_throat_analysis:"喉輪心身深度分析", chakra_throat_soul_whisper:"喉輪靈魂之語", chakra_heart_analysis:"心輪心身深度分析", chakra_heart_soul_whisper:"心輪靈魂之語", chakra_solar_analysis:"太陽神經叢輪心身深度分析", chakra_solar_soul_whisper:"太陽神經叢輪靈魂之語", chakra_sacral_analysis:"臍輪心身深度分析", chakra_sacral_soul_whisper:"臍輪靈魂之語", chakra_root_analysis:"海底輪心身深度分析", chakra_root_soul_whisper:"海底輪靈魂之語", chakra_healing_plan:"30天療癒計畫" });

    case "t10":
      if (isBasic) return JSON.stringify({ overall_score:"（能量頻率評估，1-100整數）", frequency_score:"頻率數值（數字+Hz單位）", frequency_phase:"頻率階段名稱", frequency_main_diagnosis:"頻率核心診斷（3-4句）", stability_score:"頻率穩定度評分（1-100）" });
      if (isComplete) return JSON.stringify({ overall_score:"（能量頻率評估，1-100整數）", frequency_score:"頻率數值", frequency_phase:"頻率階段名稱（+說明）", frequency_main_diagnosis:"頻率核心診斷（4-5句）", stability_score:"頻率穩定度評分", frequency_core_theme:"能量核心主題", frequency_block_analysis:"能量阻塞分析", frequency_upgrade_path:"頻率提升路徑（3步驟）" });
      return JSON.stringify({ overall_score:"（能量頻率評估，1-100整數）", frequency_score:"頻率數值（含解讀）", frequency_phase:"頻率階段深度說明", frequency_main_diagnosis:"頻率核心診斷深度分析", stability_score:"頻率穩定度評分（含分析）", frequency_core_theme:"能量核心主題深度分析", frequency_block_analysis:"能量阻塞深度分析（4點）", frequency_upgrade_path:"頻率提升完整路徑（5步驟）" });

    case "t11":
      if (isBasic) return JSON.stringify({ overall_score:"（面相整體評估，1-100整數）", face_main_analysis:"面相整體概述（3-4句）", face_upper_stop:"上停（額頭）解析", face_mid_stop:"中停（鼻子）解析", face_lower_stop:"下停（下巴）解析" });
      if (isComplete) return JSON.stringify({ overall_score:"（面相整體評估，1-100整數）", face_main_analysis:"面相整體概述（4-5句）", face_upper_stop:"上停詳細解析", face_mid_stop:"中停詳細解析", face_lower_stop:"下停詳細解析", face_destiny_summary:"命運整體走向", face_wealth_feature:"財運面相特質", face_relationship_feature:"感情緣分特質" });
      return JSON.stringify({ overall_score:"（面相整體評估，1-100整數）", face_main_analysis:"面相整體深度概述", face_upper_stop:"上停深度解析（含早年運）", face_mid_stop:"中停深度解析（含中年運）", face_lower_stop:"下停深度解析（含晚年運）", face_destiny_summary:"命運整體走向深度分析", face_wealth_feature:"財運面相特質深度解析", face_relationship_feature:"感情緣分面相深度解析" });

    case "t12":
      if (isBasic) return JSON.stringify({ overall_score:"（靈魂緣分評估，1-100整數）", soulmate_personality:"靈魂伴侶性格類型（2-3句）", soulmate_timing:"緣分出現時機", soulmate_scene:"初遇場景描述（2-3句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（靈魂緣分評估，1-100整數）", soulmate_personality:"靈魂伴侶性格類型（3-4句）", soulmate_timing:"緣分出現時機", soulmate_scene:"初遇場景描述（3-4句）", soulmate_personality_detail:"對方個性深度描述（3點）", soulmate_trait_1:"第一個關鍵特質", soulmate_trait_2:"第二個關鍵特質", soulmate_love_style:"對方的愛情表達方式", soulmate_meeting_place:"可能相遇的地點（3個）", soulmate_peak_period:"緣分高峰期", soulmate_bazi_interpretation:"命盤桃花宮位解讀（自然語言）", soulmate_action_advice:"提升緣分行動建議（3點）", chart_analysis_text:"命盤分析摘要（自然語言）" });
      return JSON.stringify({ overall_score:"（靈魂緣分評估，1-100整數）", soulmate_personality:"靈魂伴侶性格類型深度分析", soulmate_timing:"緣分出現時機深度解析", soulmate_scene:"初遇場景深度描述", soulmate_personality_detail:"對方個性深度描述（5點）", soulmate_trait_1:"第一個關鍵特質深度解析", soulmate_trait_2:"第二個關鍵特質深度解析", soulmate_love_style:"對方的愛情表達方式深度解析", soulmate_meeting_place:"可能相遇的地點（5個）", soulmate_peak_period:"緣分高峰期詳析", soulmate_bazi_interpretation:"命盤桃花宮位深度解讀", soulmate_action_advice:"提升緣分完整行動建議（5點）", chart_analysis_text:"命盤分析摘要（自然語言）" });

    case "t13":
      if (isBasic) return JSON.stringify({ overall_score:"（雙人契合度評估，1-100整數）", couple_tarot_analysis:"雙人塔羅開場解讀（3-4句）", couple_overview:"雙人關係整體概覽（3-4句）", couple_core_dynamic:"核心互動動力（2-3句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（雙人契合度評估，1-100整數）", couple_tarot_analysis:"雙人塔羅開場解讀（4-5句）", couple_overview:"雙人關係整體概覽（4-5句）", couple_core_dynamic:"核心互動動力（3-4句）", couple_strength:"雙人關係優勢（3點）", couple_challenge:"雙人關係挑戰（2-3點）", couple_future_forecast:"未來發展預測", couple_action_advice:"強化關係行動建議（3點）" });
      return JSON.stringify({ overall_score:"（雙人契合度評估，1-100整數）", couple_tarot_analysis:"雙人塔羅深度解讀", couple_overview:"雙人關係整體深度概覽", couple_core_dynamic:"核心互動動力深度分析", couple_strength:"雙人關係優勢（5點）", couple_challenge:"雙人關係挑戰與解決（4點）", couple_future_forecast:"未來發展深度預測", couple_action_advice:"強化關係完整行動建議（5點）" });

    case "t14":
      if (isBasic) return JSON.stringify({ overall_score:"（婚姻契合度評估，1-100整數）", marry_compatibility_score:"結婚適合度分數（1-100）", marry_tarot_intro:"塔羅開場解讀（2-3句）", marry_core_assessment:"婚前核心評估結論（3-4句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（婚姻契合度評估，1-100整數）", marry_compatibility_score:"結婚適合度分數（1-100）", marry_tarot_intro:"塔羅開場解讀（3-4句）", marry_core_assessment:"婚前核心評估結論（4-5句）", marry_strongest_reason:"你們最有力的結婚理由（3點）", marry_challenge:"婚前必須正視的挑戰（2-3點）", marry_timing_advice:"最佳結婚時機建議" });
      return JSON.stringify({ overall_score:"（婚姻契合度評估，1-100整數）", marry_compatibility_score:"結婚適合度分數（1-100）", marry_tarot_intro:"塔羅深度開場解讀", marry_core_assessment:"婚前核心評估深度結論", marry_strongest_reason:"你們最有力的結婚理由（4-5點）", marry_challenge:"婚前必須正視的挑戰（4點）", marry_timing_advice:"最佳結婚時機深度建議" });

    case "t15":
      if (isBasic) return JSON.stringify({ overall_score:"（移居運勢評估，1-100整數）", city_core_conclusion:"移居核心結論（2-3句）", city_personality_summary:"城市人格類型概述（2-3句）", city_verdict_items:"推薦城市排行HTML列表（前3名）" });
      if (isComplete) return JSON.stringify({ overall_score:"（移居運勢評估，1-100整數）", city_core_conclusion:"移居核心結論（3-4句）", city_personality_summary:"城市人格類型概述（3-4句）", city_verdict_items:"推薦城市排行HTML列表（前5名）", city_personality_detail:"城市人格深度描述", recommended_city_1:"第一推薦城市名稱", city_detail_1:"第一推薦城市詳細說明", city_practical_info_1:"第一推薦城市實用資訊", recommended_city_2:"第二推薦城市名稱", city_detail_2:"第二推薦城市詳細說明", city_practical_info_2:"第二推薦城市實用資訊", recommended_city_3:"第三推薦城市名稱", city_detail_3:"第三推薦城市詳細說明", city_long_term_recommendation:"長期定居建議", city_first_action:"最優先行動建議" });
      return JSON.stringify({ overall_score:"（移居運勢評估，1-100整數）", city_core_conclusion:"移居核心深度結論", city_personality_summary:"城市人格類型深度概述", city_verdict_items:"推薦城市完整排行HTML列表（前7名）", city_personality_detail:"城市人格深度詳析", recommended_city_1:"第一推薦城市名稱", city_detail_1:"第一推薦城市深度說明", city_practical_info_1:"第一推薦城市完整實用資訊", recommended_city_2:"第二推薦城市名稱", city_detail_2:"第二推薦城市深度說明", city_practical_info_2:"第二推薦城市完整實用資訊", recommended_city_3:"第三推薦城市名稱", city_detail_3:"第三推薦城市深度說明", city_long_term_recommendation:"長期定居深度建議", city_first_action:"最優先行動建議（含具體步驟）" });

    case "t16":
      if (isBasic) return JSON.stringify({ overall_score:"（離職評估總分，1-100整數）", stay_score:"留任分數（1-100）", leave_score:"離職分數（1-100）", timing_score:"時機分數（1-100）", risk_score:"風險分數（1-100）", resign_core_recommendation:"核心建議結論（3-4句）", resign_immediate_risk:"立即行動的風險提示（2句）" });
      if (isComplete) return JSON.stringify({ overall_score:"（離職評估總分，1-100整數）", stay_score:"留任分數（1-100）", leave_score:"離職分數（1-100）", timing_score:"時機分數（1-100）", risk_score:"風險分數（1-100）", resign_core_recommendation:"核心建議結論（4-5句）", resign_risk_analysis:"離職風險深度分析", resign_timing_advice:"時機建議", resign_immediate_risk:"立即行動的風險提示", resign_main_concern:"主要疑慮解析（2-3點）", resign_timing_window:"最佳行動時間窗口", resign_chart_insight_1:"命盤對職場運勢的啟示" });
      return JSON.stringify({ overall_score:"（離職評估總分，1-100整數）", stay_score:"留任分數（1-100）", leave_score:"離職分數（1-100）", timing_score:"時機分數（1-100）", risk_score:"風險分數（1-100）", resign_core_recommendation:"核心建議深度結論", resign_risk_analysis:"離職風險深度分析", resign_timing_advice:"時機深度建議（含流年分析）", resign_immediate_risk:"立即行動的風險詳細提示", resign_main_concern:"主要疑慮深度解析（4點）", resign_timing_window:"最佳行動時間窗口（含備選方案）", resign_fallback_timing:"備用時機方案", resign_next_year_q1:"明年第一季的展望", resign_chart_insight_1:"命盤對職場運勢的深度啟示" });

    default:
      return JSON.stringify({ error: `Unknown topicId: ${topicId}` });
  }
}

function buildBaziTableHtml(bazi: Record<string, unknown>): string {
  if (!bazi || typeof bazi !== "object") return "<p>（八字資料不完整）</p>";
  try {
    const pillars = bazi.pillars as Record<string, { heavenlyStem?: string; earthlyBranch?: string }> || {};
    const year = pillars.year || {}; const month = pillars.month || {};
    const day = pillars.day || {}; const hour = pillars.hour || {};
    return `<table class="bazi-table" style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr style="background:#f5f0ff;"><th style="padding:8px;border:1px solid #ddd;">柱</th><th style="padding:8px;border:1px solid #ddd;">年柱</th><th style="padding:8px;border:1px solid #ddd;">月柱</th><th style="padding:8px;border:1px solid #ddd;">日柱</th><th style="padding:8px;border:1px solid #ddd;">時柱</th></tr></thead><tbody><tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">天干</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${year.heavenlyStem || "—"}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${month.heavenlyStem || "—"}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${day.heavenlyStem || "—"}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${hour.heavenlyStem || "—"}</td></tr><tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">地支</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${year.earthlyBranch || "—"}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${month.earthlyBranch || "—"}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${day.earthlyBranch || "—"}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${hour.earthlyBranch || "—"}</td></tr></tbody></table>`;
  } catch { return "<p>（八字資料解析失敗）</p>"; }
}

function buildZiweiTableHtml(ziwei: Record<string, unknown>): string {
  if (!ziwei || typeof ziwei !== "object") return "<p>（紫微斗數資料不完整）</p>";
  try {
    const palaces = ziwei.palaces as Record<string, { mainStar?: string; stems?: string }> || {};
    const mingGong = palaces.mingGong || palaces["命宮"] || {};
    const caiGong = palaces.caiGong || palaces["財帛宮"] || {};
    const guanGong = palaces.guanGong || palaces["官祿宮"] || {};
    const fuQi = palaces.fuQiGong || palaces["夫妻宮"] || {};
    const rows = [
      { label: "命宮", data: mingGong }, { label: "財帛宮", data: caiGong },
      { label: "官祿宮", data: guanGong }, { label: "夫妻宮", data: fuQi },
    ];
    const rowsHtml = rows.map(r => `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${r.label}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${(r.data as Record<string,unknown>).mainStar as string || "—"}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${(r.data as Record<string,unknown>).stems as string || "—"}</td></tr>`).join("");
    return `<table class="ziwei-table" style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr style="background:#fff0f5;"><th style="padding:8px;border:1px solid #ddd;">宮位</th><th style="padding:8px;border:1px solid #ddd;">主星</th><th style="padding:8px;border:1px solid #ddd;">四化</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
  } catch { return "<p>（紫微斗數資料解析失敗）</p>"; }
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }], temperature: 0.8, max_tokens: 4000, response_format: { type: "json_object" } })
  });
  if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function callOpenAIVision(prompt: string, imageUrls: string[], apiKey: string): Promise<string> {
  const imageContent = imageUrls.map(url => ({ type: "image_url", image_url: { url } }));
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: [{ type: "text", text: prompt }, ...imageContent] }], temperature: 0.8, max_tokens: 4000 })
  });
  if (!resp.ok) throw new Error(`OpenAI Vision API error: ${resp.status}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

function buildUserPayload(params: { topicId: string; version: string; userProfile: Record<string, unknown>; bazi: Record<string, unknown>; ziwei: Record<string, unknown>; quizResult: Record<string, unknown>; extraInputs: Record<string, unknown>; showChart: boolean; }): string {
  const { topicId, version, userProfile, bazi, ziwei, quizResult, extraInputs, showChart } = params;
  const userName = (userProfile.name as string) || (userProfile.userName as string) || "使用者";
  const birthDate = (userProfile.birthDate as string) || (userProfile.birth_date as string) || "";
  const gender = (userProfile.gender as string) || "";
  const baziSummary = bazi && Object.keys(bazi).length > 0 ? `八字命盤資料：${JSON.stringify(bazi, null, 2)}` : "（八字資料未提供）";
  const ziweiSummary = ziwei && Object.keys(ziwei).length > 0 ? `紫微斗數命盤資料：${JSON.stringify(ziwei, null, 2)}` : "（紫微資料未提供）";
  const chartNote = showChart ? "【命盤展示模式】本報告將直接呈現命盤，請在分析中明確引用命盤資料。" : "【命盤隱藏模式】本報告不展示命盤術語，但請仍參考命盤進行分析，只輸出自然語言結論。";
  const schema = getAISchema(topicId, version);
  const topicInfo = TOPIC_MAP[topicId];
  let extraContext = "";
  if (extraInputs.partner_profile) extraContext += `\n【對象資料】${JSON.stringify(extraInputs.partner_profile)}`;
  if (extraInputs.palm_features || extraInputs.uploaded_images) extraContext += `\n【手相特徵】${JSON.stringify(extraInputs.palm_features || extraInputs.uploaded_images)}`;
  if (extraInputs.face_features) extraContext += `\n【面相特徵】${JSON.stringify(extraInputs.face_features)}`;
  if (extraInputs.city_candidates) extraContext += `\n【候選城市】${JSON.stringify(extraInputs.city_candidates)}`;
  if (extraInputs.career_options) extraContext += `\n【職涯選項】${JSON.stringify(extraInputs.career_options)}`;
  return `【使用者基本資料】\n姓名：${userName}\n生日：${birthDate}\n性別：${gender}\n報告主題：${topicInfo?.reportTopic || topicId}\n報告版本：${version}\n\n${chartNote}\n\n【八字命盤】（最高優先級參考）\n${baziSummary}\n\n【紫微斗數命盤】（最高優先級參考）\n${ziweiSummary}\n\n【測驗答案與分數】\n${JSON.stringify(quizResult, null, 2)}\n${extraContext}\n\n【重要指示】\n1. 以上命盤資料是最高優先級，必須根據命盤特徵生成個人化內容\n2. 不得生成套版鼓勵文或每個人看起來都差不多的分析\n3. 所有分數必須根據實際分析得出，不得使用任何預設數字\n4. 資料缺失必須填寫 "MISSING_DATA"，不得猜測\n\n請嚴格按照以下 JSON Schema 輸出，不得增減欄位：\n${schema}`;
}

function replacePlaceholders(html: string, aiData: Record<string, unknown>, userProfile: Record<string, unknown>, bazi: Record<string, unknown>, ziwei: Record<string, unknown>, showChart: boolean, topicId: string, extraInputs: Record<string, unknown>): string {
  const ai = (key: string): string => {
    const val = aiData[key];
    if (val === undefined || val === null || val === "") throw new Error(`AI 欄位缺失: ${key}（topic=${topicId}）`);
    return String(val);
  };
  const today = new Date();
  const reportDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const userName = String(userProfile.name || userProfile.userName || "");
  const userBirthDate = String(userProfile.birthDate || userProfile.birth_date || "");
  const partnerName = String((extraInputs.partner_profile as Record<string, unknown>)?.name || extraInputs.partnerName || "");
  const baziHtml = showChart ? buildBaziTableHtml(bazi) : "";
  const ziweiHtml = showChart ? buildZiweiTableHtml(ziwei) : "";
  const chartSectionHtml = showChart ? `\n${baziHtml}\n${ziweiHtml}\n` : "";
  const commonReplacements: Record<string, string> = {
    "{{userName}}": userName, "{{userBirthDate}}": userBirthDate,
    "{{partnerName}}": partnerName, "{{reportDate}}": reportDate,
    "{{bazi_table}}": baziHtml, "{{ziwei_table}}": ziweiHtml,
    "{{chart_section}}": chartSectionHtml,
  };
  const aiReplacements: Record<string, string> = {};
  try { aiReplacements["{{overall_score}}"] = ai("overall_score"); } catch { /* optional */ }
  const topicPlaceholders: Record<string, string[]> = {
    t01: ["destiny_main_theme","destiny_personality_overview","destiny_core_analysis","destiny_year_fortune","destiny_strength","destiny_challenge","destiny_strategy","turning_point"],
    t02: ["love2_core_reading","love2_partner_feeling","love2_3month_forecast","love2_action_advice","love2_timing"],
    t03: ["year_main_strategy","year_core_insight","year_q1","year_q2","year_q3","year_q4","month_energy_summary","month_rhythm_table"],
    t04: ["love_opening_words","love_peak_timing","love_core_analysis","love_partner_profile","love_time_windows","love_action_advice"],
    t05: ["fortune_personality_type","bazi_short_info","fortune_core_theme","fortune_wealth_analysis","fortune_investment_style","fortune_peak_period","fortune_risk_warning"],
    t06: ["career_core_conclusion","career_strength","career_challenge","career_path_analysis","career_best_direction","career_timing"],
    t07: ["aura_color","aura_intro_paragraph","aura_core_theme","aura_strength_analysis","aura_challenge_analysis","aura_repair_detail","aura_practice_advice"],
    t08: ["palm_intro_summary","palm_key1","palm_key2","palm_key3","life_line_analysis","heart_line_analysis","fate_line_analysis","head_line_analysis","wealth_line_analysis","palm_mirror_analysis","palm_other_lines","palm_outlook","palm_suggest_items"],
    t09: ["core_diagnosis","top3_chakra_issues","chakra_status_cards","chakra_personality_type","chakra_radar_analysis","chakra_crown_analysis","chakra_crown_soul_whisper","chakra_third_eye_analysis","chakra_third_eye_soul_whisper","chakra_throat_analysis","chakra_throat_soul_whisper","chakra_heart_analysis","chakra_heart_soul_whisper","chakra_solar_analysis","chakra_solar_soul_whisper","chakra_sacral_analysis","chakra_sacral_soul_whisper","chakra_root_analysis","chakra_root_soul_whisper","chakra_healing_plan"],
    t10: ["frequency_score","frequency_phase","frequency_main_diagnosis","stability_score","frequency_core_theme","frequency_block_analysis","frequency_upgrade_path"],
    t11: ["face_main_analysis","face_upper_stop","face_mid_stop","face_lower_stop","face_destiny_summary","face_wealth_feature","face_relationship_feature"],
    t12: ["soulmate_personality","soulmate_timing","soulmate_scene","soulmate_personality_detail","soulmate_trait_1","soulmate_trait_2","soulmate_love_style","soulmate_meeting_place","soulmate_peak_period","soulmate_bazi_interpretation","soulmate_action_advice","chart_analysis_text"],
    t13: ["couple_tarot_analysis","couple_overview","couple_core_dynamic","couple_strength","couple_challenge","couple_future_forecast","couple_action_advice"],
    t14: ["marry_tarot_intro","marry_core_assessment","marry_strongest_reason","marry_challenge","marry_compatibility_score","marry_timing_advice"],
    t15: ["city_core_conclusion","city_personality_summary","city_verdict_items","city_personality_detail","recommended_city_1","city_detail_1","city_practical_info_1","recommended_city_2","city_detail_2","city_practical_info_2","recommended_city_3","city_detail_3","city_long_term_recommendation","city_first_action"],
    t16: ["resign_core_recommendation","resign_risk_analysis","resign_timing_advice","resign_immediate_risk","resign_main_concern","resign_timing_window","resign_fallback_timing","resign_next_year_q1","resign_chart_insight_1","stay_score","leave_score","timing_score","risk_score"],
  };
  const fields = topicPlaceholders[topicId] || [];
  for (const field of fields) {
    try { aiReplacements[`{{${field}}}`] = ai(field); } catch { /* 版本沒有此欄位 */ }
  }
  let result = html;
  for (const [placeholder, value] of Object.entries(commonReplacements)) {
    result = result.split(placeholder).join(value);
  }
  for (const [placeholder, value] of Object.entries(aiReplacements)) {
    result = result.split(placeholder).join(value);
  }
  return result;
}

function validateAIJson(data: Record<string, unknown>, _topicId: string, _version: string): void {
  if (!data || typeof data !== "object") throw new Error("AI 回傳格式錯誤：不是有效的 JSON 物件");
  if (Object.keys(data).length === 0) throw new Error("AI 回傳空 JSON");
  for (const [k, v] of Object.entries(data)) {
    if (String(v).includes("MISSING_DATA")) throw new Error(`AI 欄位 ${k} 含有 MISSING_DATA，資料缺失無法生成報告`);
  }
}

function validateRenderedReport(html: string, topicId: string, _version: string): void {
  const placeholderMatches = html.match(/\{\{[a-zA-Z_]+\}\}/g);
  if (placeholderMatches && placeholderMatches.length > 0) {
    throw new Error(`報告含有未替換的 placeholder: ${placeholderMatches.join(", ")}`);
  }
  const forbiddenNames = ["陳曉明", "陳聰明", "王小美", "王美麗", "小美", "聰明", "曉明"];
  for (const name of forbiddenNames) {
    if (html.includes(name)) throw new Error(`報告含有禁止的示例名字: ${name}`);
  }
  const topicConfig = TOPIC_MAP[topicId];
  if (topicConfig && !topicConfig.showChart) {
    const chartTableMarkers = ['<table class="bazi-table"', '<table class="ziwei-table"'];
    for (const marker of chartTableMarkers) {
      if (html.includes(marker)) throw new Error(`showChart=false 的報告不得包含命盤表格 HTML: ${marker}`);
    }
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }
  try {
    const body = await req.json();
    const rawTopic = body.topic_id || body.quizType || body.topic || "";
    const topicId = normalizeTopicId(rawTopic);
    if (!topicId) throw new Error(`未知的 topic: "${rawTopic}"，無法找到對應模板。請確認 topic_id 是否正確（t01~t16 或 legacy quizType）。`);
    const topicConfig = TOPIC_MAP[topicId];
    const version = (body.report_version || body.reportLevel || "basic").toLowerCase();
    const showChart = body.show_chart !== undefined ? Boolean(body.show_chart) : topicConfig.showChart;
    const userProfile = body.user_profile || body.userInfo || {};
    const bazi = body.bazi || userProfile.bazi || {};
    const ziwei = body.ziwei || userProfile.ziwei || {};
    const quizResult = body.quiz_result || body.quizAnswers || {};
    const extraInputs = body.extra_inputs || {};
    const htmlTemplate = body.htmlTemplate || body.html_template || "";
    const imageUrls: string[] = body.imageUrls || body.image_urls || [];
    if (!htmlTemplate) throw new Error("缺少 htmlTemplate，無法生成報告");
    const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
    if (!apiKey) throw new Error("OPENAI_API_KEY 未設定");
    const prompt = buildUserPayload({ topicId, version, userProfile, bazi, ziwei, quizResult, extraInputs, showChart });
    let aiRawJson: string;
    if (imageUrls.length > 0 && (topicId === "t08" || topicId === "t11")) {
      aiRawJson = await callOpenAIVision(prompt, imageUrls, apiKey);
    } else {
      aiRawJson = await callOpenAI(prompt, apiKey);
    }
    let aiData: Record<string, unknown>;
    try { aiData = JSON.parse(aiRawJson); }
    catch { throw new Error(`AI 回傳的 JSON 格式無效: ${aiRawJson.substring(0, 200)}`); }
    validateAIJson(aiData, topicId, version);
    const renderedHtml = replacePlaceholders(htmlTemplate, aiData, userProfile, bazi, ziwei, showChart, topicId, extraInputs);
    validateRenderedReport(renderedHtml, topicId, version);
    return new Response(
      JSON.stringify({ success: true, html: renderedHtml, topicId, filePrefix: topicConfig.filePrefix, version, showChart }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error? err.message : String(err);
    console.error("[generate-report-v2] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
