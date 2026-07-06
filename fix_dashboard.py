import re

def update_dashboard():
    with open('dashboard.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix switchPage: remove the bad try/catch motion logic and just do a simple motion animate on the active page
    new_switch_page = '''function switchPage(page) {
    state.page = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const activePage = document.getElementById('page-' + page);
    activePage.classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    try {
        if (window.Motion && window.Motion.animate) {
            window.Motion.animate(activePage, { opacity: [0, 1], y: [10, 0] }, { duration: 0.3, easing: 'ease-out' });
        }
    } catch(e) {}
    
    const titles = { dashboard: 'Dashboard', options: 'Options Analytics', strategies: 'Strategies', backtest: 'Backtest', logs: 'Live Log', settings: 'Settings' };
    document.getElementById('pageTitle').textContent = titles[page] || page;
}'''

    content = re.sub(r'function switchPage\(page\) \{[\s\S]*?document.getElementById\(\'pageTitle\'\).textContent = titles\[page\] \|\| page;\n\}', new_switch_page, content)

    # Fix options chain table styling
    new_options_page = '''        <!-- ⚡ OPTIONS PAGE ⚡ -->
        <div class="page" id="page-options">
            <div class="card animate-in">
                <div class="card-header">
                    <h3>📊 Options Chain Analytics</h3>
                    <button class="btn btn-primary" onclick="loadOptionsChain()">🔄 Refresh</button>
                </div>
                <div class="card-body">
                    <div class="table-wrap">
                        <table id="optionsChainTable">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Strike</th>
                                    <th>Mark Price</th>
                                    <th>Delta</th>
                                    <th>Gamma</th>
                                    <th>Vega</th>
                                    <th>Theta</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="7" class="empty-state-text">Click Refresh to load Delta Exchange options chain.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>'''

    content = re.sub(r'<!-- ⚡ OPTIONS PAGE ⚡ -->[\s\S]*?</div>\s*</div>\s*</div>', new_options_page, content)

    # Fix loadOptionsChain table rows styling
    new_load_options = '''async function loadOptionsChain() {
    const tbody = document.querySelector('#optionsChainTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state-text">Loading...</td></tr>';
    try {
        const res = await fetch(`${API_BASE}/api/options/chain`);
        const data = await res.json();
        
        if(data && data.chain && data.chain.length > 0) {
            let rows = '';
            data.chain.forEach(opt => {
                rows += `<tr>
                    <td>${opt.call_put}</td>
                    <td style="font-weight:600;">${opt.strike_price}</td>
                    <td>${fmtPrice(opt.mark_price)}</td>
                    <td style="color:${opt.greeks.delta>0?'var(--success)':'var(--danger)'}">${opt.greeks.delta.toFixed(4)}</td>
                    <td>${opt.greeks.gamma.toFixed(4)}</td>
                    <td>${opt.greeks.vega.toFixed(4)}</td>
                    <td>${opt.greeks.theta.toFixed(4)}</td>
                </tr>`;
            });
            tbody.innerHTML = rows;
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-text">No data available</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state-text" style="color:var(--danger);">Error fetching options data (Backend offline?)</td></tr>';
    }
}'''

    content = re.sub(r'async function loadOptionsChain\(\) \{[\s\S]*?\}\n\}', new_load_options, content)

    with open('dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_dashboard()
