// ===== GLOBAL VARIABLES =====
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
}

// ===== USER ACTIONS =====
async function loadUserActions() {
    const userActions = document.getElementById('userActions');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        // Lấy số dư mới nhất từ server
        await fetchUserBalance(currentUser.id);
        const updatedUser = JSON.parse(localStorage.getItem('currentUser'));

        let adminLink = updatedUser.role === 'admin' 
            ? '<a href="admin.html" class="admin-link"><i class="fas fa-cog"></i> Admin</a>' 
            : '';

        userActions.innerHTML = `
            <div class="balance-container">
                <span class="balance-display" id="userBalance">${formatPrice(updatedUser.balance || 0)}</span>
                <button class="btn-topup" onclick="openTopUpModal()"><i class="fas fa-plus"></i> Nạp</button>
            </div>
            <span class="welcome">Xin chào, ${updatedUser.username}</span>
            <a href="profile.html" class="profile-link"><i class="fas fa-user"></i> Hồ sơ</a>
            ${adminLink}
            <a href="#" onclick="logout()" class="logout-link"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
        `;
    } else {
        userActions.innerHTML = `
            <a href="login.html" class="login-link"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>
            <a href="register.html" class="register-link"><i class="fas fa-user-plus"></i> Đăng ký</a>
        `;
    }
}

async function fetchUserBalance(userId) {
    try {
        const res = await fetch(`/api/users/${userId}/balance`);
        if (res.ok) {
            const data = await res.json();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                currentUser.balance = data.balance;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                const balanceSpan = document.getElementById('userBalance');
                if (balanceSpan) balanceSpan.innerText = formatPrice(data.balance);
            }
            return data.balance;
        }
    } catch (e) {
        console.error('Lỗi lấy số dư:', e);
    }
    return 0;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ===== TOPUP MODAL =====
let currentTopupCode = '';
let bankInfo = {
    bankName: 'VietinBank',
    accountNumber: '100879278075',
    accountHolder: 'DO QUANG HUNG'
};

function openTopUpModal() {
    const modal = document.getElementById('topupModal');
    if (modal) {
        modal.style.display = 'block';
        generateTopupCode();
    } else {
        alert('Modal nạp tiền chưa được thêm vào trang này');
    }
}

function closeTopUpModal() {
    document.getElementById('topupModal').style.display = 'none';
}

function generateTopupCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NAP';
    for (let i = 0; i < 7; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentTopupCode = code;

    const transferCodeEl = document.getElementById('transferCode');
    if (transferCodeEl) transferCodeEl.innerText = code;

    const amountInput = document.getElementById('topupAmount');
    const amount = amountInput ? parseInt(amountInput.value) || 10000 : 10000;

    const bankInfoEl = document.getElementById('bankInfo');
    if (bankInfoEl) {
        bankInfoEl.innerHTML = `
            <p>Ngân hàng: <strong>${bankInfo.bankName}</strong></p>
            <p>Số TK: <strong>${bankInfo.accountNumber}</strong></p>
            <p>Chủ TK: <strong>${bankInfo.accountHolder}</strong></p>
        `;
    }

    const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankName.toLowerCase()}-${bankInfo.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(code)}`;
    const qrImg = document.getElementById('vietqrImage');
    if (qrImg) {
        qrImg.src = qrUrl;
        qrImg.alt = `QR thanh toán ${amount}đ với nội dung ${code}`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const topupAmount = document.getElementById('topupAmount');
    if (topupAmount) {
        topupAmount.addEventListener('input', generateTopupCode);
    }

    const confirmTopup = document.getElementById('confirmTopup');
    if (confirmTopup) {
        confirmTopup.addEventListener('click', async function() {
            const amount = parseInt(document.getElementById('topupAmount')?.value);
            const code = currentTopupCode;
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));

            if (!currentUser) {
                alert('Bạn cần đăng nhập');
                return;
            }

            if (!amount || amount < 1000) {
                alert('Vui lòng nhập số tiền hợp lệ (tối thiểu 1.000đ)');
                return;
            }

            try {
                const res = await fetch('/api/topup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        amount: amount,
                        code: code,
                        method: 'vietqr'
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('✅ ' + data.message);
                    closeTopUpModal();
                    document.getElementById('topupAmount').value = '10000';
                    generateTopupCode();
                } else {
                    alert('❌ Lỗi: ' + data.message);
                }
            } catch (error) {
                console.error('Lỗi khi tạo lệnh nạp:', error);
                alert('Có lỗi xảy ra, vui lòng thử lại sau');
            }
        });
    }
});

window.copyTransferCode = function() {
    navigator.clipboard.writeText(currentTopupCode);
    alert('Đã sao chép nội dung chuyển khoản: ' + currentTopupCode);
};

// ===== RECENT ACCOUNTS (trang chủ) =====
function loadRecentAccounts() {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const recent = accounts.filter(a => a.status === 'available').sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8);
    const grid = document.getElementById('recent-accounts');
    if (!grid) return;

    grid.innerHTML = '';
    if (recent.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Chưa có tài khoản nào</p>';
        return;
    }

    recent.forEach(account => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${account.images?.[0] || 'https://via.placeholder.com/200'}" alt="${account.title}">
            <h3>${account.title}</h3>
            <p class="rank">${account.rank || 'Không có rank'}</p>
            <p class="price">${formatPrice(account.price)}</p>
            <div class="card-actions">
                <button class="btn-view" onclick="window.location.href='games.html?game=${account.game}'">Xem chi tiết</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ===== INIT SAMPLE DATA (nếu cần) =====
function initSampleData() {
    if (!localStorage.getItem('users')) {
        const users = [
            { id: 1, username: 'admin', email: 'admin@shop.com', password: 'admin123', balance: 1000000, role: 'admin' },
            { id: 2, username: 'user1', email: 'user1@shop.com', password: 'user123', balance: 500000, role: 'user' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    if (!localStorage.getItem('accounts')) {
        const accounts = [
            { id: 1001, game: 'lien-quan', title: 'Acc Liên Quân - Thách đấu', rank: 'Cao Thủ', details: 'Tướng đầy đủ, skin nhiều', price: 500000, oldPrice: 650000, loginEmail: 'lienquan1@game.com', loginPassword: 'pass123', images: ['https://via.placeholder.com/200'], status: 'available', date: new Date().toISOString() },
            { id: 1002, game: 'tft', title: 'Acc TFT - Kim Cương', rank: 'Kim Cương 1', details: 'Nhiều skin, nhiều mùa giải', price: 350000, loginEmail: 'tft1@game.com', loginPassword: 'pass456', images: ['https://via.placeholder.com/200'], status: 'available', date: new Date().toISOString() },
        ];
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }

    if (!localStorage.getItem('orders')) localStorage.setItem('orders', '[]');
    if (!localStorage.getItem('notifiedOrders')) localStorage.setItem('notifiedOrders', '[]');
}

// Gọi hàm init khi trang load
initSampleData();

// ===== POLLING KIỂM TRA THÔNG BÁO (nếu cần) =====
let lastOrderCheck = 0;
async function checkOrderStatus() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const res = await fetch(`/api/orders?userId=${user.id}`);
    const orders = await res.json();
    const latest = orders[0];
    if (latest && latest.id !== lastOrderCheck) {
        lastOrderCheck = latest.id;
        if (latest.status === 'completed') {
            showNotification('Đơn hàng #' + latest.id + ' đã hoàn thành! Vào profile để xem tài khoản.');
        } else if (latest.status === 'rejected') {
            showNotification('Đơn hàng #' + latest.id + ' bị từ chối.');
        }
    }
}

function showNotification(msg) {
    const notif = document.createElement('div');
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.background = 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))';
    notif.style.color = 'white';
    notif.style.padding = '15px 20px';
    notif.style.borderRadius = 'var(--radius-md)';
    notif.style.zIndex = '10000';
    notif.style.boxShadow = 'var(--shadow)';
    notif.innerText = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
}

// Polling mỗi 10 giây nếu user đã đăng nhập
setInterval(() => {
    if (localStorage.getItem('currentUser')) checkOrderStatus();
}, 10000);