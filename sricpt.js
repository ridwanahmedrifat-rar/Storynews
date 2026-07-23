const DB_NAME = "StoryNewsDB";
const DB_VERSION = 1;
const STORE_NAME = "articles";
let db = null;

function getFormattedDate() {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

const initialArticles = [
    {
        id: 1,
        title: "Next-Gen Artificial Intelligence Models Redefining Global Healthcare Solutions",
        category: "tech",
        categoryName: "Technology",
        summary: "Leading research groups unveil clinical diagnostic frameworks driven by secure LLM networks.",
        content: "Artificial intelligence in medicine has achieved a profound operational milestone. Today, multi-institutional clinical trials revealed diagnostic prediction engines capable of isolating anomalies weeks before standard symptomatic presentations.",
        author: "Dr. Sarah Jenkins",
        date: getFormattedDate(),
        image: "https://picsum.photos/800/450?random=101",
        isFeatured: true,
        likes: 42,
        likedByMe: false,
        comments: [
            { name: "Marcus Thorne", date: getFormattedDate(), text: "Fascinating breakthrough. The reduction in false positives is what healthcare systems desperately needed." },
            { name: "Elena Rostova", date: getFormattedDate(), text: "Are these models licensed for cross-border telemedicine application yet?" }
        ]
    },
    {
        id: 2,
        title: "Central Banking Committees Signal Coordinated Monetary Policy Adjustments",
        category: "business",
        categoryName: "Business",
        summary: "Financial markets respond favorably as multinational monetary institutions balance liquidity measures.",
        content: "Global financial exchanges posted stable gains following scheduled legislative updates regarding treasury holdings and liquidity protocols across North American and European sectors.",
        author: "Mark Vance",
        date: getFormattedDate(),
        image: "https://picsum.photos/400/250?random=102",
        isFeatured: false,
        likes: 19,
        likedByMe: false,
        comments: [
            { name: "David Chen", date: getFormattedDate(), text: "Bond yields are already reflecting this stability. Good sign for institutional portfolios." }
        ]
    },
    {
        id: 3,
        title: "International Climate Treaty Ratified by Forty Leading Economies",
        category: "world",
        categoryName: "World",
        summary: "Delegates finalize compliance frameworks targeting net-zero industrial transitions over the coming decade.",
        content: "In a landmark multilateral summit, delegates formally ratified the Global Environmental Concord, setting binding carbon quota targets for heavy manufacturing sectors.",
        author: "Claire Dupont",
        date: getFormattedDate(),
        image: "https://picsum.photos/400/250?random=103",
        isFeatured: false,
        likes: 31,
        likedByMe: false,
        comments: []
    },
    {
        id: 4,
        title: "Legislative Chambers Pass Bipartisan Infrastructure Modernization Bill",
        category: "politics",
        categoryName: "Politics",
        summary: "New funding provisions will fast-track high-speed transit and secure digital grid upgrades.",
        content: "Lawmakers successfully closed debate on the national modernization package this afternoon, unlocking substantial capital for regional grid stabilization.",
        author: "Jonathan Brooks",
        date: getFormattedDate(),
        image: "https://picsum.photos/400/250?random=104",
        isFeatured: false,
        likes: 14,
        likedByMe: false,
        comments: []
    },
    {
        id: 5,
        title: "Global Athletics Federation Introduces Advanced Biometric Tracking Rules",
        category: "sports",
        categoryName: "Sports",
        summary: "New telemetry standards aim to enhance athlete safety and officiate international competitions with absolute precision.",
        content: "The sports regulation council announced comprehensive structural updates for upcoming tournament qualifiers, incorporating real-time performance analytics.",
        author: "Liam O'Connor",
        date: getFormattedDate(),
        image: "https://picsum.photos/400/250?random=105",
        isFeatured: false,
        likes: 27,
        likedByMe: false,
        comments: []
    }
];

let articles = [];
let isAdminLoggedIn = false;
let currentUser = null;
let bookmarkedArticleIds = [];

function initDatabase(callback) {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
        console.error("Database error: ", event.target.error);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadArticlesFromDB(callback);
    };

    request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = database.createObjectStore(STORE_NAME, { keyPath: "id" });
            objectStore.createIndex("category", "category", { unique: false });
        }
    };
}

function loadArticlesFromDB(callback) {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
        articles = event.target.result;
        if (articles.length === 0) {
            seedInitialArticles(callback);
        } else {
            if (callback) callback();
        }
    };
}

function seedInitialArticles(callback) {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    initialArticles.forEach(art => store.put(art));

    transaction.oncomplete = () => {
        loadArticlesFromDB(callback);
    };
}

function saveArticleToDB(article, callback) {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(article);

    transaction.oncomplete = () => {
        loadArticlesFromDB(callback);
    };
}

function deleteArticleFromDB(id, callback) {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);

    transaction.oncomplete = () => {
        loadArticlesFromDB(callback);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("current-date").innerText = new Date().toLocaleDateString('en-US', dateOptions);
    document.getElementById("year").innerText = new Date().getFullYear();

    const sidebarTemplate = document.getElementById("sidebar-template");
    document.getElementById("sidebar-container").appendChild(sidebarTemplate.content.cloneNode(true));

    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserAuthState();
    }

    showSkeletonLoading();
    initDatabase(() => {
        setTimeout(() => {
            renderHome();
        }, 300);
    });

    const themeBtn = document.getElementById("theme-btn");
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        themeBtn.innerText = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
    });

    document.getElementById("searchBox").addEventListener("input", function () {
        const value = this.value.toLowerCase();
        const filtered = articles.filter(article => 
            article.title.toLowerCase().includes(value) || 
            article.summary.toLowerCase().includes(value)
        );
        renderSearchResults(filtered);
    });

    const newsForm = document.getElementById("news-form");
    const formStatus = document.getElementById("form-status");
    newsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        formStatus.style.display = "block";
        document.getElementById("email-input").value = "";
        setTimeout(() => { formStatus.style.display = "none"; }, 3500);
    });

    document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const errorMsg = document.getElementById("login-error");
        const status = document.getElementById("login-status");

        const users = JSON.parse(localStorage.getItem("users")) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            currentUser = user;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            errorMsg.style.display = "none";
            status.style.display = "block";
            updateUserAuthState();
            setTimeout(() => { 
                status.style.display = "none"; 
                closeAuthModal(); 
                navigateTo('user-dashboard');
            }, 1000);
        } else {
            errorMsg.style.display = "block";
        }
    });

    document.getElementById("signup-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("signup-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;
        const errorMsg = document.getElementById("signup-error");
        const status = document.getElementById("signup-status");

        const users = JSON.parse(localStorage.getItem("users")) || [];
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            errorMsg.style.display = "block";
        } else {
            errorMsg.style.display = "none";
            const newUser = { name, email, password };
            users.push(newUser);
            localStorage.setItem("users", JSON.stringify(users));

            currentUser = newUser;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            updateUserAuthState();

            status.style.display = "block";
            setTimeout(() => { 
                status.style.display = "none"; 
                closeAuthModal(); 
                navigateTo('user-dashboard');
            }, 1000);
        }
    });

    document.getElementById("admin-login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const user = document.getElementById("admin-user").value;
        const pass = document.getElementById("admin-pass").value;
        const errorMsg = document.getElementById("admin-login-error");

        if (user === "storynews" && pass === "storynews") {
            isAdminLoggedIn = true;
            errorMsg.style.display = "none";
            document.getElementById("admin-user").value = "";
            document.getElementById("admin-pass").value = "";
            navigateTo('admin');
        } else {
            errorMsg.style.display = "block";
        }
    });

    document.getElementById("create-article-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const cat = document.getElementById("art-category").value;
        const categoryNames = { tech: "Technology", business: "Business", world: "World", politics: "Politics", sports: "Sports" };

        const newArt = {
            id: Date.now(),
            title: document.getElementById("art-title").value,
            category: cat,
            categoryName: categoryNames[cat],
            author: document.getElementById("art-author").value,
            image: document.getElementById("art-image").value,
            summary: document.getElementById("art-summary").value,
            content: document.getElementById("art-content").value,
            date: getFormattedDate(),
            isFeatured: false,
            likes: 0,
            likedByMe: false,
            comments: []
        };

        saveArticleToDB(newArt, () => {
            document.getElementById("create-article-form").reset();
            const status = document.getElementById("art-status");
            status.style.display = "block";
            setTimeout(() => { status.style.display = "none"; }, 3500);
            renderAdminDashboard();
        });
    });
});

function showSkeletonLoading() {
    const gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = `
        <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
        <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
    `;
}

function renderSearchResults(list) {
    const container = document.getElementById("grid-container");
    if (list.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); grid-column: span 2;">No articles found matching your search query.</p>`;
        return;
    }
    container.innerHTML = list.map(story => `
        <article class="card">
            <img src="${story.image}" alt="${story.title}">
            <span class="category ${story.category}">${story.categoryName || 'News'}</span>
            <h3 onclick="navigateTo('article', ${story.id})">${story.title}</h3>
            <p>${story.summary}</p>
        </article>
    `).join('');
}

function toggleLike(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    if (article.likedByMe) {
        article.likes -= 1;
        article.likedByMe = false;
    } else {
        article.likes += 1;
        article.likedByMe = true;
    }

    saveArticleToDB(article, () => {
        refreshCurrentView(id);
    });
}

function addComment(id) {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }

    const inputField = document.getElementById(`comment-input-${id}`);
    const commentText = inputField.value.trim();
    if (!commentText) return;

    const article = articles.find(a => a.id === id);
    if (!article) return;

    article.comments.push({
        name: currentUser.name,
        date: getFormattedDate(),
        text: commentText
    });

    inputField.value = "";
    saveArticleToDB(article, () => {
        refreshCurrentView(id);
    });
}

function refreshCurrentView(id) {
    loadArticlesFromDB(() => {
        const activePage = document.querySelector(".page-section.active").id;
        if (activePage === 'page-home') {
            renderHome();
        } else if (activePage === 'page-category') {
            const currentCat = document.getElementById("category-title").innerText.split(" ")[0].toLowerCase();
            renderCategoryPage(currentCat);
        } else if (activePage === 'page-article') {
            renderArticleDetail(id);
        }
    });
}

function openAuthModal(tab = 'login') {
    switchAuthTab(tab);
    document.getElementById("auth-modal").classList.add("active");
}

function closeAuthModal() {
    document.getElementById("auth-modal").classList.remove("active");
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById("tab-login");
    const signupTab = document.getElementById("tab-signup");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (tab === 'login') {
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
        loginForm.classList.add("active");
        signupForm.classList.remove("active");
    } else {
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
        signupForm.classList.add("active");
        loginForm.classList.remove("active");
    }
}

function updateUserAuthState() {
    const container = document.getElementById("auth-buttons-container");
    const userDashLink = document.getElementById("user-dash-link");

    if (currentUser) {
        container.innerHTML = `
            <button class="auth-btn secondary" onclick="navigateTo('user-dashboard')">Dashboard</button>
            <button class="auth-btn" onclick="logoutUser()">Sign Out</button>
        `;
        userDashLink.style.display = "inline-block";
        document.getElementById("dash-user-name").innerText = currentUser.name;
        document.getElementById("dash-user-email").innerText = currentUser.email;
    } else {
        container.innerHTML = `
            <button class="auth-btn secondary" onclick="openAuthModal('login')">Sign In</button>
            <button class="auth-btn" onclick="openAuthModal('signup')">Sign Up</button>
        `;
        userDashLink.style.display = "none";
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateUserAuthState();
    navigateTo('home');
}

function toggleBookmark(id) {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }
    if (bookmarkedArticleIds.includes(id)) {
        bookmarkedArticleIds = bookmarkedArticleIds.filter(bId => bId !== id);
    } else {
        bookmarkedArticleIds.push(id);
    }
    refreshCurrentView(id);
    renderUserDashboard();
}

function renderUserDashboard() {
    const container = document.getElementById("bookmarks-container");
    const savedArticles = articles.filter(a => bookmarkedArticleIds.includes(a.id));

    if (savedArticles.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted)">You haven't bookmarked any stories yet.</p>`;
        return;
    }

    container.innerHTML = savedArticles.map(story => `
        <div class="card" style="margin-bottom: 12px;">
            <span class="category ${story.category}">${story.categoryName}</span>
            <h3 onclick="navigateTo('article', ${story.id})">${story.title}</h3>
            <button class="bookmark-btn" onclick="toggleBookmark(${story.id})">Remove Bookmark</button>
        </div>
    `).join('');
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    navigateTo('home');
}

function renderAdminDashboard() {
    loadArticlesFromDB(() => {
        const container = document.getElementById("admin-articles-list");
        container.innerHTML = articles.map(art => `
            <tr>
                <td>${art.id}</td>
                <td>${art.title}</td>
                <td><span class="category ${art.category}">${art.categoryName}</span></td>
                <td>${art.date}</td>
                <td>❤ ${art.likes} &bull; 💬 ${art.comments.length}</td>
                <td>
                    <button class="btn btn-sm" onclick="toggleFeatureArticle(${art.id})">
                        ${art.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteArticle(${art.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    });
}

function toggleFeatureArticle(id) {
    let pendingUpdates = articles.length;
    articles.forEach(a => {
        a.isFeatured = (a.id === id ? !a.isFeatured : false);
        saveArticleToDB(a, () => {
            pendingUpdates--;
            if (pendingUpdates === 0) {
                renderAdminDashboard();
            }
        });
    });
}

function deleteArticle(id) {
    if (confirm("Permanently delete this article from the database?")) {
        deleteArticleFromDB(id, () => {
            bookmarkedArticleIds = bookmarkedArticleIds.filter(bId => bId !== id);
            renderAdminDashboard();
        });
    }
}

function navigateTo(page, param = null) {
    document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
    
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
        if (link.innerText.toLowerCase().includes(page)) link.classList.add("active");
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    loadArticlesFromDB(() => {
        if (page === 'home') {
            renderHome();
            document.getElementById("page-home").classList.add("active");
        } else if (['tech', 'business', 'world', 'politics', 'sports'].includes(page)) {
            renderCategoryPage(page);
            document.getElementById("page-category").classList.add("active");
        } else if (page === 'article') {
            renderArticleDetail(param);
            document.getElementById("page-article").classList.add("active");
        } else if (page === 'about') {
            document.getElementById("page-about").classList.add("active");
        } else if (page === 'user-dashboard') {
            if (!currentUser) {
                openAuthModal('login');
            } else {
                renderUserDashboard();
                document.getElementById("page-user-dashboard").classList.add("active");
            }
        } else if (page === 'admin') {
            if (isAdminLoggedIn) {
                renderAdminDashboard();
                document.getElementById("page-admin-dashboard").classList.add("active");
            } else {
                document.getElementById("page-admin-login").classList.add("active");
            }
        }
    });
}

function renderHome() {
    const featuredContainer = document.getElementById("featured-container");
    const gridContainer = document.getElementById("grid-container");

    const featured = articles.find(a => a.isFeatured) || articles[0];
    const secondary = articles.filter(a => a !== featured);

    if (featured) {
        const isBookmarked = bookmarkedArticleIds.includes(featured.id);
        featuredContainer.innerHTML = `
            <img src="${featured.image}" alt="${featured.title}">
            <div class="featured-text">
                <span class="category ${featured.category}">${featured.categoryName}</span>
                <h2 onclick="navigateTo('article', ${featured.id})">${featured.title}</h2>
                <p>${featured.summary}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                    <span class="meta-info">By ${featured.author} &bull; Updated: ${featured.date}</span>
                    <button class="bookmark-btn" onclick="toggleBookmark(${featured.id})">
                        ${isBookmarked ? '★ Saved' : '☆ Save'}
                    </button>
                </div>
                <div class="interaction-bar">
                    <button class="action-chip ${featured.likedByMe ? 'liked' : ''}" onclick="toggleLike(${featured.id})">
                        ❤ <span>${featured.likes}</span> Likes
                    </button>
                    <button class="action-chip" onclick="navigateTo('article', ${featured.id})">
                        💬 <span>${featured.comments.length}</span> Comments
                    </button>
                </div>
            </div>
        `;
    } else {
        featuredContainer.innerHTML = '';
    }

    gridContainer.innerHTML = secondary.map(story => {
        const isBookmarked = bookmarkedArticleIds.includes(story.id);
        return `
            <article class="card">
                <img src="${story.image}" alt="${story.title}">
                <span class="category ${story.category}">${story.categoryName}</span>
                <h3 onclick="navigateTo('article', ${story.id})">${story.title}</h3>
                <p>${story.summary}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                    <span class="meta-info">Updated: ${story.date}</span>
                    <button class="bookmark-btn" onclick="toggleBookmark(${story.id})">
                        ${isBookmarked ? '★ Saved' : '☆ Save'}
                    </button>
                </div>
                <div class="interaction-bar">
                    <button class="action-chip ${story.likedByMe ? 'liked' : ''}" onclick="toggleLike(${story.id})">
                        ❤ <span>${story.likes}</span>
                    </button>
                    <button class="action-chip" onclick="navigateTo('article', ${story.id})">
                        💬 <span>${story.comments.length}</span>
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function renderCategoryPage(categoryKey) {
    const categoryTitle = document.getElementById("category-title");
    const container = document.getElementById("category-grid-container");

    const filteredArticles = articles.filter(a => a.category === categoryKey);
    categoryTitle.innerText = categoryKey.toUpperCase() + " NEWS";

    if(filteredArticles.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted)">No professional articles published under this section yet.</p>`;
        return;
    }

    container.innerHTML = filteredArticles.map(story => {
        const isBookmarked = bookmarkedArticleIds.includes(story.id);
        return `
            <article class="card">
                <img src="${story.image}" alt="${story.title}">
                <span class="category ${story.category}">${story.categoryName}</span>
                <h3 onclick="navigateTo('article', ${story.id})">${story.title}</h3>
                <p>${story.summary}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                    <span class="meta-info">Updated: ${story.date}</span>
                    <button class="bookmark-btn" onclick="toggleBookmark(${story.id})">
                        ${isBookmarked ? '★ Saved' : '☆ Save'}
                    </button>
                </div>
                <div class="interaction-bar">
                    <button class="action-chip ${story.likedByMe ? 'liked' : ''}" onclick="toggleLike(${story.id})">
                        ❤ <span>${story.likes}</span>
                    </button>
                    <button class="action-chip" onclick="navigateTo('article', ${story.id})">
                        💬 <span>${story.comments.length}</span>
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function renderArticleDetail(articleId) {
    const container = document.getElementById("article-detail-container");
    const story = articles.find(a => a.id === articleId);

    if (!story) {
        container.innerHTML = `<h2>Article not found or removed from database.</h2>`;
        return;
    }

    const isBookmarked = bookmarkedArticleIds.includes(story.id);

    const commentsHtml = story.comments.map(c => `
        <div class="comment-item">
            <div class="comment-header">
                <span>${c.name}</span>
                <span class="comment-date">${c.date}</span>
            </div>
            <div class="comment-body">${c.text}</div>
        </div>
    `).join('') || `<p style="color:var(--text-muted); font-size:0.9rem;">No comments yet. Be the first to share your professional perspective.</p>`;

    container.innerHTML = `
        <span class="category ${story.category}">${story.categoryName}</span>
        <h1 style="font-size: 2.3rem; margin-top: 10px; line-height: 1.25;">${story.title}</h1>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 12px;">
            <span class="meta-info">By ${story.author} &bull; Daily Updated: ${story.date}</span>
            <button class="bookmark-btn" onclick="toggleBookmark(${story.id})" style="font-size: 0.95rem;">
                ${isBookmarked ? '★ Saved to Bookmarks' : '☆ Save to Bookmarks'}
            </button>
        </div>
        <div class="interaction-bar" style="margin-bottom: 20px;">
            <button class="action-chip ${story.likedByMe ? 'liked' : ''}" onclick="toggleLike(${story.id})">
                ❤ <span>${story.likes}</span> Likes
            </button>
            <button class="action-chip">
                💬 <span>${story.comments.length}</span> Comments
            </button>
        </div>
        <img src="${story.image}" alt="${story.title}">
        <p class="content"><strong>${story.summary}</strong></p>
        <p class="content">${story.content}</p>

        <div class="comments-section">
            <h3>Discussion (${story.comments.length})</h3>
            <div class="comment-box">
                <textarea id="comment-input-${story.id}" placeholder="Join the discussion... (Sign in required)"></textarea>
                <button class="btn btn-sm" onclick="addComment(${story.id})">Post Comment</button>
            </div>
            <div style="margin-top: 20px;" id="comments-list-${story.id}">
                ${commentsHtml}
            </div>
        </div>
    `;
}
