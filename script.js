let transactions = JSON.parse(localStorage.getItem('transactions'))||[];
let debts = JSON.parse(localStorage.getItem('debts'))||[];
let budgetTargets = JSON.parse(localStorage.getItem('budgetTargets'))||[];
const incomeCategories=['Gaji','Bonus','Investasi','Usaha','Lainnya'];
const expenseCategories=['Makanan','Transportasi','Hiburan','Tagihan','Belanja','Kesehatan','Pendidikan','Lainnya'];

let weeklyChartInstance = null;
let monthlyChartInstance = null;
let yearlyChartInstance = null;
let categoryChartInstance = null;

// Filter state
let currentFilters = {
  search: '',
  category: '',
  type: '',
  dateFrom: '',
  dateTo: ''
};
document.addEventListener('DOMContentLoaded',()=>{
  const today=new Date().toISOString().split('T')[0];
  // safety: beberapa elemen mungkin belum ada di html sementara
  if(document.getElementById('transactionDate')) document.getElementById('transactionDate').value=today;
  if(document.getElementById('debtDate')) document.getElementById('debtDate').value=today;
  if(document.getElementById('dailyDate')) document.getElementById('dailyDate').value=today;

  // Initialize theme
  initializeTheme();
  
  // Initialize filters
  initializeFilters();
  
  updateCategoryOptions();
  updateBalance();
  updateTransactionList();
  updateDebtList();
  updateDailyView();
  updateSummary();
  updateCategorySummary();
  updateBudgetTargets();

  // event listeners (cek keberadaan elemen terlebih dahulu)
  if(document.getElementById('transactionType')) document.getElementById('transactionType').addEventListener('change',updateCategoryOptions);
  if(document.getElementById('transactionForm')) document.getElementById('transactionForm').addEventListener('submit',handleTransactionSubmit);
  if(document.getElementById('debtForm')) document.getElementById('debtForm').addEventListener('submit',handleDebtSubmit);
  if(document.getElementById('transferForm')) document.getElementById('transferForm').addEventListener('submit',handleTransfer);
  if(document.getElementById('budgetForm')) document.getElementById('budgetForm').addEventListener('submit',handleBudgetSubmit);
  
  // Search and filter listeners
  if(document.getElementById('searchInput')) {
    document.getElementById('searchInput').addEventListener('input', handleSearch);
  }
  if(document.getElementById('clearSearch')) {
    document.getElementById('clearSearch').addEventListener('click', clearSearch);
  }
  if(document.getElementById('applyFilter')) {
    document.getElementById('applyFilter').addEventListener('click', applyFilters);
  }
  if(document.getElementById('clearFilter')) {
    document.getElementById('clearFilter').addEventListener('click', clearFilters);
  }
  if(document.getElementById('themeToggle')) {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  }
});handleTransfer);
});

function updateCategoryOptions(){
  const type=document.getElementById('transactionType').value;
  const catSelect=document.getElementById('transactionCategory');
  const categories=type==='income'?incomeCategories:expenseCategories;
  catSelect.innerHTML='<option value="">Pilih Kategori</option>';
  categories.forEach(c=>{ catSelect.innerHTML+=`<option value="${c}">${c}</option>`; });
}

function handleTransactionSubmit(e){
  e.preventDefault();
  const amountRaw=document.getElementById('transactionAmount').value;
  const amount = parseFloat(amountRaw);
  if(isNaN(amount) || amount <= 0){ alert('Jumlah harus lebih dari 0'); return; }

  const transaction={
    id:Date.now(),
    type:document.getElementById('transactionType').value,
    amount:amount,
    description:document.getElementById('transactionDescription').value,
    category:document.getElementById('transactionCategory').value,
    payment:document.getElementById('transactionPayment').value,
    date:document.getElementById('transactionDate').value
  };
  transactions.push(transaction);
  localStorage.setItem('transactions',JSON.stringify(transactions));
  document.getElementById('transactionForm').reset();
  document.getElementById('transactionDate').value=new Date().toISOString().split('T')[0];
  updateBalance(); updateTransactionList(); updateDailyView(); updateSummary(); updateCategorySummary();
  alert('Transaksi berhasil disimpan!');'Transaksi berhasil disimpan!');
}

function handleTransfer(e){
  e.preventDefault();
  const from=document.getElementById('transferFrom').value;
  const to=document.getElementById('transferTo').value;
  const amount=parseFloat(document.getElementById('transferAmount').value);
  if(from===to){ alert("Tidak bisa transfer ke saldo yang sama!"); return; }
  if(isNaN(amount)||amount<=0){ alert("Jumlah tidak valid!"); return; }
  const transfer={
    id:Date.now(), type:'transfer', from,to, amount,
    description:`Transfer ${from} → ${to}`,
    date:new Date().toISOString().split('T')[0]
  };
  transactions.push(transfer);
  localStorage.setItem('transactions',JSON.stringify(transactions));
  do  updateBalance(); updateTransactionList(); updateDailyView(); updateSummary(); updateCategorySummary();
  alert('Transfer berhasil disimpan!');mmary();
  alert('Transfer berhasil disimpan!');
}

function handleDebtSubmit(e){
  e.preventDefault();
  const amount = parseFloat(document.getElementById('debtAmount').value);
  if(isNaN(amount) || amount <= 0){ alert('Jumlah hutang harus lebih dari 0'); return; }

  const debt={
    id:Date.now(),
    name:document.getElementById('debtName').value,
    amount:amount,
    description:document.getElementById('debtDescription').value,
    date:document.getElementById('debtDate').value
  };
  debts.push(debt);
  localStorage.setItem('debts',JSON.stringify(debts));
  document.getElementById('debtForm').reset();
  document.getElem  updateDebtList(); updateBalance(); updateSummary(); updateCategorySummary();
  alert('Hutang berhasil disimpan!');teBalance(); updateSummary();
  alert('Hutang berhasil disimpan!');
}

function updateBalance(){
  let totalIncome=0,totalExpense=0,cashBalance=0,digitalBalance=0,totalDebt=0;
  transactions.forEach(t=>{
    if(t.type==='income'){
      totalIncome+=t.amount;
      if(t.payment==='cash'){cashBalance+=t.amount;}else{digitalBalance+=t.amount;}
    }else if(t.type==='expense'){
      totalExpense+=t.amount;
      if(t.payment==='cash'){cashBalance-=t.amount;}else{digitalBalance-=t.amount;}
    }else if(t.type==='transfer'){
      if(t.from==='cash'){cashBalance-=t.amount; digitalBalance+=t.amount;}
      else{digitalBalance-=t.amount; cashBalance+=t.amount;}
    }
  });
  debts.forEach(d=>{totalDebt+=d.amount;});
  // cek elemen sebelum set
  if(document.getElementById('totalBalance')) document.getElementById('totalBalance').textContent='Rp '+(cashBalance+digitalBalance-totalDebt).toLocaleString('id-ID');
  if(document.getElementById('cashBalance')) document.getElementById('cashBalance').textContent='Rp '+cashBalance.toLocaleString('id-ID');
  if(document.getElementById('digitalBalance')) document.getElementById('digitalBalance').textContent='Rp '+digitalBalance.toLocaleString('id-ID');
  if(document.getElementById('totalDebt')) /* ---------------- TRANSAKSI ---------------- */
function updateTransactionList(){
  const list=document.getElementById('transactionList');
  if(!list) return;
  list.innerHTML='';
  
  const filteredTransactions = getFilteredTransactions();
  filteredTransactions.slice().reverse().forEach(t=>{tionList');
  if(!list) return;
  list.innerHTML='';
  transactions.slice().reverse().forEach(t=>{
    const item=document.createElement('div');
    item.className='transaction-item';

    const info=document.createElement('div');
    info.className='transaction-info';
    const desc=document.createElement('div');
    desc.className='transaction-description';
    if(t.type==='transfer'){ desc.textContent='🔄 '+t.description; }
    else{ desc.textContent=t.description+' ('+t.category+')'; }
    const date=document.createElement('div');
    date.className='transaction-date';
    date.textContent=t.date+' | '+(t.payment||'');
    info.appendChild(desc); info.appendChild(date);

    const amount=document.createElement('div');
    amount.className='transaction-amount '+(t.type==='income'?'income':t.type==='expense'?'expense':'transfer');
    if(t.type==='transfer'){ amount.textContent='Rp '+t.amount.toLocaleString('id-ID'); }
    else{ amount.textContent=(t.type==='income'?'+ ':'- ')+'Rp '+t.amount.toLocaleString('id-ID'); }

    const actions=document.createElement('div');
    actions.className='transaction-actions';
    const editBtn=document.createElement('button');
    editBtn.className='btn-small';
    editBtn.textContent='✏️ Edit';
    editBtn.onclick=()=>editTransaction(t.id);
    const deleteBtn=document.createElement('button');
    deleteBtn.className='btn-small danger';
    deleteBtn.textContent='🗑️ Hapus';
    deleteBtn.onclick=()=>deleteTransaction(t.id);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(amount);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function editTransaction(id){
  const tx=transactions.find(t=>t.id===id);
  if(!tx) return;
  document.getElementById('transactionType').value=tx.type;
  updateCategoryOptions();
  document.getElementById('transactionAmount').value=tx.amount;
  document.getElementById('transactionDescription').value=tx.description;
  document.getElementById('transactionCategory').value=tx.category;
  document.getElementById('transactionPayment').value=tx.payment;
  document.getElementById('transactionDate').value=tx.date;
  updateBalance(); updateTransactionList(); updateDailyView(); updateSummary(); updateCategorySummary();
  alert("Silakan edit data transaksi lalu klik 'Simpan Transaksi'");dateBalance(); updateTransactionList(); updateDailyView(); updateSummary();
  alert("Silakan edit data transaksi lalu klik 'Simpan Transaksi'");
}

function deleteTransaction(id){
  if(!confirm("Yakin mau hapus transaksi ini?")) return;
  transactions=transactions.filter(t=>t.id!==id);
  localStorage.setItem('transactions',JSON.stringify(transactions));
  updateBalance(); updateTransactionList(); updateDailyView(); updateSummary(); updateCategorySummary();
}

/* ---------------- HUTANG ---------------- */
function updateDebtList(){
  const list=document.getElementById('debtList');
  if(!list) return;
  list.innerHTML='';
  debts.slice().reverse().forEach(d=>{
    const item=document.createElement('div');
    item.className='debt-item';

    const info=document.createElement('div');
    info.className='debt-info';
    const name=document.createElement('div');
    name.className='debt-name';
    name.textContent=d.name+' - '+d.description;
    const date=document.createElement('div');
    date.className='debt-date'; date.textContent=d.date;
    info.appendChild(name); info.appendChild(date);

    const amount=document.createElement('div');
    amount.className='debt-amount'; amount.textContent='Rp '+d.amount.toLocaleString('id-ID');

    const actions=document.createElement('div');
    actions.className='debt-actions';
    const payBtn=document.createElement('button');
    payBtn.className='btn-small'; payBtn.textContent='Lunas';
    payBtn.onclick=()=>{ if(confirm('Tandai hutang sebagai lunas?')){ debts=debts.filter(x=>x.id!==d.id); localStorage.setItem('debts',JSON.stringify(debts)); updateDebtList(); updateBalance(); updateSummary(); }};
    const editBtn=document.createElement('button');
    editBtn.className='btn-small'; editBtn.textContent='✏️ Edit';
    editBtn.onclick=()=>editDebt(d.id);
    const deleteBtn=document.createElement('button');
    deleteBtn.className='btn-small danger'; deleteBtn.textContent='🗑️ Hapus';
    deleteBtn.onclick=()=>deleteDebt(d.id);
    actions.appendChild(payBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info); item.appendChild(amount); item.appendChild(actions);
    list.appendChild(item);
  });
}

function editDebt(id){
  const debt=debts.find(d=>d.id===id);
  if(!debt) return;
  document.getElementById('debtName').value=debt.name;
  document.getElementById('debtAmount').value=debt.amount;
  document.getElementById('debtDescription').value=debt.description;
  document.getElementById('debtDate').value=debt.date;
  debts=debts.filter(d=>d.id!==id);
  localStorage.setItem('debts',JSON.stringify(debts));
  updateDebtList(); updateBalance(); updateSummary();
  alert("Silakan edit data hutang lalu klik 'Simpan Hutang'");
}

function deleteDebt(id){
  if(!confirm("Yakin mau hapus hutang ini?")) return;
  debts=debts.filter(d=>d.id!==id);
  localStorage.setItem('debts',JSON.stringify(debts));
  updateDebtList(); updateBalance(); updateSummary();
}

/* ---------------- HARIAN ---------------- */
function updateDailyView(){
  const dateElem = document.getElementById('dailyDate');
  if(!dateElem) return;
  const date=dateElem.value;
  const dailyTrans=transactions.filter(t=>t.date===date);
  let dailyIncome=0,dailyExpense=0;
  const list=document.getElementById('dailyTransactionList');
  if(list) list.innerHTML='';
  dailyTrans.forEach(t=>{
    const item=document.createElement('div');
    item.className='transaction-item';
    const info=document.createElement('div');
    info.className='transaction-info';
    const desc=document.createElement('div');
    desc.className='transaction-description';
    if(t.type==='transfer'){ desc.textContent='🔄 '+t.description; }
    else{ desc.textContent=t.description+' ('+t.category+')'; }
    const d=document.createElement('div');
    d.className='transaction-date';
    d.textContent=t.date+' | '+(t.payment||'');
    info.appendChild(desc); info.appendChild(d);
    const amount=document.createElement('div');
    amount.className='transaction-amount '+(t.type==='income'?'income':t.type==='expense'?'expense':'transfer');
    if(t.type==='income'){ amount.textContent='+ Rp '+t.amount.toLocaleString('id-ID'); dailyIncome+=t.amount; }
    else if(t.type==='expense'){ amount.textContent='- Rp '+t.amount.toLocaleString('id-ID'); dailyExpense+=t.amount; }
    else{ amount.textContent='Rp '+t.amount.toLocaleString('id-ID'); }
    item.appendChild(info); item.appendChild(amount);
    if(list) list.appendChild(item);
  });
  if(document.getElementById('dailyIncome')) document.getElementById('dailyIncome').textContent='Rp '+dailyIncome.toLocaleString('id-ID');
  if(document.getElementById('dailyExpense')) document.getElementById('dailyExpense').textContent='Rp '+dailyExpense.toLocaleString('id-ID');
  if(document.getElementById('dailyBalance')) document.getElementById('dailyBalance').textContent='Rp '+(dailyIncome-dailyExpense).toLocaleString('id-ID');
}

/* ---------------- RINGKASAN MINGGUAN & BULANAN + GRAFIK ---------------- */

// helper: set 00:00 time for comparisons
function dateOnly(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }

function getStartOfWeek(date){
  // Senin = 1, Minggu = 7
  const d = new Date(date);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - (day - 1));
  start.setHours(0,0,0,0);
  return start;
}

function getEndOfWeek(startOfWeek){
  const end = new Date(startOfWeek);
  end.setDate(startOfWeek.getDate() + 6);
  end.setHours(23,59,59,999);
  return end;
}

function updateSummary(){
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(startOfWeek);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0);
  startOfMonth.setHours(0,0,0,0);
  endOfMonth.setHours(23,59,59,999);

  let weekIncome=0, weekExpense=0, monthIncome=0, monthExpense=0;

  // for charts: daily arrays
  const weekDays = []; // labels Mon..Sun
  const weekNetPerDay = []; // net income - expense per day
  for(let i=0;i<7;i++){
    const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate()+i);
    weekDays.push(d.toLocaleDateString('id-ID', { weekday: 'short' })); // Sen, Sel, ...
    weekNetPerDay.push(0);
  }

  const daysInMonth = endOfMonth.getDate();
  const monthLabels = [];
  const monthNetPerDay = new Array(daysInMonth).fill(0);
  for(let i=0;i<daysInMonth;i++){
    monthLabels.push(String(i+1));
  }

  transactions.forEach(t=>{
    if(!t.date) return;
    const tDate = dateOnly(t.date);
    // weekly
    if(tDate >= startOfWeek && tDate <= endOfWeek){
      if(t.type==='income') weekIncome+=t.amount;
      else if(t.type==='expense') weekExpense+=t.amount;
      // add to net per day
      const dayIndex = Math.floor((tDate - startOfWeek)/(1000*60*60*24));
      if(dayIndex >=0 && dayIndex < 7){
        if(t.type==='income') weekNetPerDay[dayIndex] += t.amount;
        else if(t.type==='expense') weekNetPerDay[dayIndex] -= t.amount;
      }
    }
    // monthly
    const tTime = new Date(t.date);
    if(tTime >= startOfMonth && tTime <= endOfMonth){
      if(t.type==='income') monthIncome+=t.amount;
      else if(t.type==='expense') monthExpense+=t.amount;
      const idx = tTime.getDate()-1;
      if(idx>=0 && idx < daysInMonth){
        if(t.type==='income') monthNetPerDay[idx] += t.amount;
        else if(t.type==='expense') monthNetPerDay[idx] -= t.amount;
      }
    }
  });

  // set text
  if(document.getElementById('weekIncome')) document.getElementById('weekIncome').textContent = 'Rp '+weekIncome.toLocaleString('id-ID');
  if(document.getElementById('weekExpense')) document.getElementById('weekExpense').textContent = 'Rp '+weekExpense.toLocaleString('id-ID');
  if(document.getElementById('weekBalance')) document.getElementById('weekBalance').textContent = 'Rp '+(weekIncome-weekExpense).toLocaleString('id-ID');

  if(document.getElementById('monthIncome')) document.getElementById('monthIncome').textContent = 'Rp '+monthIncome.toLocaleString('id-ID');
  if(document.getElementById('monthExpense')) document.getElementById('monthExpense').textContent = 'Rp '+monthExpense.toLocaleString('id-ID');
  if(document.getElementById('monthBalance')) document.getElementById('monthBalance').textContent = 'Rp '+(monthIncome-monthExpense).toLocaleString('id-ID');

  // update charts (if canvas ada)
  const weeklyCanvas = document.getElementById('weeklyChart');
  if(weeklyCanvas){
    // destroy previous if exists
    if(weeklyChartInstance) { weeklyChartInstance.destroy(); weeklyChartInstance = null; }
    weeklyChartInstance = new Chart(weeklyCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: weekDays,
        datasets: [
          {
            label: 'Net per hari (Rp)',
            data: weekNetPerDay.map(n=>Math.round(n)),
            // don't set colors explicitly (unless user asked). Chart.js uses defaults.
            backgroundColor: weekNetPerDay.map(n => n>=0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
            borderColor: weekNetPerDay.map(n => n>=0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => 'Rp ' + Number(ctx.raw).toLocaleString('id-ID') } }
        }
      }
    });
  }

  const monthlyCanvas = document.getElementById('monthlyChart');
  if(monthlyCanvas){
    if(monthlyChartInstance) { monthlyChartInstance.destroy(); monthlyChartInstance = null; }
    monthlyChartInstance = new Chart(monthlyCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: 'Net per hari (Rp)',
            data: monthNetPerDay.map(n=>Math.round(n)),
            backgroundColor: monthNetPerDay.map(n => n>=0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
            borderColor: monthNetPerDay.map(n => n>=0 ? 'rgba(75, 192, 19/* ---------------- THEME MANAGEMENT ---------------- */
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

/* ---------------- FILTER MANAGEMENT ---------------- */
function initializeFilters() {
  // Populate category filter
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    const allCategories = [...incomeCategories, ...expenseCategories];
    allCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
  }
  
  // Populate budget category select
  const budgetCategory = document.getElementById('budgetCategory');
  if (budgetCategory) {
    expenseCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      budgetCategory.appendChild(option);
    });
  }
}

function handleSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  
  if (searchInput) {
    currentFilters.search = searchInput.value;
    if (clearBtn) {
      clearBtn.style.display = searchInput.value ? 'block' : 'none';
    }
    updateTransactionList();
  }
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  
  if (searchInput) {
    searchInput.value = '';
    currentFilters.search = '';
    if (clearBtn) clearBtn.style.display = 'none';
    updateTransactionList();
  }
}

function applyFilters() {
  const categoryFilter = document.getElementById('categoryFilter');
  const typeFilter = document.getElementById('typeFilter');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  
  if (categoryFilter) currentFilters.category = categoryFilter.value;
  if (typeFilter) currentFilters.type = typeFilter.value;
  if (dateFrom) currentFilters.dateFrom = dateFrom.value;
  if (dateTo) currentFilters.dateTo = dateTo.value;
  
  updateTransactionList();
}

function clearFilters() {
  currentFilters = {
    search: '',
    category: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  };
  
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const typeFilter = document.getElementById('typeFilter');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  const clearBtn = document.getElementById('clearSearch');
  
  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = '';
  if (typeFilter) typeFilter.value = '';
  if (dateFrom) dateFrom.value = '';
  if (dateTo) dateTo.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  
  updateTransactionList();
}

function getFilteredTransactions() {
  return transactions.filter(transaction => {
    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                          transaction.category.toLowerCase().includes(searchTerm) ||
                          transaction.amount.toString().includes(searchTerm);
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (currentFilters.category && transaction.category !== currentFilters.category) {
      return false;
    }
    
    // Type filter
    if (currentFilters.type && transaction.type !== currentFilters.type) {
      return false;
    }
    
    // Date filters
    if (currentFilters.dateFrom && transaction.date < currentFilters.dateFrom) {
      return false;
    }
    if (currentFilters.dateTo && transaction.date > currentFilters.dateTo) {
      return false;
    }
    
    return true;
  });
}

/* ---------------- CATEGORY SUMMARY ---------------- */
function updateCategorySummary() {
  const container = document.getElementById('categorySummary');
  if (!container) return;
  
  const categoryData = {};
  
  // Calculate totals by category
  transactions.forEach(transaction => {
    if (transaction.type === 'transfer') return;
    
    const category = transaction.category || 'Lainnya';
    if (!categoryData[category]) {
      categoryData[category] = { income: 0, expense: 0 };
    }
    
    if (transaction.type === 'income') {
      categoryData[category].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      categoryData[category].expense += transaction.amount;
    }
  });
  
  // Create category items
  container.innerHTML = '';
  Object.keys(categoryData).forEach(category => {
    const data = categoryData[category];
    const netAmount = data.income - data.expense;
    const totalAmount = data.income + data.expense;
    const maxAmount = Math.max(...Object.values(categoryData).map(d => d.income + d.expense));
    const percentage = maxAmount > 0 ? (totalAmount / maxAmount) * 100 : 0;
    
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div class="category-header">
        <div class="category-name">${category}</div>
        <div class="category-amount ${netAmount >= 0 ? 'income' : 'expense'}">
          ${netAmount >= 0 ? '+' : ''}Rp ${netAmount.toLocaleString('id-ID')}
        </div>
      </div>
      <div class="category-details">
        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
          <span>Pemasukan: Rp ${data.income.toLocaleString('id-ID')}</span>
          <span>Pengeluaran: Rp ${data.expense.toLocaleString('id-ID')}</span>
        </div>
        <div class="category-progress">
          <div class="category-progress-bar" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
  
  // Update category chart
  updateCategoryChart(categoryData);
}

function updateCategoryChart(categoryData) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }
  
  const labels = Object.keys(categoryData);
  const incomeData = labels.map(cat => categoryData[cat].income);
  const expenseData = labels.map(cat => categoryData[cat].expense);
  
  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pengeluaran',
        data: expenseData,
        backgroundColor: [
          '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              return `${label}: Rp ${value.toLocaleString('id-ID')}`;
            }
          }
        }
      }
    }
  });
}

/* ---------------- BUDGET MANAGEMENT ---------------- */
function updateBudgetTargets() {
  const container = document.getElementById('budgetTargets');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (budgetTargets.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Belum ada target anggaran. Klik "Tambah Target Anggaran" untuk memulai.</p>';
    return;
  }
  
  budgetTargets.forEach(budget => {
    const spent = calculateCategorySpending(budget.category, budget.period);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const isOverBudget = spent > budget.amount;
    
    const item = document.createElement('div');
    item.className = 'budget-item';
    item.innerHTML = `
      <div class="budget-header">
        <div class="budget-category">${budget.category}</div>
        <div class="budget-actions">
          <button class="btn-small" onclick="editBudget('${budget.id}')">Edit</button>
          <button class="btn-small danger" onclick="deleteBudget('${budget.id}')">Hapus</button>
        </div>
      </div>
      <div class="budget-progress">
        <div class="budget-amounts">
          <span>Rp ${spent.toLocaleString('id-ID')}</span>
          <span>Rp ${budget.amount.toLocaleString('id-ID')}</span>
        </div>
        <div class="budget-bar">
          <div class="budget-bar-fill" style="width: ${Math.min(percentage, 100)}%; background: ${isOverBudget ? 'var(--danger-color)' : percentage > 80 ? 'var(--warning-color)' : 'var(--success-color)'}"></div>
        </div>
        <div style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
          ${percentage.toFixed(1)}% dari target ${budget.period === 'monthly' ? 'bulanan' : 'mingguan'}
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

function calculateCategorySpending(category, period) {
  const now = new Date();
  let startDate, endDate;
  
  if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else { // weekly
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    endDate = new Date(startOfWeek);
    endDate.setDate(startOfWeek.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    startDate = startOfWeek;
  }
  
  return transactions
    .filter(t => t.type === 'expense' && 
                t.category === category && 
                new Date(t.date) >= startDate && 
                new Date(t.date) <= endDate)
    .reduce((sum, t) => sum + t.amount, 0);
}

function showAddBudgetModal() {
  const modal = document.getElementById('budgetModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeBudgetModal() {
  const modal = document.getElementById('budgetModal');
  if (modal) {
    modal.classList.remove('show');
    document.getElementById('budgetForm').reset();
  }
}

function handleBudgetSubmit(e) {
  e.preventDefault();
  
  const budget = {
    id: Date.now(),
    category: document.getElementById('budgetCategory').value,
    amount: parseFloat(document.getElementById('budgetAmount').value),
    period: document.getElementById('budgetPeriod').value
  };
  
  budgetTargets.push(budget);
  localStorage.setItem('budgetTargets', JSON.stringify(budgetTargets));
  
  closeBudgetModal();
  updateBudgetTargets();
  alert('Target anggaran berhasil disimpan!');
}

function editBudget(id) {
  const budget = budgetTargets.find(b => b.id == id);
  if (!budget) return;
  
  document.getElementById('budgetCategory').value = budget.category;
  document.getElementById('budgetAmount').value = budget.amount;
  document.getElementById('budgetPeriod').value = budget.period;
  
  showAddBudgetModal();
  
  // Remove the old budget
  budgetTargets = budgetTargets.filter(b => b.id != id);
  localStorage.setItem('budgetTargets', JSON.stringify(budgetTargets));
}

function deleteBudget(id) {
  if (!confirm('Yakin mau hapus target anggaran ini?')) return;
  
  budgetTargets = budgetTargets.filter(b => b.id != id);
  localStorage.setItem('budgetTargets', JSON.stringify(budgetTargets));
  updateBudgetTargets();
}

/* ---------------- SUMMARY TABS ---------------- */
function showSummaryTab(period) {
  // Update tab buttons
  document.querySelectorAll('.summary-tab').forEach(tab => tab.classList.remove('active'));
  event.target.closest('.summary-tab').classList.add('active');
  
  // Show/hide content
  document.querySelectorAll('.summary-content').forEach(content => content.classList.add('hidden'));
  document.getElementById(period + 'Summary').classList.remove('hidden');
  
  // Update data if needed
  if (period === 'yearly') {
    updateYearlySummary();
  }
}

function updateYearlySummary() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  
  let yearIncome = 0, yearExpense = 0;
  
  transactions.forEach(t => {
    const tDate = new Date(t.date);
    if (tDate >= startOfYear && tDate <= endOfYear) {
      if (t.type === 'income') yearIncome += t.amount;
      else if (t.type === 'expense') yearExpense += t.amount;
    }
  });
  
  if (document.getElementById('yearIncome')) document.getElementById('yearIncome').textContent = 'Rp ' + yearIncome.toLocaleString('id-ID');
  if (document.getElementById('yearExpense')) document.getElementById('yearExpense').textContent = 'Rp ' + yearExpense.toLocaleString('id-ID');
  if (document.getElementById('yearBalance')) document.getElementById('yearBalance').textContent = 'Rp ' + (yearIncome - yearExpense).toLocaleString('id-ID');
  
  // Update yearly chart
  updateYearlyChart();
}

function updateYearlyChart() {
  const canvas = document.getElementById('yearlyChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (yearlyChartInstance) {
    yearlyChartInstance.destroy();
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = new Array(12).fill(0);
  
  transactions.forEach(t => {
    const tDate = new Date(t.date);
    if (tDate.getFullYear() === new Date().getFullYear()) {
      const month = tDate.getMonth();
      if (t.type === 'income') monthlyData[month] += t.amount;
      else if (t.type === 'expense') monthlyData[month] -= t.amount;
    }
  });
  
  yearlyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Net per bulan (Rp)',
        data: monthlyData.map(n => Math.round(n)),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => 'Rp ' + Number(ctx.raw).toLocaleString('id-ID')
          }
        }
      }
    }
  });
}

/* ---------------- TAB ---------------- */
function showTab(tab){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.add('hidden'));
  if(tab==='transaction'){ document.querySelector('.tab:nth-child(1)').classList.add('active'); if(document.getElementById('transactionTab')) document.getElementById('transactionTab').classList.remove('hidden'); }
  else if(tab==='debt'){ document.querySelector('.tab:nth-child(2)').classList.add('active'); if(document.getElementById('debtTab')) document.getElementById('debtTab').classList.remove('hidden'); }
  else if(tab==='daily'){ document.querySelector('.tab:nth-child(3)').classList.add('active'); if(document.getElementById('dailyTab')) document.getElementById('dailyTab').classList.remove('hidden'); }
  else if(tab==='summary'){
    document.querySelector('.tab:nth-child(4)').classList.add('active');
    if(document.getElementById('summaryTab')) document.getElementById('summaryTab').classList.remove('hidden');
    updateSummary();
  }
  else if(tab==='categories'){
    document.querySelector('.tab:nth-child(5)').classList.add('active');
    if(document.getElementById('categoriesTab')) document.getElementById('categoriesTab').classList.remove('hidden');
    updateCategorySummary();
    updateBudgetTargets();
  }
}.remove('hidden'); }
  else if(tab==='summary'){
    // show summary tab (assume it's 4th)
    const tabElem = document.querySelector('.tab:nth-child(4)');
    if(tabElem) tabElem.classList.add('active');
    if(document.getElementById('summaryTab')) document.getElementById('summaryTab').classList.remove('hidden');
    // ketika membuka ringkasan, pastikan grafik & ringkasan ter-update
    updateSummary();
  }
}
