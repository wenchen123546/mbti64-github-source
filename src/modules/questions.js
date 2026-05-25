
// --- 120 題題庫（每次隨機抽取 72 題，每維度 12 題） ---
// 優化重點：
// ① 去除文化特定情境（KTV、特定消費場所），適合所有人
// ② weight 2 與 weight 1 的選項有明顯的行為差異，不再過於相似
// ③ 題目語氣自然，情境具代入感但不假設職業、家庭狀況或生活型態
// ④ S/N 題目嚴格區分「具體/抽象」，不混淆 Fi（個人價值觀）
// ⑤ T/F 題目聚焦「邏輯/價值」決策方式，不混淆 E/I（社交能量）
const questions = [

    // --- Round 1：社交互動 ---
    {
        dimension: "E_I",
        text: "在一個全是陌生人的場合（如活動、課程或聚會），你自然會？",
        options: [
            { text: "主動找幾個人打招呼，很享受認識新朋友帶來的刺激感", trait: "E", weight: 2 },
            { text: "找旁邊的人聊聊，在小圈圈裡感覺還算自在", trait: "E", weight: 1 },
            { text: "等有共同話題的人主動來找你，不太會刻意開口", trait: "I", weight: 1 },
            { text: "待在不起眼的地方，全程感覺像在消耗能量，能早點離開最好", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "朋友約你參加一個你完全不熟悉的新活動，你最先想到的問題是？",
        options: [
            { text: "具體問清楚時間、地點、費用和活動流程，有了這些才放心決定", trait: "S", weight: 2 },
            { text: "了解大概在做什麼，確認自己不會完全格格不入", trait: "S", weight: 1 },
            { text: "好奇這個活動會帶來什麼不一樣的體驗或視角", trait: "N", weight: 1 },
            { text: "想像它是否會開啟某種全新的生活方式或圈子", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "和身邊的人出現意見衝突時，你最在意的是什麼？",
        options: [
            { text: "找出哪個立場在邏輯上更站得住腳，不管它來自誰", trait: "T", weight: 2 },
            { text: "把雙方的論點釐清楚，避免因誤解而產生不必要的摩擦", trait: "T", weight: 1 },
            { text: "確保每個人都感覺被聽見，就算最後結論不照自己的意思也沒關係", trait: "F", weight: 1 },
            { text: "維護關係的和諧，寧可讓步也不願讓氣氛變得緊張", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "這週有好幾件事要做，但沒有外力強制你的截止時間，你會怎麼處理？",
        options: [
            { text: "自己給每件事設截止日期，並認真遵守，否則內心會有壓迫感", trait: "J", weight: 2 },
            { text: "大致排出先後順序，有個方向就夠了，不需要分秒必爭", trait: "J", weight: 1 },
            { text: "看每天的狀態決定先做哪個，靈活地調整，事情都會做完的", trait: "P", weight: 1 },
            { text: "幾乎不做計畫，等感覺對了或不得不做時才行動", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "生活中突然需要做一個不小的決定（如換住所、報名某個課程），你通常？",
        options: [
            { text: "靠直覺加上幾個關鍵考量，很快就能拍板定案", trait: "A", weight: 2 },
            { text: "想清楚最重要的幾點後，能在相對短的時間內做決定", trait: "A", weight: 1 },
            { text: "花比較長的時間蒐集資料比較，有時覺得自己想太多了", trait: "O", weight: 1 },
            { text: "在各種可能性之間仔細權衡，寧願多花時間也不願倉促做出可能後悔的決定", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你的朋友在你面前抱怨另一個朋友，但你覺得被抱怨的那方其實也沒什麼大問題，你會？",
        options: [
            { text: "順著他說，幫他抒發情緒，不急著評判誰對誰錯", trait: "H", weight: 2 },
            { text: "傾聽為主，再委婉提一下另一方可能的角度", trait: "H", weight: 1 },
            { text: "平靜說出你的真實看法，包括你覺得對方也有道理的部分", trait: "C", weight: 1 },
            { text: "直接告訴他你認為另一方沒什麼問題，真正的朋友不能只有一種聲音", trait: "C", weight: 2 }
        ]
    },

    // --- Round 2：消費與選擇 ---
    {
        dimension: "E_I",
        text: "你在實體店裡挑選商品，店員主動過來詢問是否需要協助，你的反應通常是？",
        options: [
            { text: "大方邀請對方一起參謀，享受有人互動的購物過程", trait: "E", weight: 2 },
            { text: "簡短說明需求，接受對方的建議，覺得有人協助還不錯", trait: "E", weight: 1 },
            { text: "禮貌說謝謝，表示自己看一下就好，偏好自己做決定", trait: "I", weight: 1 },
            { text: "覺得有點被打擾，婉拒後盡量避免再次目光接觸，只想安靜地逛", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "準備購買一樣對你而言重要的東西（如手機、電腦），你的決策主要依據是？",
        options: [
            { text: "具體的規格數據、評測分數和保固條件等可量化的客觀條件", trait: "S", weight: 2 },
            { text: "實際使用者的反饋，以及能否解決你日常的具體需求", trait: "S", weight: 1 },
            { text: "是否有創新之處，或是否帶來你覺得有意思的全新體驗", trait: "N", weight: 1 },
            { text: "它代表的未來趨勢和技術潛力，想像它能如何改變你未來的使用方式", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "朋友熱情地邀你一起參與一件你覺得沒什麼實質意義的事，你會？",
        options: [
            { text: "直接說明你覺得這沒什麼意義並婉拒，不會因面子而勉強自己", trait: "T", weight: 2 },
            { text: "用比較客觀的理由（如時間或預算）來委婉拒絕", trait: "T", weight: 1 },
            { text: "雖然覺得不太需要，但不想掃朋友的興，可能就答應了", trait: "F", weight: 1 },
            { text: "朋友的心意比活動本身重要，他會開心就是最大的意義，你樂意一起去", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "你要去採買一週所需的生活用品，你的習慣是？",
        options: [
            { text: "事先列好清單，按清單走，買完就離開，效率至上", trait: "J", weight: 2 },
            { text: "心裡知道大概需要什麼，有方向但偶爾會多拿幾樣順眼的東西", trait: "J", weight: 1 },
            { text: "邊逛邊決定，常買到一些「看起來不錯」但沒計畫到的東西", trait: "P", weight: 1 },
            { text: "把這件事當成探索體驗，隨心所欲挑選，結帳時自己也不確定買了什麼", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "在網路上看到一個心動的商品，你的結帳流程通常是？",
        options: [
            { text: "確認在預算內就直接買，不需要多想", trait: "A", weight: 2 },
            { text: "稍微比較一下評價或其他選項，很快就能下決定", trait: "A", weight: 1 },
            { text: "放進購物車觀望幾天，反覆看評價，生怕買到不適合的", trait: "O", weight: 1 },
            { text: "研究到後來選項太多，有時反而決定等打折或以後再說", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "遇到非常強勢的推銷，一直向你推薦你根本不需要的東西，你會？",
        options: [
            { text: "覺得對方可能有自己的壓力，耐心聽完，再用很委婉的方式說不需要", trait: "H", weight: 2 },
            { text: "維持微笑，重複說「我再考慮看看」，用時間讓對方放棄", trait: "H", weight: 1 },
            { text: "明確且不帶情緒地說「我不需要，謝謝」，然後結束對話", trait: "C", weight: 1 },
            { text: "直接打斷並要求對方停止，覺得浪費彼此時間的事越早結束越好", trait: "C", weight: 2 }
        ]
    },

    // --- Round 3：媒體與娛樂 ---
    {
        dimension: "E_I",
        text: "假設你有一個完整的下午可以自由運用，你最自然的選擇是？",
        options: [
            { text: "約幾個朋友出來，或去人多熱鬧的地方感受氣氛", trait: "E", weight: 2 },
            { text: "安排一個輕鬆的社交活動，有人陪著就好，不需要太正式", trait: "E", weight: 1 },
            { text: "窩在家裡，追劇、閱讀或做自己的事，偶爾回個訊息就夠了", trait: "I", weight: 1 },
            { text: "徹底的一個人時光，把通知全關掉，完全沉浸在自己的世界裡", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "看電影或影集時，什麼樣的內容最能讓你全程投入？",
        options: [
            { text: "細節考究、貼近現實、情節發展清晰的故事", trait: "S", weight: 2 },
            { text: "角色互動真實有趣、劇情推進明確、讓你身歷其境的敘事", trait: "S", weight: 1 },
            { text: "充滿隱喻或伏筆、需要稍微思考才能解讀的敘事方式", trait: "N", weight: 1 },
            { text: "探討深刻主題的哲理故事，或完全超脫現實邏輯的奇幻世界", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "看劇時，反派最後揭露了他有非常悲慘的過去，你的反應是？",
        options: [
            { text: "理解他的遭遇，但認為過去不構成免責理由，他的行為仍需承擔後果", trait: "T", weight: 2 },
            { text: "能同情他的處境，但仍會客觀分析他的行為選擇是否合理", trait: "T", weight: 1 },
            { text: "開始對這個角色有了同情，對他的反感大幅降低", trait: "F", weight: 1 },
            { text: "完全被他的痛苦所感動，甚至覺得是社會辜負了他", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "追一部剛上架、共十集的熱門影集，你的進度通常是？",
        options: [
            { text: "計畫每天看一兩集，有紀律地分散欣賞，不會一口氣全看完", trait: "J", weight: 2 },
            { text: "大致分配一下時間，這幾天陸續有計畫地看完", trait: "J", weight: 1 },
            { text: "本來只打算看一集，結果常不小心熬夜追了大半", trait: "P", weight: 1 },
            { text: "完全不控制，直接一口氣追完才罷休，享受沉浸式的爆看體驗", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "打開串流平台要選今晚看什麼，你通常怎麼做？",
        options: [
            { text: "第一眼看到覺得不錯的就點進去，不好看再換，不糾結", trait: "A", weight: 2 },
            { text: "快速看一下推薦或排行，幾分鐘內選定並開始看", trait: "A", weight: 1 },
            { text: "把好幾部的預告看過一輪，猶豫很久，不確定哪部最符合今天心情", trait: "O", weight: 1 },
            { text: "片單滑了好幾遍，認真比較評分和劇情介紹，可能花了太多時間比較，決定等下次再看", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "朋友極力推薦的內容，你體驗後覺得邏輯漏洞很多，他事後問你感想，你會說？",
        options: [
            { text: "努力找出幾個值得稱讚的地方大力誇獎，把不喜歡的部分留在心裡", trait: "H", weight: 2 },
            { text: "笑說「還不錯啊，某幾段有意思」，輕描淡寫地帶過不喜歡的部分", trait: "H", weight: 1 },
            { text: "平靜說出你不喜歡的地方，並指出幾個你認為的問題，和他討論", trait: "C", weight: 1 },
            { text: "直接給出負評，認為好朋友之間就該能坦誠交流，不管對方是否推薦", trait: "C", weight: 2 }
        ]
    },

    // --- Round 4：居住與空間 ---
    {
        dimension: "E_I",
        text: "如果可以自由選擇住在哪裡，你會比較想要？",
        options: [
            { text: "市中心或熱鬧地段，樓下就有人群、店家和各種活動", trait: "E", weight: 2 },
            { text: "交通方便的生活圈，附近有幾家熟悉的店，偶爾能和人互動", trait: "E", weight: 1 },
            { text: "鬧中取靜的地方，有自己的私人空間，不容易被打擾", trait: "I", weight: 1 },
            { text: "遠離塵囂的環境，越少鄰居越好，享受極致的安靜與隱私", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "你想重新佈置自己的生活空間，切入點會是？",
        options: [
            { text: "先測量尺寸、確認動線流暢、確保收納空間充足，以實用為最高原則", trait: "S", weight: 2 },
            { text: "選好耐用的材質和實用的傢俱，確保日常機能沒有缺口", trait: "S", weight: 1 },
            { text: "先決定想呈現什麼樣的氛圍或風格，再尋找能搭配主題的物件", trait: "N", weight: 1 },
            { text: "把空間視為表達自我美學與靈魂的畫布，不在意是否符合「正常」的住家樣貌", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "如果和人同住，因為生活習慣不同而起摩擦，你的處理方式是？",
        options: [
            { text: "提出具體的共同規則，要求雙方都照著來，減少灰色地帶", trait: "T", weight: 2 },
            { text: "理性討論各自的需求，找出一個對雙方都算公平的妥協方案", trait: "T", weight: 1 },
            { text: "先確認對方的心情，等氣氛平和了再討論，過程中願意多體諒", trait: "F", weight: 1 },
            { text: "以維持和諧為優先，只要對方不是太過分，自己多退一步也無妨", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "你目前的個人空間（房間、桌面）最接近哪一種狀態？",
        options: [
            { text: "一切歸位、極度整潔，有分類系統，需要什麼馬上找得到", trait: "J", weight: 2 },
            { text: "大致有條理，偶爾有點生活感，但不至於找不到東西", trait: "J", weight: 1 },
            { text: "看起來有點亂，但自己心裡有套「隨性的秩序」，通常能找到需要的", trait: "P", weight: 1 },
            { text: "比較混亂，有時需要花一點時間才能找到某樣東西，但已習慣了", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "某件你一直想做的事（如整理空間、學新技能），你的行動模式通常是？",
        options: [
            { text: "想到就做，沒有太多顧慮，決定了就立刻開始", trait: "A", weight: 2 },
            { text: "評估一下再動手，但不會拖太久，覺得差不多可以了就開始", trait: "A", weight: 1 },
            { text: "常覺得「條件還不夠成熟」，會等到更有把握時才啟動", trait: "O", weight: 1 },
            { text: "需要把前置準備做到自己滿意的程度才能安心開始，有時因此起步較晚", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "朋友向你借一樣對你有點重要的東西，你心裡其實不太想借，你會？",
        options: [
            { text: "想都沒想就說好，事後有點後悔，但不好意思開口說", trait: "H", weight: 2 },
            { text: "有點猶豫，但最後還是借了，同時輕鬆說清楚希望什麼時候還", trait: "H", weight: 1 },
            { text: "想清楚之後直接說你現在不方便借，或說明你的顧慮", trait: "C", weight: 1 },
            { text: "直接說不，並解釋原因，覺得對自己誠實比勉強自己更重要", trait: "C", weight: 2 }
        ]
    },

    // --- Round 5：壓力與挑戰 ---
    {
        dimension: "E_I",
        text: "面對一件讓你壓力很大的事，你的第一個衝動是？",
        options: [
            { text: "馬上找人說，需要有人聽你講、給你反應，一直憋著很難受", trait: "E", weight: 2 },
            { text: "告訴一兩個信任的人，說出來之後感覺輕鬆很多", trait: "E", weight: 1 },
            { text: "想先一個人靜一靜，自己消化一下，不急著跟別人說", trait: "I", weight: 1 },
            { text: "幾乎不會主動說，傾向獨自處理，覺得倒苦水讓自己更狼狽", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "面對一個困難的問題，你比較習慣從哪個方向切入？",
        options: [
            { text: "先蒐集相關的具體事實和數據，逐步分析，找出最務實的解法", trait: "S", weight: 2 },
            { text: "回想過去有沒有類似的情況，用親身經驗或慣用方法來應對", trait: "S", weight: 1 },
            { text: "快速想出幾種可能的解法，再從中找出最有潛力的方向", trait: "N", weight: 1 },
            { text: "跳過「已知方法」，直覺地往沒嘗試過的方向探索，享受發現新路徑", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "身邊的人正在很難過或情緒低落，你的本能反應是？",
        options: [
            { text: "幫他分析可能的原因和解決方案，覺得給出具體幫助比陪著難過更有用", trait: "T", weight: 2 },
            { text: "先問他想要建議還是只是想說說，再視情況提供支持", trait: "T", weight: 1 },
            { text: "先讓他知道你在，願意陪著他，等他準備好才談怎麼辦", trait: "F", weight: 1 },
            { text: "完全進入他的情緒裡，給他全部的注意力和陪伴，方案之後再說", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "事情突然改變計畫，原本的安排全部泡湯，你的反應通常是？",
        options: [
            { text: "感到明顯的不適，需要時間調適，然後重新規劃才能繼續前進", trait: "J", weight: 2 },
            { text: "有點惱，但能接受，很快就會開始想接下來可以怎麼安排", trait: "J", weight: 1 },
            { text: "沒太大差別，感覺隨機發生的事有時反而更有趣", trait: "P", weight: 1 },
            { text: "反而有點興奮，計畫消失代表有了更多即興的彈性空間", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "面對一個你有一點把握、但不確定能否成功的機會，你通常？",
        options: [
            { text: "評估一下勝算，覺得差不多就直接衝，先跳進去再說", trait: "A", weight: 2 },
            { text: "考慮一下，如果大方向看起來可行，就決定去試試", trait: "A", weight: 1 },
            { text: "需要花不少時間想清楚各種風險，問過幾個人的意見才敢決定", trait: "O", weight: 1 },
            { text: "常因需要更充分的把握而選擇觀望，事後有時會遺憾沒有把握住", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "在群體討論中，有人提出一個你認為明顯不合理的觀點，你會？",
        options: [
            { text: "不直接反對，試著找出對方說的某些可取之處，讓氣氛繼續順暢", trait: "H", weight: 2 },
            { text: "用提問或溫和的方式表達你的疑慮，讓對方有機會自己重新思考", trait: "H", weight: 1 },
            { text: "平靜說明你不同意的理由，認為這是正常的討論過程", trait: "C", weight: 1 },
            { text: "直接指出問題所在，覺得讓不合理的觀點通過才是真正不負責任", trait: "C", weight: 2 }
        ]
    },

    // --- Round 6：人際與情緒 ---
    {
        dimension: "E_I",
        text: "在你生命中，什麼樣的互動最能讓你感到有活力、充滿能量？",
        options: [
            { text: "和一群人熱鬧地互動，在群體中感受到自己被需要的感覺", trait: "E", weight: 2 },
            { text: "和幾個朋友輕鬆聊天，分享彼此的近況和想法", trait: "E", weight: 1 },
            { text: "和一個真正了解你的人深聊，不需要表演，能說真心話", trait: "I", weight: 1 },
            { text: "一個人安靜地沉浸在自己的事物中，完全不受外界干擾", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "你最欣賞、也最想深入認識的人通常具備什麼特質？",
        options: [
            { text: "生活踏實、有責任感、說到做到的人，讓你感到安心可靠", trait: "S", weight: 2 },
            { text: "有共同的具體喜好（如運動、興趣），相處起來自然不費力的人", trait: "S", weight: 1 },
            { text: "思考跳脫常規、有獨特觀點，能和你碰撞出有趣想法的人", trait: "N", weight: 1 },
            { text: "充滿未來願景、總在探索各種可能性，和你聊天常讓你看到全新視角的人", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "你在思考是否要做一件你很想做的事，但它在現實層面不太「合理」，你的思考重心是？",
        options: [
            { text: "仔細評估實際的可行性和機會成本，不合理就果斷放棄", trait: "T", weight: 2 },
            { text: "分析風險和報酬，如果邏輯上缺口太大就暫時擱置", trait: "T", weight: 1 },
            { text: "雖然理性上有疑慮，但如果內心覺得這件事很重要，會想辦法克服", trait: "F", weight: 1 },
            { text: "如果這件事和你的核心價值觀深度契合，就算不合理也覺得值得嘗試", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "對於你在乎的人的特殊紀念日，你的習慣是？",
        options: [
            { text: "提前幾週就開始規劃，訂好地點、備好禮物，確保一切萬無一失", trait: "J", weight: 2 },
            { text: "心裡提前有底要怎麼慶祝，至少會先確認好主要的安排", trait: "J", weight: 1 },
            { text: "通常到前幾天才開始想，傾向給出隨興但有誠意的驚喜", trait: "P", weight: 1 },
            { text: "不拘泥特定形式，可能當天靈機一動帶對方去經歷一場未知的冒險", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "當你意識到某段關係已經讓你持續內耗，你的行動力是？",
        options: [
            { text: "果斷設停損點，快刀斬亂麻，立刻拉開距離不回頭", trait: "A", weight: 2 },
            { text: "理性評估後決定漸行漸遠，慢慢把重心轉回自己身上", trait: "A", weight: 1 },
            { text: "心裡知道該抽離，但反覆考慮各種可能的後果和影響，遲遲無法做最後決定", trait: "O", weight: 1 },
            { text: "心裡知道該放手，但會反覆衡量各種因素，需要很長時間才能做出最後決定", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你發現一個不太熟的朋友正在轉發你確定是錯誤的資訊，你會？",
        options: [
            { text: "選擇不說什麼，覺得和不太熟的人起衝突很尷尬", trait: "H", weight: 2 },
            { text: "私訊他分享一下你找到的更準確資訊，語氣輕鬆不帶批判", trait: "H", weight: 1 },
            { text: "清楚地告知對方這則資訊有誤，並附上正確來源", trait: "C", weight: 1 },
            { text: "直接公開指出這是錯的，覺得讓錯誤資訊繼續流傳才是真正的問題", trait: "C", weight: 2 }
        ]
    },

    // --- Round 7：學習與成長 ---
    {
        dimension: "E_I",
        text: "學習一項新技能或參加某個課程，你比較傾向哪種方式？",
        options: [
            { text: "主動發問、和老師同學互動，群體學習讓你進步更快也更有動力", trait: "E", weight: 2 },
            { text: "喜歡有課堂討論和同伴一起學，有人陪著比較有動力", trait: "E", weight: 1 },
            { text: "偏好自己安靜練習，吸收老師的說明即可，不太需要討論", trait: "I", weight: 1 },
            { text: "最理想是透過自學，完全照自己的節奏來，不需要課堂形式", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "學習一項複雜的新技能或工具，你的入門方式是？",
        options: [
            { text: "仔細閱讀說明文件或教學，照步驟穩紮穩打地打好基礎", trait: "S", weight: 2 },
            { text: "先掌握核心功能，需要什麼再去查，以實際應用為主", trait: "S", weight: 1 },
            { text: "大概瀏覽一下就開始嘗試，從錯誤和摸索中逐漸理解整體邏輯", trait: "N", weight: 1 },
            { text: "跳過說明，直接探索，享受自己發現隱藏功能或捷徑的樂趣", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "對你來說，一個好的老師或帶領者，最重要的特質是？",
        options: [
            { text: "專業知識無懈可擊，講解邏輯清晰，能給出精準的批評與糾正", trait: "T", weight: 2 },
            { text: "有系統地傳授知識，讓你在能力上確實獲得提升", trait: "T", weight: 1 },
            { text: "因材施教、有耐心，在過程中給予你足夠的信心與鼓勵", trait: "F", weight: 1 },
            { text: "對教學充滿熱情，能看見你的獨特潛力，帶給你強烈的啟發感", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "面對一個月後的重要考試或截止期限，你的準備方式是？",
        options: [
            { text: "制定每天的學習進度計畫並嚴格執行，不允許自己拖延", trait: "J", weight: 2 },
            { text: "有進度規劃，確保在最後期限前完成，但有彈性地調整節奏", trait: "J", weight: 1 },
            { text: "看狀態來，有靈感就衝，狀態不好就先擱著，不強迫自己", trait: "P", weight: 1 },
            { text: "前期比較放鬆，依賴最後幾天的高強度衝刺，壓力讓你發揮最好", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "同時看到三個你都想嘗試、主題相近的選項（書、課程、活動），你會？",
        options: [
            { text: "快速決定哪個最優先，馬上選定並開始，不再繼續比較", trait: "A", weight: 2 },
            { text: "稍微比一下，很快就能選出一個，並且不太後悔自己的選擇", trait: "A", weight: 1 },
            { text: "拿不定主意，擔心選錯會後悔，在選項之間反覆掙扎", trait: "O", weight: 1 },
            { text: "難以做出最終選擇，最後可能全部都沒有選，打算回去再研究", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你注意到身邊的人（學生、同事、後輩）用了一種你確定是錯誤的方法，你會？",
        options: [
            { text: "不直接說，用引導性的問題讓他自己發現，盡量不打擊他的信心", trait: "H", weight: 2 },
            { text: "先肯定他的努力，再溫和地提示他可能有更好的做法", trait: "H", weight: 1 },
            { text: "平靜告訴他哪裡錯了，並說明正確的做法，覺得清楚說明才是真的幫忙", trait: "C", weight: 1 },
            { text: "直接指出錯誤並給出正確做法，覺得效率比保護感受更重要", trait: "C", weight: 2 }
        ]
    },

    // --- Round 8：感情與人際衝突 ---
    {
        dimension: "E_I",
        text: "經歷了一次嚴重的人際挫折或失落後，你的恢復方式是？",
        options: [
            { text: "馬上找一群朋友出去，透過熱鬧和社交宣洩情緒", trait: "E", weight: 2 },
            { text: "找兩三個信任的朋友說說話，需要有人陪伴和聆聽", trait: "E", weight: 1 },
            { text: "婉拒一切邀約，先靜靜地閱讀或做自己的事來沉澱心情", trait: "I", weight: 1 },
            { text: "幾乎斷絕外界聯繫，習慣獨自消化，直到完全復原才回歸", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "讀一本書或聽一場演講時，什麼樣的內容最容易讓你產生強烈共鳴或啟發？",
        options: [
            { text: "充滿具體案例、可量化的數據，以及可以直接套用的方法和步驟", trait: "S", weight: 2 },
            { text: "清楚的邏輯脈絡、有真實依據，讓你知道「某件事為什麼有效」", trait: "S", weight: 1 },
            { text: "提出一個嶄新的視角或概念框架，讓你重新理解某件以為已經懂的事", trait: "N", weight: 1 },
            { text: "串連看似無關的領域，揭示出隱藏的深層規律，讓你對世界的理解產生根本性的轉變", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "在執行一件重要任務時，你發現隊友因粗心犯了影響到整體結果的錯誤，你的第一反應是？",
        options: [
            { text: "直接點出錯誤並要求立刻修正，錯誤若不被清楚說明只會再發生", trait: "T", weight: 2 },
            { text: "冷靜說明問題在哪、影響是什麼，再一起討論如何補救", trait: "T", weight: 1 },
            { text: "先確認對方的情緒狀態，以不讓他太難堪的方式提出問題和修正方向", trait: "F", weight: 1 },
            { text: "把傷害降到最低是第一優先，讓對方安心才能讓整件事更順利被處理", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "你對某個你在乎的人提出一個共同計畫（旅行、活動），你的角色通常是？",
        options: [
            { text: "主動承擔規劃工作，把所有細節都安排好，才能真正放鬆享受", trait: "J", weight: 2 },
            { text: "提出幾個大方向的想法，確保主要的事情有底再說", trait: "J", weight: 1 },
            { text: "樂意配合，不太需要提前規劃，到了當下再隨機應變也沒問題", trait: "P", weight: 1 },
            { text: "覺得過度計畫反而會破壞樂趣，最喜歡臨時起意、走到哪算到哪", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "你必須在當天內回覆一封關係到未來方向的重要訊息，你通常會？",
        options: [
            { text: "想清楚了就直接回，對我來說拖著比當下面對更消耗心力", trait: "A", weight: 2 },
            { text: "花一兩個小時整理思緒，確定立場後果斷送出不再猶豫", trait: "A", weight: 1 },
            { text: "寫了好幾版草稿，反覆斟酌用詞和語氣，希望傳達得精準到位", trait: "O", weight: 1 },
            { text: "可能到接近期限才回覆，因為你需要充分思考才對自己的回應有信心", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "有一個不太熟、很久沒聯絡的朋友，突然開口向你借一筆不小的錢，你會？",
        options: [
            { text: "擔心他可能真的有困難，心軟就直接幫忙，不好意思追問太多", trait: "H", weight: 2 },
            { text: "有點錯愕，若金額在可承受範圍內，可能就借了，但同時說清楚還款期望", trait: "H", weight: 1 },
            { text: "冷靜詢問借錢的原因與還款計畫，評估合理性再做決定", trait: "C", weight: 1 },
            { text: "直接拒絕，認為突如其來的財務請求沒有明確理由就不接受", trait: "C", weight: 2 }
        ]
    },

    // --- Round 9：職涯與目標 ---
    {
        dimension: "E_I",
        text: "你理想中的工作或學習環境是？",
        options: [
            { text: "開放式空間，隨時有人互動、討論，充滿動態的協作氣氛", trait: "E", weight: 2 },
            { text: "有自己的位子，但能輕鬆和旁邊的人聊聊，不需要強制互動", trait: "E", weight: 1 },
            { text: "有獨立的作業空間，可以專注處理任務，不受環境干擾", trait: "I", weight: 1 },
            { text: "遠端或獨立工作，主要靠文字溝通，減少不必要的實體社交", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "在規劃未來的發展方向時，你最看重的指標是？",
        options: [
            { text: "明確的成長幅度、穩定性和具體的保障條件", trait: "S", weight: 2 },
            { text: "能累積實際可用的技能，讓自己有穩固的競爭力", trait: "S", weight: 1 },
            { text: "這個方向是否具有發展潛力，能否持續刺激你的思考與成長", trait: "N", weight: 1 },
            { text: "能否實踐你的核心價值觀，發揮影響力，甚至完成某種更大的使命", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "如果要從兩個機會中做選擇，你的決策重心通常是？",
        options: [
            { text: "絕對理性地比較各項客觀條件，用數據說話", trait: "T", weight: 2 },
            { text: "評估哪個選擇對長期發展帶來更大的實質效益", trait: "T", weight: 1 },
            { text: "考量過程中感受到的氛圍，以及是否讓你覺得被尊重", trait: "F", weight: 1 },
            { text: "傾聽內心的直覺，選擇那個讓你感覺有人情味、充滿溫度的選項", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "面對每天繁雜的待辦事項，你的執行習慣是？",
        options: [
            { text: "用清單精確管理，依優先順序嚴格執行，享受一一打勾的成就感", trait: "J", weight: 2 },
            { text: "有意識地確認今天必須完成的幾件事，確保重要的不會漏掉", trait: "J", weight: 1 },
            { text: "知道有些事要做，但執行順序看當下心情，沒有固定模式", trait: "P", weight: 1 },
            { text: "靈活應變，常依當下靈感調整重點，有時會先處理突然浮現的新想法", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "突然收到一個很有吸引力、但完全不在你原本計畫內的大機會，你通常？",
        options: [
            { text: "迅速評估幾個關鍵條件，很短時間內就果斷決定要不要接", trait: "A", weight: 2 },
            { text: "認真考慮一個晚上，隔天能給出明確答覆並立刻著手準備", trait: "A", weight: 1 },
            { text: "需要較長時間思考，反覆詢問身邊的人，怕做出錯誤的選擇", trait: "O", weight: 1 },
            { text: "陷入密集的思考模式，反覆推演各種情境，直到自己完全想清楚才行動", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你正在帶領一個態度很好、但能力不足且一再犯錯的新人，你的方式是？",
        options: [
            { text: "花大量時間溫和地引導，深怕傷到他的自尊，有時甚至默默幫忙善後", trait: "H", weight: 2 },
            { text: "先肯定他的態度，再耐心具體地指出需要改進的地方", trait: "H", weight: 1 },
            { text: "直接拿出標準，平靜告知哪裡不足、需要達到什麼要求", trait: "C", weight: 1 },
            { text: "明確說明現實標準，若屢屢無法改進，會果斷建議他考慮更適合的方向", trait: "C", weight: 2 }
        ]
    },

    // --- Round 10：哲學與自我認識 ---
    {
        dimension: "E_I",
        text: "對你來說，「獨處」是什麼感覺？",
        options: [
            { text: "偶爾還好，但時間一長就覺得空虛，很想回到人群中吸收能量", trait: "E", weight: 2 },
            { text: "是放鬆的方式，但持續太久，還是喜歡有人陪著", trait: "E", weight: 1 },
            { text: "是必要的充電時間，讓你能回到自己的內在世界，恢復狀態", trait: "I", weight: 1 },
            { text: "是生命的養分，只有真正獨處時你才感到完全自由與安定", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "當你一個人靜靜思考時，腦子更常在運轉的是？",
        options: [
            { text: "今天實際發生了什麼事，或接下來要做哪些具體的安排", trait: "S", weight: 2 },
            { text: "回顧某些過去的片段，或盤算近期的事情要怎麼處理比較好", trait: "S", weight: 1 },
            { text: "想像某些事情的各種可能走向，或把不同的想法串連在一起", trait: "N", weight: 1 },
            { text: "探索某些關於意義、存在或宇宙的深刻哲學問題", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "什麼樣的演講、書或故事最能真正打動你？",
        options: [
            { text: "邏輯嚴密、顛覆你既有認知、讓你在智識上獲得巨大滿足的內容", trait: "T", weight: 2 },
            { text: "結構清晰、拆解複雜問題並提供實用策略的內容", trait: "T", weight: 1 },
            { text: "分享克服逆境的真實故事，展現人性的溫暖與情感聯繫", trait: "F", weight: 1 },
            { text: "充滿深度同理心、觸及靈魂深處脆弱感、讓你感到被完全理解的內容", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "對於「未來」和「計畫」，你的信念比較偏向哪一種？",
        options: [
            { text: "未來由自己掌控，嚴謹的計畫加上強大的自律能打造理想人生", trait: "J", weight: 2 },
            { text: "相信努力有回報，設立清楚的目標並穩步前進是對待人生的基本態度", trait: "J", weight: 1 },
            { text: "計畫趕不上變化，保持彈性才能隨時接住生命給的驚喜", trait: "P", weight: 1 },
            { text: "未來是流動且不可預測的，順應自然的節奏比強行規劃更讓你舒服", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "面對「沒有標準答案」的人生問題或選擇，你的態度是？",
        options: [
            { text: "果斷創造屬於自己的答案，選定後就堅定走下去，不再回頭看", trait: "A", weight: 2 },
            { text: "選一個方向先走走看，不適合就換，不會過度擔憂正不正確", trait: "A", weight: 1 },
            { text: "在不同的可能性之間反覆思量，需要大量的內在對話才能逐漸靠近一個方向", trait: "O", weight: 1 },
            { text: "習慣在沒有明確指引的情況下進行深度的自我辯證，享受這個過程但也承認它很耗時", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "朋友因某件事非常生氣，跑來找你時語氣很衝，你的反應是？",
        options: [
            { text: "不在意他的語氣，先安撫他的情緒，怕他一直氣下去會更難受", trait: "H", weight: 2 },
            { text: "心裡知道他只是在發洩，給他空間講完，再慢慢引導他冷靜", trait: "H", weight: 1 },
            { text: "等他發完脾氣，冷靜告訴他你的看法，同時指出他的語氣不太好", trait: "C", weight: 1 },
            { text: "直接打斷他說「先別急，把事情講清楚」，覺得激動的情緒對解決問題沒幫助", trait: "C", weight: 2 }
        ]
    }
,
    {
        dimension: "E_I",
        text: "打電話給一個不熟悉的人（例如客服、新朋友的朋友），你通常會？",
        options: [
            { text: "直接撥出去，邊說邊想，很少提前打草稿", trait: "E", weight: 2 },
            { text: "稍微想一下要說什麼再撥，但不會特別緊張", trait: "E", weight: 1 },
            { text: "在心裡大致演練一遍對話再撥出去", trait: "I", weight: 1 },
            { text: "能傳訊息就絕不打電話，打電話前需要大量的心理建設", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "在日常判斷與決策中，你更傾向依賴哪種類型的資訊？",
        options: [
            { text: "有具體數據和事實支撐的資訊，眼見為憑，看得見摸得著才可靠", trait: "S", weight: 2 },
            { text: "過去累積的具體經驗和已被驗證的方法，對未經證實的新說法保持保守", trait: "S", weight: 1 },
            { text: "隱藏的規律、模式和可能性，即使缺乏完整事實，你的直覺判斷通常也不會差太遠", trait: "N", weight: 1 },
            { text: "以「這只是眾多可能現實之一」的態度看待所有資訊，腦中常同時運轉多個假設與情境", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "評判一個人的行為時，你更傾向依據什麼？",
        options: [
            { text: "他的行為是否符合邏輯和原則，背景因素不太影響我對行為本身的評價", trait: "T", weight: 2 },
            { text: "在充分了解情況後，以盡量客觀的標準評估行為是否合理，不完全憑印象", trait: "T", weight: 1 },
            { text: "他所處的具體情境和行為背後的動機，相同的舉動在不同脈絡下有截然不同的意義", trait: "F", weight: 1 },
            { text: "他的情感狀態、成長背景和個人困境，我更在乎「為什麼這樣做」而非「這樣做對不對」", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "面對工作或學習上的截止期限（Deadline），你的心態通常是？",
        options: [
            { text: "截止日對我是最低標準，我通常提前完成並留有緩衝時間", trait: "J", weight: 2 },
            { text: "截止日是我保持節奏的錨點，我確保不慌不忙地在那之前完成", trait: "J", weight: 1 },
            { text: "截止前的壓力能激發出最佳狀態，雖然有點緊，但通常能趕上", trait: "P", weight: 1 },
            { text: "截止前幾小時是我效率最高的時段，習慣在壓力巔峰中完成重要工作", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "面對一件複雜的工作任務，你最自然的切入方式是？",
        options: [
            { text: "先把所有具體步驟和細節都整理清楚，按部就班地執行", trait: "S", weight: 2 },
            { text: "先確認重要的里程碑和截止日期，再一步步拆解細節", trait: "S", weight: 1 },
            { text: "先在腦中勾勒整體的大框架和最終想達成的願景，再補細節", trait: "N", weight: 1 },
            { text: "先把各種可能的方法和創新角度都探索一遍，再決定怎麼做", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "你更希望自己被稱讚的是哪一種特質？",
        options: [
            { text: "「他思路極度清晰，是個非常有邏輯的人。」", trait: "T", weight: 2 },
            { text: "「他公平理性，能客觀看待事情。」", trait: "T", weight: 1 },
            { text: "「他對人體貼入微，是個很有人情味的人。」", trait: "F", weight: 1 },
            { text: "「他心思細膩，總是能感受到別人的需要。」", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "一件重要的事情「已經拍板定案」了，你的感受是？",
        options: [
            { text: "鬆一口氣，確定的事情讓你能夠安心往前走", trait: "J", weight: 2 },
            { text: "通常沒什麼問題，決定了就開始行動比較重要", trait: "J", weight: 1 },
            { text: "還好，但如果之後有更好的選擇，你會希望保留調整的空間", trait: "P", weight: 1 },
            { text: "有點侷促，你喜歡保持彈性，已定案的感覺讓你有點不自在", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "E_I",
        text: "在一個熱鬧的社交場合結束後，你通常會？",
        options: [
            { text: "精力充沛甚至還想繼續，社交讓你充了電", trait: "E", weight: 2 },
            { text: "情緒還不錯，但也準備好休息一下了", trait: "E", weight: 1 },
            { text: "有點疲憊，需要一段安靜的時間才能恢復到平常狀態", trait: "I", weight: 1 },
            { text: "感到明顯的精力透支，需要獨處很長一段時間才能補充回來", trait: "I", weight: 2 }
        ]
    },

    // --- 擴充題庫：新增 32 題（達成 100 題題庫） ---

    // +5 E_I
    {
        dimension: "E_I",
        text: "需要思考一個重要問題時，你更偏好哪種方式？",
        options: [
            { text: "找幾個人一起腦力激盪，在對話中你的想法才會越來越清晰", trait: "E", weight: 2 },
            { text: "先和別人聊聊大方向，再自己整理細節", trait: "E", weight: 1 },
            { text: "一個人安靜想清楚後，再有選擇性地和人討論", trait: "I", weight: 1 },
            { text: "完全靠內在思考完成，和人討論反而會打斷你的思路", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "E_I",
        text: "在一個需要自我介紹的場合，你的感受是？",
        options: [
            { text: "很自在，甚至享受這種展示自己的機會", trait: "E", weight: 2 },
            { text: "不排斥，簡單說幾句還算輕鬆", trait: "E", weight: 1 },
            { text: "有點緊張，會事先在腦中準備好要說什麼", trait: "I", weight: 1 },
            { text: "非常不自在，希望能跳過這個環節或盡量簡短帶過", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "E_I",
        text: "連續好幾天都和人密集互動之後，你的狀態是？",
        options: [
            { text: "狀態很好，覺得自己活力充沛，甚至還想繼續", trait: "E", weight: 2 },
            { text: "還行，雖然稍微累但整體是愉快的", trait: "E", weight: 1 },
            { text: "明顯需要獨處一段時間來恢復，感覺能量被抽乾了", trait: "I", weight: 1 },
            { text: "感覺被徹底耗盡，強烈需要一段完全不被打擾的獨處時間來補充能量", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "E_I",
        text: "參加一個你有興趣的講座或工作坊，中場休息時你會？",
        options: [
            { text: "主動和旁邊的人聊天，交換想法或聯絡方式", trait: "E", weight: 2 },
            { text: "如果有人搭話就聊聊，不排斥互動", trait: "E", weight: 1 },
            { text: "安靜地看手機或筆記，消化剛才的內容", trait: "I", weight: 1 },
            { text: "找個安靜的地方待著，享受這段不需要社交的喘息時間", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "E_I",
        text: "回想你最有成就感的時刻，那個場景更可能是？",
        options: [
            { text: "在一群人面前完成了某件事，獲得掌聲或認可", trait: "E", weight: 2 },
            { text: "和團隊一起達成目標後的慶祝時刻", trait: "E", weight: 1 },
            { text: "安靜地完成了一件對自己很重要的事，內心充滿滿足", trait: "I", weight: 1 },
            { text: "獨自在深夜突破了一個困擾許久的難題，那種純粹的內在喜悅", trait: "I", weight: 2 }
        ]
    },

    // +5 S_N
    {
        dimension: "S_N",
        text: "你和朋友在討論一個社會議題，你更傾向？",
        options: [
            { text: "引用具體的統計數據和真實案例來支持你的觀點", trait: "S", weight: 2 },
            { text: "從你觀察到的現實現象出發，描述你看到了什麼", trait: "S", weight: 1 },
            { text: "提出一個理論框架或模型來解釋這個現象背後的系統性原因", trait: "N", weight: 1 },
            { text: "把話題延伸到更大的哲學問題，例如制度設計、人性本質或文明趨勢", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "去一個新的城市旅行，你最享受的部分是？",
        options: [
            { text: "品嘗當地美食、逛市場、感受街道的氣味和聲音等感官體驗", trait: "S", weight: 2 },
            { text: "參觀知名景點，拍照記錄，帶回具體的旅行紀念", trait: "S", weight: 1 },
            { text: "觀察這座城市的文化脈絡，思考它和你所知的其他地方有何不同", trait: "N", weight: 1 },
            { text: "在巷弄中漫無目的地探索，想像住在這裡的人過著什麼樣的生活", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "別人形容你的思考方式，你覺得哪個說法最準確？",
        options: [
            { text: "腳踏實地，總是從事實和現狀出發", trait: "S", weight: 2 },
            { text: "務實可靠，能把事情一步步落實到位", trait: "S", weight: 1 },
            { text: "跳躍性思維，常在不同的概念之間找到意想不到的連結", trait: "N", weight: 1 },
            { text: "天馬行空，腦子裡同時轉著好幾個可能的世界", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "如果要你寫一篇文章或報告，你的自然傾向是？",
        options: [
            { text: "用精確的數據、明確的事實和具體的步驟來呈現", trait: "S", weight: 2 },
            { text: "清楚描述觀察到的現象，再提出合理的結論", trait: "S", weight: 1 },
            { text: "透過比喻、類比和概念性的框架來傳達你的洞見", trait: "N", weight: 1 },
            { text: "用大膽的假設和跨領域的聯想來挑戰既有的認知", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "回想你在學校或學習中最擅長的領域，更接近哪一種？",
        options: [
            { text: "需要記憶具體事實、操作步驟或實作技能的科目", trait: "S", weight: 2 },
            { text: "有明確答案、可以一步步推演的應用型題目", trait: "S", weight: 1 },
            { text: "需要理解抽象概念、分析理論之間關係的科目", trait: "N", weight: 1 },
            { text: "開放式的思辨、創意寫作或需要提出原創觀點的任務", trait: "N", weight: 2 }
        ]
    },

    // +4 T_F
    {
        dimension: "T_F",
        text: "做一個會影響到別人的決定時，你最終的判斷依據是？",
        options: [
            { text: "什麼是客觀上最正確、最有效率的選擇，即使有人不高興", trait: "T", weight: 2 },
            { text: "在合理的範圍內，找到一個對多數人都公平的方案", trait: "T", weight: 1 },
            { text: "考量每個人的感受和處境，盡量讓沒有人覺得被忽視", trait: "F", weight: 1 },
            { text: "以對人的影響為最高優先，寧可犧牲效率也不願傷害任何人", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "聽到一個讓人感動的慈善故事，你的第一反應比較偏向？",
        options: [
            { text: "思考這個慈善模式的可持續性和實際效果如何", trait: "T", weight: 2 },
            { text: "覺得是好事，但也想了解背後的運作機制是否合理", trait: "T", weight: 1 },
            { text: "被故事本身打動，想了解更多關於當事人的經歷", trait: "F", weight: 1 },
            { text: "強烈的情感共鳴，可能會想立刻捐款或參與幫助", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "在分配資源或機會時，你認為最重要的原則是？",
        options: [
            { text: "嚴格按照客觀標準和能力來分配，這才是真正的公平", trait: "T", weight: 2 },
            { text: "制定明確的規則，大家都照規則走，減少爭議", trait: "T", weight: 1 },
            { text: "考慮每個人的不同起點和困難，適度給予弱勢方更多支持", trait: "F", weight: 1 },
            { text: "最重要的是每個人都感覺被善待，人的尊嚴比規則更重要", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "你和另一半（或好友）發生爭執，事後你最先做的是？",
        options: [
            { text: "回想爭執中各自的論點，判斷誰的邏輯更站得住腳", trait: "T", weight: 2 },
            { text: "釐清問題的根源，思考怎麼避免下次再發生同樣的事", trait: "T", weight: 1 },
            { text: "擔心這次爭執是否傷害了你們的關係，想確認對方還好嗎", trait: "F", weight: 1 },
            { text: "即使你覺得自己有道理，也會先主動示好修復關係", trait: "F", weight: 2 }
        ]
    },

    // +5 J_P
    {
        dimension: "J_P",
        text: "出門旅行時，你偏好的方式是？",
        options: [
            { text: "事先做好完整攻略，每天行程都排好，照表操課才安心", trait: "J", weight: 2 },
            { text: "訂好住宿和幾個必去的點，其他隨興安排", trait: "J", weight: 1 },
            { text: "只訂了機票和第一晚的住宿，到了再看心情決定去哪", trait: "P", weight: 1 },
            { text: "完全不做計畫，享受未知帶來的驚喜，覺得這才是旅行的意義", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "你的手機行事曆或待辦清單的使用狀況是？",
        options: [
            { text: "密密麻麻排滿了，連休息時間都會標註，完全依賴它管理生活", trait: "J", weight: 2 },
            { text: "重要事項都會記，是你維持節奏的好工具", trait: "J", weight: 1 },
            { text: "偶爾記一下，但很多時候忘了看或懶得更新", trait: "P", weight: 1 },
            { text: "幾乎不用，覺得被行程表綁住反而讓你焦慮", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "一個週末早上醒來，沒有任何既定安排，你的心情是？",
        options: [
            { text: "有點不安，會趕快想今天要做什麼，給自己安排一些事情", trait: "J", weight: 2 },
            { text: "先確認有沒有該做的事，處理完再放鬆", trait: "J", weight: 1 },
            { text: "太棒了！完全開放的一天，看心情決定做什麼", trait: "P", weight: 1 },
            { text: "這是最理想的狀態，沒有計畫的日子才是真正的自由", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "在進行一個長期專案時，你的工作節奏通常是？",
        options: [
            { text: "從第一天就開始穩定推進，確保不會到最後才趕工", trait: "J", weight: 2 },
            { text: "設幾個中間檢查點，確保大方向沒偏離即可", trait: "J", weight: 1 },
            { text: "前期慢慢醞釀，中後期逐漸加速，最後衝刺完成", trait: "P", weight: 1 },
            { text: "靈感來了就密集工作，沒靈感就做別的，最後總會完成的", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "對於「規則」和「制度」，你的態度比較接近？",
        options: [
            { text: "規則是秩序的基石，大家都遵守才能讓事情順利運作", trait: "J", weight: 2 },
            { text: "合理的規則應該被尊重，但可以隨情況做適度調整", trait: "J", weight: 1 },
            { text: "規則是參考，真正重要的是根據當下情境做出最好的判斷", trait: "P", weight: 1 },
            { text: "太多規則會扼殺創造力和自由，能不受限就不受限", trait: "P", weight: 2 }
        ]
    },

    // +6 A_O
    {
        dimension: "A_O",
        text: "朋友問你週末要不要一起做某件事，你通常多快能回覆？",
        options: [
            { text: "幾乎秒回，想去就去，不需要太多考慮", trait: "A", weight: 2 },
            { text: "大概幾分鐘內就能確認，不會拖太久", trait: "A", weight: 1 },
            { text: "需要想一下，可能過幾個小時才回覆，怕答應了又後悔", trait: "O", weight: 1 },
            { text: "常常拖到最後才回，因為一直在衡量各種可能的安排", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "在餐廳點餐時，你的決策過程通常是？",
        options: [
            { text: "掃一眼菜單就知道要點什麼，很快就決定了", trait: "A", weight: 2 },
            { text: "看一下推薦或招牌，不超過兩分鐘就能選定", trait: "A", weight: 1 },
            { text: "在好幾道菜之間猶豫不決，常問服務生或同行的人意見", trait: "O", weight: 1 },
            { text: "翻來覆去看菜單，點了之後還會後悔是不是該選另一道", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "做了一個重要決定之後，你的心理狀態通常是？",
        options: [
            { text: "決定了就不回頭，把精力放在執行上，很少後悔", trait: "A", weight: 2 },
            { text: "偶爾會想一下，但很快就能說服自己當時的選擇是對的", trait: "A", weight: 1 },
            { text: "時不時會冒出「如果當初選了另一個會怎樣」的念頭", trait: "O", weight: 1 },
            { text: "反覆回想、重新評估自己的選擇，內心的討論很難真正停下來", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "面對一個你不太有經驗的新任務，你的起步方式是？",
        options: [
            { text: "先動手做再說，邊做邊學，做錯了再修正", trait: "A", weight: 2 },
            { text: "快速了解基本要求後就開始嘗試，不會準備太久", trait: "A", weight: 1 },
            { text: "想要充分準備好再開始，怕一開始就做錯會更麻煩", trait: "O", weight: 1 },
            { text: "花大量時間研究和準備，確認自己有足夠的掌握度後才願意正式動手", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "你剛到一個不熟悉的城市，需要找地方吃飯但沒有任何推薦，你的做法是？",
        options: [
            { text: "看到一家順眼的就直接走進去，不合口味大不了換一家", trait: "A", weight: 2 },
            { text: "快速看一下附近評價最高的，選一家就走", trait: "A", weight: 1 },
            { text: "仔細比較好幾家的菜單、評價和照片，確認選一家最靠譜的", trait: "O", weight: 1 },
            { text: "花了很長時間研究，遲遲無法做決定，最後可能去便利商店先解決", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "回顧你的人生重大選擇，你覺得自己更常是？",
        options: [
            { text: "果斷的行動者，大多數時候先做了再說，很少後悔", trait: "A", weight: 2 },
            { text: "想清楚後就能迅速行動的人，不會在原地打轉太久", trait: "A", weight: 1 },
            { text: "謹慎的思考者，有時因為考慮太周全而錯過了行動的最佳時機", trait: "O", weight: 1 },
            { text: "深思熟慮型的人，寧可慢一步也要確保方向正確，不喜歡冒不必要的險", trait: "O", weight: 2 }
        ]
    },

    // +7 H_C
    {
        dimension: "H_C",
        text: "有人問你對他的新髮型或穿搭的看法，你其實覺得不太好看，你會？",
        options: [
            { text: "找出某個還不錯的地方大力稱讚，完全不提你覺得不好的部分", trait: "H", weight: 2 },
            { text: "笑著說「挺有個性的」或「感覺不一樣了」，模糊帶過", trait: "H", weight: 1 },
            { text: "委婉但誠實地說你覺得之前的風格可能更適合他", trait: "C", weight: 1 },
            { text: "直接說你覺得不太好看，認為誠實才是對朋友最好的態度", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "在團體中需要做出一個不受歡迎的決定（如刪減預算、拒絕某人的提案），你的方式是？",
        options: [
            { text: "盡可能拖延或找別人來宣布，非常不想成為那個「壞人」", trait: "H", weight: 2 },
            { text: "用很多鋪墊和軟化的語言來傳達，盡量降低衝擊", trait: "H", weight: 1 },
            { text: "清楚說明決定和原因，語氣平和但不迴避", trait: "C", weight: 1 },
            { text: "直接了當地宣布，覺得拖泥帶水反而對所有人更殘忍", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你在排隊時，有人明顯插隊到你前面，你會？",
        options: [
            { text: "算了，不想為這種小事起衝突，忍一下就好", trait: "H", weight: 2 },
            { text: "用眼神或肢體語言暗示對方，希望他自己意識到", trait: "H", weight: 1 },
            { text: "禮貌但明確地告訴對方隊伍的尾端在後面", trait: "C", weight: 1 },
            { text: "直接指出來，覺得不制止這種行為就是默許它發生", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "朋友做了一個你認為很糟糕的人生決定（如和明顯不適合的人交往），你會？",
        options: [
            { text: "默默支持，覺得每個人都有自己要走的路，不該干涉", trait: "H", weight: 2 },
            { text: "等對方主動提起時，才試探性地提出一些問題讓他思考", trait: "H", weight: 1 },
            { text: "找個適當時機，坦誠說出你的擔憂和觀察", trait: "C", weight: 1 },
            { text: "直接告訴他你覺得這個決定很糟，真正的朋友不會看你走錯路而不說話", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "在聚餐中，有人講了一個你覺得有些冒犯的笑話，你的反應是？",
        options: [
            { text: "跟著笑，就算不舒服也不想破壞氣氛或讓場面尷尬", trait: "H", weight: 2 },
            { text: "不笑但也不說什麼，用沉默來表達你的態度", trait: "H", weight: 1 },
            { text: "等笑話過去後，找機會輕描淡寫地提一下那個笑話為什麼不太合適", trait: "C", weight: 1 },
            { text: "當場直接指出這個笑話有問題，覺得不表態就是默認", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你請人幫你做了一件事，結果品質遠低於你的期望，你會？",
        options: [
            { text: "自己默默修改或重做，不想讓對方覺得被否定", trait: "H", weight: 2 },
            { text: "先感謝他的付出，再委婉提出幾個可以調整的地方", trait: "H", weight: 1 },
            { text: "具體指出哪些地方不符合要求，請他修改到位", trait: "C", weight: 1 },
            { text: "直接說這不符合標準需要重做，覺得含糊其辭才是浪費雙方時間", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你和一群人吃飯，其中有人一直開不太尊重某位缺席朋友的玩笑，你會？",
        options: [
            { text: "覺得不太好但不想掃興，笑笑帶過，回去再私下和那位缺席朋友說一聲", trait: "H", weight: 2 },
            { text: "巧妙幫缺席的朋友說幾句好話，讓話題自然轉向", trait: "H", weight: 1 },
            { text: "認真地說你覺得這樣不太好，即使氣氛會稍微尷尬", trait: "C", weight: 1 },
            { text: "直接制止說「不在場的人沒辦法為自己說話，這樣不公平」", trait: "C", weight: 2 }
        ]
    },

    // ==========================================
    // 新增 20 題（題庫達到 120 題，每維度 20 題）
    // ==========================================

    // +3 E_I (17→20)
    {
        dimension: "E_I",
        text: "當你有一個很棒的想法或好消息時，你的第一反應是？",
        options: [
            { text: "迫不及待地想告訴身邊所有人，分享的過程讓你更興奮", trait: "E", weight: 2 },
            { text: "想找一兩個人聊聊，說出來會讓這件事變得更真實", trait: "E", weight: 1 },
            { text: "先在心裡細細品味一番，不急著對外分享", trait: "I", weight: 1 },
            { text: "把它安靜地收藏在心裡，覺得分享出去反而會稀釋掉那份喜悅", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "E_I",
        text: "在團隊合作中，你最自然的角色通常是？",
        options: [
            { text: "主動協調各方、發起討論，確保大家都參與進來", trait: "E", weight: 2 },
            { text: "在需要時發表意見、推動進度，但不需要一直站在前面", trait: "E", weight: 1 },
            { text: "專注做好自己負責的部分，討論時有想法才開口", trait: "I", weight: 1 },
            { text: "偏好獨立完成任務後再整合，覺得太多會議反而降低效率", trait: "I", weight: 2 }
        ]
    },
    {
        dimension: "E_I",
        text: "日常生活中，你的社交節奏比較接近？",
        options: [
            { text: "幾乎每天都有社交活動，越忙碌越有活力", trait: "E", weight: 2 },
            { text: "一週安排幾次社交就很舒服，不會刻意避開人群", trait: "E", weight: 1 },
            { text: "社交需要提前心理準備，事後也需要恢復時間", trait: "I", weight: 1 },
            { text: "一週只需要一兩次有品質的社交就足夠，其餘時間更享受獨處", trait: "I", weight: 2 }
        ]
    },

    // +3 S_N (17→20)
    {
        dimension: "S_N",
        text: "和朋友聊到一個你們都經歷過的事件，你更容易記住的是？",
        options: [
            { text: "具體的細節：誰說了什麼話、在哪裡、天氣如何、穿什麼衣服", trait: "S", weight: 2 },
            { text: "事件的經過和時間順序，大致的場景和關鍵對話", trait: "S", weight: 1 },
            { text: "那次經歷帶給你的整體感覺和領悟，但細節已經模糊", trait: "N", weight: 1 },
            { text: "它和你生命中其他經歷之間的連結和呼應，以及它在更大脈絡中的意義", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "你比較欣賞哪種類型的人？",
        options: [
            { text: "腳踏實地、執行力強，能把想法變成具體成果的人", trait: "S", weight: 2 },
            { text: "經驗豐富、見識廣博，能給出可靠的實用建議的人", trait: "S", weight: 1 },
            { text: "思維敏捷、充滿創意，總能提出令人耳目一新的點子的人", trait: "N", weight: 1 },
            { text: "有遠見、能看到別人看不到的趨勢，帶領大家走向未知可能的人", trait: "N", weight: 2 }
        ]
    },
    {
        dimension: "S_N",
        text: "學到一個新概念或知識時，你覺得真正「學會」的標準是？",
        options: [
            { text: "能在實際情境中正確操作或應用它", trait: "S", weight: 2 },
            { text: "能用具體的例子向別人清楚說明", trait: "S", weight: 1 },
            { text: "能理解它背後的原理，並把它和已知的知識體系串連起來", trait: "N", weight: 1 },
            { text: "能把它延伸到全新的領域或情境，產生原創的應用方式", trait: "N", weight: 2 }
        ]
    },

    // +4 T_F (16→20)
    {
        dimension: "T_F",
        text: "一個認識但不算親近的人向你求助，而你幫忙會對自己造成一些不便，你的考量是？",
        options: [
            { text: "評估付出的成本和對方的需求是否合理，不合理就婉拒", trait: "T", weight: 2 },
            { text: "考慮這是否在合理範圍內，如果是就幫，不是就說明原因", trait: "T", weight: 1 },
            { text: "雖然有些不便，但想到對方可能真的需要幫助，多半會答應", trait: "F", weight: 1 },
            { text: "覺得能幫就幫，不願意看著別人陷入困境而什麼都不做", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "當你需要給別人建設性的回饋時，你更在意的是？",
        options: [
            { text: "回饋內容的精確性和實用性，確保對方能明確知道問題在哪", trait: "T", weight: 2 },
            { text: "表達清楚且客觀，讓對方理解你的判斷依據", trait: "T", weight: 1 },
            { text: "選擇適當的時機和語氣，讓對方能在心理安全的狀態下接收", trait: "F", weight: 1 },
            { text: "最重要的是對方感受到你的善意和支持，而不是覺得被批評", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "面對社會上一個引發爭議的議題，你形成立場的方式通常是？",
        options: [
            { text: "蒐集數據和事實，用邏輯分析各方論點的合理性，再得出自己的結論", trait: "T", weight: 2 },
            { text: "分析問題的結構和因果關係，找出最合理的解釋", trait: "T", weight: 1 },
            { text: "先關注這個議題對真實的人造成了什麼影響，再從中形成判斷", trait: "F", weight: 1 },
            { text: "站在受影響者的角度去感受，覺得任何分析都不能脫離人的處境", trait: "F", weight: 2 }
        ]
    },
    {
        dimension: "T_F",
        text: "回想你人生中做過的一個重要決定，最終讓你「定案」的關鍵是？",
        options: [
            { text: "理性分析的結果清楚指向某個選項，邏輯上它就是最優解", trait: "T", weight: 2 },
            { text: "綜合各方面的利弊後，這個選項的整體效益最高", trait: "T", weight: 1 },
            { text: "雖然理性上各有優缺，但有一個選項讓你「心裡覺得對」", trait: "F", weight: 1 },
            { text: "最終是內心深處的價值觀和直覺告訴你：這才是屬於你的路", trait: "F", weight: 2 }
        ]
    },

    // +3 J_P (17→20)
    {
        dimension: "J_P",
        text: "你搬到一個新的住處，拆箱和整理物品的方式是？",
        options: [
            { text: "第一天就制定整理計畫，按區域逐步完成，直到每樣東西都歸位", trait: "J", weight: 2 },
            { text: "先把最重要的區域（如廚房、臥室）整理好，其他慢慢來", trait: "J", weight: 1 },
            { text: "需要什麼就拆什麼箱子，沒有特定順序，住著住著就整理好了", trait: "P", weight: 1 },
            { text: "可能好幾個月還有沒拆的箱子，覺得只要日常需要的東西找得到就好", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "對於生活中的「小決定」（如今天吃什麼、週末做什麼），你的態度是？",
        options: [
            { text: "即使是小事也喜歡提前有個方向，不喜歡到了才想", trait: "J", weight: 2 },
            { text: "大部分時候有個底，但偶爾臨時改也無所謂", trait: "J", weight: 1 },
            { text: "通常不提前想，到了那個時刻再根據心情決定", trait: "P", weight: 1 },
            { text: "越不做計畫越自在，覺得小事就該隨興而為才有生活感", trait: "P", weight: 2 }
        ]
    },
    {
        dimension: "J_P",
        text: "你接收到一項複雜的指示或任務說明，你的處理方式是？",
        options: [
            { text: "立刻整理成清單或筆記，建立結構化的執行步驟", trait: "J", weight: 2 },
            { text: "在腦中歸納出重點和順序，確保自己清楚下一步是什麼", trait: "J", weight: 1 },
            { text: "大概聽懂就好，做的時候再回頭看不清楚的地方", trait: "P", weight: 1 },
            { text: "先動手開始做，邊做邊理解，覺得實際操作比理論理解更有效", trait: "P", weight: 2 }
        ]
    },

    // +4 A_O (16→20)
    {
        dimension: "A_O",
        text: "和朋友約好時間要出門，出發前你發現天氣不太好，你會？",
        options: [
            { text: "帶把傘就出門了，不會因為天氣改變既定計畫", trait: "A", weight: 2 },
            { text: "快速看一下氣象預報，沒有大問題就照原計畫走", trait: "A", weight: 1 },
            { text: "開始考慮要不要改期或換成室內活動，上網查各種替代方案", trait: "O", weight: 1 },
            { text: "把各種可能性（改期、換地點、照原計畫但帶裝備）都想過一遍，向朋友提出幾個方案讓大家一起決定", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "有人請教你對某件事的看法，而你對這個領域不是特別熟悉，你會？",
        options: [
            { text: "根據你目前知道的，直接給出你的判斷和建議", trait: "A", weight: 2 },
            { text: "坦言你了解有限，但還是分享你初步的想法供參考", trait: "A", weight: 1 },
            { text: "告訴對方你需要多了解一下再回覆，不想給出不夠周延的意見", trait: "O", weight: 1 },
            { text: "先做充分的研究後再回覆，寧可晚一點回答也不願給出可能有誤的建議", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "你需要為一件有時效性的事做出回覆，但手邊的資訊不完整，你通常？",
        options: [
            { text: "根據已有的資訊做出判斷，覺得有七成把握就夠了", trait: "A", weight: 2 },
            { text: "快速補充最關鍵的資訊後就做決定，不追求完美", trait: "A", weight: 1 },
            { text: "盡可能蒐集更多資訊再回覆，即使時間有點緊", trait: "O", weight: 1 },
            { text: "寧可申請延長期限也要等資訊充足，不願在不確定的情況下表態", trait: "O", weight: 2 }
        ]
    },
    {
        dimension: "A_O",
        text: "面對一個你已經考慮很久但遲遲沒行動的事情（如開始運動、學新東西），最終讓你啟動的原因通常是？",
        options: [
            { text: "某天突然覺得「就是現在」，立刻就開始了，不需要特別的契機", trait: "A", weight: 2 },
            { text: "出現了一個明確的機會或推力（如朋友邀約），就順勢開始了", trait: "A", weight: 1 },
            { text: "終於找到了一個你覺得完善的計畫或方法，才願意正式啟動", trait: "O", weight: 1 },
            { text: "經過長期的資料蒐集和心理準備，確認條件都到位後才踏出第一步", trait: "O", weight: 2 }
        ]
    },

    // +3 H_C (17→20)
    {
        dimension: "H_C",
        text: "在團體作業或活動中，有人明顯在偷懶、讓其他人多做，你會？",
        options: [
            { text: "不想當壞人，默默幫忙分擔他的部分，事後有點委屈", trait: "H", weight: 2 },
            { text: "私下輕聲提醒他，語氣盡量不讓他覺得被針對", trait: "H", weight: 1 },
            { text: "在討論中平靜提出每個人應負擔的部分，讓偷懶的行為被攤開", trait: "C", weight: 1 },
            { text: "直接在大家面前點出不公平的分工，覺得沉默就是對認真的人不公平", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "你答應幫朋友一個忙，但中途發現這件事比預期麻煩很多，你會？",
        options: [
            { text: "硬著頭皮做完，不好意思反悔或加條件", trait: "H", weight: 2 },
            { text: "繼續幫忙但委婉提一下比預期複雜，讓對方知道你的付出", trait: "H", weight: 1 },
            { text: "坦白說這比你想的複雜，和對方重新討論怎麼分擔", trait: "C", weight: 1 },
            { text: "直接說明你的極限，如果超出太多就說抱歉沒辦法繼續", trait: "C", weight: 2 }
        ]
    },
    {
        dimension: "H_C",
        text: "在一個你不太認同的社交場合中（例如話題讓你不舒服、氣氛讓你覺得不對），你會？",
        options: [
            { text: "默默配合，不想讓自己成為破壞氣氛的人，回家再消化不適感", trait: "H", weight: 2 },
            { text: "找機會巧妙地轉換話題或淡化不舒服的元素", trait: "H", weight: 1 },
            { text: "在適當時機表達你的不同看法，語氣溫和但立場清楚", trait: "C", weight: 1 },
            { text: "直接表達你的不認同或選擇離開，覺得不需要為了社交而勉強自己", trait: "C", weight: 2 }
        ]
    }
];

if (typeof window !== "undefined") {
  window.questions = questions;
  window.sysData = { questions: questions };
}
