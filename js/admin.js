// Kiểm tra quyền admin
(function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = 'index.html';
    }
})();

// Hiển thị ngày hiện tại
document.getElementById('current-date').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// Xử lý chuyển tab
document.querySelectorAll('.sidebar-nav li').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        this.classList.add('active');
        const tabName = this.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabName + '-tab').classList.add('active');
        document.getElementById('page-title').textContent = this.innerText.trim();

        // Load dữ liệu tương ứng
        if (tabName === 'dashboard') loadDashboard();
        else if (tabName === 'orders') loadOrdersTable();
        else if (tabName === 'customers') loadCustomers();
        else if (tabName === 'products') loadProductsTable();
        else if (tabName === 'payment') loadPaymentHistory();
        else if (tabName === 'analytics') loadAnalytics();
    });
});

// Load sidebar stats
function updateSidebarStats() {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    document.getElementById('sidebar-products').textContent = accounts.length;
    document.getElementById('sidebar-orders').textContent = orders.length;
    document.getElementById('sidebar-users').textContent = users.length;
}

// Dashboard
function loadDashboard() {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    const totalRevenue = orders.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0);
    const today = new Date().toDateString();
    const todayRevenue = orders.filter(o => o.status === 'approved' && new Date(o.updatedAt || o.createdAt).toDateString() === today).reduce((s, o) => s + o.price, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'pending').length; // tạm
    const completed = orders.filter(o => o.status === 'approved').length;
    const others = orders.filter(o => o.status === 'rejected').length;

    document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString() + '₫';
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-products').textContent = accounts.length;
    document.getElementById('total-customers').textContent = users.length;
    document.getElementById('pending-count').textContent = pendingOrders;
    document.getElementById('processing-count').textContent = processing;
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('others-count').textContent = others;

    // Recent orders
    const recent = orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const html = recent.map(o => {
        const user = users.find(u => u.id === o.userId) || { username: 'Guest' };
        return `
            <div class="recent-order-item">
                <div class="recent-order-info">
                    <strong>${o.accountName}</strong>
                    <span>${user.username}</span>
                </div>
                <div class="recent-order-amount">${o.price.toLocaleString()}₫</div>
            </div>
        `;
    }).join('');
    document.getElementById('recent-orders-list').innerHTML = html;
}

// Orders table
function loadOrdersTable() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');

    let html = '';
    orders.forEach(order => {
        const user = users.find(u => u.id === order.userId) || { username: 'Guest', email: '' };
        const account = accounts.find(a => a.id === order.accountId) || { title: 'Đã xóa' };
        const statusClass = order.status === 'pending' ? 'pending' : order.status === 'approved' ? 'approved' : 'rejected';
        const statusText = order.status === 'pending' ? 'Processing' : order.status === 'approved' ? 'Delivered' : 'Failed';
        html += `
            <tr>
                <td>ORD-${order.id}</td>
                <td>${user.username}<br><small>${user.email || ''}</small></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>SePay</td>
                <td>${order.price.toLocaleString()}₫</td>
                <td>
                    ${order.status === 'pending' ? 
                        `<button class="btn-approve" onclick="approveOrder(${order.id})">✓</button>
                         <button class="btn-reject" onclick="rejectOrder(${order.id})">✗</button>` : 
                        '<span>Done</span>'}
                </td>
            </tr>
        `;
    });
    document.getElementById('orders-list-body').innerHTML = html || '<tr><td colspan="6">Không có đơn hàng</td></tr>';
}

// Customers
function loadCustomers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');

    document.getElementById('customer-total').textContent = users.length;
    const withOrders = users.filter(u => orders.some(o => o.userId === u.id)).length;
    document.getElementById('customer-with-orders').textContent = withOrders;
    const active = users.filter(u => {
        const lastOrder = orders.filter(o => o.userId === u.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        return lastOrder && (new Date() - new Date(lastOrder.createdAt) < 30*24*60*60*1000);
    }).length;
    document.getElementById('customer-active').textContent = active;
    const totalSpent = orders.filter(o => o.status === 'approved').reduce((s,o) => s + o.price, 0);
    document.getElementById('customer-avg').textContent = (totalSpent / (users.length || 1)).toFixed(0) + '₫';

    let html = '';
    users.forEach(user => {
        const userOrders = orders.filter(o => o.userId === user.id && o.status === 'approved');
        const total = userOrders.reduce((s,o) => s + o.price, 0);
        html += `
            <tr>
                <td>${user.username}<br><small>${user.email || ''}</small></td>
                <td>${user.role === 'admin' ? 'Admin' : 'Shop customer'}</td>
                <td>${new Date(user.id).toLocaleDateString('vi-VN')}</td>
                <td>${userOrders.length}</td>
                <td>${total.toLocaleString()}₫</td>
            </tr>
        `;
    });
    document.getElementById('customers-list-body').innerHTML = html;
}

// Products
function loadProductsTable() {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    let html = '';
    accounts.forEach(acc => {
        html += `
            <tr>
                <td>${acc.id}</td>
                <td>${acc.game === 'lien-quan' ? 'Liên Quân' : acc.game === 'tft' ? 'TFT' : 'PlayTogether'}</td>
                <td>${acc.title}</td>
                <td>${acc.rank || ''}</td>
                <td>${acc.price.toLocaleString()}₫</td>
                <td><span class="status-badge ${acc.status === 'available' ? 'approved' : 'rejected'}">${acc.status === 'available' ? 'Còn' : 'Đã bán'}</span></td>
                <td><button class="btn-reject" onclick="deleteAccount(${acc.id})">Xóa</button></td>
            </tr>
        `;
    });
    document.getElementById('products-list-body').innerHTML = html;
}

// Payment History
function loadPaymentHistory() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]').filter(o => o.status === 'approved');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const total = orders.reduce((s,o) => s + o.price, 0);
    document.getElementById('payment-total').textContent = total.toLocaleString() + '₫';
    const thisMonth = orders.filter(o => {
        const d = new Date(o.updatedAt || o.createdAt);
        return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
    }).reduce((s,o) => s + o.price, 0);
    document.getElementById('payment-month').textContent = thisMonth.toLocaleString() + '₫';
    document.getElementById('payment-count').textContent = orders.length;

    let html = '';
    orders.forEach(order => {
        const user = users.find(u => u.id === order.userId) || { username: 'Guest', email: '' };
        html += `
            <tr>
                <td>ORD-${order.id}</td>
                <td>${user.username}<br><small>${user.email}</small></td>
                <td>${new Date(order.updatedAt || order.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>SePay</td>
                <td>TX: ${order.id}</td>
                <td>${order.price.toLocaleString()}₫</td>
            </tr>
        `;
    });
    document.getElementById('payment-list-body').innerHTML = html;
}

// Analytics
function loadAnalytics() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]').filter(o => o.status === 'approved');
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    // top sản phẩm bán chạy (theo số lần xuất hiện trong orders)
    const productCount = {};
    orders.forEach(o => {
        productCount[o.accountId] = (productCount[o.accountId] || 0) + 1;
    });
    const top = Object.entries(productCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
    let html = '';
    top.forEach(([accId, count]) => {
        const acc = accounts.find(a => a.id == accId);
        if (acc) {
            html += `<tr><td>${acc.title}</td><td>${count}</td><td>${(acc.price * count).toLocaleString()}₫</td></tr>`;
        }
    });
    document.getElementById('top-products-list').innerHTML = html || '<tr><td colspan="3">Chưa có dữ liệu</td></tr>';
}

// Delete account
window.deleteAccount = function(id) {
    if (confirm('Xóa tài khoản?')) {
        let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        accounts = accounts.filter(a => a.id !== id);
        localStorage.setItem('accounts', JSON.stringify(accounts));
        loadProductsTable();
        updateSidebarStats();
    }
};

// Approve / Reject (giữ nguyên từ code cũ)
window.approveOrder = function(orderId) {
    if (!confirm('Duyệt đơn hàng?')) return;
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return;
    const order = orders[idx];
    const accIdx = accounts.findIndex(a => a.id === order.accountId);
    if (accIdx !== -1) {
        accounts[accIdx].status = 'sold';
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }
    orders[idx].status = 'approved';
    orders[idx].updatedAt = new Date().toISOString();
    localStorage.setItem('orders', JSON.stringify(orders));
    // Cập nhật notified
    const notified = JSON.parse(localStorage.getItem('notifiedOrders') || '[]');
    notified.push(orderId);
    localStorage.setItem('notifiedOrders', JSON.stringify(notified));
    loadOrdersTable();
    updateSidebarStats();
};

window.rejectOrder = function(orderId) {
    if (!confirm('Từ chối đơn?')) return;
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return;
    orders[idx].status = 'rejected';
    orders[idx].updatedAt = new Date().toISOString();
    localStorage.setItem('orders', JSON.stringify(orders));
    const notified = JSON.parse(localStorage.getItem('notifiedOrders') || '[]');
    notified.push(orderId);
    localStorage.setItem('notifiedOrders', JSON.stringify(notified));
    loadOrdersTable();
    updateSidebarStats();
};

// Add product form
document.getElementById('show-add-product-form').addEventListener('click', function() {
    const form = document.getElementById('add-product-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('addAccountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const newAccount = {
        id: Date.now(),
        game: document.getElementById('game').value,
        title: document.getElementById('title').value,
        rank: document.getElementById('rank').value,
        details: document.getElementById('details').value,
        price: parseInt(document.getElementById('price').value),
        loginEmail: document.getElementById('loginEmail').value,
        loginPassword: document.getElementById('loginPassword').value,
        images: document.getElementById('images').value.split(',').map(s => s.trim()),
        status: 'available',
        date: new Date().toISOString()
    };
    accounts.push(newAccount);
    localStorage.setItem('accounts', JSON.stringify(accounts));
    document.getElementById('addMessage').innerHTML = '<p style="color:#10b981;">Thêm thành công!</p>';
    this.reset();
    loadProductsTable();
    updateSidebarStats();
});

// Khởi tạo
updateSidebarStats();
loadDashboard();