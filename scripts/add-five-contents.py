# 向 condo-report-content.json 追加 5 份转售 Top 私宅研报内容（2026-09-04）
# 评分口径：framework v3 私宅标准硬锚点机械映射（权重 20/15/20/10/10/15/10）
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(ROOT, 'scripts', 'condo-report-content.json')

FIVE = [
# ================= 1. Parc Esta =================
{
 "slug": "parc-esta",
 "title": "Parc Esta — D14 Eunos RCR 地铁口大盘深度投资分析",
 "tag": "D14 Eunos · RCR 城市边缘 · 99年地契",
 "h1": "Parc Esta",
 "sub": "900-916 Sims Avenue, Singapore · 1,399 户 · TOP 2022 · MCL Land 开发",
 "score": 7.37,
 "verdictLabel": "✅ 可考虑 — 地铁口 + 低物业费的自住友好型大盘",
 "meta": [
  {"k": "地契", "v": "99 年 (2018起)"},
  {"k": "总单位", "v": "1,399 套"},
  {"k": "楼栋", "v": "9 栋 (18层)"},
  {"k": "最近 MRT", "v": "Eunos 步行 ~178m"},
  {"k": "成交均价", "v": "$2,317 psf (近1年)"},
  {"k": "1km 学校", "v": "Haig Girls' 等"}
 ],
 "exec": "Parc Esta 是 Eunos 地铁口（步行约 178 米、大部分有遮蔽）的 1,399 户度假式大盘，2018 年开盘均价约 $1,700 psf，近一年转售均价已到 <b>$2,317 psf</b>，五年年化涨幅约 3.1%。它的核心卖点是<b>通勤与持有成本双低</b>：EWL 一站到 Paya Lebar 换乘环线、物业费仅 $170-230/月（1,399 户摊薄效应），近 12 个月 110 笔转售的流动性在 D14 数一数二。短板同样清晰：分户型加权毛回报仅约 2.8%（D14 租金被老旧存量稀释、2-3 房总价偏高），Sims Avenue/Changi Road 沿线路噪需要适应，且 1,399 户的体量意味着转售永远不缺竞争对手。<b>自住 8 分、投资 6.5 分。</b>",
 "params": {
  "basic": [
   {"k": "开发商", "v": "MCL Land (Everbright) Pte Ltd"},
   {"k": "地块面积", "v": "376,713 sqft / 34,998 sqm"},
   {"k": "容积率", "v": "2.8"},
   {"k": "土地性质", "v": "99 年地契（2018-07-12 起）"},
   {"k": "TOP", "v": "2022-12-30"},
   {"k": "建筑师", "v": "P&T Consultants"},
   {"k": "总包", "v": "China Construction (S. Pacific)"}
  ],
  "blocks": [
   {"k": "楼栋", "v": "9 栋（18 层）"},
   {"k": "户型", "v": "1房 420 sqft 起 ~ 5房 1,604 sqft（另 5 间商铺）"},
   {"k": "车位", "v": "1,122 + 9 无障碍"}
  ],
  "facilities": [
   {"t": "50m 标准泳池 + 360° 环形泻湖", "ok": True},
   {"t": "网球场 + 多功能球场", "ok": True},
   {"t": "室内健身房 + 户外健身角", "ok": True},
   {"t": "会所 + 多功能室", "ok": True},
   {"t": "BBQ 凉亭 + 吊床园", "ok": True},
   {"t": "儿童乐园 + 戏水区 + 宠物乐园", "ok": True},
   {"t": "无桑拿/蒸汽房/KTV 房", "ok": False}
  ],
  "facNote": "设施走的是实用主义路线——三个主题园林（Grand/East/West Parc）加 200 米水景轴，但刻意砍掉了桑拿、KTV 等花哨配置，换来全岛大盘里最低档的物业费（1房 $170、2-3房 $190、4-5房 $230/月）。代价是健身房偏小、多功能室仅一间，周末预订要靠抢。",
  "transport": [
   {"k": "Eunos MRT (EW7)", "v": "步行 ~178m（大部分有遮蔽）"},
   {"k": "Paya Lebar 换乘 (EW/CC)", "v": "1 站"},
   {"k": "CBD (Raffles Place)", "v": "MRT 约 15 分钟"},
   {"k": "PIE / ECP / KPE", "v": "2-4 分钟车程"},
   {"k": "樟宜机场", "v": "ECP 约 15 分钟"}
  ],
  "schools": [
   {"k": "Haig Girls' School", "v": "1km 内"},
   {"k": "Eunos Primary", "v": "~900m"},
   {"k": "Maha Bodhi School", "v": "1-2km"},
   {"k": "Tao Nan School", "v": "1-2km"},
   {"k": "CHIJ (Katong) Primary", "v": "1-2km"}
  ]
 },
 "dims": [
  {"score": 8, "weight": 20, "title": "🗺️ 地段 Location",
   "text": "RCR 基础 7 分 + MRT 178m（≤400m +1）= 8 分。Eunos 是东区成熟生活区：巴刹、咖啡店、Joo Chiat 美食带步行可达，一站到 Paya Lebar 区域中心（PLQ 商圈+办公）。按同区同分规则（与 Sims Urban Oasis 同属 D14 且 MRT 距离差 228m≤250m），两盘地段统一取 8 分。1km 内小学仅 Haig Girls' 一所，学校加成有限。"},
  {"score": 3.8, "weight": 15, "title": "💰 租金回报 Rental Yield",
   "text": "分户型加权毛回报约 2.82%（URA 2026-07 租约 × 近12个月转售中位价）：1房 3.31%（中位价 $1.05M / 月租 $2,900）、2房 2.68%、3房 2.15%。按锚点公式 3+(2.82-2.0)=3.8 分。注意 D14 租金含大量老旧存量，本盘新净实际租值略高（第三方口径约 3.3%），但 2-3 房总价段回报率被买入价明显摊薄。"},
  {"score": 7, "weight": 20, "title": "📈 资本增值 Appreciation",
   "text": "2021→2026 均价从 $1,982 升至 $2,307 psf，年化约 3.1% → 锚点 7 分（2-4% 档）。年度节奏稳（2022 +3.4%、2023 +3.4%、2024 +5.5%、2025 +2.4%），无暴涨暴跌。前瞻无重大新增基建（Paya Lebar 利好已部分兑现），不加减。99 年地契 2018 年起算，剩余约 91 年，衰减压力尚远。"},
  {"score": 7.5, "weight": 10, "title": "🏗️ 开发商信誉 Developer",
   "text": "MCL Land 属老牌知名档（7-8 分），新加坡交付记录稳健（The Poiz、Sky Vue 等），背靠香港置地/怡和体系资金链可靠。本项目交付后未见系统性质量投诉，住户对浴室等精装细节评价偏高（酒店风），取中值 7.5 分。"},
  {"score": 9, "weight": 10, "title": "💵 持有成本 Holding Cost",
   "text": "MCST 月费 1房 $170 / 2-3房 $190 / 4-5房 $230，全线低于 $300 → 锚点 9 分。1,399 户摊薄 + 开发商刻意不做高维护设施，是全市大盘里持有成本最低的一档，对长线自住和收租都极为友好。"},
  {"score": 9, "weight": 15, "title": "🔄 退出流动性 Exit Liquidity",
   "text": "近 12 个月转售 110 笔（>50 → 锚点 9 分），是 D14 非新盘成交王。1-2 房占比高（成交画像中 <1,000sqft 占 85%），总价门槛 $1.0-1.8M 正对组屋升级者与投资者主力预算带，成交周期短。需留意的是同盘挂牌竞争同样激烈，定价需贴市价。"},
  {"score": 8, "weight": 10, "title": "🛡️ 风险控制 Risk",
   "text": "二手现楼、无任何政策窗口未过（买家 ABSD 属普适规则）→ 锚点 8-9 档取 8。地契剩约 91 年无衰减问题；TDSR/LTV 属标准敞口。投资视角唯一要注意的是高总价 3 房以上户型的退出纵深较浅（近1年 4房+ 仅 3 笔成交）。"}
 ],
 "compTitle": "D14 同区可比项目（近1年均价）",
 "comps": [
  {"name": "Parc Esta（本盘）", "tenure": "99年 (2018)", "psf": "$2,317", "self": True},
  {"name": "Park Place Residences @ PLQ", "tenure": "99年", "psf": "$2,262"},
  {"name": "Penrose", "tenure": "99年", "psf": "$2,154"},
  {"name": "Waterbank at Dakota", "tenure": "99年", "psf": "$2,092"},
  {"name": "Mori", "tenure": "永久", "psf": "$1,847"}
 ],
 "compNote": "本盘定价立于 D14 第一梯队——比 PLQ 上盖还贵，买的是地铁口 + 新净 + 低物业费组合；同区永久地契 Mori 反而便宜 20%，说明 D14 买家更愿意为通勤便利付费。数据源：URA（自有 dashboard 交叉验证）。",
 "lifestyle": {
  "quotes": [
   {"t": "尽管是超大型项目，泳池即便周末也不会特别拥挤。楼栋排成两列、间距很大，设施位于中轴，整体感觉开阔而不逼仄。", "src": "👍 Stacked Homes 住户实住 4 个月评测, 2023"},
   {"t": "维护费相当低，紧凑型三房每月不到 $200。浴室配套像酒店，每次使用都有度假感。小区里有 7-11、FairPrice Express 和牙科诊所。", "src": "👍 Stacked Homes 住户实住评测, 2023"},
   {"t": "Sims Avenue 和 Changi Road 都是繁忙主干道，需要能接受车流声——好在关上窗后噪音降到最低，夜里睡觉几乎听不见。", "src": "👎 Stacked Homes 住户实住评测, 2023"},
   {"t": "健身房有点小，高峰时段会拥挤；全盘只有一个多功能室，周末/公共假期很难预订。", "src": "⚠️ Stacked Homes 住户实住评测, 2023"}
  ],
  "rating": "★★★★☆ (4.0/5)",
  "summary": "实住反馈整体正面：低物业费、开阔楼距、地铁口便利性是被反复提及的三大优点；短板集中在临路噪音、健身房/多功能室等共享设施在高峰时段的供给不足。社区活跃度高（住户群参与度高），自助管理氛围好。适合看重通勤与日常便利的自住家庭；对设施丰富度要求高的买家会觉得「够用但不豪华」。"
 },
 "risks": [
  "租金回报偏低（加权约 2.8%），高总价 3 房以上户型收租性价比差，投资只建议 1-2 房",
  "1,399 户体量 → 转售与出租市场内部竞争长期存在，溢价空间受同盘挂牌压制",
  "Sims Avenue / Changi Road 沿线路噪，低楼层临路单元需在看房时实测",
  "D14 供应管线充裕（Penrose 等新盘持续进入二手市场），片区价格天花板互相牵制",
  "利率高位环境下，2.8% 毛回报对杠杆买家现金流为负，需自有资金缓冲"
 ],
 "verdict": "Parc Esta 是「用合理性取胜」的盘：没有名校、没有无敌景观，但地铁 178 米 + 全岛最低档物业费 + D14 最强流动性，构成了极难被替代的自住基本面。五年年化 3.1% 的增值谈不上惊艳但足够稳健，且每一年的成交分布都健康（非单点拉高）。综合评分 7.37 落于「可考虑」区间上沿——自住买家可以果断一些，纯投资买家请把预期调到「保本 + 微赚 + 高流动性」档位。",
 "fit": {
  "yes": ["CBD/东部通勤的自住家庭（地铁口是硬刚需）", "预算 $1.0-1.8M 的组屋升级者", "重视低持有成本的长线业主", "需要高流动性退出的稳健型投资者（限 1-2 房）"],
  "no": ["追求 4%+ 毛回报的收租型投资者", "对名校学区有硬性要求的家庭（1km 仅 1 所小学）", "对路噪敏感且不愿住高层的买家", "追求小体量私密性的买家"]
 },
 "buyAdvice": "优先 1-2 房（成交占比 85%、租售流动性最好）；选房避开 Sims Avenue 正向临路单元，中高楼层朝内园景为佳；出价贴同户型近 3 个月成交价，本盘成交密集、议价空间透明，无需追高。",
 "score2": 7.37
},
# ================= 2. Riverfront Residences =================
{
 "slug": "riverfront-residences",
 "title": "Riverfront Residences — D19 Hougang OCR 河畔家庭大盘深度投资分析",
 "tag": "D19 Hougang · OCR 城市外围 · 99年地契",
 "h1": "Riverfront Residences",
 "sub": "41-57 Hougang Avenue 7, Singapore · 1,472 户 · TOP 2023 · Oxley 联合体开发",
 "score": 7.51,
 "verdictLabel": "✅ 推荐 — OCR 高回报 + CRL 利好的河畔家庭盘",
 "meta": [
  {"k": "地契", "v": "99 年 (2018起)"},
  {"k": "总单位", "v": "1,472 套"},
  {"k": "楼栋", "v": "9 栋 17 层 + 21 排屋"},
  {"k": "最近 MRT", "v": "Hougang 步行 ~844m"},
  {"k": "成交均价", "v": "$1,741 psf (近1年)"},
  {"k": "1km 学校", "v": "3 所小学"}
 ],
 "exec": "Riverfront Residences 是后港河畔（Sungei Serangoon 沿岸）的 1,472 户度假大盘，前身是 Rio Casa HUDC 集售地块。近一年转售均价 <b>$1,741 psf</b>，2021→2026 年化涨幅约 <b>4.7%</b>——五个研究对象里最高，且 2026 年 Hougang 将升级为 NEL×CRL 双线路换乘站（CRL1 预计 2030 通车）的前瞻利好尚未完全定价。分户型加权毛回报约 <b>3.4%</b>（1房高达 4.1%），物业费仅 $221-278/月，1km 内 3 所小学。核心短板：离 Hougang MRT 约 844 米的「真实步行距离」，以及 Oxley 系交付品质的中等口碑。<b>自住 7.5 分、投资 7.5 分。</b>",
 "params": {
  "basic": [
   {"k": "开发商", "v": "Rio Casa Venture（Oxley + KSH + SLB + Apricot）"},
   {"k": "地块面积", "v": "396,087 sqft / 36,811 sqm"},
   {"k": "容积率", "v": "2.8"},
   {"k": "土地性质", "v": "99 年地契（2018-05-31 起）"},
   {"k": "TOP", "v": "2023（分期交付）"},
   {"k": "建筑师", "v": "ADDP Architects"},
   {"k": "总包", "v": "Kim Seng Heng Engineering"}
  ],
  "blocks": [
   {"k": "楼栋", "v": "9 栋（17 层）+ 21 套分层排屋"},
   {"k": "户型", "v": "1房 ~ 5房 + 分层排屋（另 6 间商铺）"},
   {"k": "车位", "v": "1,483（两层地库）"}
  ],
  "facilities": [
   {"t": "75m 河畔泳池 + 50m 标准泳池", "ok": True},
   {"t": "网球场 + 推杆果岭", "ok": True},
   {"t": "健身房 + KTV/影院室", "ok": True},
   {"t": "400m 慢跑道 + 蒸汽房", "ok": True},
   {"t": "儿童攀岩 + 飞索 + 游乐场", "ok": True},
   {"t": "3 间多功能室 + BBQ 区", "ok": True},
   {"t": "河畔长廊直通 PCN 公园连道", "ok": True}
  ],
  "facNote": "102 项设施在 D19 属于顶配密度，75m 河畔泳池正对 Sungei Serangoon 是最鲜明的记忆点；21 套分层排屋让「有地生活方式 + 公寓设施」共存，在 OCR 属稀缺形态。1,472 户摊薄后 MCST 仅 $221-278/月，持有成本与 Parc Esta 同属最低档。",
  "transport": [
   {"k": "Hougang MRT (NE14)", "v": "步行 ~844m（12-13 分钟）"},
   {"k": "未来 CRL 换乘 (CR8)", "v": "同站，预计 2030"},
   {"k": "Defu MRT (CR7, 在建)", "v": "预计 2029"},
   {"k": "KPE / TPE", "v": "数分钟上高速"},
   {"k": "巴士 112/112A", "v": "小区门口"}
  ],
  "schools": [
   {"k": "CHIJ Our Lady of the Nativity", "v": "0.44km"},
   {"k": "Holy Innocents' Primary", "v": "0.75km"},
   {"k": "Punggol Primary", "v": "1.0km"},
   {"k": "Holy Innocents' High", "v": "0.43km"},
   {"k": "Serangoon Secondary", "v": "0.55km"}
  ]
 },
 "dims": [
  {"score": 6.5, "weight": 20, "title": "🗺️ 地段 Location",
   "text": "OCR 基础 6 分 + 1km 内 3 所小学（+0.5）= 6.5 分。MRT 844m 落在 400-1500m 中性档无加减——这是本盘最大的物理短板，但 Hougang 镇中心（Hougang Mall、Midtown、巴刹、综合诊疗所）步行圈内配套成熟，河畔 PCN 直通 Coney Island 的生活方式加成明显。CRL 落地后地段逻辑将重估。"},
  {"score": 5.4, "weight": 15, "title": "💰 租金回报 Rental Yield",
   "text": "分户型加权毛回报约 3.42%：1房 4.06%（中位价 $0.86M / 月租 $2,900）、2房 2.96%、3房 2.62%。按锚点公式 5+(3.42-3.0)=5.4 分，五个研究对象中最高。低入场总价 + 后港/盛港租客池（NE 线通勤族、空军基地、Defu 工业园）支撑真实租需，第三方口径约 3.3% 交叉验证一致。"},
  {"score": 9, "weight": 20, "title": "📈 资本增值 Appreciation",
   "text": "2021→2026 均价 $1,385→$1,740 psf，年化约 4.7% → 锚点 8 分（>4% 档）；2022 +8.0%、2023 +9.3% 是主力拉升段，2024-2026 转入温和。前瞻 +1：Hougang 2030 年升级 NEL×CRL 换乘站（CRL Phase 1 已动工）属「重大基建利好」锚点项。合计 9 分，为五盘最高。"},
  {"score": 5.5, "weight": 10, "title": "🏗️ 开发商信誉 Developer",
   "text": "Oxley 主导的四方联合体属中型档（5-6 分）。Oxley 以快周转、低地价策略著称，交付品质口碑中等——不是系统性质量丑闻，但精装细节与顶级开发商有差距；KSH/Lian Beng 施工侧经验扎实。交付后未见大规模缺陷集体投诉，取 5.5 分。"},
  {"score": 9, "weight": 10, "title": "💵 持有成本 Holding Cost",
   "text": "MCST 月费约 $221（1房）- $278（2房）- $267（3房），全线 <$300 → 锚点 9 分。1,472 户 + 21 排屋的超大分摊池，使这个设施密度极高的盘持有成本反而处于全市最低档，收租现金流压力小。"},
  {"score": 9, "weight": 15, "title": "🔄 退出流动性 Exit Liquidity",
   "text": "近 12 个月转售 106 笔（>50 → 9 分），D19 非新盘第一。注意成交画像中 62% 是楼花转售（TOP 前后集中换手），真正现楼转售占 33%——说明早期买家获利了结通道顺畅。$0.86-1.5M 的主力总价带正对 OCR 升级者预算，纵深健康。"},
  {"score": 8, "weight": 10, "title": "🛡️ 风险控制 Risk",
   "text": "二手现楼、无政策窗口 → 锚点 8。地契 2018 年起剩约 91 年。需留意的是成交结构：早期楼花转售占比高意味着同户型成本线差异大，谈判时对手的让利空间也大；高总价排屋/5房退出纵深有限（近1年 4房+ 仅 5 笔）。"}
 ],
 "compTitle": "D19 同区可比项目（近1年均价）",
 "comps": [
  {"name": "Riverfront Residences（本盘）", "tenure": "99年 (2018)", "psf": "$1,741", "self": True},
  {"name": "The Florence Residences", "tenure": "99年", "psf": "$1,876"},
  {"name": "Affinity at Serangoon", "tenure": "99年", "psf": "$1,797"},
  {"name": "The Minton", "tenure": "99年", "psf": "$1,590"},
  {"name": "Kingsford Waterbay", "tenure": "99年", "psf": "$1,465"}
 ],
 "compNote": "本盘比 Florence/Affinity 便宜 4-7%，比同河畔的 Kingsford Waterbay 贵 19%——定价卡在「镇中心配套 + 河畔景观 + CRL 期权」的中间甜点位。Chuan Park（$2,652）为 2026 新盘重建项目，口径不同未列入。数据源：URA。",
 "lifestyle": {
  "quotes": [
   {"t": "空间、河景与度假村尺度的设施，以低于区均价的 PSF 成交——交换条件是一段真实的、没有营销美化的 MRT 步行距离。", "src": "👍 ShiokNest 项目评测 (7.8/10), 2026"},
   {"t": "门口就是 Serangoon Park Connector，骑车、慢跑、皮划艇都方便；对家庭买家来说户型面积和学校范围（CHIJ OLN 0.44km）是硬吸引力。", "src": "👍 ShiokNest / 学校距离数据, 2026"},
   {"t": "开发商提供的首年免费接驳巴士已经停运，大多数住户现在步行、骑车或开车去地铁站。", "src": "👎 ShiokNest 项目评测, 2026"},
   {"t": "公开住户评价数量有限；成交结构显示 TOP 前后换手密集（62% 楼花转售），早期入住体验报告尚少，建议看房时实地核验公区维护状态。", "src": "⚠️ 数据口径说明（URA 成交画像）"}
  ],
  "rating": "★★★☆☆ (3.5/5)",
  "summary": "河畔生活方式 + 设施密度 + 低物业费是真实亮点，MRT 步行距离是真实痛点——两者都不是营销话术。交付初期曾有买家对精装细节的零星吐槽（Oxley 系的常规水平），但无系统性质量问题曝光。适合有车家庭、学区刚需与跑步/骑行爱好者；每天依赖 MRT 步行通勤的买家要把 12 分钟步行如实计入生活成本。"
 },
 "risks": [
  "MRT 844m 步行距离对无车家庭是长期生活成本，转售时也限制部分买家池",
  "Oxley 系精装口碑中等，收楼/购买二手时需仔细验房（重点：渗水、瓷砖、门窗）",
  "62% 楼花转售占比 → 同户型成本线参差，急售盘可能压价",
  "CRL 通车在 2030 年，利好兑现前通勤现状不会改善",
  "D19 新盘供应（Chuan Park 重建等）拉高片区价格锚，但也分流部分升级需求"
 ],
 "verdict": "Riverfront Residences 是五盘里「数据故事」最完整的：最高的年化涨幅（4.7%）、最高的加权毛回报（3.4%）、最低的物业费档位、1km 三校、外加一个尚未定价的 CRL 换乘站期权。它用 844 米的 MRT 距离换来了这一切——这个交换对家庭自住客和 1 房投资者非常划算，对依赖地铁步行的通勤族则不成立。综合 7.51 分，刚好跨入「推荐」区间，是五盘中风险收益比最均衡的选择。",
 "fit": {
  "yes": ["有车或以车代步的家庭（学区+河畔+大户型）", "追求 3.4%+ 回报的小户型投资者（1房 4.1%）", "看好 CRL 长线重估的耐心资本", "预算 $0.9-1.5M 的 OCR 组屋升级者"],
  "no": ["每日依赖 MRT 步行通勤的上班族", "对开发商精装品质有顶级要求的买家", "3 年内短炒的买家（CRL 利好未到兑现期）", "追求 RCR/CCR 地段保值的保守买家"]
 },
 "buyAdvice": "投资首选 1 房（$0.86M 中位价、4.1% 回报、换手最活跃）；自住优先河畔朝向中高层或分层排屋（稀缺形态）。谈判时利用楼花转售成本线差异——查同户型原始买入价，向高利润卖家压价空间更大。持有周期建议 ≥5 年，吃到 CRL 通车红利。",
 "score2": 7.51
},
# ================= 3. Jadescape =================
{
 "slug": "jadescape",
 "title": "Jadescape — D20 Bishan-Marymount RCR 智能家居大盘深度投资分析",
 "tag": "D20 Bishan/Thomson · RCR 城市边缘 · 99年地契",
 "h1": "Jadescape",
 "sub": "2-16 Shunfu Road, Singapore · 1,206 户 · TOP 2023 · Qingjian Realty 开发",
 "score": 7.27,
 "verdictLabel": "⚠️ 可考虑 — 地段增值亮眼，交付品质需验收把关",
 "meta": [
  {"k": "地契", "v": "99 年 (2018起)"},
  {"k": "总单位", "v": "1,206 套"},
  {"k": "楼栋", "v": "7 栋 (21-23层)"},
  {"k": "最近 MRT", "v": "Marymount 步行 ~371m"},
  {"k": "成交均价", "v": "$2,318 psf (近1年)"},
  {"k": "学校", "v": "Catholic High 0.75km"}
 ],
 "exec": "Jadescape 是 Bishan-Marymount 板块的 1,206 户智能家居住宅，前身 Shunfu Ville HUDC 集售（$6.38 亿，当年最大宗）。近一年转售均价 <b>$2,318 psf</b>，2021→2026 年化涨幅约 <b>5.2%</b> 为五盘最高，2024 年 72+ 笔转售据称全部获利。地段硬实力强：Marymount MRT 371 米、Catholic High 0.75km、RI/RGS 2km 圈。但硬币反面同样醒目：<b>交付品质投诉集中</b>（白蚁、室内用料廉价、瓷砖易刮花、物业管理响应慢），开发商维度被机械扣至 4.5 分；加权毛回报仅约 2.8%。<b>自住 7 分、投资 6.5 分。</b>",
 "params": {
  "basic": [
   {"k": "开发商", "v": "Qingjian Realty (Marymount) Pte Ltd"},
   {"k": "地块面积", "v": "~398,114 sqft"},
   {"k": "土地成本", "v": "$747 psf ppr（2016 集售 $638M）"},
   {"k": "土地性质", "v": "99 年地契（2018-06-19 起）"},
   {"k": "TOP", "v": "2023-01"},
   {"k": "建筑师", "v": "Tange Associates × Ong&Ong"},
   {"k": "总包", "v": "China Construction (South Pacific)"}
  ],
  "blocks": [
   {"k": "楼栋", "v": "7 栋（21-23 层）"},
   {"k": "户型", "v": "1房 527 sqft 起 ~ 5房 2,099 sqft（另 6 商铺）"},
   {"k": "车位", "v": "1,206 + 8 无障碍"}
  ],
  "facilities": [
   {"t": "50m 无边际泳池 + 50m 天际泳池", "ok": True},
   {"t": "下沉式网球场 ×2", "ok": True},
   {"t": "双健身房 + 山顶健身房", "ok": True},
   {"t": "桑拿 + 蒸汽房 + 水疗", "ok": True},
   {"t": "影院/KTV + 虚拟高尔夫", "ok": True},
   {"t": "13层空中露台 + 儿童探险乐园", "ok": True},
   {"t": "全屋智能家居（人脸门禁/HiLIFE App）", "ok": True}
  ],
  "facNote": "100+ 项设施 + 全新加坡首个全屋智能家居概念（面部识别、二维码访客、HiLIFE 物业 App），硬件规格在 RCR 大盘里数一数二，并拿下 EdgeProp 2023 唯一 Top Mega Development 奖。但要警惕：设施光环与交付用料口碑存在落差（见居住体验章节）。MCST 1房 $233、2-3房 $280、4房 $326、5房 $373/月。",
  "transport": [
   {"k": "Marymount MRT (CC16)", "v": "步行 ~371m（4-5 分钟）"},
   {"k": "Bishan 换乘 (NS/CC)", "v": "1 站"},
   {"k": "Upper Thomson MRT (TEL)", "v": "~0.76km"},
   {"k": "CTE / PIE", "v": "数分钟接入"},
   {"k": "未来 NSC 南北交通廊道", "v": "2027+"}
  ],
  "schools": [
   {"k": "Catholic High School", "v": "0.75km"},
   {"k": "Ai Tong School", "v": "1.16km"},
   {"k": "Raffles Institution", "v": "2km 内"},
   {"k": "Raffles Girls' School", "v": "2km 内"},
   {"k": "Guangyang Primary", "v": "1.37km"}
  ]
 },
 "dims": [
  {"score": 8, "weight": 20, "title": "🗺️ 地段 Location",
   "text": "RCR 基础 7 分 + MRT 371m（≤400m +1）= 8 分。Bishan-Marymount 是中部最成熟居住带之一：Shunfu 巴刹正对门、Thomson 美食带、MacRitchie 水库步行可达，1 站到 Bishan 换乘南北线。学校数据口径提示：本所 pipeline 的 1km 小学清单为空（故无 +0.5 加成），但公开口径 Catholic High 距 0.75km、RI/RGS 在 2km 圈——学区实际是加分项，按机械口径保守计 8 分。"},
  {"score": 3.8, "weight": 15, "title": "💰 租金回报 Rental Yield",
   "text": "分户型加权毛回报约 2.77%：1房 3.59%（中位价 $1.07M / 月租 $3,200）、2房 2.70%、3房 2.13%。锚点公式 3+(2.77-2.0)=3.8 分。第三方口径约 3.2%（新净溢价）。3 房以上户型买入价已站上 $2.9M，收租逻辑不成立；只有 1 房适合收租。"},
  {"score": 8, "weight": 20, "title": "📈 资本增值 Appreciation",
   "text": "2021→2026 均价 $1,799→$2,315 psf，年化约 5.2% → 锚点 8 分（>4% 档）。2023 单年 +11.2% 是 TOP 兑现段；2024 年 72+ 笔转售全部获利（第三方统计），获利盘一致性极强。前瞻无新增 MRT 利好（Marymount 已通车、NSC 为道路工程不计），维持 8 分。"},
  {"score": 4.5, "weight": 10, "title": "🏗️ 开发商信誉 Developer",
   "text": "Qingjian Realty 属中型档（5-6 分，Bellewoods/Bellewaters 曾获 BCA CONQUAS Star 是亮点），但按框架硬规则「有 defect 集体投诉记录 −1」：本项目交付后出现白蚁反复、室内用料与瓷砖易损等业主集中投诉（PropertyGuru 多条低分评价 + 管理响应慢），机械扣减后 4.5 分——这是五盘中开发商维度最低分，也是本报告最重要的风险提示。"},
  {"score": 9, "weight": 10, "title": "💵 持有成本 Holding Cost",
   "text": "MCST 月费 1房 $233 / 2-3房 $280 / 4房 $326 / 5房 $373，主力户型 <$300 → 锚点 9 分。1,206 户分摊 + 智能家居降低部分管理人力，持有成本健康。"},
  {"score": 9, "weight": 15, "title": "🔄 退出流动性 Exit Liquidity",
   "text": "近 12 个月转售 70 笔（>50 → 9 分）。更难得的是获利一致性——2024 年以来转售据称全数获利，说明二手接盘价稳步抬升、卖方无割肉压力。1-2 房占成交 67%，$1.0-1.8M 总价带流动性最好；4 房以上（$2.9M+）换手明显变慢。"},
  {"score": 8, "weight": 10, "title": "🛡️ 风险控制 Risk",
   "text": "二手现楼、无政策窗口 → 锚点 8。地契剩约 91 年。本维度的政策/杠杆/合规口径下无额外扣分项；交付品质问题按框架归入居住体验与开发商维度，不在此重复扣减——但买家应知：defect 纠纷若长期未决，会间接影响二手议价。"}
 ],
 "compTitle": "D20 同区可比项目（近1年均价）",
 "comps": [
  {"name": "Jadescape（本盘）", "tenure": "99年 (2018)", "psf": "$2,318", "self": True},
  {"name": "AMO Residence", "tenure": "99年", "psf": "$2,515"},
  {"name": "Sky Vue", "tenure": "99年", "psf": "$2,203"},
  {"name": "Thomson Three", "tenure": "99年", "psf": "$2,118"},
  {"name": "The Panorama", "tenure": "99年", "psf": "$2,084"}
 ],
 "compNote": "本盘比 Bishan 核心的 Sky Vue 贵 5%、比 AMO Residence（新盘余量）便宜 8%，是板块内「次核心、次新、近地铁」的标准定价。Thomson Three/Panorama 楼龄差距约 5-10 年，折价 9-10% 属正常楼龄曲线。数据源：URA。",
 "lifestyle": {
  "quotes": [
   {"t": "Mega development 里室内设施最全的：大健身房媲美商业健身房，泳池与凉亭设计出色，选址也极佳——对面就是巴刹，几分钟走到 Marymount MRT。", "src": "👍 PropertyGuru 业主评价 (5分), 2023-07"},
   {"t": "Google 4.4 分（97 条）：小区里有 7-11 和理发店很方便，绿化和泳池很棒，智能门禁对讲系统很有安全感。", "src": "👍 Google Reviews 汇总, 2025"},
   {"t": "白蚁问题失控、多个单位出现；室内用料廉价不耐用，瓷砖超级容易刮花；管理方处理白蚁毫无紧迫感。", "src": "👎 PropertyGuru 业主评价 (1.3分/1.2分), 2023-04 ~ 2024-05"},
   {"t": "1,206 户密度高，朝快速路方向的单元会有路噪；没有大型商场在步行圈内（最近 Thomson Plaza 1.2km）。", "src": "⚠️ Noam Nathan 评测汇总 / 市场共识"}
  ],
  "rating": "★★★☆☆ (3.5/5)",
  "summary": "评价呈明显两极：设施、地段、智能系统几乎零差评（EdgeProp 大奖背书）；但交付用料与物业管理是集中火力区——白蚁、瓷砖刮花、维修响应慢被多名业主点名。这不是结构性烂尾级问题，却实实在在影响居住体验与二手看房印象。买二手务必实地验房（重点：地板瓷砖、墙角渗水、询问白蚁处理记录），并把 MCST 管理状态问清。"
 },
 "risks": [
  "交付品质投诉集中（白蚁/用料/物业响应），二手看房印象分受损，议价时既是风险也是筹码",
  "加权毛回报仅约 2.8%，3 房以上总价段（$2.9M+）收租逻辑不成立",
  "1,206 户高密度 + 板块内无大型商场，租客更偏好 AMK/Bishan 站周边（第三方评测观点）",
  "2024 年转售全获利意味着当前买家入场成本已抬升，短期安全边际变薄",
  "朝快速路单元路噪 + 高密度，部分户型居住体验打折"
 ],
 "verdict": "Jadescape 是五盘里「反差感」最强的：5.2% 年化涨幅第一、设施规格第一、地段 8 分——但开发商维度 4.5 分也是第一（倒数）。它适合的是「会验房、重地段、买 1-2 房」的精明买家：用投诉噪音换来的议价空间，买入一个基本面（地段+流动性+学区）其实很强的盘。综合 7.27 分落「可考虑」区间——分数被开发商维度机械拉低，若你相信 defect 问题会随 MCST 成熟而消化，实际风险低于纸面。",
 "fit": {
  "yes": ["看重中部地段 + 学区的自住家庭（Catholic High/RI 圈）", "会验房、善用负面信息议价的精明买家", "1 房收租投资者（3.6% 回报 + 近地铁）", "智能家居/设施密度爱好者"],
  "no": ["对交付品质零容忍的买家", "追求省心物业管理的业主", "3 房以上大户型收租投资者（回报 2.1%）", "需要大型商场步行可达的家庭"]
 },
 "buyAdvice": "只买 1-2 房（流动性与回报唯一成立的户型段）；看房必查白蚁处理记录、瓷砖/地板损耗与渗水痕迹，把验房发现折算进报价（当前市场普遍有 2-4% 议价空间）；优先内园景或中高层避开路噪单元。",
 "score2": 7.27
},
# ================= 4. Sims Urban Oasis =================
{
 "slug": "sims-urban-oasis",
 "title": "Sims Urban Oasis — D14 Aljunied RCR GuocoLand 品质通勤盘深度投资分析",
 "tag": "D14 Aljunied · RCR 城市边缘 · 99年地契",
 "h1": "Sims Urban Oasis",
 "sub": "2-16 Sims Drive, Singapore · 1,024 户 · TOP 2017 · GuocoLand 开发",
 "score": 7.32,
 "verdictLabel": "✅ 可考虑 — 顶级开发商品质 + 双 MRT 通勤盘",
 "meta": [
  {"k": "地契", "v": "99 年 (2014起)"},
  {"k": "总单位", "v": "1,024 套"},
  {"k": "楼栋", "v": "8 座 (12-25层)"},
  {"k": "最近 MRT", "v": "Aljunied 步行 ~406m"},
  {"k": "成交均价", "v": "$1,941 psf (近1年)"},
  {"k": "1km 学校", "v": "2 所小学"}
 ],
 "exec": "Sims Urban Oasis 是 GuocoLand 在 Aljunied 的 1,024 户中型大盘，2014 年 GLS 地块、2017 年 TOP，是五个研究对象里<b>楼龄最成熟、开发商背书最强</b>的（顶级上市档 9 分）。近一年转售均价 <b>$1,941 psf</b>——比同区 Parc Esta 便宜 16%，买的是 Aljunied MRT 406 米 + Paya Lebar 区域中心步行圈 + 双 50 米泳池的均衡配置。短板：加权毛回报约 2.8% 与同区一样被老旧租金存量稀释，物业费 $290-327/月 是五盘中唯一进 $300+ 档的，且 2014 年起算的地契比其余四盘少 4 年。<b>自住 7.5 分、投资 7 分。</b>",
 "params": {
  "basic": [
   {"k": "开发商", "v": "GuocoLand Limited（国浩地产）"},
   {"k": "地块来源", "v": "2014 年 GLS 政府售地"},
   {"k": "容积率", "v": "2.8"},
   {"k": "土地性质", "v": "99 年地契（2014 起）"},
   {"k": "TOP", "v": "2017-10"},
   {"k": "规模", "v": "1,024 户 + 6 商铺 + 托儿所"},
   {"k": "总包", "v": "—"}
  ],
  "blocks": [
   {"k": "楼栋", "v": "8 座塔楼（12-25 层）"},
   {"k": "户型", "v": "1房 ~ 5房（部分顶层 4.3m 挑高 + loft）"},
   {"k": "车位", "v": "地库充足（含商业/托儿所配套）"}
  ],
  "facilities": [
   {"t": "双 50m 标准泳池（共 4 个泳池）", "ok": True},
   {"t": "屋顶空中公园（Sky Park）", "ok": True},
   {"t": "网球场 + 健身房", "ok": True},
   {"t": "会所 + 商务中心 + 多功能室", "ok": True},
   {"t": "慢跑道 + 烧烤区 + 游乐场", "ok": True},
   {"t": "小区内设托儿所 + 6 间商铺", "ok": True},
   {"t": "20 万 sqft 公共空间", "ok": True}
  ],
  "facNote": "GuocoLand 把做 Wallich Residence 的景观功力下放到了中端盘：双 50 米泳池 + 屋顶空中公园 + 20 万 sqft 公共空间，交付 8 年后公区维护状态仍是同楼龄标杆（第三方 7.9/10）。MCST 月费约 $290-327，是五盘中唯一站上 $300+ 档的——为品质付的合理溢价。",
  "transport": [
   {"k": "Aljunied MRT (EW9)", "v": "步行 ~406m（6-8 分钟，部分有遮蔽）"},
   {"k": "Paya Lebar 换乘 (EW/CC)", "v": "1 站"},
   {"k": "Mountbatten MRT (CC7)", "v": "步行 ~15 分钟"},
   {"k": "CBD (Raffles Place)", "v": "MRT 直达 <10 分钟"},
   {"k": "PIE / KPE / Nicoll Hwy", "v": "5 分钟车程"}
  ],
  "schools": [
   {"k": "Geylang Methodist (Primary)", "v": "~0.6km"},
   {"k": "Canossa Catholic Primary", "v": "1km 内"},
   {"k": "Geylang Methodist (Sec)", "v": "~0.7km"},
   {"k": "James Cook University", "v": "~1.2km"},
   {"k": "Nexus International", "v": "步行圈"}
  ]
 },
 "dims": [
  {"score": 8, "weight": 20, "title": "🗺️ 地段 Location",
   "text": "RCR 基础 7 分；MRT 406m 以 6 米之差错过 ≤400m 的 +1 档，但 1km 内 2 所小学 +0.5 → 7.5；再按同区同分规则（与 Parc Esta 同属 D14、MRT 距离差 228m≤250m）取同档较高分 = 8 分。Aljunied-Paya Lebar 是东区通勤效率最高的走廊之一，PLQ 办公+商圈步行可达，EWL 直达 CBD 无需换乘。"},
  {"score": 3.8, "weight": 15, "title": "💰 租金回报 Rental Yield",
   "text": "分户型加权毛回报约 2.81%：1房 2.92%（中位价 $1.19M / 月租 $2,900）、2房 2.52%、3房 2.68%。锚点公式 3.8 分。注意口径差异：D14 租金中位数含大量 Geylang 老旧公寓，第三方用本盘真实租约算得约 3.9%（1房 $3,210、2房 $3,907）——本盘实际租值显著高于片区中位，但按框架机械口径记 3.8 分并在文字中说明。"},
  {"score": 7, "weight": 20, "title": "📈 资本增值 Appreciation",
   "text": "2021→2026 均价 $1,622→$1,952 psf，年化约 3.8% → 锚点 7 分（2-4% 档，逼近 4%）。逐年节奏健康（2024 +6.3% 最强）。前瞻：Paya Lebar 区域中心利好已大部兑现，无新增重大基建，不加减。2014 年起算的地契比同期新盘少约 4 年，长线持有需纳入折旧曲线考量。"},
  {"score": 9, "weight": 10, "title": "🏗️ 开发商信誉 Developer",
   "text": "GuocoLand 属顶级上市档（9 分）：Wallich Residence、Leedon Residence 等高端交付记录，资金与品控体系成熟。交付 8 年后公区维护与二手口碑依然在线，是五盘中唯一「楼龄越长越能证明品质」的样本。"},
  {"score": 7, "weight": 10, "title": "💵 持有成本 Holding Cost",
   "text": "MCST 月费约 $290-327（3房约 $290-327，大户型更高），落入 $300-500 档 → 锚点 7 分。1,024 户摊薄力度不及 1,400+ 户级别对手，但换来了更高的公区人均密度与维护品质，属合理的品质溢价。"},
  {"score": 9, "weight": 15, "title": "🔄 退出流动性 Exit Liquidity",
   "text": "近 12 个月转售 61 笔（>50 → 9 分），且是五盘中唯一 100% 现楼转售的项目——成交结构最干净（无楼花换手噪音），每一笔都是真实二手供需。1房占 54%，$1.1-1.9M 总价带正对专业人士与升级者预算。"},
  {"score": 8, "weight": 10, "title": "🛡️ 风险控制 Risk",
   "text": "二手现楼、无政策窗口 → 锚点 8。地契剩约 87 年（2014 起算），比其余四盘少 4 年但仍远离 60 年融资红线。租客池深厚（PLQ 办公群 + CBD 通勤）降低空置风险；利率敏感性为标准敞口。"}
 ],
 "compTitle": "D14 同区可比项目（近1年均价）",
 "comps": [
  {"name": "Sims Urban Oasis（本盘）", "tenure": "99年 (2014)", "psf": "$1,941", "self": True},
  {"name": "Parc Esta", "tenure": "99年 (2018)", "psf": "$2,317"},
  {"name": "Park Place Residences @ PLQ", "tenure": "99年", "psf": "$2,262"},
  {"name": "Penrose", "tenure": "99年", "psf": "$2,154"},
  {"name": "Urban Treasures", "tenure": "永久", "psf": "$1,978"}
 ],
 "compNote": "本盘比 Parc Esta 便宜 16%、比永久地契的 Urban Treasures 还低 2%——楼龄多 5 年换来的折价，对看重 GuocoLand 品质与成熟社区的买家是性价比入口。数据源：URA。",
 "lifestyle": {
  "quotes": [
   {"t": "双 50 米泳池、设备齐全的健身房、社交会所、儿童游乐区、全景屋顶空中公园——超过 20 万 sqft 的公共空间，让住户有地方透气，这在这种体量的项目里很难得。", "src": "👍 ShiokNest 项目评测 (7.9/10), 2026"},
   {"t": "EWL 一线直达 City Hall、Raffles Place、Tanjong Pagar，不开车也能真通勤；Mountbatten 环线站步行 15 分钟是第二选择，比只靠 Aljunied 的 Geylang 项目多一条腿。", "src": "👍 ShiokNest 项目评测, 2026"},
   {"t": "租约结构明显偏向紧凑户型——1-2 房占租约大头，意味着租客以单身专业人士与合租为主，换手更频繁；如果你买来自己住、希望邻居稳定，这一点要有预期。", "src": "👎 ShiokNest 租约结构分析, 2026"},
   {"t": "Geylang 片区的夜间氛围与刻板印象是部分家庭买家的心理门槛；项目本身在 Sims Drive 内侧，与闹区有缓冲，但片区标签仍影响部分转售买家池。", "src": "⚠️ 市场共识 / 片区分析"}
  ],
  "rating": "★★★★☆ (4.0/5)",
  "summary": "交付 8 年后的 Sims Urban Oasis 是「时间验证过」的盘：公区维护、通勤效率、开发商口碑全部在线，第三方给到 7.9/10。负面集中在两处：租客换手频繁带来的邻居流动感（1-2 房投资者占比高的必然结果），以及 Geylang 片区标签对家庭买家的心理影响。自住建议选 3 房以上自住率高的楼栋；投资则享受它深厚的租客池。"
 },
 "risks": [
  "加权毛回报约 2.8%（机械口径），依赖本盘真实租值（约 3.9%）才有投资意义，买入价纪律必须严格",
  "2014 年起算地契比次新盘少 4 年，超长线（20 年+）持有的折旧曲线略陡",
  "租客换手率高 → 邻居流动性大，纯自住买家需选楼栋选户型规避",
  "Geylang 片区标签长期压制部分家庭买家池",
  "MCST $300+ 档，五盘中持有成本最高（品质溢价，但收租现金流需计入）"
 ],
 "verdict": "Sims Urban Oasis 是「均衡派」：地段 8、开发商 9、流动性 9，没有一项短板掉进 5 分以下——代价也没有一项惊喜（回报 3.8、增值 7）。它比 Parc Esta 便宜 16%，用楼龄和 4 年地契换 GuocoLand 的品质确定性，对计划持有 10 年左右的买家是划算交易。综合 7.32 分居「可考虑」区间：不是让人兴奋的选择，但很难买错。",
 "fit": {
  "yes": ["看重开发商品质与社区成熟度的自住家庭", "CBD/PLQ 通勤族（EWL 直达 + 环线备选）", "预算 $1.1-1.9M 的专业人士首套私宅", "信任真实租值（~3.9%）的 1-2 房收租投资者"],
  "no": ["追求最低物业费的长线持有者", "对 Geylang 片区标签敏感的家庭", "希望邻居以自住家庭为主的买家（1-2 房楼栋）", "博短期价差的新盘偏好者"]
 },
 "buyAdvice": "优先中高层内园景 2-3 房（自住率与转手纵深最好）；与 Parc Esta 比价是本盘核心谈判逻辑——折价维持在 15% 左右属合理，折价收窄到 10% 以内则说明报价偏高；验房重点查 8 年楼龄的空调/厨卫设备更换状态。",
 "score2": 7.32
},
# ================= 5. Whistler Grand =================
{
 "slug": "whistler-grand",
 "title": "Whistler Grand 悦湖苑 — D5 West Coast OCR CDL 双塔景观盘深度投资分析",
 "tag": "D5 West Coast · OCR 城市外围 · 99年地契",
 "h1": "Whistler Grand 悦湖苑",
 "sub": "105-109 West Coast Vale, Singapore · 716 户 · TOP 2021 · CDL 开发",
 "score": 7.55,
 "verdictLabel": "✅ 推荐 — 双名校 + JRL 期权的 CDL 西区景观盘",
 "meta": [
  {"k": "地契", "v": "99 年 (2018起)"},
  {"k": "总单位", "v": "716 套"},
  {"k": "楼栋", "v": "2 栋 (36层双塔)"},
  {"k": "最近 MRT", "v": "Clementi ~1.3km（接驳车）"},
  {"k": "成交均价", "v": "$1,948 psf (近1年)"},
  {"k": "1km 学校", "v": "2 所（含 Nan Hua）"}
 ],
 "exec": "Whistler Grand 是 CDL 在 West Coast Vale 的 716 户双塔地标（36 层），88 米空中泳池正对 Pandan Reservoir。近一年转售均价 <b>$1,948 psf</b>，2021→2026 年化涨幅约 3.9%。它的投资逻辑是「<b>学区现在时 + 交通将来时</b>」：Qifa Primary 390 米、Nan Hua Primary（SAP 名校）750 米已经落袋；JRL Pandan Reservoir 站（约 1.06km，预计 2028）与 Jurong Lake District 第二 CBD 的兑现是免费期权。分户型加权毛回报约 <b>3.3%</b>（1房 3.8%）为五盘第二。核心短板同样明显：现阶段离 Clementi MRT 1.3km，日常通勤依赖 CDL 免费接驳车或自驾。<b>自住 7.5 分、投资 7.5 分。</b>",
 "params": {
  "basic": [
   {"k": "开发商", "v": "CDL Pegasus Pte Ltd（城市发展）"},
   {"k": "地块面积", "v": "210,883 sqft"},
   {"k": "土地成本", "v": "$800 psf ppr"},
   {"k": "土地性质", "v": "99 年地契（2018-05-07 起）"},
   {"k": "TOP", "v": "2021-10"},
   {"k": "建筑师", "v": "ADDP Architects"},
   {"k": "总包", "v": "Tiong Seng Contractors"}
  ],
  "blocks": [
   {"k": "楼栋", "v": "2 栋（36 层双塔）"},
   {"k": "户型", "v": "1房 441 sqft 起 ~ 5房/PH 2,422 sqft（含 Dual-Key）"},
   {"k": "车位", "v": "716（1:1，两层地库）"}
  ],
  "facilities": [
   {"t": "88m 空中泳池 + 水疗池", "ok": True},
   {"t": "悬挑健身房（Cantilevered Gym）", "ok": True},
   {"t": "Sky Club / Star Club 空中会所", "ok": True},
   {"t": "网球场 + 家庭泳池 + 儿童池", "ok": True},
   {"t": "儿童探险乐园 + 小区托儿所", "ok": True},
   {"t": "BBQ + 多功能室", "ok": True},
   {"t": "免费接驳车至 Clementi / Jurong East", "ok": True}
  ],
  "facNote": "双塔 36 层把设施抬上高空——88m 空中泳池与悬挑健身房正对 Pandan Reservoir 与海岸线，景观是 D5 同价位里独一档。1:1 车位配比 + 免费接驳巴士是对「离 MRT 远」的务实补偿。MCST 月费 1房 $250、2-3房 $300、4-5房 $350、PH $400。",
  "transport": [
   {"k": "Clementi MRT (EW23)", "v": "~1.31km（免费接驳车）"},
   {"k": "Pandan Reservoir MRT (JE7, 在建)", "v": "~1.06km，预计 2028"},
   {"k": "West Coast MRT (CRL, 规划)", "v": "2032+"},
   {"k": "AYE", "v": "数分钟上高速"},
   {"k": "NUS / one-north / Jurong East", "v": "10 分钟车程"}
  ],
  "schools": [
   {"k": "Qifa Primary", "v": "~390-750m"},
   {"k": "Nan Hua Primary（SAP 名校）", "v": "~750m"},
   {"k": "Commonwealth Secondary", "v": "0.97km"},
   {"k": "Clementi Town Secondary", "v": "0.97km"},
   {"k": "NUS / UWCSEA / Japanese School", "v": "短车程"}
  ]
 },
 "dims": [
  {"score": 7, "weight": 20, "title": "🗺️ 地段 Location",
   "text": "OCR 基础 6 分 + 1km 内 2 所小学（+0.5）+ Nan Hua 属 SAP 名校（再 +0.5）= 7 分。MRT 1.31km 落在 400-1500m 中性档无加减（>1500m 才 -1）。West Coast Vale 是纯住宅飞地，安静+水库景观是生活质感加成，但现阶段商业配套薄弱（最近 West Coast Plaza 800m），通勤便利性待 JRL 兑现后重估。"},
  {"score": 5.3, "weight": 15, "title": "💰 租金回报 Rental Yield",
   "text": "分户型加权毛回报约 3.26%：1房 3.77%（中位价 $1.11M / 月租 $3,500）、2房 2.68%、3房 2.92%。锚点公式 5+(3.26-3.0)=5.3 分，五盘第二。D5 租金为五区最高（NUS、one-north、International Business Park 租客池支撑），1 房产品是回报主力。"},
  {"score": 8, "weight": 20, "title": "📈 资本增值 Appreciation",
   "text": "2021→2026 均价 $1,623→$1,963 psf，年化约 3.9% → 锚点 7 分；前瞻 +1：JRL Pandan Reservoir 站（2028）+ Jurong Lake District 第二 CBD + 远期 CRL West Coast 换乘属「重大基建利好」。合计 8 分。2023 年 +9.8% 的拉升证明市场对西区故事买账，2024-2026 转入 1-2.5% 的平台整固。"},
  {"score": 9, "weight": 10, "title": "🏗️ 开发商信誉 Developer",
   "text": "CDL 属顶级上市档（9 分）：60+ 年、5 万+ 套交付记录，BCA Quality Champion（Platinum）七连冠（至 2019），精装用料与公区维护是行业标杆。双塔高空设施的结构与防水工程复杂度高于常规盘，CDL 的工程履历是最让人放心的背书。"},
  {"score": 7, "weight": 10, "title": "💵 持有成本 Holding Cost",
   "text": "MCST 月费 1房 $250、2-3房 $300、4-5房 $350、PH $400——主力 2-3 房恰好卡在 $300 线，落入 $300-500 档 → 锚点 7 分。716 户（少于千户级对手）+ 双塔高空设施维护成本略高，是品质与成本的平衡点。"},
  {"score": 9, "weight": 15, "title": "🔄 退出流动性 Exit Liquidity",
   "text": "近 12 个月转售 58 笔（>50 → 9 分），是 D5 非新盘成交最活跃的盘之一。1房占 49%（$1.1M 中位价正对投资者），2-3 房家庭户型换手也稳定；TOP 2021 已满 3 年 SSD 窗口，卖方无税务束缚。"},
  {"score": 8, "weight": 10, "title": "🛡️ 风险控制 Risk",
   "text": "二手现楼、无政策窗口 → 锚点 8。地契剩约 91 年。本盘特有风险不在政策口径内（归入居住体验）：JRL 建设期的噪音与灰尘、以及兑现时间表的延期风险（已从 2027 延至 2028）——基建期权的价值取决于持有耐心。"}
 ],
 "compTitle": "D5 同区可比项目（近1年均价）",
 "comps": [
  {"name": "Whistler Grand（本盘）", "tenure": "99年 (2018)", "psf": "$1,948", "self": True},
  {"name": "Parc Clematis", "tenure": "99年", "psf": "$2,231"},
  {"name": "Normanton Park", "tenure": "99年", "psf": "$2,004"},
  {"name": "Faber Residence", "tenure": "99年", "psf": "$2,160"},
  {"name": "Parc Riviera", "tenure": "99年", "psf": "$1,752"}
 ],
 "compNote": "本盘比 Parc Clematis 便宜 13%、比 Normanton Park 便宜 3%，比同 West Coast 的 Parc Riviera（2019 TOP、离 MRT 更远）贵 11%——定价准确反映了「学区 + 景观 + CDL 品质」的组合价值，JRL 兑现前仍有相对低估空间。数据源：URA。",
 "lifestyle": {
  "quotes": [
   {"t": "双 36 层塔楼让海景与城景单元形成清晰分层，25 层以上朝海 3 房是最抢手的组合——全景水景 + 宜居家庭户型；Dual-Key 户型可以两边分租、一住一租或合成大平层。", "src": "👍 ShiokNest 项目评测, 2026"},
   {"t": "Qifa Primary 只有 390 米——稳稳落在 1km 优先报名圈；Nan Hua Primary 780 米。两所都是有口碑的热门学校。NUS 短车程，租客池里还有大学师生。", "src": "👍 ShiokNest 项目评测, 2026"},
   {"t": "最近的运营中 MRT 是 1.3km 外的 Clementi——在新加坡的热带天气里等于 16-18 分钟步行，日常通勤实际上要靠巴士、接驳车或私家车。CDL 的免费接驳巴士是务实的补丁，也等于官方承认了 MRT 缺口是本盘头号短板。", "src": "👎 ShiokNest 项目评测, 2026"},
   {"t": "JRL Pandan Reservoir 站预计 2028 年中通车（已较原计划延期）；West Coast 延线换乘 CRL 要到 2030 年代末。这些线路会彻底改变连通性，但都是多年以后的事。", "src": "⚠️ ShiokNest 项目评测, 2026"}
  ],
  "rating": "★★★★☆ (4.0/5)",
  "summary": "居住体验分两块说：小区内——CDL 交付品质、高空设施、水库景观、West Coast Park 近在咫尺，家庭与宠物友好度高，几乎无负面；小区外——现阶段是「车本位」生活（步行指数仅 41/100），买菜靠 West Coast Plaza（800m），通勤靠接驳车。适合有车家庭与看重学区的自住客；无车通勤族要么等 2028，要么把接驳车时刻表背下来。"
 },
 "risks": [
  "现阶段 MRT 缺口是硬伤：Clementi 1.3km，无车家庭日常生活成本（时间/接驳依赖）需如实计入",
  "JRL 已延期一次（2027→2028），基建期权兑现节奏不完全可控",
  "JRL/CRL 施工期的噪音、灰尘与道路改道会影响短期居住体验",
  "716 户中 1 房占比高 → 投资客比例不低，租客换手频繁",
  "D5 新盘供应（Faber Residence、Elta 等 $2,100-2,600 psf）拉高片区锚价，也分流升级需求"
 ],
 "verdict": "Whistler Grand 是「现在打折、未来兑现」的典型：学区（Qifa 390m + Nan Hua 750m）与 CDL 品质是已落袋的价值，JRL + Jurong Lake District + 远期 CRL 是三层未定价的期权——而你需要支付的代价只是「2028 年前依赖接驳车/自驾」。3.26% 加权回报 + 3.9% 年化 + 58 笔年成交，让等待期并不煎熬。综合 7.55 分为五盘最高，入「推荐」区间：它奖励的是有耐心的买家。",
 "fit": {
  "yes": ["有孩子、锁定 Qifa/Nan Hua 学区的家庭", "有车或接受接驳车的自住买家", "看好 Jurong Lake District 10 年故事的耐心资本", "1 房收租投资者（3.8% + NUS 租客池）"],
  "no": ["无车且每日依赖 MRT 的通勤族（2028 年前）", "对施工噪音敏感、追求即刻成熟的买家", "短炒客（基建期权 3 年内难兑现）", "预算只够楼梯房总价但想要大户型的买家"]
 },
 "buyAdvice": "投资首选 1 房（$1.1M 中位价、3.8% 回报、换手占比 49%）；自住优先 25 层以上朝水库/海景 3 房（二手市场最抢手组合）；趁 JRL 通车前的平台期（2024-2026 年涨幅仅 1-2.5%）入场议价，通车后大概率重估。",
 "score2": 7.55
}
]

data = json.load(open(F, encoding='utf-8'))
existing = {c['slug'] for c in data}
added = 0
for c in FIVE:
    if c['slug'] in existing:
        print(f"SKIP {c['slug']} (already exists)")
        continue
    # 评分自洽校验
    comp = sum(d['score'] * d['weight'] for d in c['dims']) / 100
    assert abs(comp - c['score2']) < 0.05, f"{c['slug']}: 标注 {c['score2']} != 加权 {comp:.3f}"
    data.append(c)
    added += 1
    print(f"ADD {c['slug']}: score2={c['score2']} (加权校验 {comp:.3f} OK)")
json.dump(data, open(F, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"完成: 新增 {added}, 总计 {len(data)}")
