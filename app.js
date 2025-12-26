/* --- FALLBACK DATA --- */
const FALLBACK_DATA = {
  "ingredients": [
    { "category": "Bahan Utama", "name": "Terigu", "brand": "Segitiga Curah", "buyPrice": 9500, "buyWeight": 1000, "usage": 1000 },
    { "category": "Bahan Utama", "name": "Gula Pasir", "brand": "Curah", "buyPrice": 17000, "buyWeight": 1000, "usage": 550 },
    { "category": "Bahan Utama", "name": "Kelapa", "brand": "Parut", "buyPrice": 34000, "buyWeight": 1000, "usage": 500 },
    { "category": "Bahan Utama", "name": "Telur Ayam", "brand": "", "buyPrice": 1850, "buyWeight": 1, "usage": 3 },
    { "category": "Bahan Utama", "name": "Telur Bebek", "brand": "", "buyPrice": 2000, "buyWeight": 1, "usage": 1 },
    { "category": "Bahan Tambahan", "name": "Garam", "brand": "Daun", "buyPrice": 2500, "buyWeight": 250, "usage": 8 },
    { "category": "Bahan Tambahan", "name": "Ragi", "brand": "Mauripan", "buyPrice": 48000, "buyWeight": 500, "usage": 4 },
    { "category": "Bahan Tambahan", "name": "Bread Improver", "brand": "Angel", "buyPrice": 36000, "buyWeight": 500, "usage": 4 },
    { "category": "Bahan Tambahan", "name": "Margarin Cake", "brand": "Mother Choice", "buyPrice": 30000, "buyWeight": 1000, "usage": 30 },
    { "category": "Bahan Tambahan", "name": "BOS", "brand": "Palmvita", "buyPrice": 30000, "buyWeight": 1000, "usage": 30 },
    { "category": "Topping", "name": "Keju", "brand": "Wincheez", "buyPrice": 92000, "buyWeight": 2000, "usage": 90 },
    { "category": "Topping", "name": "Meses", "brand": "Innova Hijau", "buyPrice": 31000, "buyWeight": 1000, "usage": 120 },
    { "category": "Topping", "name": "Margarin", "brand": "Mother Choice", "buyPrice": 30000, "buyWeight": 1000, "usage": 25 },
    { "category": "Topping", "name": "B.O.S", "brand": "Palmvita", "buyPrice": 30000, "buyWeight": 1000, "usage": 25 },
    { "category": "Bahan Tambahan", "name": "Emulsifier", "brand": "SP", "buyPrice": 50000, "buyWeight": 1000, "usage": 10 }
  ],
  "ops": [
    { "name": "Gas (Harian)", "cost": 15000 },
    { "name": "Sewa Lapak (Harian)", "cost": 15000 },
    { "name": "Packing (Estimasi Harian)", "cost": 10000 }
  ],
  "steps": [],
  "baseYield": 130
};

/* --- GLOBAL STATE --- */
let ingredients = [];
let ops = [];
let steps = [];
let baseYield = 130;
let currentMultiplier = 1;
let sellingPrice = 1000; // Default harga jual

/* --- EGG LOGIC --- */
function getEggQty(type, multiplier) {
    const isAyam = type.toLowerCase().includes('ayam');
    const isBebek = type.toLowerCase().includes('bebek');
    
    if (![1, 1.25, 1.5, 2].includes(multiplier)) {
        const base = isAyam ? 3 : (isBebek ? 1 : 0);
        return Math.ceil(base * multiplier);
    }

    if (multiplier === 1) return isAyam ? 3 : 1;
    if (multiplier === 1.25) return isAyam ? 4 : 1;
    if (multiplier === 1.5) return isAyam ? 4 : 2;
    if (multiplier === 2) return isAyam ? 6 : 2;

    const base = isAyam ? 3 : 1;
    return Math.ceil(base * multiplier);
}

/* --- UTILITIES --- */
const toIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

/* --- INIT & DATA LOADING --- */
async function init() {
    const localIng = localStorage.getItem('pukisMod_ing');
    
    if (localIng) {
        ingredients = JSON.parse(localIng);
        ops = JSON.parse(localStorage.getItem('pukisMod_ops') || '[]');
        steps = JSON.parse(localStorage.getItem('pukisMod_steps') || '[]');
        baseYield = parseFloat(localStorage.getItem('pukisMod_yield') || '130');
        sellingPrice = parseFloat(localStorage.getItem('pukisMod_price') || '1000');
        render();
    } else {
        try {
            const response = await fetch('data.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error("Status " + response.status);
            const data = await response.json();
            loadData(data);
        } catch (error) {
            console.warn("Gagal load data.json (Fallback):", error);
            loadData(FALLBACK_DATA);
        }
    }
}

function loadData(data) {
    ingredients = data.ingredients || [];
    ops = data.ops || [];
    steps = data.steps || [];
    baseYield = parseFloat(data.baseYield || data.yieldPcs || 130);
    sellingPrice = 1000; // Reset price on load default
    
    saveToLocal(); 
    render();
}

function saveToLocal() {
    localStorage.setItem('pukisMod_ing', JSON.stringify(ingredients));
    localStorage.setItem('pukisMod_ops', JSON.stringify(ops));
    localStorage.setItem('pukisMod_steps', JSON.stringify(steps));
    localStorage.setItem('pukisMod_yield', baseYield.toString());
    localStorage.setItem('pukisMod_price', sellingPrice.toString());
}

/* --- RENDERING --- */
function render() {
    const scaleSelect = document.getElementById('scaleSelect');
    const customInput = document.getElementById('customScaleInput');
    
    if (scaleSelect.value === 'custom') {
        customInput.classList.remove('hidden');
        currentMultiplier = parseFloat(customInput.value) || 1;
    } else {
        customInput.classList.add('hidden');
        currentMultiplier = parseFloat(scaleSelect.value);
    }

    // Set value ke input field
    document.getElementById('baseYieldInput').value = baseYield;
    document.getElementById('sellingPriceInput').value = sellingPrice;

    renderIngredients();
    renderOps();
    renderSteps();
    renderSummary();
}

function renderIngredients() {
    const listContainer = document.getElementById('listContainer');
    listContainer.innerHTML = '';
    
    let totalIngCost = 0;
    const categories = ["Bahan Utama", "Bahan Tambahan", "Topping", "Lainnya"];
    ingredients.forEach(i => { if(!categories.includes(i.category)) categories.push(i.category); });

    categories.forEach(cat => {
        const items = ingredients.map((item, index) => ({...item, originalIndex: index}))
                                 .filter(item => item.category === cat);
        
        if (items.length > 0) {
            listContainer.innerHTML += `
                <tr class="bg-slate-800/40">
                    <td colspan="4" class="px-4 py-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider border-b border-slate-800">
                        ${cat}
                    </td>
                </tr>
            `;

            items.forEach(item => {
                const pricePerUnit = item.buyPrice / item.buyWeight;
                let currentUsage = 0;
                let unitLabel = 'gr';

                const isEgg = item.name.toLowerCase().includes('telur');
                if (isEgg) {
                    currentUsage = getEggQty(item.name, currentMultiplier);
                    unitLabel = 'btr';
                } else {
                    currentUsage = item.usage * currentMultiplier;
                }

                const cost = pricePerUnit * currentUsage;
                totalIngCost += cost;

                const brandInfo = item.brand ? `<span class="text-indigo-300 font-bold">${item.brand}</span><br>` : '';
                
                listContainer.innerHTML += `
                    <tr class="group hover:bg-slate-800/60 transition-colors border-b border-slate-800/50 last:border-0">
                        <td class="px-4 py-1.5 relative">
                            <div class="font-medium text-slate-200 text-sm cursor-help w-max border-b border-dotted border-slate-600 hover:border-indigo-400 transition-colors" title="Harga Beli: ${toIDR(item.buyPrice)} / ${item.buyWeight}${unitLabel}">
                                ${item.name}
                            </div>
                            <div class="text-[10px] text-slate-500">${brandInfo}</div>
                        </td>
                        <td class="px-2 py-1.5 text-right">
                            <div class="flex items-center justify-end">
                                <span class="bg-slate-800/50 rounded px-2 py-1 text-emerald-400 font-mono text-xs font-bold">
                                    ${Number.isInteger(currentUsage) ? currentUsage : currentUsage.toFixed(1)} ${unitLabel}
                                </span>
                            </div>
                            <div class="text-[9px] text-slate-600 mr-1">Basis 1kg: ${item.usage}</div>
                        </td>
                        <td class="px-4 py-1.5 text-right text-slate-300 mono text-xs font-medium">
                            ${toIDR(cost)}
                        </td>
                        <td class="px-2 py-1.5 text-center">
                            <button onclick="window.openModal(${item.originalIndex})" class="text-slate-600 hover:text-indigo-400 transition-colors p-1.5 rounded hover:bg-slate-700/50">
                                <i class="fas fa-pencil-alt text-xs"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    });
    window.tempTotalIngCost = totalIngCost;
}

function renderOps() {
    const container = document.getElementById('opsContainer');
    container.innerHTML = '';
    let total = 0;
    ops.forEach((op, idx) => {
        total += op.cost;
        container.innerHTML += `
            <div class="flex justify-between items-center p-2 bg-slate-800/40 rounded border border-slate-800 hover:border-orange-500/30 transition-colors group">
                <span class="text-slate-400 text-xs">${op.name}</span>
                <div class="flex items-center gap-2">
                    <span class="text-slate-300 mono text-xs font-medium">${toIDR(op.cost)}</span>
                    <button onclick="window.removeOps(${idx})" class="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-1"><i class="fas fa-times text-xs"></i></button>
                </div>
            </div>
        `;
    });
    document.getElementById('displayOpsTotal').innerText = toIDR(total);
    window.tempTotalOpsCost = total;
}
/* 
function renderSteps() {
    const container = document.getElementById('stepsContainer');
    container.innerHTML = '';
    steps.forEach((step, idx) => {
        container.innerHTML += `
            <li class="flex gap-2 group p-2 rounded hover:bg-slate-800/40 transition-colors">
                <span class="font-mono text-slate-500 text-xs mt-0.5">${idx + 1}.</span>
                <p class="flex-1 text-xs leading-relaxed text-slate-300">${step}</p>
                <button onclick="window.removeStep(${idx})" class="text-slate-600 hover:text-red-500 self-start opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </li>
        `;
    });
} */
/* --- GANTI FUNCTION renderSteps YANG LAMA DENGAN INI --- */
function renderSteps() {
    const container = document.getElementById('stepsContainer');
    container.innerHTML = '';
    
    steps.forEach((step, idx) => {
        container.innerHTML += `
            <li class="flex gap-2 group p-2 rounded bg-slate-800/20 border border-transparent transition-all items-start mb-1"
                draggable="true"
                data-index="${idx}"
                ondragstart="window.handleDragStart(event)"
                ondragover="window.handleDragOver(event)"
                ondrop="window.handleDrop(event)"
                ondragenter="window.handleDragEnter(event)"
                ondragleave="window.handleDragLeave(event)"
                ondragend="window.handleDragEnd(event)" 
            >
                <div class="cursor-move text-slate-600 hover:text-indigo-400 mt-1 p-1 flex-none pointer-events-none">
                    <i class="fas fa-grip-vertical text-xs"></i>
                </div>

                <span class="font-mono text-slate-500 text-xs mt-1.5 select-none flex-none w-4 pointer-events-none">${idx + 1}.</span>
                
                <textarea 
                    id="step-area-${idx}"
                    class="flex-1 w-full bg-transparent text-xs leading-relaxed text-slate-300 placeholder-slate-600 outline-none border-none focus:ring-0 resize-none overflow-hidden py-1 px-1 rounded focus:bg-slate-800/50 transition-colors"
                    rows="1"
                    placeholder="Isi langkah..."
                    oninput="window.autoResizeTextarea(this); window.updateStepText(${idx}, this.value)"
                >${step}</textarea>

                <button onclick="window.removeStep(${idx})" class="text-slate-600 hover:text-red-500 self-start mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-none">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </li>
        `;
    });

    // Auto-resize setelah render
    setTimeout(() => {
        container.querySelectorAll('textarea').forEach(tx => {
            window.autoResizeTextarea(tx);
        });
    }, 0);
}


function renderSummary() {
    // 1. Yield & Cost
    const currentYield = Math.floor(baseYield * currentMultiplier);
    const totalCost = (window.tempTotalIngCost || 0) + (window.tempTotalOpsCost || 0);
    const hppPerPcs = currentYield > 0 ? totalCost / currentYield : 0;

    // 2. Profit Calc
    const revenue = currentYield * sellingPrice;
    const profit = revenue - totalCost;

    // 3. Display
    document.getElementById('displayYield').innerText = currentYield;
    // Base yield input handle by own listener
    
    document.getElementById('displayTotalCost').innerText = toIDR(totalCost);
    document.getElementById('displayHppPcs').innerText = toIDR(hppPerPcs);

    const elProfit = document.getElementById('displayProfit');
    elProfit.innerText = toIDR(profit);
    if(profit >= 0) {
        elProfit.classList.remove('text-red-400');
        elProfit.classList.add('text-white');
    } else {
        elProfit.classList.add('text-red-400');
        elProfit.classList.remove('text-white');
    }
}

/* --- EVENT HANDLERS --- */
document.getElementById('scaleSelect').addEventListener('change', render);
document.getElementById('customScaleInput').addEventListener('input', render);

// Listener untuk Base Yield & Selling Price
document.getElementById('baseYieldInput').addEventListener('input', function() {
    baseYield = parseFloat(this.value) || 0;
    saveToLocal();
    renderSummary(); // Cukup update summary, tidak perlu render ulang semua list
});

document.getElementById('sellingPriceInput').addEventListener('input', function() {
    sellingPrice = parseFloat(this.value) || 0;
    saveToLocal();
    renderSummary();
});


document.getElementById('btnAddOps').addEventListener('click', () => {
    const name = document.getElementById('newOpsName').value;
    const cost = parseFloat(document.getElementById('newOpsCost').value);
    if (name && !isNaN(cost)) {
        ops.push({ name, cost });
        document.getElementById('newOpsName').value = '';
        document.getElementById('newOpsCost').value = '';
        saveToLocal(); render();
    }
});

const stepInput = document.getElementById('newStepText');
document.getElementById('btnAddStep').addEventListener('click', addStep);
stepInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault(); addStep();
    }
});
function addStep() {
    if (stepInput.value.trim()) {
        steps.push(stepInput.value.trim());
        stepInput.value = '';
        saveToLocal(); render();
    }
}

window.openModal = function(idx) {
    document.getElementById('modalOverlay').classList.remove('hidden');
    const idxInput = document.getElementById('editIndex');
    const btnDelete = document.getElementById('btnDelete');
    
    if (idx !== 'new') {
        const item = ingredients[idx];
        document.getElementById('modalCategory').value = item.category || 'Bahan Utama';
        document.getElementById('modalName').value = item.name;
        document.getElementById('modalBrand').value = item.brand || '';
        document.getElementById('modalPrice').value = item.buyPrice;
        document.getElementById('modalWeight').value = item.buyWeight;
        document.getElementById('modalUsage').value = item.usage;

        idxInput.value = idx;
        btnDelete.classList.remove('hidden');
        updateModalCalc();
    } else {
        document.getElementById('modalCategory').value = 'Bahan Utama';
        document.getElementById('modalName').value = '';
        document.getElementById('modalBrand').value = '';
        document.getElementById('modalPrice').value = '';
        document.getElementById('modalWeight').value = '';
        document.getElementById('modalUsage').value = '';

        idxInput.value = 'new';
        btnDelete.classList.add('hidden');
        document.getElementById('modalCalc').innerText = 'Rp 0 / unit';
    }
};

window.removeOps = function(idx) { ops.splice(idx, 1); saveToLocal(); render(); };
window.removeStep = function(idx) { steps.splice(idx, 1); saveToLocal(); render(); };

document.getElementById('btnSaveModal').addEventListener('click', () => {
    const idx = document.getElementById('editIndex').value;
    const newItem = {
        category: document.getElementById('modalCategory').value,
        name: document.getElementById('modalName').value,
        brand: document.getElementById('modalBrand').value,
        buyPrice: parseFloat(document.getElementById('modalPrice').value),
        buyWeight: parseFloat(document.getElementById('modalWeight').value),
        usage: parseFloat(document.getElementById('modalUsage').value) || 0
    };

    if (!newItem.name || isNaN(newItem.buyPrice)) return alert('Lengkapi data!');

    if (idx === 'new') {
        ingredients.push(newItem);
    } else {
        ingredients[idx] = newItem;
    }
    document.getElementById('modalOverlay').classList.add('hidden');
    saveToLocal(); render();
});

document.getElementById('btnDelete').addEventListener('click', () => {
    const idx = document.getElementById('editIndex').value;
    if (idx !== 'new' && confirm("Hapus bahan ini?")) {
        ingredients.splice(idx, 1);
        document.getElementById('modalOverlay').classList.add('hidden');
        saveToLocal(); render();
    }
});

function updateModalCalc() {
    const p = parseFloat(document.getElementById('modalPrice').value) || 0;
    const w = parseFloat(document.getElementById('modalWeight').value) || 1;
    const res = w > 0 ? p/w : 0;
    document.getElementById('modalCalc').innerText = `Rp ${res.toFixed(1)} / unit`;
}
['modalPrice', 'modalWeight'].forEach(id => document.getElementById(id).addEventListener('input', updateModalCalc));

document.getElementById('btnReset').addEventListener('click', () => {
    if(confirm('Reset ke data awal 1kg?')) {
        localStorage.removeItem('pukisMod_ing');
        localStorage.removeItem('pukisMod_ops');
        localStorage.removeItem('pukisMod_steps');
        localStorage.removeItem('pukisMod_yield');
        localStorage.removeItem('pukisMod_price');
        location.reload();
    }
});

document.getElementById('btnExportJson').addEventListener('click', () => {
    const data = { ingredients, ops, steps, baseYield };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hpp_pukis_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});

document.getElementById('btnExportCsv').addEventListener('click', () => {
    let csv = "DATA HPP PUKIS\n";
    csv += `Skala Produksi,${currentMultiplier}x\n`;
    csv += `Harga Jual,${sellingPrice}\n`;
    csv += `Estimasi Profit,${document.getElementById('displayProfit').innerText}\n\n`;
    csv += "BAHAN,PEMAKAIAN,BIAYA\n";
    
    ingredients.forEach(item => {
        let usage = item.usage * currentMultiplier;
        if(item.name.toLowerCase().includes('telur')) usage = getEggQty(item.name, currentMultiplier);
        
        const pricePerUnit = item.buyPrice / item.buyWeight;
        const cost = pricePerUnit * usage;
        csv += `"${item.name}",${usage},${cost}\n`;
    });
    
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_hpp.csv");
    document.body.appendChild(link);
    link.click();
});

document.addEventListener('DOMContentLoaded', init);

/* --- TAMBAHAN LOGIC EDIT & DRAG DROP --- */

// 1. Logic Update Text saat diketik
window.updateStepText = function(idx, value) {
    steps[idx] = value;
    saveToLocal(); // Simpan ke localStorage agar tidak hilang saat refresh
    // Kita TIDAK memanggil render() di sini agar kursor tidak lepas fokus saat mengetik
};

/* --- LOGIC DRAG & DROP YANG SUDAH DIPERBAIKI --- */
let dragSrcEl = null;

// Helper untuk membersihkan semua style sisa drag
function resetDragStyles() {
    document.querySelectorAll('#stepsContainer li').forEach(li => {
        li.classList.remove('opacity-50', 'border-indigo-500', 'bg-slate-700/50', 'scale-[0.98]');
    });
}

window.handleDragStart = function(e) {
    dragSrcEl = e.target.closest('li'); 
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', dragSrcEl.innerHTML);
    
    // Beri sedikit delay agar elemen yang didrag terlihat transparan, tapi ghost imagenya tetap utuh
    setTimeout(() => {
        if(dragSrcEl) dragSrcEl.classList.add('opacity-50', 'border-indigo-500', 'scale-[0.98]');
    }, 0);
};

window.handleDragOver = function(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Wajib agar bisa di-drop
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
};

window.handleDragEnter = function(e) {
    const targetLi = e.target.closest('li');
    if (targetLi && targetLi !== dragSrcEl) {
        targetLi.classList.add('bg-slate-700/50'); // Highlight target drop
    }
};

window.handleDragLeave = function(e) {
    const targetLi = e.target.closest('li');
    
    // LOGIC BARU: Cek apakah mouse benar-benar keluar dari kotak Li, 
    // atau hanya masuk ke elemen anak (textarea/icon) di dalamnya.
    // Jika 'relatedTarget' (elemen tujuan mouse) masih ada di dalam 'targetLi', jangan hapus class.
    if (targetLi && !targetLi.contains(e.relatedTarget)) {
        targetLi.classList.remove('bg-slate-700/50');
    }
};

window.handleDrop = function(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    const targetLi = e.target.closest('li');
    
    // Pastikan valid dan posisi berubah
    if (dragSrcEl && targetLi && dragSrcEl !== targetLi) {
        const oldIndex = parseInt(dragSrcEl.getAttribute('data-index'));
        const newIndex = parseInt(targetLi.getAttribute('data-index'));

        // Tukar posisi data
        const itemMoved = steps.splice(oldIndex, 1)[0];
        steps.splice(newIndex, 0, itemMoved);

        saveToLocal();
        render(); 
    }
    return false;
};

// FUNGSI BARU: Dipanggil saat drag selesai (baik sukses di-drop atau dilepas sembarangan)
window.handleDragEnd = function(e) {
    dragSrcEl = null;
    resetDragStyles(); // Hapus semua warna gelap/border yang nyangkut
};

// Helper Textarea Resize
window.autoResizeTextarea = function(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
};

// Tambahkan Helper Function ini di bagian bawah app.js (agar lebih rapi)
window.autoResizeTextarea = function(element) {
    element.style.height = 'auto'; // Reset dulu
    element.style.height = (element.scrollHeight + 2) + 'px'; // Set sesuai konten + buffer 2px
};