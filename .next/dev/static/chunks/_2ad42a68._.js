(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "store",
    ()=>store
]);
"use client";
class Store {
    static instance;
    constructor(){
        if ("TURBOPACK compile-time truthy", 1) {
            this.initializeData();
        }
    }
    static getInstance() {
        if (!Store.instance) {
            Store.instance = new Store();
        }
        return Store.instance;
    }
    initializeData() {
        const users = this.getUsers();
        const adminExists = users.some((u)=>u.email === "admin@youtubeauto.ai");
        if (!adminExists) {
            const adminUser = {
                id: "admin-001",
                email: "admin@youtubeauto.ai",
                name: "Aditya Singh",
                phone: "+91 7068003894",
                role: "admin",
                plan: "agency",
                createdAt: new Date().toISOString(),
                hasCompletedSetup: true,
                freeVideosUsed: 0,
                paidVideoCredits: 0,
                totalSpent: 0,
                youtubeMonetized: true,
                youtubeEarnings: 0,
                youtubeShareOwed: 0,
                lastActive: new Date().toISOString()
            };
            users.push(adminUser);
            localStorage.setItem("users", JSON.stringify(users));
        }
    }
    // User methods
    getUsers() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const data = localStorage.getItem("users");
        return data ? JSON.parse(data) : [];
    }
    getUserByEmail(email) {
        return this.getUsers().find((u)=>u.email === email) || null;
    }
    createUser(user) {
        const users = this.getUsers();
        const newUser = {
            ...user,
            id: `user-${Date.now()}`,
            createdAt: new Date().toISOString(),
            freeVideosUsed: 0,
            paidVideoCredits: 0,
            totalSpent: 0,
            youtubeMonetized: false,
            youtubeEarnings: 0,
            youtubeShareOwed: 0,
            lastActive: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        return newUser;
    }
    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex((u)=>u.id === userId);
        if (index !== -1) {
            users[index] = {
                ...users[index],
                ...updates
            };
            localStorage.setItem("users", JSON.stringify(users));
        }
    }
    getUserById(userId) {
        return this.getUsers().find((u)=>u.id === userId) || null;
    }
    // Channel methods
    getChannels(userId) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const data = localStorage.getItem("channels");
        const channels = data ? JSON.parse(data) : [];
        return userId ? channels.filter((c)=>c.userId === userId) : channels;
    }
    createChannel(channel) {
        const channels = this.getChannels();
        const newChannel = {
            ...channel,
            id: `channel-${Date.now()}`
        };
        channels.push(newChannel);
        localStorage.setItem("channels", JSON.stringify(channels));
        return newChannel;
    }
    updateChannel(channelId, updates) {
        const channels = this.getChannels();
        const index = channels.findIndex((c)=>c.id === channelId);
        if (index !== -1) {
            channels[index] = {
                ...channels[index],
                ...updates
            };
            localStorage.setItem("channels", JSON.stringify(channels));
        }
    }
    deleteChannel(channelId) {
        const channels = this.getChannels();
        const filtered = channels.filter((c)=>c.id !== channelId);
        localStorage.setItem("channels", JSON.stringify(filtered));
    }
    // Video methods
    getVideos(channelId) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const data = localStorage.getItem("videos");
        const videos = data ? JSON.parse(data) : [];
        return channelId ? videos.filter((v)=>v.channelId === channelId) : videos;
    }
    canCreateVideo(userId) {
        const user = this.getUserById(userId);
        if (!user) return {
            allowed: false,
            reason: "User not found"
        };
        // Admin always allowed
        if (user.role === "admin") return {
            allowed: true
        };
        // Check if user has free videos remaining
        if (user.freeVideosUsed < 10) return {
            allowed: true
        };
        // Check if user has paid credits
        if (user.paidVideoCredits > 0) return {
            allowed: true
        };
        return {
            allowed: false,
            reason: "No free videos or credits remaining. Please upgrade."
        };
    }
    calculateRiskLevel(niche) {
        const highRiskNiches = [
            "news",
            "politics",
            "finance",
            "make money online",
            "cryptocurrency",
            "health",
            "medical"
        ];
        const lowercaseNiche = niche.toLowerCase();
        return highRiskNiches.some((risk)=>lowercaseNiche.includes(risk)) ? "high" : "low";
    }
    createVideo(video) {
        const videos = this.getVideos();
        const channel = this.getChannels().find((c)=>c.id === video.channelId);
        if (!channel) throw new Error("Channel not found");
        const user = this.getUserById(channel.userId);
        if (!user) throw new Error("User not found");
        const canCreate = this.canCreateVideo(user.id);
        if (!canCreate.allowed) {
            throw new Error(canCreate.reason);
        }
        const isFree = user.freeVideosUsed < 10;
        const cost = isFree ? 0 : 0.16;
        const riskLevel = this.calculateRiskLevel(channel.category);
        const newVideo = {
            ...video,
            id: `video-${Date.now()}`,
            aiScore: Math.floor(Math.random() * 30) + 70,
            adminApproved: false,
            userApproved: false,
            cost,
            isFree,
            riskLevel,
            createdAt: new Date().toISOString()
        };
        videos.push(newVideo);
        localStorage.setItem("videos", JSON.stringify(videos));
        if (isFree) {
            this.updateUser(user.id, {
                freeVideosUsed: user.freeVideosUsed + 1
            });
        } else {
            this.updateUser(user.id, {
                paidVideoCredits: user.paidVideoCredits - 1,
                totalSpent: user.totalSpent + 0.2
            });
        }
        return newVideo;
    }
    updateVideo(videoId, updates) {
        const videos = this.getVideos();
        const index = videos.findIndex((v)=>v.id === videoId);
        if (index !== -1) {
            videos[index] = {
                ...videos[index],
                ...updates
            };
            localStorage.setItem("videos", JSON.stringify(videos));
        }
    }
    // Generate 30-day schedule
    generate30DaySchedule(channelId, contentStrategy) {
        const topics = this.generateTopics(contentStrategy, 30);
        const videos = [];
        const channel = this.getChannels().find((c)=>c.id === channelId);
        if (!channel) return [];
        const user = this.getUserById(channel.userId);
        if (!user) throw new Error("User not found");
        const canCreate = this.canCreateVideo(user.id);
        if (!canCreate.allowed) {
            throw new Error(canCreate.reason);
        }
        const riskLevel = this.calculateRiskLevel(channel.category);
        for(let i = 0; i < 30; i++){
            const isFree = user.freeVideosUsed < 10;
            const cost = isFree ? 0 : 0.16;
            const video = {
                id: `video-${Date.now()}-${i}`,
                channelId,
                title: topics[i],
                status: i === 0 ? "pending-approval" : "pending-approval",
                scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
                views: 0,
                likes: 0,
                comments: 0,
                thumbnail: `/ai-tools-thumbnail.png`,
                topic: topics[i],
                aiScore: Math.floor(Math.random() * 30) + 70,
                adminApproved: false,
                userApproved: false,
                cost,
                isFree,
                riskLevel,
                createdAt: new Date().toISOString()
            };
            videos.push(video);
        }
        const existingVideos = this.getVideos();
        localStorage.setItem("videos", JSON.stringify([
            ...existingVideos,
            ...videos
        ]));
        // Update user video count
        const freeVideosUsed = Math.min(30, user.freeVideosRemaining);
        const paidVideos = 30 - freeVideosUsed;
        this.updateUser(user.id, {
            freeVideosUsed: user.freeVideosUsed + freeVideosUsed,
            paidVideoCredits: user.paidVideoCredits - paidVideos,
            totalSpent: user.totalSpent + paidVideos * 0.2
        });
        return videos;
    }
    generateTopics(strategy, count) {
        const topics = [
            "Top 5 AI Tools 2026 Hindi",
            "ChatGPT Hindi Tutorial",
            "Best Laptops Under 50K",
            "AI Image Generation Guide",
            "YouTube Growth Tips",
            "Tech News This Week",
            "Smartphone Buying Guide",
            "Internet Safety Tips",
            "Future of AI Technology",
            "Free Online Tools",
            "Productivity Apps Review",
            "Gaming PC Build Guide",
            "Photo Editing Tutorial",
            "Best Budget Gadgets",
            "AI Voice Generator",
            "WhatsApp Hidden Features",
            "Instagram Growth Hacks",
            "Tech Career Guide",
            "Best Free Software",
            "Online Money Making",
            "Video Editing Tutorial",
            "AI Music Generator",
            "Best Tech Under 1000",
            "Coding for Beginners",
            "AI Art Tutorial",
            "Tech Myths Busted",
            "Smart Home Setup",
            "Best Apps 2026",
            "Digital Marketing Tips",
            "AI Business Tools"
        ];
        return topics.slice(0, count).map((topic, i)=>`${topic} | ${strategy}`);
    }
    adminApproveVideo(videoId, adminId) {
        const videos = this.getVideos();
        const index = videos.findIndex((v)=>v.id === videoId);
        if (index !== -1) {
            videos[index] = {
                ...videos[index],
                adminApproved: true,
                adminApprovedBy: adminId,
                adminApprovedAt: new Date().toISOString(),
                status: "approved"
            };
            localStorage.setItem("videos", JSON.stringify(videos));
        }
    }
    adminRejectVideo(videoId) {
        const videos = this.getVideos();
        const video = videos.find((v)=>v.id === videoId);
        if (!video) return;
        const index = videos.findIndex((v)=>v.id === videoId);
        if (index !== -1) {
            videos[index] = {
                ...videos[index],
                status: "rejected"
            };
            localStorage.setItem("videos", JSON.stringify(videos));
            const channel = this.getChannels().find((c)=>c.id === video.channelId);
            if (channel) {
                const user = this.getUserById(channel.userId);
                if (user) {
                    if (video.isFree) {
                        this.updateUser(user.id, {
                            freeVideosUsed: Math.max(0, user.freeVideosUsed - 1)
                        });
                    } else {
                        this.updateUser(user.id, {
                            paidVideoCredits: user.paidVideoCredits + 1
                        });
                    }
                }
            }
        }
    }
    userApproveVideo(videoId) {
        const videos = this.getVideos();
        const index = videos.findIndex((v)=>v.id === videoId);
        if (index !== -1) {
            videos[index] = {
                ...videos[index],
                userApproved: true,
                userApprovedAt: new Date().toISOString(),
                status: "user-approved"
            };
            localStorage.setItem("videos", JSON.stringify(videos));
        }
    }
    getVideosByRiskLevel(riskLevel) {
        return this.getVideos().filter((v)=>v.riskLevel === riskLevel && v.status === "pending-approval");
    }
    bulkApproveVideos(videoIds, adminId) {
        const videos = this.getVideos();
        videoIds.forEach((videoId)=>{
            const index = videos.findIndex((v)=>v.id === videoId);
            if (index !== -1) {
                videos[index] = {
                    ...videos[index],
                    adminApproved: true,
                    adminApprovedBy: adminId,
                    adminApprovedAt: new Date().toISOString(),
                    status: "approved"
                };
            }
        });
        localStorage.setItem("videos", JSON.stringify(videos));
    }
    addVideoCredits(userId, credits, amount) {
        const user = this.getUserById(userId);
        if (user) {
            this.updateUser(userId, {
                paidVideoCredits: user.paidVideoCredits + credits,
                totalSpent: user.totalSpent + amount
            });
        }
    }
    // Admin methods
    getAdminStats() {
        const users = this.getUsers();
        const videos = this.getVideos();
        const payments = this.getPayments();
        const totalUsers = users.filter((u)=>u.role !== "admin").length;
        const activeToday = users.filter((u)=>{
            const lastActive = new Date(u.lastActive);
            const today = new Date();
            return lastActive.toDateString() === today.toDateString();
        }).length;
        const pendingApprovals = videos.filter((v)=>v.status === "pending-approval").length;
        const lowRiskPending = videos.filter((v)=>v.status === "pending-approval" && v.riskLevel === "low").length;
        const highRiskPending = videos.filter((v)=>v.status === "pending-approval" && v.riskLevel === "high").length;
        const totalVideos = videos.length;
        const videoRevenue = users.reduce((sum, u)=>sum + u.totalSpent, 0);
        const youtubeRevenue = users.reduce((sum, u)=>sum + u.youtubeShareOwed, 0);
        return {
            totalUsers,
            activeToday,
            pendingApprovals,
            lowRiskPending,
            highRiskPending,
            totalVideos,
            videoRevenue,
            youtubeRevenue,
            totalRevenue: videoRevenue + youtubeRevenue
        };
    }
}
const store = ("TURBOPACK compile-time truthy", 1) ? Store.getInstance() : "TURBOPACK unreachable";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const storedUser = localStorage.getItem("currentUser");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                const foundUser = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["store"]?.getUserByEmail(userData.email);
                if (foundUser) {
                    setUser(foundUser);
                }
            }
            setIsLoading(false);
        }
    }["AuthProvider.useEffect"], []);
    const login = async (email, password)=>{
        try {
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["store"]) return false;
            const passwords = JSON.parse(localStorage.getItem("passwords") || "{}");
            if (passwords[email] !== password) return false;
            const foundUser = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["store"].getUserByEmail(email);
            if (foundUser) {
                setUser(foundUser);
                localStorage.setItem("currentUser", JSON.stringify(foundUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error("[v0] Login error:", error);
            return false;
        }
    };
    const signup = async (name, email, password, phone)=>{
        try {
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["store"]) return false;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["store"].getUserByEmail(email)) {
                return false;
            }
            const passwords = JSON.parse(localStorage.getItem("passwords") || "{}");
            passwords[email] = password;
            localStorage.setItem("passwords", JSON.stringify(passwords));
            const isAdmin = email === "admin@youtubeauto.ai";
            const newUser = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["store"].createUser({
                email,
                name,
                phone,
                role: isAdmin ? "admin" : "user",
                plan: isAdmin ? "agency" : "free",
                hasCompletedSetup: isAdmin
            });
            setUser(newUser);
            localStorage.setItem("currentUser", JSON.stringify(newUser));
            return true;
        } catch (error) {
            console.error("[v0] Signup error:", error);
            return false;
        }
    };
    const logout = ()=>{
        setUser(null);
        localStorage.removeItem("currentUser");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            login,
            signup,
            logout,
            isLoading
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/auth-context.tsx",
        lineNumber: 90,
        columnNumber: 10
    }, this);
}
_s(AuthProvider, "YajQB7LURzRD+QP5gw0+K2TZIWA=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
"[project]/node_modules/@vercel/analytics/dist/next/index.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Analytics",
    ()=>Analytics2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// src/nextjs/index.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
// src/nextjs/utils.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
"use client";
;
;
// package.json
var name = "@vercel/analytics";
var version = "1.3.1";
// src/queue.ts
var initQueue = ()=>{
    if (window.va) return;
    window.va = function a(...params) {
        (window.vaq = window.vaq || []).push(params);
    };
};
// src/utils.ts
function isBrowser() {
    return typeof window !== "undefined";
}
function detectEnvironment() {
    try {
        const env = ("TURBOPACK compile-time value", "development");
        if ("TURBOPACK compile-time truthy", 1) {
            return "development";
        }
    } catch (e) {}
    return "production";
}
function setMode(mode = "auto") {
    if (mode === "auto") {
        window.vam = detectEnvironment();
        return;
    }
    window.vam = mode;
}
function getMode() {
    const mode = isBrowser() ? window.vam : detectEnvironment();
    return mode || "production";
}
function isDevelopment() {
    return getMode() === "development";
}
function computeRoute(pathname, pathParams) {
    if (!pathname || !pathParams) {
        return pathname;
    }
    let result = pathname;
    try {
        const entries = Object.entries(pathParams);
        for (const [key, value] of entries){
            if (!Array.isArray(value)) {
                const matcher = turnValueToRegExp(value);
                if (matcher.test(result)) {
                    result = result.replace(matcher, `/[${key}]`);
                }
            }
        }
        for (const [key, value] of entries){
            if (Array.isArray(value)) {
                const matcher = turnValueToRegExp(value.join("/"));
                if (matcher.test(result)) {
                    result = result.replace(matcher, `/[...${key}]`);
                }
            }
        }
        return result;
    } catch (e) {
        return pathname;
    }
}
function turnValueToRegExp(value) {
    return new RegExp(`/${escapeRegExp(value)}(?=[/?#]|$)`);
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// src/generic.ts
var DEV_SCRIPT_URL = "https://va.vercel-scripts.com/v1/script.debug.js";
var PROD_SCRIPT_URL = "/_vercel/insights/script.js";
function inject(props = {
    debug: true
}) {
    var _a;
    if (!isBrowser()) return;
    setMode(props.mode);
    initQueue();
    if (props.beforeSend) {
        (_a = window.va) == null ? void 0 : _a.call(window, "beforeSend", props.beforeSend);
    }
    const src = props.scriptSrc || (isDevelopment() ? DEV_SCRIPT_URL : PROD_SCRIPT_URL);
    if (document.head.querySelector(`script[src*="${src}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.sdkn = name + (props.framework ? `/${props.framework}` : "");
    script.dataset.sdkv = version;
    if (props.disableAutoTrack) {
        script.dataset.disableAutoTrack = "1";
    }
    if (props.endpoint) {
        script.dataset.endpoint = props.endpoint;
    }
    if (props.dsn) {
        script.dataset.dsn = props.dsn;
    }
    script.onerror = ()=>{
        const errorMessage = isDevelopment() ? "Please check if any ad blockers are enabled and try again." : "Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.";
        console.log(`[Vercel Web Analytics] Failed to load script from ${src}. ${errorMessage}`);
    };
    if (isDevelopment() && props.debug === false) {
        script.dataset.debug = "false";
    }
    document.head.appendChild(script);
}
function pageview({ route, path }) {
    var _a;
    (_a = window.va) == null ? void 0 : _a.call(window, "pageview", {
        route,
        path
    });
}
// src/react.tsx
function Analytics(props) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Analytics.useEffect": ()=>{
            inject({
                framework: props.framework || "react",
                ...props.route !== void 0 && {
                    disableAutoTrack: true
                },
                ...props
            });
        }
    }["Analytics.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Analytics.useEffect": ()=>{
            if (props.route && props.path) {
                pageview({
                    route: props.route,
                    path: props.path
                });
            }
        }
    }["Analytics.useEffect"], [
        props.route,
        props.path
    ]);
    return null;
}
;
var useRoute = ()=>{
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const path = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const finalParams = {
        ...Object.fromEntries(searchParams.entries()),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- can be empty in pages router
        ...params || {}
    };
    return {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- can be empty in pages router
        route: params ? computeRoute(path, finalParams) : null,
        path
    };
};
// src/nextjs/index.tsx
function AnalyticsComponent(props) {
    const { route, path } = useRoute();
    return /* @__PURE__ */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Analytics, {
        path,
        route,
        ...props,
        framework: "next"
    });
}
function Analytics2(props) {
    return /* @__PURE__ */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: null
    }, /* @__PURE__ */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(AnalyticsComponent, {
        ...props
    }));
}
;
 //# sourceMappingURL=index.mjs.map
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_2ad42a68._.js.map