/*
  config.js
  ---------
  या फाईलमध्ये सर्व 13 Annex (विवरणपत्र) यांची रचना (columns + rows) दिलेली आहे.
  प्रत्येक Annex चा टाईप:
    - "fixed"   : रकाने (rows) आधीच ठरलेले आहेत (उदा. Annex 1, 2, 2a, 5, 7). युजर फक्त संख्या भरतो.
    - "dynamic" : युजर स्वतः नवीन ओळी (rows) जोडू शकतो (उदा. Annex 2b, 3, 3a, 6).
    - "keyvalue": फॉर्म सारखी साधी माहिती (उदा. Annex 4).

  प्रत्येक column ला "editable: true/false" आणि "type" (number/text) दिलेला आहे.
  computed columns साठी "formula" फंक्शन दिलेले आहे (row मधील इतर column च्या मूल्यांवरून आपोआप गणना).

  *** महत्त्वाचे: तुम्ही ही फाईल बघून रकान्यांची अचूक नावे/क्रम हवं तसं बदलू शकता. ***
  मूळ एक्सेल फाईलमधून जेवढी माहिती वाचता आली तेवढी इथे भरली आहे; काही ठिकाणी
  (उदा. Annex 3, 3a, 6) पूर्ण रकाने एक्सेलमध्ये रिकामे/कापलेले असल्याने ते "dynamic" ठेवले आहेत
  जेणेकरून युजर आवश्यक तेवढ्या ओळी स्वतः भरू शकेल.
*/

const ANNEX_CONFIG = [
  // ---------------- Annex 1 (एक्सेलप्रमाणे तंतोतंत — 18 रकाने, 13 स्तंभ) ----------------
  {
    id: "annex1",
    title: "विवरणपत्र 1 : वेतन अनुदान/वेतन खर्च",
    type: "fixed",
    summaryKey: "total4m",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false, width: "5%" },
      { key: "baab", label: "खर्चाचे प्रकार", type: "text", editable: false, width: "20%" },
      { key: "py", label: "प्रत्यक्ष खर्च 2025-2026", type: "number", editable: true },
      { key: "budgetProv", label: "अर्थसंकल्पीय तरतूद 2026-2027", type: "number", editable: true },
      { key: "actual4m", label: "प्रत्यक्ष खर्च 01/04/2026 ते 31/07/2026", type: "number", editable: true },
      { key: "expected4m", label: "संभाव्य खर्च 01/08/2026 ते 31/03/2027", type: "number", editable: true },
      { key: "total4m", label: "एकूण खर्च 2026-2027 (5+6)", type: "number", editable: false,
        formula: r => num(r.actual4m) + num(r.expected4m) },
      { key: "diff", label: "खर्च कमी(-) खर्च जास्त(+) (7-4)", type: "number", editable: false,
        formula: r => num(r.total4m_computed) - num(r.budgetProv) },
      { key: "manjur", label: "कर्मचारी संख्या - मंजूर", type: "number", editable: true },
      { key: "bharleli", label: "कर्मचारी संख्या - भरलेली", type: "number", editable: true },
      { key: "rikt", label: "कर्मचारी संख्या - रिक्त", type: "number", editable: true },
      { key: "mahinaVarsh", label: "वेतनाचा प्रत्यक्ष खर्च - महिना व वर्ष", type: "text", editable: true },
      { key: "rakkam", label: "वेतनाचा प्रत्यक्ष खर्च - रक्कम", type: "text", editable: true },
    ],
    rows: [
      { sr: "1", baab: "मूळ वेतन (सुधारित वेतनसंरचनेतील अनुज्ञेय वेतन स्तरामधील मुळ वेतन)" },
      { sr: "2", baab: "राष्ट्रीय निवृत्ती वेतन (NPS) १४ टक्के प्रमाणे (लेखाशिर्षनिहाय दर्शविण्यात यावा.) (मूळ वेतन अधिक महागाई भत्ता यावर १४ टक्के)" },
      { sr: "3 अ", baab: "चालू आर्थिक वर्ष 2026-27 करीता मार्च 2026 ते फेब्रुवारी 2027 (12 महिन्याकरीता) महागाई भत्ता 58 टक्के प्रमाणे (वि.वि.शा.नि.दि. 25.02.2026 अन्वये)" },
      { sr: "", baab: "वित्त विभाग शा.नि.दि. 25.02.2026 अन्वये - माहे जुलै 2025 ते ऑक्टोबर 2025 ची 3 टक्के नुसार 4 महिन्यांची थकबाकी" },
      { sr: "", baab: "वित्त विभाग शा.नि.दि. 18.05.2026 अन्वये - माहे नोव्हेंबर 2025 ते जानेवारी 2026 ची 3 टक्के नुसार 3 महिन्यांची थकबाकी" },
      { sr: "ब", baab: "माहे जानेवारी, 2026 करीता संभाव्य 2 टक्के महागाई भत्ता वाढ गृहीत धरुन जानेवारी 2026 ते फेब्रुवारी 2027 (14 महिन्यांकरीता) 2 टक्के प्रमाणे" },
      { sr: "क", baab: "माहे जुलै, 2026 करीता संभाव्य 3 टक्के महागाई भत्ता वाढ गृहीत धरुन जुलै 2026 ते फेब्रुवारी 2027 (8 महिन्यांकरीता) 3 टक्के प्रमाणे" },
      { sr: "", baab: "एकूण महागाई भत्ता (अ + ब + क)", isSubtotal: true, sumRows: [2, 3, 4, 5, 6] },
      { sr: "4", baab: "घरभाडे भत्ता (वित्त विभाग शा.नि.दि. 05.02.2019 अन्वये)" },
      { sr: "5", baab: "स्थानिक पूरक भत्ता" },
      { sr: "6", baab: "वाहतूक भत्ता (वित्त विभाग शा.नि.दि. 20.04.2022 अन्वये)" },
      { sr: "7", baab: "प्रोंत्साहन भत्ता" },
      { sr: "8", baab: "10/20/30 वर्षे कालबध्द पदोन्नती भार व लाभार्थी" },
      { sr: "9", baab: "रजा प्रवास सवलत योजना (भार)" },
      { sr: "10", baab: "वैद्यकीय प्रतिपूर्ती (भार/लाभार्थी संख्या दर्शविण्यात यावी)" },
      { sr: "11", baab: "थकित देयके (विवरण पत्र क्रमांक : 1अ मधील रकाना क्र.6 मधील एकूण रक्कम) (लाभार्थी संख्या दर्शविण्यात यावी.)" },
      { sr: "12", baab: "इतर खर्च (सर्व तपशिलासह सादर करावा)" },
      { sr: "", baab: "एकूण", isTotalRow: true, sumRows: [0, 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    ],
  },

  // ---------------- Annex 1a ----------------
  {
    id: "annex1a",
    title: "विवरणपत्र 1अ : थकित देयकांचा तपशील",
    type: "dynamic",
    summaryKey: "rakkam",
    addRowLabel: "नवीन थकित देयक जोडा",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false, auto: "serial" },
      { key: "srcUser", label: "युजर (Master एकत्रीकरणात भरले जाते)", type: "text", editable: false },
      { key: "naav", label: "कर्मचाऱ्याचे नाव / देयकाचा तपशील", type: "text", editable: true, width: "25%" },
      { key: "pad", label: "पद", type: "text", editable: true },
      { key: "kaalavadhi", label: "कालावधी (माहे-ते-माहे)", type: "text", editable: true },
      { key: "rakkam", label: "रक्कम (₹ हजारात)", type: "number", editable: true },
      { key: "karan", label: "थकित राहण्याचे कारण", type: "text", editable: true, width: "20%" },
    ],
    rows: [],
  },

  // ---------------- Annex 1b ----------------
  {
    id: "annex1b",
    title: "विवरणपत्र 1ब",
    type: "dynamic",
    summaryKey: "actual",
    addRowLabel: "नवीन ओळ जोडा",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false, auto: "serial" },
      { key: "srcUser", label: "युजर (Master एकत्रीकरणात भरले जाते)", type: "text", editable: false },
      { key: "baab", label: "बाब", type: "text", editable: true, width: "30%" },
      { key: "prov", label: "तरतूद", type: "number", editable: true },
      { key: "actual", label: "प्रत्यक्ष खर्च", type: "number", editable: true },
      { key: "shera", label: "शेरा", type: "text", editable: true },
    ],
    rows: [],
  },

  // ---------------- Annex 2 ----------------
  {
    id: "annex2",
    title: "विवरणपत्र 2 : योजनानिहाय चारमाही सुधारित अंदाजपत्रक",
    type: "fixed",
    summaryKey: "total",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false },
      { key: "uddishtha", label: "वर्षाचे उद्दिष्ट", type: "text", editable: false, width: "25%" },
      { key: "prov", label: "अर्थसंकल्पिय तरतूद 2026-27", type: "number", editable: true },
      { key: "actual", label: "प्रत्यक्ष खर्च 01/04 ते 31/07", type: "number", editable: true },
      { key: "expected", label: "संभाव्य खर्च 01/08 ते 31/03", type: "number", editable: true },
      { key: "total", label: "एकूण खर्च", type: "number", editable: false,
        formula: r => (num(r.actual) + num(r.expected)) },
      { key: "diff", label: "जादा(+)/कमी(-)", type: "number", editable: false,
        formula: r => (num(r.total_computed) - num(r.prov)) },
      { key: "reason", label: "कारणे", type: "text", editable: true, width: "20%" },
    ],
    rows: [
      { sr: "1", uddishtha: "01 वेतन" },
      { sr: "2", uddishtha: "02 मजूरी" },
      { sr: "3", uddishtha: "03 अतिकालिक भत्ता" },
      { sr: "4", uddishtha: "06 दूरध्वनी, वीज, पाणी" },
      { sr: "5", uddishtha: "10 कंत्राटी सेवा" },
      { sr: "6", uddishtha: "11 प्रवास खर्च" },
      { sr: "7", uddishtha: "13 कार्यालयीन खर्च" },
      { sr: "8", uddishtha: "14 भाडेपट्टी व कर" },
      { sr: "9", uddishtha: "16 प्रकाशने" },
      { sr: "10", uddishtha: "17 संगणक खर्च" },
      { sr: "11", uddishtha: "19 आहार खर्च" },
      { sr: "12", uddishtha: "21 सामग्री व पुरवठा" },
      { sr: "13", uddishtha: "24 पेट्रोल, तेल, वंगण" },
      { sr: "14", uddishtha: "28 व्यावसायिक व विशेष सेवा" },
      { sr: "15", uddishtha: "31 सहाय्यक अनुदान (वेतनेत्तर)" },
      { sr: "16", uddishtha: "34 शिष्यवृत्या व विद्यावेतने" },
      { sr: "17", uddishtha: "50 इतर खर्च" },
      { sr: "18", uddishtha: "52 यंत्रसामुग्री साधनसामुग्री" },
      { sr: "", uddishtha: "एकूण", isTotalRow: true,
        sumRows: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
    ],
  },

  // ---------------- Annex 2a ----------------
  {
    id: "annex2a",
    title: "विवरणपत्र 2अ : दूरध्वनी, वीज, पाणी व कार्यालयीन खर्चाचा तपशील",
    type: "fixed",
    summaryKey: "total",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false },
      { key: "baab", label: "खर्चाची बाब", type: "text", editable: false, width: "28%" },
      { key: "prov", label: "अर्थसंकल्पिय तरतूद", type: "number", editable: true },
      { key: "actual", label: "प्रत्यक्ष खर्च 01/04 ते 31/07", type: "number", editable: true },
      { key: "expected", label: "संभाव्य खर्च 01/08 ते 31/03", type: "number", editable: true },
      { key: "total", label: "एकूण खर्च", type: "number", editable: false,
        formula: r => (num(r.actual) + num(r.expected)) },
    ],
    rows: [
      { sr: "1", baab: "विद्युत खर्च" },
      { sr: "2", baab: "दूरध्वनि खर्च" },
      { sr: "3", baab: "पाणीपट्टी खर्च" },
      { sr: "अ", baab: "एकूण (अ) दूरध्वनी, वीज, पाणी खर्च", isSubtotal: true, sumRows: [0, 1, 2] },
      { sr: "4", baab: "गॅस खर्च" },
      { sr: "5", baab: "उष्ण व शीत हवामान विषयक खर्च" },
      { sr: "6", baab: "वाचनालय" },
      { sr: "7", baab: "लेखनसामग्री" },
      { sr: "8", baab: "प्रयोगशाळा" },
      { sr: "9", baab: "कार्यालयीन यंत्राची व उपकरणांची खरेदी आणि परिरक्षण" },
      { sr: "10", baab: "टपालखर्च" },
      { sr: "11", baab: "फर्निचर खरेदी" },
      { sr: "12", baab: "फर्निचर दुरुस्ती" },
      { sr: "13", baab: "नमुने छपाई" },
      { sr: "14", baab: "वाहनांचे परिरक्षण" },
      { sr: "15", baab: "इतर खर्च" },
      { sr: "ब", baab: "एकूण (ब) कार्यालयीन खर्च (अ.क्र.4 ते 15)", isTotalRow: true,
        sumRows: [4,5,6,7,8,9,10,11,12,13,14,15] },
    ],
  },

  // ---------------- Annex 2b ----------------
  {
    id: "annex2b",
    title: "विवरणपत्र 2ब : इमारत भाडेबाबतचा तपशील",
    type: "dynamic",
    summaryKey: "ekun_tartud",
    addRowLabel: "नवीन इमारत/भाडे तपशील जोडा",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false, auto: "serial" },
      { key: "srcUser", label: "युजर (Master एकत्रीकरणात भरले जाते)", type: "text", editable: false },
      { key: "vibhag", label: "विभागाचे नाव", type: "text", editable: true },
      { key: "karyalay", label: "कार्यालयाचे नाव", type: "text", editable: true },
      { key: "prakar", label: "प्रकार (नियमित/थकीत)", type: "text", editable: true },
      { key: "tapshil", label: "इमारतीचा तपशील", type: "text", editable: true, width: "18%" },
      { key: "kshetrafal", label: "क्षेत्रफळ", type: "text", editable: true },
      { key: "bhaade_pratimaha", label: "भाडे प्रति महा", type: "number", editable: true },
      { key: "ekun_tartud", label: "2026-27 करीता एकूण तरतूद", type: "number", editable: true },
      { key: "kaalavadhi", label: "तरतूदीचा कालावधी (माहे-ते-माहे)", type: "text", editable: true },
      { key: "karan", label: "थकीत राहण्याची कारणे", type: "text", editable: true },
      { key: "actual", label: "प्रत्यक्ष खर्च 01/04 ते 31/07", type: "number", editable: true },
    ],
    rows: [],
  },

  // ---------------- Annex 3 ----------------
  {
    id: "annex3",
    title: "विवरणपत्र 3 : भविष्य निर्वाह निधी (व्याज प्रदान)",
    type: "dynamic",
    summaryKey: "rakkam",
    addRowLabel: "नवीन बाब जोडा",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false, auto: "serial" },
      { key: "srcUser", label: "युजर (Master एकत्रीकरणात भरले जाते)", type: "text", editable: false },
      { key: "baab", label: "बाब", type: "text", editable: true, width: "45%" },
      { key: "rakkam", label: "रक्कम रुपये (हजारात)", type: "number", editable: true },
    ],
    rows: [
      { baab: "दि. 01/04/2026 ची आरंभीची शिल्लक" },
      { baab: "दि. 01/04/2026 ते 31/07/2026 मधील जमा वर्गणी" },
    ],
  },

  // ---------------- Annex 3a ----------------
  {
    id: "annex3a",
    title: "विवरणपत्र 3अ : 8336 नागरी ठेवी - कोषागार ताळमेळ",
    type: "dynamic",
    addRowLabel: "महिना जोडा",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false, auto: "serial" },
      { key: "srcUser", label: "युजर (Master एकत्रीकरणात भरले जाते)", type: "text", editable: false },
      { key: "mahina", label: "महिना", type: "text", editable: true },
      { key: "jama_karyalay", label: "जमा (कार्यालयानुसार)", type: "number", editable: true },
      { key: "jama_koshagar", label: "जमा (कोषागारानुसार)", type: "number", editable: true },
      { key: "kami_jast", label: "कमी/जास्त", type: "number", editable: false,
        formula: r => (num(r.jama_karyalay) - num(r.jama_koshagar)) },
      { key: "karan", label: "तफावतीची कारणे व कार्यवाही", type: "text", editable: true, width: "25%" },
    ],
    rows: [
      { mahina: "एप्रिल" }, { mahina: "मे" }, { mahina: "जून" }, { mahina: "जुलै" },
      { mahina: "ऑगस्ट" }, { mahina: "सप्टेंबर" }, { mahina: "ऑक्टोबर" }, { mahina: "नोव्हेंबर" },
      { mahina: "डिसेंबर" }, { mahina: "जानेवारी" }, { mahina: "फेब्रुवारी" }, { mahina: "मार्च" },
    ],
  },

  // ---------------- Annex 4 (key-value form) ----------------
  {
    id: "annex4",
    title: "विवरणपत्र 4 : योजना/लेखाशिर्षाबाबतची माहिती",
    type: "keyvalue",
    fields: [
      { key: "lekhashirsha_naav", label: "1. लेखाशिर्षाचे नाव", type: "text" },
      { key: "swaroop", label: "2. योजनेचे स्वरुप", type: "text" },
      { key: "uddesh", label: "3. योजनेचा उद्देश", type: "text" },
      { key: "amalbajavani", label: "4. अंमलबजावणीची कार्यपध्दती", type: "textarea" },
      { key: "shasan_nirnay", label: "5. योजनेचे शासन निर्णय", type: "text" },
      { key: "savistar_tapshil", label: "5. योजनेचा सविस्तर तपशिल", type: "textarea" },
    ],
  },

  // ---------------- Annex 5 ----------------
  {
    id: "annex5",
    title: "विवरणपत्र 5 : जमेच्या बाबींचा तपशील",
    type: "fixed",
    summaryKey: "total",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false },
      { key: "baab", label: "जमेची बाब", type: "text", editable: false, width: "38%" },
      { key: "magil_varsh", label: "2025-26 मध्ये जमा झालेली प्रत्यक्ष रक्कम", type: "number", editable: true },
      { key: "actual", label: "01/04 ते 31/07 प्रत्यक्ष जमा", type: "number", editable: true },
      { key: "expected", label: "01/08 ते 31/03 अपेक्षित जमा", type: "number", editable: true },
      { key: "total", label: "एकूण जमा", type: "number", editable: false,
        formula: r => (num(r.actual) + num(r.expected)) },
      { key: "shera", label: "शेरा", type: "text", editable: true },
    ],
    rows: [
      { sr: "", baab: "0202 शिक्षण क्रीडा, कला व संस्कृती — 101 प्राथमिक शिक्षण", isSectionHeader: true },
      { sr: "", baab: "(01) शिक्षण फी व इतर फी", isSectionHeader: true },
      { sr: "1", baab: "(01)(01) शिक्षण फी व इतर फी (02020204)" },
      { sr: "2", baab: "(01)(02) शिक्षण फी व इतर फी (02020213)" },
      { sr: "3", baab: "(02)(01) 25% राखीव प्रवेश - केंद्र शासन प्रतिपुर्ती (02025046)" },
      { sr: "", baab: "एकूण शिक्षण फी व इतर", isSubtotal: true, sumRows: [2,3,4] },
      { sr: "", baab: "102, माध्यमिक शिक्षण", isSectionHeader: true },
      { sr: "", baab: "(01) शिक्षण फी व इतर फी", isSectionHeader: true },
      { sr: "4", baab: "(01)(01) परीक्षा फी (02020222)" },
      { sr: "5", baab: "(1)(02) शिक्षण फी व इतर फी (02020231)" },
      { sr: "6", baab: "(01)(03) दंड व जप्तीच्या रकमा (02020242)" },
      { sr: "", baab: "एकूण 102 शिक्षण फी व इतर फी", isSubtotal: true, sumRows: [8,9,10] },
      { sr: "", baab: "104 प्रौढ शिक्षण", isSectionHeader: true },
      { sr: "", baab: "(01) शिक्षण फी व इतर फी", isSectionHeader: true },
      { sr: "7", baab: "(01)(01) परीक्षा फी (02020278)" },
      { sr: "8", baab: "(01)(03) शिक्षण फी व इतर फी (02020287)" },
      { sr: "", baab: "एकूण प्रौढ शिक्षण व इतर फी", isSubtotal: true, sumRows: [14,15] },
      { sr: "", baab: "501 सेवा व सेवा फी", isSectionHeader: true },
      { sr: "9", baab: "(00)(01) सेवा व सेवा फी (02020062)" },
      { sr: "10", baab: "(00)(02) महा. शैक्षणिक संस्था शुल्क विनिमयन अधि. 2011 (शुल्क निर्धारण)" },
      { sr: "", baab: "एकूण 501 सेवा व सेवा फी", isSubtotal: true, sumRows: [18,19] },
      { sr: "", baab: "600 सर्वसाधारण", isSectionHeader: true },
      { sr: "", baab: "(01) सर्वसाधारण", isSectionHeader: true },
      { sr: "11", baab: "(01)(01) परीक्षा फी (02020296)" },
      { sr: "12", baab: "(01)(02) दान निधीतून मिळणारी अंशदाने व उत्पन्न (02020302)" },
      { sr: "13", baab: "(01)(03) महा. पूर्वमाध्यमिक अधि. 1996 - शालेय पूर्व केंद्रापासून मिळणारी नोंदणी फी" },
      { sr: "", baab: "एकूण 600 सर्वसाधारण", isSubtotal: true, sumRows: [23,24,25] },
      { sr: "", baab: "800 इतर जमा रकमा", isSectionHeader: true },
      { sr: "", baab: "(01) इतर जमा रकमा", isSectionHeader: true },
      { sr: "14", baab: "(01)(01) अतिप्रदानाची वसूली (02020322)" },
      { sr: "15", baab: "(01)(02) रजावेतने अंशदाने (02020331)" },
      { sr: "16", baab: "(01)(03) वस्तूसंग्रह/रद्दी/इतर विक्री (02020340)" },
      { sr: "17", baab: "(01)(04) इतर बाबी (02020358)" },
      { sr: "18", baab: "(01)(06) माध्यमिक शाळा परीक्षा मंडळाकडून वसूली (02020376)" },
      { sr: "19", baab: "(01)(07) अनधिकृत नगरपालिकांकडून वसुली (02020385)" },
      { sr: "20", baab: "(01)(08) संकीर्ण (02020394)" },
      { sr: "", baab: "एकूण 800 (01)", isSubtotal: true, sumRows: [29,30,31,32,33,34,35] },
      { sr: "21", baab: "(02)(01) महाराष्ट्र राज्य परीक्षा परिषदेकडून वसुली (02020198)" },
      { sr: "", baab: "एकूण 800 जमा रकमा", isSubtotal: true, sumRows: [36,37] },
      { sr: "", baab: "801 अनुदानग्राहीकडून अखर्चित शिल्लकीवरील व्याज किंवा इतर जमा रकमा", isSectionHeader: true },
      { sr: "22", baab: "(01) व्याज - सिंगल नोडल खात्यातील अखर्चित शिल्लकीवरील व्याज (02025098)" },
      { sr: "23", baab: "(02) इतर जमा रकमा - सिंगल नोडल खात्यातील इतर जमा रकमा (02025108)" },
      { sr: "", baab: "एकूण 801 व्याज किंवा इतर जमा रकमा", isSubtotal: true, sumRows: [40,41] },
      { sr: "", baab: "एकूण 01 सर्वसाधारण शिक्षण", isTotalRow: true, sumRows: [5,11,16,20,26,38,42] },
    ],
  },

  // ---------------- Annex 6 ----------------
  {
    id: "annex6",
    title: "विवरणपत्र 6 : स्थानिक स्वराज्य संस्था अनुदान निर्धारण",
    type: "dynamic",
    summaryKey: "vasul_rakkam",
    addRowLabel: "नवीन संस्था जोडा",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false, auto: "serial" },
      { key: "srcUser", label: "युजर (Master एकत्रीकरणात भरले जाते)", type: "text", editable: false },
      { key: "sanstha", label: "जिप/नप/नपा/मनपा/कटक मंडळाचे नांव", type: "text", editable: true, width: "22%" },
      { key: "varsh", label: "अनुदान निर्धारण झालेले वर्ष", type: "text", editable: true },
      { key: "karan", label: "प्रलंबित निर्धारण कारणे", type: "text", editable: true, width: "20%" },
      { key: "vasul_rakkam", label: "निर्धारणांती वसूलपात्र रक्कम", type: "number", editable: true },
      { key: "bharana_tapshil", label: "वसूल भरणा तपशील", type: "text", editable: true },
    ],
    rows: [],
  },

  // ---------------- Annex 7 ----------------
  {
    id: "annex7",
    title: "विवरणपत्र 7 : प्रस्तावित तरतुदीचे मासिक निधी विवरणपत्र",
    type: "fixed",
    summaryKey: "prastavit",
    columns: [
      { key: "sr", label: "अ.क्र.", type: "text", editable: false },
      { key: "uddishtha", label: "उद्दिष्ट", type: "text", editable: false, width: "14%" },
      { key: "prastavit", label: "प्रस्तावित तरतूद", type: "number", editable: true },
      { key: "m1", label: "एप्रिल", type: "number", editable: true },
      { key: "m2", label: "मे", type: "number", editable: true },
      { key: "m3", label: "जुन", type: "number", editable: true },
      { key: "m4", label: "जुलै", type: "number", editable: true },
      { key: "m5", label: "ऑगस्ट", type: "number", editable: true },
      { key: "m6", label: "सप्टेंबर", type: "number", editable: true },
      { key: "m7", label: "ऑक्टोबर", type: "number", editable: true },
      { key: "m8", label: "नोव्हेंबर", type: "number", editable: true },
      { key: "m9", label: "डिसेंबर", type: "number", editable: true },
      { key: "m10", label: "जानेवारी", type: "number", editable: true },
      { key: "m11", label: "फेब्रुवारी", type: "number", editable: true },
      { key: "m12", label: "मार्च", type: "number", editable: true },
      { key: "total", label: "एकूण (12 महिने)", type: "number", editable: false,
        formula: r => ["m1","m2","m3","m4","m5","m6","m7","m8","m9","m10","m11","m12"]
          .reduce((s,k) => s + num(r[k]), 0) },
    ],
    rows: [
      { sr: "1", uddishtha: "01 वेतन" },
      { sr: "2", uddishtha: "02 मजूरी" },
      { sr: "3", uddishtha: "03 अतिकालिक भत्ता" },
      { sr: "4", uddishtha: "06 दूरध्वनी, वीज, पाणी" },
      { sr: "5", uddishtha: "10 कंत्राटी सेवा" },
      { sr: "6", uddishtha: "11 प्रवास खर्च" },
      { sr: "7", uddishtha: "13 कार्यालयीन खर्च" },
      { sr: "8", uddishtha: "14 भाडेपट्टी व कर" },
      { sr: "9", uddishtha: "16 प्रकाशने" },
      { sr: "10", uddishtha: "17 संगणक खर्च" },
      { sr: "11", uddishtha: "19 आहार खर्च" },
      { sr: "12", uddishtha: "21 सामग्री व पुरवठा" },
      { sr: "13", uddishtha: "24 पेट्रोल, तेल, वंगण" },
      { sr: "14", uddishtha: "28 व्यावसायिक व विशेष सेवा" },
      { sr: "15", uddishtha: "31 सहाय्यक अनुदान (वेतनेत्तर)" },
      { sr: "16", uddishtha: "34 शिष्यवृत्या व विद्यावेतने" },
      { sr: "17", uddishtha: "50 इतर खर्च" },
      { sr: "18", uddishtha: "52 यंत्रसामुग्री साधनसामुग्री" },
      { sr: "", uddishtha: "एकूण", isTotalRow: true,
        sumRows: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
    ],
  },
];

// संख्या सुरक्षितपणे वाचण्यासाठी उपयोगी फंक्शन (रिकामे/text आले तरी 0 धरेल)
function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// जुन्या ब्राउझर स्क्रिप्टमध्ये import न वापरता वापरता यावे म्हणून window वर ठेवतो
if (typeof window !== "undefined") {
  window.ANNEX_CONFIG = ANNEX_CONFIG;
  window.num = num;
}
