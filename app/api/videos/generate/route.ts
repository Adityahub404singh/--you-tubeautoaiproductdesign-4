import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const SUBCATEGORIES: Record<string, any> = {
  psychology: {
    sub: ["dark_psychology","body_language","cognitive_bias","attachment_theory","subconscious_mind","manipulation_tactics"],
    dark_psychology:     { hooks:["Ye 3 tricks se log aapko control karte hain,","Dark psychology ka sabse khatarnak secret,","Psychologist ne bataya ye sign mat ignore karna,"], title:"Dark Psychology: [TOPIC] Ka Khatarnak Sach", music:"dark ambient mysterious" },
    body_language:       { hooks:["Ye body language sign dekha to sach samajh lo,","Haath ki ye position batati hai sab kuch,","Aankhein kabhi jhooth nahi bolti,"], title:"Body Language: [TOPIC] Se Pehchano Asli Iraada", music:"calm psychology" },
    cognitive_bias:      { hooks:["Aapka dimaag aapko roz bewakoof banata hai,","Ye bias aapke har fesle mein hai,","Scientists ne prove kiya ye galat sochte hain sab,"], title:"Cognitive Bias: [TOPIC] Se Aapka Dimaag Dhoka Khata Hai", music:"curious documentary" },
    attachment_theory:   { hooks:["Aap kaisi relationship mein hain ye batata hai ek cheez,","Bachpan ki ye cheez adult life barbaad karti hai,","Ye attachment style aapki relationship fail karti hai,"], title:"Attachment Theory: [TOPIC] Ka Asar Zindagi Par", music:"emotional piano" },
    subconscious_mind:   { hooks:["Aapka subconscious aapko control kar raha hai,","90% decisions subconscious leta hai,","Neend mein ye hota hai aapke dimaag mein,"], title:"Subconscious Mind: [TOPIC] Ka Andar Ka Sach", music:"ambient mysterious" },
    manipulation_tactics:{ hooks:["Ye 5 tarike se log aapko manipulate karte hain,","Sales wale ye trick use karte hain aap par,","Is word ka use kabhi mat karo,"], title:"Manipulation: [TOPIC] Ki Tricks Jo Sab Par Chalti Hain", music:"dark cinematic" },
  },
  motivation: {
    sub: ["comeback_story","discipline_habits","morning_routine","failure_lessons","success_mindset","productivity"],
    comeback_story:    { hooks:["Ek banda tha jiske paas kuch nahi tha aaj crore hai,","Sabne haare ko dekha par usne ek cheez nahi chodi,","0 se 1 ka safar real story,"], title:"Comeback: [TOPIC] Ne Kaise Badla Sab Kuch", music:"epic motivational" },
    discipline_habits: { hooks:["Ye ek habit crore log nahi kar sakte,","Successful log subah uthke ye karte hain,","66 din mein ye karo zindagi badal jayegi,"], title:"Discipline: [TOPIC] Ki Habit Jo Sab Badal De", music:"powerful drive" },
    morning_routine:   { hooks:["Subah ki pehli 1 ghante mein ye galti mat karna,","Billionaires ki subah aisi hoti hai,","Ye morning routine productivity 10x karti hai,"], title:"Morning Routine: [TOPIC] Ka Secret Kamyabi Ka", music:"upbeat energetic" },
    failure_lessons:   { hooks:["Ye failure successful logo ka pehla step tha,","Haar ne aapko kuch diya jo jeet nahi de sakti,","Elon Musk bhi 3 baar fail hua tha,"], title:"Failure Lessons: [TOPIC] Se Jo Sikhna Chahiye", music:"cinematic inspire" },
    success_mindset:   { hooks:["90% log isi soch ki wajah se fail hote hain,","Amir aur garib ki soch ka ek farq,","Ye mindset shift life 180 degree palat dega,"], title:"Success Mindset: [TOPIC] Se Badlo Soch", music:"epic orchestral" },
    productivity:      { hooks:["Ye method se 8 ghante ka kaam 3 mein hota hai,","Deep work ka matlab samjhe hain aap,","Ye distraction productivity 40% girata hai,"], title:"Productivity: [TOPIC] Karo 10x Zyada Kaam", music:"focus beats" },
  },
  businesslessons: {
    sub: ["startup_mistakes","marketing_hacks","negotiation","leadership","sales_psychology","financial_freedom"],
    startup_mistakes:  { hooks:["99% startups isi ek galti se doobt hain,","Founder ne pehle din ye bhool ki sab kho diya,","VC investor ne seedha poocha ye sawal,"], title:"Startup Mistakes: [TOPIC] Jo Founder Regret Karta Hai", music:"corporate urgent" },
    marketing_hacks:   { hooks:["Ye marketing trick bina paisa ke viral karti hai,","Coca-Cola ne ye trick use ki 100 saal se,","Ye color change karne se sales 30% badi,"], title:"Marketing Hack: [TOPIC] Se Bina Budget Viral Bano", music:"upbeat corporate" },
    negotiation:       { hooks:["Ye ek line salary double kar deti hai,","FBI negotiator ka ye secret sab use karte hain,","Kabhi bhi pehle price mat batao,"], title:"Negotiation: [TOPIC] Se Pao Jo Chahte Ho", music:"confident corporate" },
    leadership:        { hooks:["Sab boss hote hain leader koi koi hota hai,","Ye ek quality sabse bade leaders mein common hai,","Jeff Bezos ne ye ek rule banaya tha,"], title:"Leadership: [TOPIC] Ke Woh Guna Jo Logo Ko Inspire Kare", music:"inspiring corporate" },
    sales_psychology:  { hooks:["Customer ye nahi chahta jo aap bechte ho,","Ye 3 words sales double kar dete hain,","Sabse bada sales lie jo sab mante hain,"], title:"Sales Psychology: [TOPIC] Se Kuch Bhi Becho", music:"confident upbeat" },
    financial_freedom: { hooks:["25 saal mein financially free hone ka ek formula,","Middle class ye galti karta hai puri zindagi,","Ye asset aapko sote mein paise deta hai,"], title:"Financial Freedom: [TOPIC] Ka Raasta Aazadi Ka", music:"success ambient" },
  },
  storytelling: {
    sub: ["true_crime","emotional_drama","mystery_thriller","real_life_hero","betrayal_story","redemption"],
    true_crime:        { hooks:["Ye sach tha par kisi ne believe nahi kiya,","Police case band kar di par sach alag tha,","Us raat jo hua court mein bhi bataya nahi gaya,"], title:"True Crime: [TOPIC] Ka Sach Jo Chhupaya Gaya", music:"dark suspense" },
    emotional_drama:   { hooks:["Rona aayega par ye sunna zaroori hai,","Ek bete ne baap ke liye jo kiya woh,","Hospital ki is kahani ne lakho logo ko rula diya,"], title:"Emotional Story: [TOPIC] Dil Ko Chhoo Legi", music:"emotional strings" },
    mystery_thriller:  { hooks:["Koi nahi jaanta abhi bhi kya hua tha,","Ye case aaj bhi unsolved hai,","Raat ke 2 baje phone aaya number unknown tha,"], title:"Mystery: [TOPIC] Ka Raaz Jo Abhi Nahi Khula", music:"thriller suspense" },
    real_life_hero:    { hooks:["Ek aam aadmi ne woh kiya jo heroes karte hain,","Kisi ne credit nahi liya par duniya badal di,","Ye banda sirf dil ki sunta hai,"], title:"Real Hero: [TOPIC] Ka Asli Hero Kaun Tha", music:"inspiring hero" },
    betrayal_story:    { hooks:["Jis par sabse zyada trust kiya usne hi toda,","Partner friend family ye betrayal sabse badi thi,","Ye sacchi kahani aapko sochne par majboor karegi,"], title:"Betrayal: [TOPIC] Ne Jo Kiya Woh Maafinaar Nahi", music:"sad dramatic" },
    redemption:        { hooks:["Sab haare maan chuke the par usne nahi,","Ek doosra mauka mila aur sab badal gaya,","Ye insaan jail se bahar aaya aur crore kamaya,"], title:"Redemption: [TOPIC] Haar Ke Jeetne Walo Ki Kahani", music:"hopeful cinematic" },
  },
  history: {
    sub: ["india_untold","mughal_secrets","freedom_struggle","ancient_civilizations","world_wars","forgotten_heroes"],
    india_untold:          { hooks:["Ye history books mein kabhi nahi padhai gayi,","India ki ye sacchai chhupai gayi thi,","Ye khazana aaj bhi wahi hai,"], title:"India History: [TOPIC] Ka Chhupa Hua Sach", music:"epic orchestral" },
    mughal_secrets:        { hooks:["Mughals ka ye secret history ne chhupa diya,","Shahjahan ke baad jo hua woh shocking hai,","Ye Mughal darbar mein roz hota tha,"], title:"Mughal Secrets: [TOPIC] Ka Andar Ka Sach", music:"historical cinematic" },
    freedom_struggle:      { hooks:["Azaadi ke liye ye kurbani di gayi kisi ne nahi bataya,","Is freedom fighter ka naam school mein nahi padha,","August 1947 mein ye hua tha jo batate nahi,"], title:"Freedom: [TOPIC] Ki Larai Jo History Ne Bhulai", music:"patriotic orchestral" },
    ancient_civilizations: { hooks:["5000 saal purani civilization ka ye raaz,","Ye technology 2000 saal pehle India mein thi,","Harappa mein ye milna scientists ko shock kar gaya,"], title:"Ancient India: [TOPIC] Ka 5000 Saal Purana Raaz", music:"ancient mystery" },
    world_wars:            { hooks:["World War 2 ka ye fact schools mein nahi padhate,","Ek galat decision ne lakhon log maar diye,","Hitler ke akhri din ka sach kya tha,"], title:"World War: [TOPIC] Ka Wo Sach Jo History Mein Nahi", music:"war documentary" },
    forgotten_heroes:      { hooks:["Ye banda India ka sabse bada hero tha koi nahi jaanta,","Aurat ne kiya tha jo kisi mard nahi kar saka,","Is naam ko bhula diya gaya par kaam yaad hai,"], title:"Forgotten Hero: [TOPIC] Jise India Bhool Gaya", music:"heroic strings" },
  },
  horror: {
    sub: ["haunted_places","true_paranormal","unexplained_events","psychological_horror","urban_legends","cursed_objects"],
    haunted_places:      { hooks:["Ye jagah India ki sabse darr wali jagah hai,","Is building mein raat ko koi nahi rukta,","Government ne is area ko seal kiya hua hai,"], title:"Haunted: [TOPIC] Raat Ko Yahan Koi Nahi Jata", music:"horror ambient" },
    true_paranormal:     { hooks:["Ye 100% sachi kahani hai main swear karta hoon,","Camera ne jo pakda woh paranormal tha,","Ye event scientific proof ke baad bhi unexplained hai,"], title:"Paranormal: [TOPIC] Science Bhi Explain Nahi Kar Saka", music:"dark supernatural" },
    unexplained_events:  { hooks:["Ye event aaj bhi mystery hai duniya ke liye,","Plane disappear ho gaya 30 saal baad mila,","Ye disappearance case aaj bhi open hai,"], title:"Mystery: [TOPIC] Duniya Abhi Tak Samajh Nahi Pai", music:"thriller suspense" },
    psychological_horror:{ hooks:["Ye cheez dimaag mein darr daalti hai bina baat ke,","Sleep paralysis mein jo dikhta hai woh kya hai,","Ye disorder aapko khud se dara deta hai,"], title:"Psychological Horror: [TOPIC] Ka Dimaagi Darr", music:"psychological dark" },
    urban_legends:       { hooks:["Ye kahani India ke har sheher mein hai,","Nani dadi ki ye kahaaniyaan sach nikli,","Kya sach mein aise hota hai midnight par,"], title:"Urban Legend: [TOPIC] Sacchi Ya Jhooth", music:"eerie ambient" },
    cursed_objects:      { hooks:["Is cheez ko rakhne wala safe nahi hai,","Museum ne is object ko seal kar rakha hai,","Ye painting sirf bure logon ke saath hoti hai,"], title:"Cursed: [TOPIC] Ye Object Kisi Ko Nahi Chuna Chahiye", music:"dark horror" },
  },
  ainews: {
    sub: ["ai_tools","tech_giants","future_jobs","ai_india","robotics","digital_economy"],
    ai_tools:       { hooks:["Ye AI tool launch hote hi viral ho gaya,","ChatGPT ko ye tool peeche chhor gaya,","Ye free tool kaam 10x fast karta hai,"], title:"AI Tool Alert: [TOPIC] Abhi Try Karo", music:"tech upbeat" },
    tech_giants:    { hooks:["Google ne aaj jo announce kiya sab hil gaye,","Apple ka ye secret project finally bahar aaya,","Microsoft ka ye move sab badal dega,"], title:"Tech News: [TOPIC] Ka Bada Elaan Aaj", music:"breaking news" },
    future_jobs:    { hooks:["Ye 5 jobs AI 2 saal mein khatam kar dega,","Ye skill seekh lo AI replace nahi kar payega,","2026 mein ye jobs demand mein hongi,"], title:"Future Jobs: [TOPIC] AI Ke Baad Kya Bachega", music:"urgent documentary" },
    ai_india:       { hooks:["India ka ye AI startup duniya mein chhaya,","Government ne AI ke liye ye plan banaya,","IIT se nikla ye AI tool viral ho gaya,"], title:"India AI: [TOPIC] Desh Ka Tech Revolution", music:"patriotic upbeat" },
    robotics:       { hooks:["Ye robot human jaisi baat karta hai,","Factory mein robots ne workers replace kar diye,","Ye humanoid robot 2025 mein aa raha hai,"], title:"Robots: [TOPIC] Machines Ki Duniya Aa Gayi", music:"futuristic electronic" },
    digital_economy:{ hooks:["Ye crypto 1000% return de raha hai,","Digital rupee kya hoga India mein,","NFT khatam hua ya abhi bhi chance hai,"], title:"Digital Economy: [TOPIC] Paise Ka Future", music:"finance tech" },
  },
  startupstories: {
    sub: ["founder_journey","funding_story","pivot_moment","product_launch","failure_comeback","unicorn_story"],
    founder_journey: { hooks:["Iss founder ne ghar bech ke startup shuru kiya,","Ek chai wale ke bete ne crore ka startup banaya,","Sirf 22 saal mein ye banda crorepati bana,"], title:"Founder Story: [TOPIC] Ka Inspiring Safar", music:"inspiring drive" },
    funding_story:   { hooks:["Investors ne 10 baar reject kiya 11vi baar crore mila,","Shark Tank India mein ye deal sabse badi thi,","Zero se funding lene ka ye formula kaam karta hai,"], title:"Funding Story: [TOPIC] Kaise Mila Crore Ka Investment", music:"corporate upbeat" },
    pivot_moment:    { hooks:["Company band hone wali thi ek decision ne sab badla,","Ye pivot story India ka sabse bada turnaround hai,","Jab product fail hua to ye kiya aur success mili,"], title:"Pivot: [TOPIC] Ek Decision Se Badli Company Ki Kismat", music:"dramatic corporate" },
    product_launch:  { hooks:["Pehle din hi 1 lakh downloads ho gaye,","Launch ke 24 ghante mein servers crash ho gaye,","Ye product India mein fastest growing ban gaya,"], title:"Product Launch: [TOPIC] Ka Record-Breaking Debut", music:"exciting upbeat" },
    failure_comeback:{ hooks:["Company doobi investors ne paise waapas maange,","Founder bankrupt hua aur 2 saal mein billionaire bana,","Ye failure story motivation se bhari hai,"], title:"Comeback: [TOPIC] Doobi Company Kaise Dobara Aayi", music:"epic comeback" },
    unicorn_story:   { hooks:["Ye startup India ka latest unicorn ban gaya,","1 billion dollar valuation ka ye safar kaisa tha,","Gaon se shuru hua ye startup aaj duniya mein hai,"], title:"Unicorn: [TOPIC] India Ka Naya $1 Billion Startup", music:"success orchestral" },
  },
  luxury: {
    sub: ["expensive_items","billionaire_lifestyle","luxury_travel","premium_brands","rare_collectibles","celebrity_wealth"],
    expensive_items:    { hooks:["Ye cheez sirf 1% log afford kar sakte hain,","Iski keemat sunke aap chauk jaoge,","Duniya ki sabse mehengi cheez kya hai,"], title:"Luxury: [TOPIC] Ki Keemat Sunke Hairan Ho Jaoge", music:"luxury lounge" },
    billionaire_lifestyle:{ hooks:["Billionaire ki subah aisi hoti hai,","Jeff Bezos ek din mein itna kharch karta hai,","Ye 5 cheezein sirf billionaires karte hain,"], title:"Billionaire Life: [TOPIC] Ki Zindagi Ka Ek Din", music:"premium smooth" },
    luxury_travel:      { hooks:["Ye hotel ek raat ka 50 lakh leta hai,","Duniya ka sabse mehengaa vacation kaisa hota hai,","Private jet mein travel ka ye anubhav alag hai,"], title:"Luxury Travel: [TOPIC] Jahan Sirf Ameer Jaate Hain", music:"travel luxury" },
    premium_brands:     { hooks:["Ye brand logo ki neend kharab kar deta hai,","Hermes bag ke liye 5 saal wait karna padta hai,","Ye watch sirf 500 log duniya mein rakhte hain,"], title:"Premium Brand: [TOPIC] Ka Wo Raaz Jo Sab Nahi Jaante", music:"elegant jazz" },
    rare_collectibles:  { hooks:["Ye item auction mein 100 crore mein bika,","Rare hone ki wajah se ye priceless ho gaya,","Ye collection duniya mein sirf ek hai,"], title:"Rare Collection: [TOPIC] Ki Anokhi Duniya", music:"mysterious luxury" },
    celebrity_wealth:   { hooks:["Is celebrity ki net worth sun ke dimaag ghoom jayega,","Ye star ek movie mein itna kamata hai,","Celebrity lifestyle mein ye cheez common hai,"], title:"Celebrity Wealth: [TOPIC] Ka Asli Paisa Kitna Hai", music:"glamour upbeat" },
  },
  quotes: {
    sub: ["life_wisdom","heartbreak_healing","success_quotes","motivational_hindi","self_love","philosophical"],
    life_wisdom:        { hooks:["Kabhi kabhi ek line poori zindagi badal deti hai,","Ye baat dil ko chhoo jayegi,","Zindagi ne sikhaya ek chhoti si baat,"], title:"Life Wisdom: [TOPIC] Se Seekhi Ye Baat", music:"warm acoustic" },
    heartbreak_healing: { hooks:["Har tootne wale ke liye ye zaroori hai,","Dil toot jaaye to ye yaad rakhna,","Ye sunke aap ruk jaoge sochoge,"], title:"Heartbreak: [TOPIC] Ke Baad Dobara Uthna Seekho", music:"soft emotional piano" },
    success_quotes:     { hooks:["Successful logo ki ye ek common baat hai,","Ye quote sunke aapki soch badal jayegi,","Achievement ka raaz ek line mein,"], title:"Success Quote: [TOPIC] Ka Ye Lesson Yaad Rakhna", music:"inspiring acoustic" },
    motivational_hindi: { hooks:["Haar mat mano abhi bahut kuch baaki hai,","Ye struggle hi aapki asli training hai,","Toote hue log sabse mazboot hote hain,"], title:"Motivation: [TOPIC] Ka Dard Tumhari Taakat Hai", music:"warm motivational" },
    self_love:          { hooks:["Khud se pyaar karna sabse zaroori hai,","Apne aap ko pahle rakhna selfish nahi hai,","Ye boundaries set karna seekho,"], title:"Self Love: [TOPIC] Pehle Khud Ko Sambhalo", music:"gentle uplifting" },
    philosophical:      { hooks:["Zindagi ka matlab kya hai ye sochte ho kabhi,","Ye sawal sab poochte hain par jawab koi nahi deta,","Philosophy ki ye ek baat sab kuch samjha deti hai,"], title:"Philosophy: [TOPIC] Ka Gehri Soch Wala Sawal", music:"contemplative ambient" },
  },
  stoicism: {
    sub: ["marcus_aurelius","control_what_you_can","discipline_over_emotion","suffering_growth","daily_stoic","modern_stoicism"],
    marcus_aurelius:      { hooks:["Marcus Aurelius ne ye ek baat kahi thi,","Roman emperor ka ye secret aaj bhi kaam karta hai,","2000 saal purani ye advice aaj bhi valid hai,"], title:"Marcus Aurelius: [TOPIC] Ki Timeless Wisdom", music:"solemn orchestral" },
    control_what_you_can:{ hooks:["Jo control nahi kar sakte usse chhodna seekho,","Ye ek principle zindagi easy kar deta hai,","Stoicism ka sabse important lesson ye hai,"], title:"Stoic Control: [TOPIC] Jo Control Hai Wahi Karo", music:"deep focus" },
    discipline_over_emotion:{ hooks:["Emotion se nahi discipline se chalo,","Feelings temporary hain results permanent hain,","Ye ek habit sab successful log follow karte hain,"], title:"Discipline: [TOPIC] Se Upar Uthni Discipline Ki Shakti", music:"stern cinematic" },
    suffering_growth:     { hooks:["Dukh se bhagna band karo samjho use,","Suffering ke bina growth impossible hai,","Ye dard hi aapko strong banana ata hai,"], title:"Suffering: [TOPIC] Ka Dard Hi Hai Aapki Shakti", music:"deep emotional" },
    daily_stoic:          { hooks:["Aaj ka ek stoic lesson jo life badal de,","Roz ye ek kaam karo badloge zaroor,","Daily stoicism ka ye powerful practice hai,"], title:"Daily Stoic: [TOPIC] Ka Aaj Ka Powerful Lesson", music:"morning calm" },
    modern_stoicism:      { hooks:["Purani philosophy modern life mein kaise kaam karti hai,","Ye ancient wisdom startup founders use karte hain,","Stoicism aur modern success ka connection,"], title:"Modern Stoic: [TOPIC] Aaj Ki Duniya Mein Stoicism", music:"contemporary calm" },
  },
  pov: {
    sub: ["future_world","ai_takeover","space_explorer","last_human","time_traveler","virtual_reality"],
    future_world:   { hooks:["Main apni aankhein kholta hoon kuch alag hai,","2050 ki duniya mein main khada hoon,","Ye jagah pehle kabhi nahi dekhi maine,"], title:"Future POV: [TOPIC] Ki Anokhi Duniya Mein Main", music:"synthwave atmospheric" },
    ai_takeover:    { hooks:["Mujhe pata hai kuch galat hai yahan,","AI ne sab kuch sambhal liya hai aaj,","Machines ne decisions lene shuru kar diye,"], title:"AI POV: [TOPIC] Jab AI Ne Sab Control Kiya", music:"dark futuristic" },
    space_explorer: { hooks:["Main pehli baar kisi aur planet par hun,","Earth se lakhon kilometer door khada hun,","Stars ke beech ye sheher kaisa hai,"], title:"Space POV: [TOPIC] Antariksh Ki Yatra Mein Main", music:"space ambient" },
    last_human:     { hooks:["Main duniya ka aakhri insaan hun,","Har taraf machines hain insaan nahi,","Kab hua ye sab mujhe nahi pata,"], title:"Last Human POV: [TOPIC] Akhri Insaan Ki Kahani", music:"post-apocalyptic" },
    time_traveler:  { hooks:["Main 100 saal peeche pahunch gaya hun,","Waqt yahan alag tarah se chalta hai,","Is pal ko change karna mera mission hai,"], title:"Time Travel POV: [TOPIC] Waqt Ki Yatra Mein Main", music:"temporal mysterious" },
    virtual_reality:{ hooks:["Ye real nahi hai par bilkul real lagta hai,","Main VR mein hun aur bahar jaana nahi chahta,","Digital duniya mein ye kya ho raha hai,"], title:"VR POV: [TOPIC] Digital Duniya Ka Anokha Anubhav", music:"electronic immersive" },
  },
  general: {
    sub: ["trending_facts","life_hacks","india_special","viral_challenge","did_you_know","inspirational"],
    trending_facts:  { hooks:["Ye baat aaj sabko jaanni chahiye,","Ye fact sunke aap hairan reh jaoge,","Aaj kuch aisa bataunga jo aap sochte nahi,"], title:"Facts: [TOPIC] Ye Jaanna Zaroori Tha", music:"curious documentary" },
    life_hacks:      { hooks:["Ye ek cheez life 10x easy kar deti hai,","Simple trick jo sab log miss karte hain,","Ye jaante ho to zindagi aasan ho jaati hai,"], title:"Life Hack: [TOPIC] Se Zindagi Banao Aasaan", music:"upbeat positive" },
    india_special:   { hooks:["India mein ye ek cheez duniya mein nahi milti,","Hamara desh ye karta hai jo koi nahi karta,","India ki ye baat duniya ko pata nahi,"], title:"India Special: [TOPIC] Jo Sirf Bharat Mein Hota Hai", music:"patriotic upbeat" },
    viral_challenge: { hooks:["Ye challenge poori duniya mein viral ho gaya,","India mein ye trend sabse fast phela,","Ye karne wale log hairan kar dete hain,"], title:"Viral: [TOPIC] Ka Trend Jo Duniya Mein Chhaya", music:"trendy upbeat" },
    did_you_know:    { hooks:["Kya aap jaante hain ye baat,","Ye fact 99% log nahi jaante,","Aaj ek aisi cheez batata hun jo sunke chauk jaoge,"], title:"Did You Know: [TOPIC] Ka Ye Shocking Fact", music:"curious ambient" },
    inspirational:   { hooks:["Ye story sunke aap kuch karna chahoge,","Ek aam insaan ne ye kiya jo extraordinary hai,","Ye inspiration aapki zindagi badal sakti hai,"], title:"Inspiration: [TOPIC] Ki Ye Kahani Sunna Zaroori Tha", music:"warm inspiring" },
  },
}

const CATEGORY_CONFIG: Record<string, any> = {
  psychology:      { voice:"hi-IN-MadhurNeural", voiceRate:"+8%",  voicePitch:"-1Hz", pexels:["brain neurons purple glow","therapy office calm","ocean waves night blue","city lights blur","misty lake dawn"] },
  stoicism:        { voice:"hi-IN-MadhurNeural", voiceRate:"-5%",  voicePitch:"-3Hz", pexels:["greek marble statue fog","foggy mountain solo","solitary silhouette","ancient ruins grayscale","calm lake mist"] },
  quotes:          { voice:"hi-IN-SwaraNeural",  voiceRate:"0%",   voicePitch:"0Hz",  pexels:["warm sunset window","cozy coffee bokeh","golden hour bokeh","minimalist desk","golden nature calm"] },
  businesslessons: { voice:"hi-IN-MadhurNeural", voiceRate:"+10%", voicePitch:"+1Hz", pexels:["office skyscraper glass","business handshake","stock chart green","city skyline bright","modern office clean"] },
  storytelling:    { voice:"hi-IN-SwaraNeural",  voiceRate:"-8%",  voicePitch:"-2Hz", pexels:["dark forest cinematic","abandoned house mystery","rainy window noir","candle shadow room","old library dust"] },
  startupstories:  { voice:"hi-IN-MadhurNeural", voiceRate:"+10%", voicePitch:"+1Hz", pexels:["startup office night","tech team coding","laptop screen glow","silicon valley modern","entrepreneur pitch"] },
  luxury:          { voice:"hi-IN-MadhurNeural", voiceRate:"+2%",  voicePitch:"0Hz",  pexels:["luxury car night","gold watch shine","private jet interior","luxury yacht sunset","designer fashion"] },
  history:         { voice:"hi-IN-MadhurNeural", voiceRate:"-3%",  voicePitch:"-1Hz", pexels:["ancient ruins fog","historical battlefield","old map parchment","ancient columns","vintage photograph"] },
  pov:             { voice:"hi-IN-SwaraNeural",  voiceRate:"+5%",  voicePitch:"+1Hz", pexels:["cyberpunk city neon","immersive neon corridor","futuristic hallway glow","synthwave horizon","neon rain night"] },
  horror:          { voice:"hi-IN-SwaraNeural",  voiceRate:"-15%", voicePitch:"-5Hz", pexels:["haunted house dark fog","horror corridor red","graveyard night mist","dark door shadow","scary forest fog"] },
  ainews:          { voice:"hi-IN-MadhurNeural", voiceRate:"+15%", voicePitch:"+2Hz", pexels:["news studio broadcast","breaking news digital","world map digital","newsroom desk blue","digital ticker screen"] },
  motivation:      { voice:"hi-IN-MadhurNeural", voiceRate:"+8%",  voicePitch:"0Hz",  pexels:["sunrise motivation epic","athlete training power","mountain peak victory","crowd cheering","determination face"] },
  general:         { voice:"hi-IN-MadhurNeural", voiceRate:"+6%",  voicePitch:"0Hz",  pexels:["cinematic aerial sunset","epic mountains golden","urban city timelapse","beautiful nature light","dramatic sky clouds"] },
}

const GROQ_MODELS = ["llama-3.3-70b-versatile","meta-llama/llama-4-scout-17b-16e-instruct","llama-3.1-8b-instant"]

async function groqWithFallback(groq: Groq, messages: any[], max_tokens: number, temperature: number): Promise<string> {
  for (const model of GROQ_MODELS) {
    try {
      const res = await groq.chat.completions.create({ model, messages, temperature, max_tokens })
      console.log(`✅ Groq model: ${model}`)
      return res.choices[0].message.content || ""
    } catch (e: any) {
      if (e?.status === 429) { console.log(`⚠️ Rate limit: ${model}`); continue }
      throw e
    }
  }
  throw new Error("All Groq models rate limited.")
}

function extractJSON(raw: string): any {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi,"").replace(/```(?:json)?\s*/gi,"").replace(/```\s*/g,"").trim()
  try { return JSON.parse(text) } catch {}
  const s = text.indexOf("{"), e = text.lastIndexOf("}")
  if (s !== -1 && e > s) {
    try { return JSON.parse(text.slice(s, e+1)) } catch {}
    try { return JSON.parse(text.slice(s, e+1).replace(/\r?\n/g," ").replace(/\t/g," ")) } catch {}
  }
  throw new Error("No valid JSON in response")
}

function getSubcategory(catKey: string): { subKey: string; subConfig: any } {
  const cat = SUBCATEGORIES[catKey] || SUBCATEGORIES.general
  const subs: string[] = cat.sub || ["general"]
  const subKey = subs[Math.floor(Math.random() * subs.length)]
  const subConfig = cat[subKey] || SUBCATEGORIES.general.trending_facts
  return { subKey, subConfig }
}

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { topic, language, channelName, category, mode, generate30Day } = await req.json()
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 })

    const catKey = (category || "general").toLowerCase().replace(/\s+/g,"").replace(/[^a-z0-9]/g,"")
    const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.general
    const isShorts = mode === "shorts" || catKey === "shorts" || catKey === "horror"
    const lang = language || "Hindi"
    const channel = channelName || "My Channel"

    const { subKey, subConfig } = getSubcategory(catKey)
    const hooks: string[] = subConfig.hooks || ["Aaj kuch aisa bataunga jo aap sochte nahi,"]
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)]
    const titleFormula: string = subConfig.title || "[TOPIC] Ye Jaanna Zaroori Tha"
    const musicMood: string = subConfig.music || "cinematic ambient"
    const seoTitle = titleFormula.replace("[TOPIC]", topic.slice(0, 30))

    console.log(`📂 Category: ${catKey} | Sub: ${subKey} | Music: ${musicMood}`)

    if (generate30Day) {
      const subs = (SUBCATEGORIES[catKey] || SUBCATEGORIES.general).sub || ["general"]
      const raw = await groqWithFallback(groq, [{
        role: "user",
        content: `Generate 30 unique YouTube Shorts topics for "${topic}" in ${lang}.
Category: ${catKey} | Rotate through these subcategories: ${subs.join(", ")}
Each topic MUST be a different subcategory. Return JSON array ONLY:
[{"day":1,"topic":"...","subcategory":"${subs[0]}","hook":"opening line Hindi","title":"SEO title"}]`
      }], 2500, 0.95)
      const schedule = extractJSON(raw)
      return NextResponse.json({ success: true, schedule30Day: Array.isArray(schedule) ? schedule : [] })
    }

    const raw = await groqWithFallback(groq, [
      {
        role: "system",
        content: `You are India's #1 viral Hindi YouTube Shorts creator.
Category: ${catKey} | Subcategory: ${subKey} | Music mood: ${musicMood}
Channel: "${channel}" | Language: ${lang}

SCRIPT RULES:
- First line MUST be exactly: "${randomHook}"
- Max 8 words per sentence
- Use [PAUSE] for dramatic pauses
- Pure Hindi/Hinglish speech only — NO markdown, bullets, symbols, dashes
- Duration: ${isShorts ? "30-45 seconds" : "4-6 minutes"}
- End with subscribe CTA in Hindi

TITLE: Use this formula exactly: "${seoTitle}" — max 60 chars, add numbers if possible

THUMBNAIL: thumbnailText = exactly 3 ALL CAPS power words matching the emotion
TAGS: Mix Hindi + English, include category + subcategory keywords

RESPOND ONLY WITH VALID JSON — no explanation, no markdown`
      },
      {
        role: "user",
        content: `Topic: "${topic}"

Return EXACT JSON:
{
  "title": "${seoTitle}",
  "hook": "${randomHook}",
  "script": "Full spoken script in ${lang}. Start with hook. Use [PAUSE]. Natural speech. One line.",
  "description": "YouTube SEO: Line 1 = main keyword + what video covers. Line 2 = subscribe hook. 150 words. End: #hindi #${catKey} #viral #india #shorts #trending",
  "keyPoints": ["point1","point2","point3","point4","point5"],
  "callToAction": "Subscribe CTA in ${lang}",
  "pexelsQuery": "3-4 English words for ${catKey} ${subKey} footage",
  "thumbnailText": "3 WORDS ALL CAPS",
  "thumbnailEmoji": "1 emoji",
  "tags": ["${catKey}","${subKey.replace(/_/g," ")}","hindi","india","viral","shorts","trending","${topic.split(" ")[0].toLowerCase()}","facts","knowledge"],
  "chapters": ["0:00 - Hook","0:15 - Main Point","0:40 - Conclusion"],
  "videoMood": "${musicMood}",
  "subcategory": "${subKey}"
}`
      }
    ], 4000, 0.85)

    const scriptData = extractJSON(raw)

    const clean = (s: string) => (s||"")
      .replace(/\u2014|\u2013/g,", ").replace(/\u2018|\u2019|\u201C|\u201D/g,"")
      .replace(/[^\x20-\x7E\u0900-\u097F\u0964\u0965\n.,!?;: [\]]/g," ")
      .replace(/\s+/g," ").trim()

    if (scriptData.script)       scriptData.script      = clean(scriptData.script)
    if (scriptData.title)        scriptData.title       = clean(scriptData.title) || seoTitle
    if (scriptData.description)  scriptData.description = clean(scriptData.description)
    if (scriptData.thumbnailText) scriptData.thumbnailText = scriptData.thumbnailText
      .replace(/[^A-Z0-9\s]/gi,"").toUpperCase().trim().split(/\s+/).slice(0,4).join(" ")

    let pexelsClips: any[] = []
    const pexelsKey = process.env.PEXELS_API_KEY
    if (pexelsKey) {
      try {
        const q = encodeURIComponent(scriptData.pexelsQuery || config.pexels[0])
        const pexRes = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=8&orientation=${isShorts?"portrait":"landscape"}&size=medium`, { headers:{ Authorization: pexelsKey } })
        if (pexRes.ok) {
          const pexData = await pexRes.json()
          pexelsClips = (pexData.videos||[]).slice(0,5).map((v: any) => ({
            id: v.id,
            url: v.video_files?.find((f: any) => f.quality==="hd" && f.width<=1280)?.link || v.video_files?.[0]?.link,
            duration: v.duration,
          }))
        }
      } catch {}
    }

    return NextResponse.json({
      success:      true,
      title:        scriptData.title        || seoTitle,
      script:       scriptData.script       || "",
      description:  scriptData.description  || "",
      hook:         scriptData.hook         || randomHook,
      keyPoints:    scriptData.keyPoints    || [],
      callToAction: scriptData.callToAction || "",
      chapters:     scriptData.chapters     || [],
      pexelsQuery:  scriptData.pexelsQuery  || "",
      tags:         scriptData.tags         || [],
      voice:        config.voice,
      voiceRate:    config.voiceRate,
      voicePitch:   config.voicePitch,
      videoMood:    scriptData.videoMood    || musicMood,
      category:     catKey,
      subcategory:  scriptData.subcategory  || subKey,
      pexelsClips,
      thumbnail: {
        boldText: scriptData.thumbnailText || seoTitle.toUpperCase().split(/\s+/).slice(0,3).join(" "),
        emoji:    scriptData.thumbnailEmoji || "🔥",
      },
    })
  } catch (error: any) {
    console.error("Script gen error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

