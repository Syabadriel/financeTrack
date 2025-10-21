/* script.js — Cleaned & ready-to-use
   Requirements:
   - Chart.js (v3+)
   - HTML must contain elements referenced by id (transactionForm, debtForm, transferForm, budgetForm, transactionList, debtList, etc.)
   - LocalStorage used for persistence
*/

(() => {
  // --- State ---
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  let debts = JSON.parse(localStorage.getItem('debts')) || [];
  let budgetTargets = JSON.parse(localStorage.getItem('budgetTargets')) || [];

  const incomeCategories = ['Gaji','Bonus','Investasi','Usaha','Lainnya'];
  const expenseCategories = ['Makanan','Transportasi','Hiburan','Tagihan','Belanja','Kesehatan','Pendidikan','Lainnya'];

  let weeklyChartInstance = null;
  let monthlyChartInstance = null;
  let yearlyChartInstance = null;
  let categoryChartInstance = null;

  let currentFilters = {
    search: '',
    category: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  };

  // --- Helpers ---
  const q = id => document.getElementById(id);
  const safeText = (elId, text) => { const el = q(elId); if (el) el.textContent = text; };

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function saveAll() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('debts', JSON.stringify(debts));
    localStorage.setItem('budgetTargets', JSON.stringify(budgetTargets));
  }

  function dateOnly(d) {
    const x = new Date(d);
    x.setHours(0,0,0,0);
    return x;
  }

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay() === 0 ? 7 : d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - (day - 1));
    start.setHours(0,0,0,0);
    return start;
  }

  // --- Theme ---
  function initializeTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  }
  function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  // --- Filters init & management ---
  function initializeFilters() {
    const catFilter = q('categoryFilter');
    if (catFilter) {
      const all = [...new Set([...incomeCategories, ...expenseCategories])];
      all.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        catFilter.appendChild(opt);
      });
    }

    const budgetCategory = q('budgetCategory');
    if (budgetCategory) {
      expenseCategories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        budgetCategory.appendChild(opt);
      });
    }
  }

  function handleSearchInput() {
    const el = q('searchInput');
    if (!el) return;
    currentFilters.search = el.value.trim();
    const clearBtn = q('clearSearch');
    if (clearBtn) clearBtn.style.display = el.value ? 'inline-block' : 'none';
    updateTransactionList();
  }
  function clearSearch() {
    const el = q('searchInput');
    if (el) el.value = '';
    currentFilters.search = '';
    const clearBtn = q('clearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    updateTransactionList();
  }

  function applyFilters() {
    const cf = q('categoryFilter'); if (cf) currentFilters.category = cf.value;
    const tf = q('typeFilter'); if (tf) currentFilters.type = tf.value;
    const df = q('dateFrom'); if (df) currentFilters.dateFrom = df.value;
    const dt = q('dateTo'); if (dt) currentFilters.dateTo = dt.value;
    updateTransactionList();
  }
  function clearFilters() {
    currentFilters = { search:'', category:'', type:'', dateFrom:'', dateTo:'' };
    ['searchInput','categoryFilter','typeFilter','dateFrom','dateTo','clearSearch'].forEach(id=>{
      const el = q(id); if (el) { if (el.tagName === 'INPUT' || el.tagName === 'SELECT') el.value = ''; }
    });
    updateTransactionList();
  }

  function getFilteredTransactions() {
    return transactions.filter(t => {
      if (currentFilters.search) {
        const s = currentFilters.search.toLowerCase();
        const inDesc = (t.description||'').toLowerCase().includes(s);
        const inCat = (t.category||'').toLowerCase().includes(s);
        const inAmt = t.amount.toString().includes(s);
        if (!(inDesc || inCat || inAmt)) return false;
      }
      if (currentFilters.category && t.category !== currentFilters.category) return false;
      if (currentFilters.type && t.type !== currentFilters.type) return false;
      if (currentFilters.dateFrom && t.date < currentFilters.dateFrom) return false;
      if (currentFilters.dateTo && t.date > currentFilters.dateTo) return false;
      return true;
    });
  }

  // --- Category options ---
  function updateCategoryOptions() {
    const typeEl = q('transactionType');
    const catSelect = q('transactionCategory');
    if (!typeEl || !catSelect) return;
    const categories = typeEl.value === 'income' ? incomeCategories : expenseCategories;
    catSelect.innerHTML = '<option value="">Pilih Kategori</option>';
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      catSelect.appendChild(opt);
    });
  }

  // --- Transaction handlers ---
  function handleTransactionSubmit(e) {
    if (e) e.preventDefault();
    const type = q('transactionType') ? q('transactionType').value : 'expense';
    const amountRaw = q('transactionAmount') ? q('transactionAmount').value : '0';
    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount <= 0) { alert('Jumlah harus lebih dari 0'); return; }

    const transaction = {
      id: Date.now(),
      type,
      amount,
      description: (q('transactionDescription') && q('transactionDescription').value) || '',
      category: (q('transactionCategory') && q('transactionCategory').value) || '',
      payment: (q('transactionPayment') && q('transactionPayment').value) || '',
      date: (q('transactionDate') && q('transactionDate').value) || todayISO()
    };

    transactions.push(transaction);
    saveAll();
    const form = q('transactionForm');
    if (form) form.reset();
    if (q('transactionDate')) q('transactionDate').value = todayISO();
    updateBalance();
    updateTransactionList();
    updateDailyView();
    updateSummary();
    updateCategorySummary();
    alert('Transaksi berhasil disimpan!');
  }

  function handleTransfer(e) {
    if (e) e.preventDefault();
    const from = q('transferFrom') ? q('transferFrom').value : '';
    const to = q('transferTo') ? q('transferTo').value : '';
    const amount = parseFloat(q('transferAmount') ? q('transferAmount').value : '0');
    if (from === to) { alert('Tidak bisa transfer ke saldo yang sama!'); return; }
    if (isNaN(amount) || amount <= 0) { alert('Jumlah tidak valid!'); return; }
    const tx = {
      id: Date.now(),
      type: 'transfer',
      from, to, amount,
      description: `Transfer ${from} → ${to}`,
      payment: '',
      category: '',
      date: todayISO()
    };
    transactions.push(tx);
    saveAll();
    const form = q('transferForm'); if (form) form.reset();
    updateBalance(); updateTransactionList(); updateDailyView(); updateSummary(); updateCategorySummary();
    alert('Transfer berhasil disimpan!');
  }

  // --- Debt handlers ---
  function handleDebtSubmit(e) {
    if (e) e.preventDefault();
    const amount = parseFloat(q('debtAmount') ? q('debtAmount').value : '0');
    if (isNaN(amount) || amount <= 0) { alert('Jumlah hutang harus lebih dari 0'); return; }
    const d = {
      id: Date.now(),
      name: (q('debtName') && q('debtName').value) || '',
      amount,
      description: (q('debtDescription') && q('debtDescription').value) || '',
      date: (q('debtDate') && q('debtDate').value) || todayISO()
    };
    debts.push(d);
    saveAll();
    const form = q('debtForm'); if (form) form.reset();
    if (q('debtDate')) q('debtDate').value = todayISO();
    updateDebtList(); updateBalance(); updateSummary();
    alert('Hutang berhasil disimpan!');
  }

  // --- Balance & lists ---
  function updateBalance() {
    let totalIncome = 0, totalExpense = 0, cashBalance = 0, digitalBalance = 0, totalDebt = 0;
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.payment === 'cash') cashBalance += t.amount; else digitalBalance += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        if (t.payment === 'cash') cashBalance -= t.amount; else digitalBalance -= t.amount;
      } else if (t.type === 'transfer') {
        if (t.from === 'cash') { cashBalance -= t.amount; digitalBalance += t.amount; }
        else { digitalBalance -= t.amount; cashBalance += t.amount; }
      }
    });
    debts.forEach(d => totalDebt += d.amount);

    safeText('totalBalance', 'Rp ' + (cashBalance + digitalBalance - totalDebt).toLocaleString('id-ID'));
    safeText('cashBalance', 'Rp ' + cashBalance.toLocaleString('id-ID'));
    safeText('digitalBalance', 'Rp ' + digitalBalance.toLocaleString('id-ID'));
    safeText('totalDebt', 'Rp ' + totalDebt.toLocaleString('id-ID'));
  }

  function updateTransactionList() {
    const list = q('transactionList');
    if (!list) return;
    list.innerHTML = '';

    const items = getFilteredTransactions().slice().reverse();
    if (items.length === 0) {
      list.innerHTML = '<div class="empty">Belum ada transaksi</div>';
      return;
    }

    items.forEach(t => {
      const item = document.createElement('div'); item.className = 'transaction-item';
      const info = document.createElement('div'); info.className = 'transaction-info';
      const desc = document.createElement('div'); desc.className = 'transaction-description';
      desc.textContent = t.type === 'transfer' ? '🔄 ' + t.description : `${t.description || '-'} (${t.category || 'Lainnya'})`;
      const date = document.createElement('div'); date.className = 'transaction-date';
      date.textContent = `${t.date} ${t.payment ? ' | ' + t.payment : ''}`;
      info.appendChild(desc); info.appendChild(date);

      const amount = document.createElement('div');
      amount.className = 'transaction-amount ' + (t.type === 'income' ? 'income' : t.type === 'expense' ? 'expense' : 'transfer');
      if (t.type === 'transfer') amount.textContent = 'Rp ' + t.amount.toLocaleString('id-ID');
      else amount.textContent = (t.type === 'income' ? '+ ' : '- ') + 'Rp ' + t.amount.toLocaleString('id-ID');

      const actions = document.createElement('div'); actions.className = 'transaction-actions';
      const editBtn = document.createElement('button'); editBtn.className = 'btn-small'; editBtn.textContent = '✏️ Edit';
      editBtn.onclick = () => editTransaction(t.id);
      const delBtn = document.createElement('button'); delBtn.className = 'btn-small danger'; delBtn.textContent = '🗑️ Hapus';
      delBtn.onclick = () => deleteTransaction(t.id);
      actions.appendChild(editBtn); actions.appendChild(delBtn);

      item.appendChild(info); item.appendChild(amount); item.appendChild(actions);
      list.appendChild(item);
    });
  }

  function editTransaction(id) {
    const tx = transactions.find(x => x.id === id);
    if (!tx) return alert('Transaksi tidak ditemukan');
    if (q('transactionType')) q('transactionType').value = tx.type;
    updateCategoryOptions();
    if (q('transactionAmount')) q('transactionAmount').value = tx.amount;
    if (q('transactionDescription')) q('transactionDescription').value = tx.description || '';
    if (q('transactionCategory')) q('transactionCategory').value = tx.category || '';
    if (q('transactionPayment')) q('transactionPayment').value = tx.payment || '';
    if (q('transactionDate')) q('transactionDate').value = tx.date || todayISO();

    transactions = transactions.filter(t => t.id !== id);
    saveAll();
    updateBalance(); updateTransactionList(); updateDailyView(); updateSummary(); updateCategorySummary();
    alert("Silakan edit data transaksi lalu klik 'Simpan Transaksi'");
  }

  function deleteTransaction(id) {
    if (!confirm('Yakin mau hapus transaksi ini?')) return;
    transactions = transactions.filter(t => t.id !== id);
    saveAll();
    updateBalance(); updateTransactionList(); updateDailyView(); updateSummary(); updateCategorySummary();
  }

  // --- Debt list ---
  function updateDebtList() {
    const list = q('debtList'); if (!list) return;
    list.innerHTML = '';
    if (debts.length === 0) { list.innerHTML = '<div class="empty">Belum ada hutang</div>'; return; }
    debts.slice().reverse().forEach(d => {
      const item = document.createElement('div'); item.className = 'debt-item';
      const info = document.createElement('div'); info.className = 'debt-info';
      const name = document.createElement('div'); name.className = 'debt-name'; name.textContent = `${d.name} - ${d.description || '-'}`;
      const date = document.createElement('div'); date.className = 'debt-date'; date.textContent = d.date;
      info.appendChild(name); info.appendChild(date);
      const amount = document.createElement('div'); amount.className = 'debt-amount'; amount.textContent = 'Rp ' + d.amount.toLocaleString('id-ID');

      const actions = document.createElement('div'); actions.className = 'debt-actions';
      const payBtn = document.createElement('button'); payBtn.className = 'btn-small'; payBtn.textContent = 'Lunas';
      payBtn.onclick = () => { if (confirm('Tandai hutang sebagai lunas?')) { debts = debts.filter(x => x.id !== d.id); saveAll(); updateDebtList(); updateBalance(); updateSummary(); } };
      const editBtn = document.createElement('button'); editBtn.className = 'btn-small'; editBtn.textContent = '✏️ Edit';
      editBtn.onclick = () => editDebt(d.id);
      const delBtn = document.createElement('button'); delBtn.className = 'btn-small danger'; delBtn.textContent = '🗑️ Hapus';
      delBtn.onclick = () => deleteDebt(d.id);
      actions.appendChild(payBtn); actions.appendChild(editBtn); actions.appendChild(delBtn);

      item.appendChild(info); item.appendChild(amount); item.appendChild(actions);
      list.appendChild(item);
    });
  }

  function editDebt(id) {
    const d = debts.find(x => x.id === id);
    if (!d) return alert('Hutang tidak ditemukan');
    if (q('debtName')) q('debtName').value = d.name;
    if (q('debtAmount')) q('debtAmount').value = d.amount;
    if (q('debtDescription')) q('debtDescription').value = d.description;
    if (q('debtDate')) q('debtDate').value = d.date;
    debts = debts.filter(x => x.id !== id);
    saveAll();
    updateDebtList(); updateBalance(); updateSummary();
    alert("Silakan edit data hutang lalu klik 'Simpan Hutang'");
  }

  function deleteDebt(id) {
    if (!confirm('Yakin mau hapus hutang ini?')) return;
    debts = debts.filter(d => d.id !== id);
    saveAll();
    updateDebtList(); updateBalance(); updateSummary();
  }

  // --- Daily view ---
  function updateDailyView() {
    const dateElem = q('dailyDate'); if (!dateElem) return;
    const date = dateElem.value;
    const daily = transactions.filter(t => t.date === date);
    const list = q('dailyTransactionList'); if (!list) return;
    list.innerHTML = '';
    let income = 0, expense = 0;
    daily.forEach(t => {
      const item = document.createElement('div'); item.className = 'transaction-item';
      const info = document.createElement('div'); info.className = 'transaction-info';
      const desc = document.createElement('div'); desc.className = 'transaction-description';
      desc.textContent = t.type === 'transfer' ? '🔄 ' + t.description : `${t.description || '-'} (${t.category || 'Lainnya'})`;
      const d = document.createElement('div'); d.className = 'transaction-date'; d.textContent = `${t.date} ${t.payment ? ' | ' + t.payment : ''}`;
      info.appendChild(desc); info.appendChild(d);
      const amount = document.createElement('div'); amount.className = 'transaction-amount ' + (t.type === 'income' ? 'income' : 'expense');
      if (t.type === 'income') { amount.textContent = '+ Rp ' + t.amount.toLocaleString('id-ID'); income += t.amount; }
      else if (t.type === 'expense') { amount.textContent = '- Rp ' + t.amount.toLocaleString('id-ID'); expense += t.amount; }
      else amount.textContent = 'Rp ' + t.amount.toLocaleString('id-ID');
      item.appendChild(info); item.appendChild(amount);
      list.appendChild(item);
    });
    safeText('dailyIncome', 'Rp ' + income.toLocaleString('id-ID'));
    safeText('dailyExpense', 'Rp ' + expense.toLocaleString('id-ID'));
    safeText('dailyBalance', 'Rp ' + (income - expense).toLocaleString('id-ID'));
  }

  // --- Summary & Charts ---
  function updateSummary() {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23,59,59,999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); endOfMonth.setHours(23,59,59,999);

    let weekIncome = 0, weekExpense = 0, monthIncome = 0, monthExpense = 0;
    const weekLabels = []; const weekNet = [];
    for (let i=0;i<7;i++){ const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); weekLabels.push(d.toLocaleDateString('id-ID', {weekday:'short'})); weekNet.push(0); }
    const daysInMonth = endOfMonth.getDate(); const monthLabels = Array.from({length: daysInMonth}, (_,i)=>String(i+1)); const monthNet = new Array(daysInMonth).fill(0);

    transactions.forEach(t => {
      if (!t.date) return;
      const tDate = dateOnly(t.date);
      if (tDate >= startOfWeek && tDate <= endOfWeek) {
        if (t.type === 'income') weekIncome += t.amount;
        else if (t.type === 'expense') weekExpense += t.amount;
        const idx = Math.floor((tDate - startOfWeek) / (1000*60*60*24));
        if (idx >= 0 && idx < 7) weekNet[idx] += t.type === 'income' ? t.amount : -t.amount;
      }
      const tTime = new Date(t.date);
      if (tTime >= startOfMonth && tTime <= endOfMonth) {
        if (t.type === 'income') monthIncome += t.amount;
        else if (t.type === 'expense') monthExpense += t.amount;
        const idx = tTime.getDate() - 1;
        if (idx >= 0 && idx < daysInMonth) monthNet[idx] += t.type === 'income' ? t.amount : -t.amount;
      }
    });

    safeText('weekIncome','Rp ' + weekIncome.toLocaleString('id-ID'));
    safeText('weekExpense','Rp ' + weekExpense.toLocaleString('id-ID'));
    safeText('weekBalance','Rp ' + (weekIncome - weekExpense).toLocaleString('id-ID'));
    safeText('monthIncome','Rp ' + monthIncome.toLocaleString('id-ID'));
    safeText('monthExpense','Rp ' + monthExpense.toLocaleString('id-ID'));
    safeText('monthBalance','Rp ' + (monthIncome - monthExpense).toLocaleString('id-ID'));

    // Weekly chart
    const weeklyCanvas = q('weeklyChart');
    if (weeklyCanvas) {
      if (weeklyChartInstance) weeklyChartInstance.destroy();
      weeklyChartInstance = new Chart(weeklyCanvas.getContext('2d'), {
        type: 'bar',
        data: { labels: weekLabels, datasets: [{ label:'Net per hari (Rp)', data: weekNet.map(n=>Math.round(n)) }] },
        options: { responsive:true, plugins:{ legend:{display:false}, tooltip:{callbacks:{label: ctx => 'Rp ' + Number(ctx.raw).toLocaleString('id-ID') }}}}
      });
    }

    const monthlyCanvas = q('monthlyChart');
    if (monthlyCanvas) {
      if (monthlyChartInstance) monthlyChartInstance.destroy();
      monthlyChartInstance = new Chart(monthlyCanvas.getContext('2d'), {
        type: 'bar',
        data: { labels: monthLabels, datasets: [{ label:'Net per hari (Rp)', data: monthNet.map(n=>Math.round(n)) }] },
        options: { responsive:true, plugins:{ legend:{display:false}, tooltip:{callbacks:{label: ctx => 'Rp ' + Number(ctx.raw).toLocaleString('id-ID') }}}}
      });
    }

    // Yearly summary/chart updated elsewhere when requested
  }

  function updateYearlySummary() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    let yearIncome = 0, yearExpense = 0;
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const monthlyData = new Array(12).fill(0);

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === now.getFullYear()) {
        const m = tDate.getMonth();
        if (t.type === 'income') monthlyData[m] += t.amount;
        else if (t.type === 'expense') monthlyData[m] -= t.amount;
        if (t.type === 'income') yearIncome += t.amount;
        else if (t.type === 'expense') yearExpense += t.amount;
      }
    });

    safeText('yearIncome','Rp ' + yearIncome.toLocaleString('id-ID'));
    safeText('yearExpense','Rp ' + yearExpense.toLocaleString('id-ID'));
    safeText('yearBalance','Rp ' + (yearIncome - yearExpense).toLocaleString('id-ID'));

    const canvas = q('yearlyChart');
    if (canvas) {
      if (yearlyChartInstance) yearlyChartInstance.destroy();
      yearlyChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: months, datasets: [{ label:'Net per bulan (Rp)', data: monthlyData.map(n=>Math.round(n)), fill:true }] },
        options: { responsive:true, plugins:{legend:{display:false}, tooltip:{callbacks:{label: ctx => 'Rp ' + Number(ctx.raw).toLocaleString('id-ID') }}}}
      });
    }
  }

  // --- Category summary & chart ---
  function updateCategorySummary() {
    const container = q('categorySummary'); if (!container) return;
    const categoryData = {};
    transactions.forEach(t => {
      if (t.type === 'transfer') return;
      const cat = t.category || 'Lainnya';
      if (!categoryData[cat]) categoryData[cat] = { income:0, expense:0 };
      if (t.type === 'income') categoryData[cat].income += t.amount;
      else if (t.type === 'expense') categoryData[cat].expense += t.amount;
    });

    container.innerHTML = '';
    const keys = Object.keys(categoryData);
    if (keys.length === 0) { container.innerHTML = '<div class="empty">Belum ada kategori</div>'; return; }

    const maxAmount = Math.max(...keys.map(k => categoryData[k].income + categoryData[k].expense));

    keys.forEach(k => {
      const d = categoryData[k];
      const net = d.income - d.expense;
      const total = d.income + d.expense;
      const pct = maxAmount > 0 ? (total / maxAmount) * 100 : 0;
      const item = document.createElement('div'); item.className = 'category-item';
      item.innerHTML = `
        <div class="category-header">
          <div class="category-name">${k}</div>
          <div class="category-amount ${net >= 0 ? 'income' : 'expense'}">${net >=0 ? '+' : ''}Rp ${net.toLocaleString('id-ID')}</div>
        </div>
        <div class="category-details">
          <div style="display:flex;justify-content:space-between;font-size:.85rem;color:var(--text-secondary);margin-bottom:.5rem;">
            <span>Pemasukan: Rp ${d.income.toLocaleString('id-ID')}</span>
            <span>Pengeluaran: Rp ${d.expense.toLocaleString('id-ID')}</span>
          </div>
          <div class="category-progress"><div class="category-progress-bar" style="width:${pct}%"></div></div>
        </div>
      `;
      container.appendChild(item);
    });

    updateCategoryChart(categoryData);
  }

  function updateCategoryChart(categoryData) {
    const canvas = q('categoryChart'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();
    const labels = Object.keys(categoryData);
    const expenseData = labels.map(l => categoryData[l].expense);
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: expenseData }] },
      options: { responsive:true, plugins:{legend:{position:'bottom'}} }
    });
  }

  // --- Budget management ---
  function calculateCategorySpending(category, period) {
    const now = new Date();
    let startDate, endDate;
    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); endDate.setHours(23,59,59,999);
    } else {
      const day = now.getDay(); const start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0,0,0,0);
      startDate = start; endDate = new Date(start); endDate.setDate(start.getDate() + 6); endDate.setHours(23,59,59,999);
    }
    return transactions.filter(t => t.type === 'expense' && t.category === category && new Date(t.date) >= startDate && new Date(t.date) <= endDate).reduce((s,tx) => s + tx.amount, 0);
  }

  function updateBudgetTargets() {
    const container = q('budgetTargets'); if (!container) return;
    container.innerHTML = '';
    if (budgetTargets.length === 0) { container.innerHTML = '<div class="empty">Belum ada target anggaran</div>'; return; }
    budgetTargets.forEach(b => {
      const spent = calculateCategorySpending(b.category, b.period);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const over = spent > b.amount;
      const item = document.createElement('div'); item.className = 'budget-item';
      item.innerHTML = `
        <div class="budget-header">
          <div class="budget-category">${b.category}</div>
          <div class="budget-actions">
            <button class="btn-small" data-edit="${b.id}">Edit</button>
            <button class="btn-small danger" data-del="${b.id}">Hapus</button>
          </div>
        </div>
        <div class="budget-progress">
          <div class="budget-amounts"><span>Rp ${spent.toLocaleString('id-ID')}</span><span>Rp ${b.amount.toLocaleString('id-ID')}</span></div>
          <div class="budget-bar"><div class="budget-bar-fill" style="width:${Math.min(pct,100)}%"></div></div>
          <div style="text-align:center;margin-top:.5rem;font-size:.85rem;color:var(--text-secondary)">${pct.toFixed(1)}% dari target ${b.period === 'monthly' ? 'bulanan' : 'mingguan'}</div>
        </div>
      `;
      container.appendChild(item);
      const editBtn = item.querySelector('[data-edit]'); if (editBtn) editBtn.onclick = () => editBudget(b.id);
      const delBtn = item.querySelector('[data-del]'); if (delBtn) delBtn.onclick = () => deleteBudget(b.id);
    });
  }

  function showAddBudgetModal() { const modal = q('budgetModal'); if (modal) modal.classList.add('show'); }
  function closeBudgetModal() { const modal = q('budgetModal'); if (modal) modal.classList.remove('show'); const form = q('budgetForm'); if (form) form.reset(); }

  function handleBudgetSubmit(e) {
    if (e) e.preventDefault();
    const cat = q('budgetCategory') ? q('budgetCategory').value : '';
    const amount = parseFloat(q('budgetAmount') ? q('budgetAmount').value : '0');
    const period = q('budgetPeriod') ? q('budgetPeriod').value : 'monthly';
    if (!cat || isNaN(amount) || amount <= 0) { alert('Lengkapi data target anggaran'); return; }
    const budget = { id: Date.now(), category: cat, amount, period };
    budgetTargets.push(budget);
    saveAll();
    closeBudgetModal();
    updateBudgetTargets();
    alert('Target anggaran berhasil disimpan!');
  }

  function editBudget(id) {
    const b = budgetTargets.find(x => x.id == id);
    if (!b) return alert('Target tidak ditemukan');
    if (q('budgetCategory')) q('budgetCategory').value = b.category;
    if (q('budgetAmount')) q('budgetAmount').value = b.amount;
    if (q('budgetPeriod')) q('budgetPeriod').value = b.period;
    budgetTargets = budgetTargets.filter(x => x.id != id);
    saveAll();
    showAddBudgetModal();
  }

  function deleteBudget(id) {
    if (!confirm('Yakin mau hapus target anggaran ini?')) return;
    budgetTargets = budgetTargets.filter(x => x.id != id);
    saveAll();
    updateBudgetTargets();
  }

  // --- Tabs ---
  function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    if (tab === 'transaction') { const el = document.querySelector('.tab[data-tab="transaction"]'); if (el) el.classList.add('active'); if (q('transactionTab')) q('transactionTab').classList.remove('hidden'); }
    else if (tab === 'debt') { const el = document.querySelector('.tab[data-tab="debt"]'); if (el) el.classList.add('active'); if (q('debtTab')) q('debtTab').classList.remove('hidden'); }
    else if (tab === 'daily') { const el = document.querySelector('.tab[data-tab="daily"]'); if (el) el.classList.add('active'); if (q('dailyTab')) q('dailyTab').classList.remove('hidden'); }
    else if (tab === 'summary') { const el = document.querySelector('.tab[data-tab="summary"]'); if (el) el.classList.add('active'); if (q('summaryTab')) q('summaryTab').classList.remove('hidden'); updateSummary(); }
    else if (tab === 'categories') { const el = document.querySelector('.tab[data-tab="categories"]'); if (el) el.classList.add('active'); if (q('categoriesTab')) q('categoriesTab').classList.remove('hidden'); updateCategorySummary(); updateBudgetTargets(); }
  }

  // --- Init on DOM ready ---
  document.addEventListener('DOMContentLoaded', () => {
    // default dates
    if (q('transactionDate')) q('transactionDate').value = todayISO();
    if (q('debtDate')) q('debtDate').value = todayISO();
    if (q('dailyDate')) q('dailyDate').value = todayISO();

    initializeTheme();
    initializeFilters();
    updateCategoryOptions();
    updateBalance();
    updateTransactionList();
    updateDebtList();
    updateDailyView();
    updateSummary();
    updateCategorySummary();
    updateBudgetTargets();

    // listeners (safe attach)
    const tType = q('transactionType'); if (tType) tType.addEventListener('change', updateCategoryOptions);
    const tForm = q('transactionForm'); if (tForm) tForm.addEventListener('submit', handleTransactionSubmit);
    const transferForm = q('transferForm'); if (transferForm) transferForm.addEventListener('submit', handleTransfer);
    const debtForm = q('debtForm'); if (debtForm) debtForm.addEventListener('submit', handleDebtSubmit);
    const budgetForm = q('budgetForm'); if (budgetForm) budgetForm.addEventListener('submit', handleBudgetSubmit);

    const searchInput = q('searchInput'); if (searchInput) searchInput.addEventListener('input', handleSearchInput);
    const clearBtn = q('clearSearch'); if (clearBtn) clearBtn.addEventListener('click', clearSearch);
    const applyBtn = q('applyFilter'); if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    const clearFilterBtn = q('clearFilter'); if (clearFilterBtn) clearFilterBtn.addEventListener('click', clearFilters);
    const themeToggle = q('themeToggle'); if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // tab clicks
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (ev) => {
        const t = tab.dataset.tab;
        if (t) showTab(t);
      });
    });

    // daily date change
    const dailyDate = q('dailyDate'); if (dailyDate) dailyDate.addEventListener('change', updateDailyView);
  });

  // expose some functions for console/debug (optional)
  window.appFinance = {
    transactions, debts, budgetTargets,
    addTransaction: handleTransactionSubmit,
    addDebt: handleDebtSubmit,
    addBudget: handleBudgetSubmit,
    updateSummary, updateYearlySummary, updateCategorySummary, updateBudgetTargets
  };
})();
