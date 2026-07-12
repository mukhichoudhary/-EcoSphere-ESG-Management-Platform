// theme.js - Synchronously applies saved Theme and Dark Mode styles on page load
(function() {
    const theme = localStorage.getItem("theme") || "Default";
    const darkMode = localStorage.getItem("darkMode") === "true";

    const style = document.createElement('style');
    let css = '';
    
    if (darkMode) {
        css += `
            body { background: #121212 !important; color: white !important; }
            .card, .chart-card, .chart-box, .table-section, .activities, .activity, .progress-section, .leaderboard, .settings-card { 
                background: #1f2937 !important; 
                color: white !important; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
            }
            table td { color: white !important; border-bottom: 1px solid #374151 !important; }
            table tr:hover { background: rgba(255, 255, 255, 0.05) !important; }
            input, select { background: #374151 !important; color: white !important; border: 1px solid #4b5563 !important; }
            p, span { color: #ccc !important; }
            h1, h2, h3 { color: white !important; }
        `;
    }

    let sidebarColor = "#0f172a";
    if (theme === "Green") sidebarColor = "#15803d";
    else if (theme === "Blue") sidebarColor = "#2563eb";
    else if (theme === "Purple") sidebarColor = "#7c3aed";
    else if (theme === "Dark") sidebarColor = "#111827";

    css += `
        .sidebar { background: ${sidebarColor} !important; }
    `;

    style.innerHTML = css;
    
    // Inject stylesheet early
    if (document.head) {
        document.head.appendChild(style);
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            document.head.appendChild(style);
        });
    }
})();
