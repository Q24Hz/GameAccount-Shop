// Hàm load thông tin user actions
function loadUserActions() {
    const userActions = document.getElementById('userActions');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        let adminLink = currentUser.role === 'admin' ? '<a href="admin.html" class="admin-link"><i class="fas fa-cog"></i> Admin</a>' : '';
        userActions.innerHTML = `
            <span class="welcome">Xin chào, ${currentUser.username}</span>
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

// Hàm logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Hàm load tài khoản mới nhất cho trang chủ
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
            <p class="price">${account.price.toLocaleString()}đ</p>
            <div class="card-actions">
                <button class="btn-view" onclick="window.location.href='games.html?game=${account.game}'">Xem chi tiết</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Khởi tạo dữ liệu mẫu nếu chưa có
function initSampleData() {
    if (!localStorage.getItem('users')) {
        const users = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@shop.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                id: 2,
                username: 'user1',
                email: 'user1@shop.com',
                password: 'user123',
                role: 'user'
            }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    if (!localStorage.getItem('accounts')) {
        const accounts = [
            {
                id: 1001,
                game: 'lien-quan',
                title: 'Acc Liên Quân - Thách đấu',
                rank: 'Cao Thủ',
                details: 'Tướng đầy đủ, skin nhiều',
                price: 500000,
                oldPrice: 650000,
                loginEmail: 'lienquan1@game.com',
                loginPassword: 'pass123',
                images: ['https://via.placeholder.com/200'],
                status: 'available',
                date: new Date().toISOString()
            },
            {
                id: 1002,
                game: 'tft',
                title: 'Acc TFT - Kim Cương',
                rank: 'Kim Cương 1',
                details: 'Nhiều skin, nhiều mùa giải',
                price: 350000,
                loginEmail: 'tft1@game.com',
                loginPassword: 'pass456',
                images: ['https://via.placeholder.com/200'],
                status: 'available',
                date: new Date().toISOString()
            },
            {
                id: 1003,
                game: 'play-together',
                title: 'Acc PT - Level 40',
                rank: 'Level 40',
                details: 'Nhiều vật phẩm, bạn bè',
                price: 200000,
                loginEmail: 'pt1@game.com',
                loginPassword: 'pass789',
                images: ['https://via.placeholder.com/200'],
                status: 'available',
                date: new Date().toISOString()
            }
        ];
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }

    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', '[]');
    }

    if (!localStorage.getItem('notifiedOrders')) {
        localStorage.setItem('notifiedOrders', '[]');
    }
}

// Gọi khởi tạo dữ liệu mẫu khi trang load
initSampleData();