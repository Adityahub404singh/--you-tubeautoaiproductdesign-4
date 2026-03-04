module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "store",
    ()=>store
]);
"use client";
class Store {
    static instance;
    constructor(){
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
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
        if ("TURBOPACK compile-time truthy", 1) return [];
        //TURBOPACK unreachable
        ;
        const data = undefined;
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
        if ("TURBOPACK compile-time truthy", 1) return [];
        //TURBOPACK unreachable
        ;
        const data = undefined;
        const channels = undefined;
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
        if ("TURBOPACK compile-time truthy", 1) return [];
        //TURBOPACK unreachable
        ;
        const data = undefined;
        const videos = undefined;
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
const store = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : null;
}),
"[project]/lib/auth-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            const foundUser = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["store"]?.getUserByEmail(userData.email);
            if (foundUser) {
                setUser(foundUser);
            }
        }
        setIsLoading(false);
    }, []);
    const login = async (email, password)=>{
        try {
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["store"]) return false;
            const passwords = JSON.parse(localStorage.getItem("passwords") || "{}");
            if (passwords[email] !== password) return false;
            const foundUser = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["store"].getUserByEmail(email);
            if (foundUser) {
                setUser(foundUser);
                localStorage.setItem("currentUser", JSON.stringify(foundUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    };
    const signup = async (name, email, password, phone)=>{
        try {
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["store"]) return false;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["store"].getUserByEmail(email)) {
                return false;
            }
            const passwords = JSON.parse(localStorage.getItem("passwords") || "{}");
            passwords[email] = password;
            localStorage.setItem("passwords", JSON.stringify(passwords));
            const isAdmin = email === "admin@youtubeauto.ai";
            const newUser = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["store"].createUser({
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
            console.error("Signup error:", error);
            return false;
        }
    };
    const logout = ()=>{
        setUser(null);
        localStorage.removeItem("currentUser");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
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
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__582a7d09._.js.map