import re

def update_dashboard():
    with open('dashboard.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add motion.js to head
    if 'motion.js' not in content:
        content = content.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/motion@10.16.2/dist/motion.js"></script>\n</head>')

    # 2. Add Options Nav Item
    options_nav = """            <div class="nav-item" data-page="options" onclick="switchPage('options')">
                <span class="nav-icon">📊</span> Options
            </div>
"""
    if 'data-page="options"' not in content:
        content = content.replace(
            '<div class="nav-item" data-page="backtest"',
            options_nav + '            <div class="nav-item" data-page="backtest"'
        )
    
    # 3. Add Options Page
    options_page = """
        <!-- ⚡ OPTIONS PAGE ⚡ -->
        <div class="page" id="page-options">
            <div class="card animate-in">
                <div class="card-header">
                    <h3>📊 Options Chain Analytics</h3>
                    <button class="btn btn-primary" onclick="loadOptionsChain()">🔄 Refresh</button>
                </div>
                <div class="card-body">
                    <div style="overflow-x: auto;">
                        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;" id="optionsChainTable">
                            <thead>
                                <tr style="border-bottom:1px solid var(--border); color:var(--text-muted);">
                                    <th style="padding:10px;">Type</th>
                                    <th style="padding:10px;">Strike</th>
                                    <th style="padding:10px;">Mark Price</th>
                                    <th style="padding:10px;">Delta</th>
                                    <th style="padding:10px;">Gamma</th>
                                    <th style="padding:10px;">Vega</th>
                                    <th style="padding:10px;">Theta</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="7" style="padding:20px; text-align:center;">Click Refresh to load Delta Exchange options chain.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
"""
    if 'id="page-options"' not in content:
        content = content.replace(
            '<!-- ⚡ BACKTEST PAGE ⚡ -->',
            options_page + '\n            <!-- ⚡ BACKTEST PAGE ⚡ -->'
        )

    # 4. Modify switchPage for motion
    if 'const { animate } = Motion;' not in content:
        js_motion = """
function switchPage(page) {
    state.page = page;
    
    // Attempt motion if available
    try {
        const { animate } = window.Motion;
        animate('.page', { opacity: 0, y: 10 }, { duration: 0.2 }).finished.then(() => {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const activePage = document.getElementById('page-' + page);
            activePage.classList.add('active');
            document.querySelector(`[data-page="${page}"]`).classList.add('active');
            animate(activePage, { opacity: [0, 1], y: [10, 0] }, { duration: 0.3, easing: "ease-out" });
        });
    } catch(e) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
    }
    
    const titles = { dashboard: 'Dashboard', options: 'Options Analytics', strategies: 'Strategies', backtest: 'Backtest', logs: 'Live Log', settings: 'Settings' };
    document.getElementById('pageTitle').textContent = titles[page] || page;
}

async function loadOptionsChain() {
    const tbody = document.querySelector('#optionsChainTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" style="padding:20px; text-align:center;">Loading...</td></tr>';
    try {
        const res = await fetch(`${API_BASE}/api/options/chain`);
        const data = await res.json();
        
        if(data && data.chain && data.chain.length > 0) {
            let rows = '';
            data.chain.forEach(opt => {
                rows += `<tr style="border-bottom:1px solid var(--border-light);">
                    <td style="padding:10px;">${opt.call_put}</td>
                    <td style="padding:10px; font-weight:600;">${opt.strike_price}</td>
                    <td style="padding:10px;">${opt.mark_price.toFixed(4)}</td>
                    <td style="padding:10px; color:${opt.greeks.delta>0?'var(--success)':'var(--danger)'}">${opt.greeks.delta.toFixed(4)}</td>
                    <td style="padding:10px;">${opt.greeks.gamma.toFixed(4)}</td>
                    <td style="padding:10px;">${opt.greeks.vega.toFixed(4)}</td>
                    <td style="padding:10px;">${opt.greeks.theta.toFixed(4)}</td>
                </tr>`;
            });
            tbody.innerHTML = rows;
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="padding:20px; text-align:center;">No data available</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:20px; text-align:center; color:var(--danger);">Error fetching options data (Backend offline?)</td></tr>';
    }
}
"""
        # Replace original switchPage
        import re
        content = re.sub(r'function switchPage\(page\) \{[\s\S]*?document.getElementById\(\'pageTitle\'\).textContent = titles\[page\] \|\| page;\n\}', js_motion, content)

    with open('dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_dashboard()
