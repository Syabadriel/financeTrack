let transactions = JSON.parse(localStorage.getItem('transactions'))||[];
let debts = JSON.parse(localStorage.getItem('debts'))||[];
const incomeCategories=['Gaji','Bonus','Investasi','Usaha','Lainnya'];
const expenseCategories=['Makanan','Transportasi','Hiburan','Tagihan','Belanja','Kesehatan','Pendidikan','Lainnya'];

document.addEventListener('DOMContentLoaded',()=>{
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('transactionDate').value=today;
  document.getElementById('debtDate').value=today;
  document.getElementById('dailyDate').value=today;
  updateCategoryOptions();
  updateBalance(); updateTransactionList(); updateDebtList(); updateDailyView();
  document.getElementById('transactionType').addEventListener('change',updateCategoryOptions);
  document.getElementById('transactionForm').addEventListener('submit',handleTransactionSubmit);
  document.getElementById('debtForm').addEventListener('submit',handleDebtSubmit);
  document.getElementById('transferForm').addEventListener('submit',handleTransfer);
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
  const transaction={
    id:Date.now(),
    type:document.getElementById('transactionType').value,
    amount:parseFloat(document.getElementById('transactionAmount').value),
    description:document.getElementById('transactionDescription').value,
    category:document.getElementById('transactionCategory').value,
    payment:document.getElementById('transactionPayment').value,
    date:document.getElementById('transactionDate').value
  };
  transactions.push(transaction);
  localStorage.setItem('transactions',JSON.stringify(transactions));
  document.getElementById('transactionForm').reset();
  document.getElementById('transactionDate').value=new Date().toISOString().split('T')[0];
  updateBalance(); updateTransactionList(); updateDailyView();
  alert('Transaksi berhasil disimpan!');
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
  document.getElementById('transferForm').reset();
  updateBalance(); updateTransactionList(); updateDailyView();
  alert('Transfer berhasil disimpan!');
}

function handleDebtSubmit(e){
  e.preventDefault();
  const debt={
    id:Date.now(),
    name:document.getElementById('debtName').value,
    amount:parseFloat(document.getElementById('debtAmount').value),
    description:document.getElementById('debtDescription').value,
    date:document.getElementById('debtDate').value
  };
  debts.push(debt);
  localStorage.setItem('debts',JSON.stringify(debts));
  document.getElementById('debtForm').reset();
  document.getElementById('debtDate').value=new Date().toISOString().split('T')[0];
  updateDebtList(); updateBalance();
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
  document.getElementById('totalBalance').textContent='Rp '+(cashBalance+digitalBalance-totalDebt).toLocaleString('id-ID');
  document.getElementById('cashBalance').textContent='Rp '+cashBalance.toLocaleString('id-ID');
  document.getElementById('digitalBalance').textContent='Rp '+digitalBalance.toLocaleString('id-ID');
  document.getElementById('totalDebt').textContent='Rp '+totalDebt.toLocaleString('id-ID');
}

function updateTransactionList(){
  const list=document.getElementById('transactionList');
  list.innerHTML='';
  transactions.slice().reverse().forEach(t=>{
    const item=document.createElement('div');
    item.className='transaction-item';
    const info=document.createElement('div');
    info.className='transaction-info';
    const desc=document.createElement('div');
    desc.className='transaction-description';
    if(t.type==='transfer'){
      desc.textContent='🔄 '+t.description;
    }else{
      desc.textContent=t.description+' ('+t.category+')';
    }
    const date=document.createElement('div');
    date.className='transaction-date';
    date.textContent=t.date+' | '+(t.payment||'');
    info.appendChild(desc); info.appendChild(date);
    const amount=document.createElement('div');
    amount.className='transaction-amount '+(t.type==='income'?'income':t.type==='expense'?'expense':'transfer');
    if(t.type==='transfer'){ amount.textContent='Rp '+t.amount.toLocaleString('id-ID'); }
    else{ amount.textContent=(t.type==='income'?'+ ':'- ')+'Rp '+t.amount.toLocaleString('id-ID'); }
    item.appendChild(info); item.appendChild(amount);
    list.appendChild(item);
  });
}

function updateDebtList(){
  const list=document.getElementById('debtList');
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
    const payBtn=document.createElement('button');
    payBtn.className='btn-small'; payBtn.textContent='Lunas';
    payBtn.onclick=()=>{debts=debts.filter(x=>x.id!==d.id); localStorage.setItem('debts',JSON.stringify(debts)); updateDebtList(); updateBalance();};
    item.appendChild(info); item.appendChild(amount); item.appendChild(payBtn);
    list.appendChild(item);
  });
}

function updateDailyView(){
  const date=document.getElementById('dailyDate').value;
  const dailyTrans=transactions.filter(t=>t.date===date);
  let dailyIncome=0,dailyExpense=0;
  const list=document.getElementById('dailyTransactionList');
  list.innerHTML='';
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
    list.appendChild(item);
  });
  document.getElementById('dailyIncome').textContent='Rp '+dailyIncome.toLocaleString('id-ID');
  document.getElementById('dailyExpense').textContent='Rp '+dailyExpense.toLocaleString('id-ID');
  document.getElementById('dailyBalance').textContent='Rp '+(dailyIncome-dailyExpense).toLocaleString('id-ID');
}

function showTab(tab){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.add('hidden'));
  if(tab==='transaction'){ document.querySelector('.tab:nth-child(1)').classList.add('active'); document.getElementById('transactionTab').classList.remove('hidden'); }
  else if(tab==='debt'){ document.querySelector('.tab:nth-child(2)').classList.add('active'); document.getElementById('debtTab').classList.remove('hidden'); }
  else if(tab==='daily'){ document.querySelector('.tab:nth-child(3)').classList.add('active'); document.getElementById('dailyTab').classList.remove('hidden'); }
}
