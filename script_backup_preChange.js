// 全局变量
let productRowCounter = 1;

// 货币符号映射
const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'CNY': '¥'
};

// 国家代码映射
const countryCodes = {
    'United States': 'US',
    'USA': 'US',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Japan': 'JP',
    'South Korea': 'KR',
    'China': 'CN',
    'India': 'IN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Singapore': 'SG',
    'Malaysia': 'MY',
    'Thailand': 'TH',
    'Vietnam': 'VN'
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 设置当前日期
    setCurrentDate();
    
    // 生成初始发票编号
    generateInvoiceNumber();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化产品行
    initializeProductRows();
    
    // 更新头部显示
    updateHeaderDisplay();
}

function setCurrentDate() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = dateString;
    document.getElementById('headerDate').textContent = formatDate(today);
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('zh-CN', options);
}

function generateInvoiceNumber() {
    const countrySelect = document.getElementById('customerCountry');
    const selectedCountry = countrySelect.options[countrySelect.selectedIndex].text;
    const countryCode = countryCodes[selectedCountry] || 'XX';
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    
    const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const invoiceNumber = `INV-${countryCode}-${day}${month}${year}-${randomSuffix}`;
    document.getElementById('invoiceNumber').value = invoiceNumber;
    document.getElementById('headerInvoiceNumber').textContent = invoiceNumber;
}

function updateHeaderDisplay() {
    const currency = document.getElementById('currency').value;
    const symbol = currencySymbols[currency];
    
    // 更新价格表头
    const priceHeaders = document.querySelectorAll('.compact-table th:nth-child(5), .compact-table th:nth-child(6)');
    priceHeaders.forEach((header, index) => {
        if (index === 0) {
            header.textContent = `单价 (${currency})`;
        } else {
            header.textContent = `总价 (${currency})`;
        }
    });
    
    // 重新计算总额
    calculateGrandTotal();
}

function bindEventListeners() {
    // 解析客户信息按钮
    document.getElementById('parseCustomerInfo').addEventListener('click', parseCustomerInfo);
    
    // 添加产品按钮
    document.getElementById('addProduct').addEventListener('click', addProductRow);
    
    // 生成PDF按钮
    document.getElementById('generatePDF').addEventListener('click', generatePDF);
    
    // 国家选择变化时重新生成发票编号
    document.getElementById('customerCountry').addEventListener('change', generateInvoiceNumber);
    
    // 货币变化时更新显示
    document.getElementById('currency').addEventListener('change', updateHeaderDisplay);
    
    // 产品数量和价格变化时计算总价
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('product-quantity') || e.target.classList.contains('product-price')) {
            calculateProductTotal(e.target.closest('tr'));
            calculateGrandTotal();
            updateTotalPackages();
        }
    });
    
    // 运费变化时重新计算总金额
    document.getElementById('shippingFee').addEventListener('input', calculateGrandTotal);
    
    // 删除产品按钮
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-product') || e.target.closest('.remove-product')) {
            const button = e.target.classList.contains('remove-product') ? e.target : e.target.closest('.remove-product');
            removeProductRow(button.closest('tr'));
        }
    });
}

function parseCustomerInfo() {
    const pastedInfo = document.getElementById('customerInfoPaste').value.trim();
    
    if (!pastedInfo) {
        showMessage('请先粘贴客户信息', 'error');
        return;
    }
    
    try {
        const parsedInfo = extractCustomerInfo(pastedInfo);
        fillCustomerForm(parsedInfo);
        showMessage('客户信息解析成功！', 'success');
        
        // 清空输入框
        document.getElementById('customerInfoPaste').value = '';
    } catch (error) {
        showMessage('解析客户信息时出错，请检查格式是否正确', 'error');
        console.error('解析错误:', error);
    }
}

function extractCustomerInfo(text) {
    const info = {
        company: '',
        contact: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        email: '',
        country: ''
    };
    
    // 提取邮箱
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
        info.email = emailMatch[0];
    }
    
    // 提取电话号码
    const phoneRegex = /(?:Phone|Tel|Telephone)?\s*:?\s*(\+?\d[\d\s\-\(\)]{7,})/gi;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
        info.phone = phoneMatch[0].replace(/(?:Phone|Tel|Telephone)?\s*:?\s*/, '').trim();
    }
    
    // 提取邮政编码
    const postalRegex = /\b(\d{5}(-\d{4})?|\d{3}\s\d{2}\s\d{2}|[A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/g;
    const postalMatch = text.match(postalRegex);
    if (postalMatch) {
        info.postalCode = postalMatch[postalMatch.length - 1];
    }
    
    // 移除已提取的信息
    let remainingText = text;
    if (info.email) remainingText = remainingText.replace(info.email, '');
    if (info.phone) remainingText = remainingText.replace(phoneMatch[0], '');
    if (info.postalCode) remainingText = remainingText.replace(info.postalCode, '');
    
    // 提取国家
    for (const [countryName, countryCode] of Object.entries(countryCodes)) {
        if (remainingText.toLowerCase().includes(countryName.toLowerCase())) {
            info.country = countryName;
            remainingText = remainingText.replace(new RegExp(countryName, 'gi'), '');
            break;
        }
    }
    
    // 分割剩余文本
    const parts = remainingText.split(/[,\\n]+/).map(part => part.trim()).filter(part => part);
    
    if (parts.length >= 1) {
        // 第一部分通常是公司名
        info.company = parts[0];
    }
    
    if (parts.length >= 2) {
        // 第二部分可能是联系人或地址的一部分
        if (parts[1].length < 50 && !parts[1].match(/\d+/)) {
            info.contact = parts[1];
        } else {
            info.address = parts[1];
        }
    }
    
    // 处理地址信息
    let addressParts = [];
    for (let i = info.contact ? 2 : 1; i < parts.length; i++) {
        if (parts[i] && !parts[i].match(/^(Phone|Tel|Email|Mobile)/i)) {
            addressParts.push(parts[i]);
        }
    }
    
    if (addressParts.length > 0) {
        const addressText = addressParts.join(', ');
        
        // 尝试分离城市和地址
        const cityRegex = /(?:,\s*|\\n\s*)([A-Za-z\s]+?)(?:,\s*[A-Z]{2}|,\s*\d{5}|$)/;
        const cityMatch = addressText.match(cityRegex);
        
        if (cityMatch) {
            info.city = cityMatch[1].trim();
            info.address = addressText.replace(cityMatch[0], '').replace(/^[,\\s]+/, '').trim();
        } else {
            info.address = addressText;
        }
    }
    
    return info;
}

function fillCustomerForm(info) {
    if (info.company) document.getElementById('customerCompany').value = info.company;
    if (info.contact) document.getElementById('customerContact').value = info.contact;
    if (info.address) document.getElementById('customerAddress').value = info.address;
    if (info.city) document.getElementById('customerCity').value = info.city;
    if (info.postalCode) document.getElementById('customerPostalCode').value = info.postalCode;
    if (info.phone) document.getElementById('customerPhone').value = info.phone;
    if (info.email) document.getElementById('customerEmail').value = info.email;
    
    if (info.country) {
        const countrySelect = document.getElementById('customerCountry');
        for (let i = 0; i < countrySelect.options.length; i++) {
            if (countrySelect.options[i].text === info.country) {
                countrySelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // 重新生成发票编号
    generateInvoiceNumber();
}

function initializeProductRows() {
    const firstRow = document.querySelector('#productsTable tbody tr');
    if (firstRow) {
        calculateProductTotal(firstRow);
    }
    calculateGrandTotal();
    updateTotalPackages();
}

function addProductRow() {
    const tbody = document.querySelector('#productsTable tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'fade-in';
    
    newRow.innerHTML = `
        <td><input type="text" class="form-control form-control-sm product-name" required></td>
        <td><input type="text" class="form-control form-control-sm product-model" required></td>
        <td><input type="text" class="form-control form-control-sm product-hs" required></td>
        <td><input type="number" class="form-control form-control-sm product-quantity" min="1" value="1" required></td>
        <td><input type="number" class="form-control form-control-sm product-price" min="0" step="0.01" required></td>
        <td><input type="number" class="form-control form-control-sm product-total" min="0" step="0.01" readonly></td>
        <td><button type="button" class="btn btn-sm btn-outline-danger remove-product"><i class="bi bi-trash"></i></button></td>
    `;
    
    tbody.appendChild(newRow);
    productRowCounter++;
    
    // 添加动画效果
    setTimeout(() => {
        newRow.classList.add('fade-in');
    }, 10);
}

function removeProductRow(row) {
    const tbody = document.querySelector('#productsTable tbody');
    if (tbody.children.length > 1) {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            row.remove();
            calculateGrandTotal();
            updateTotalPackages();
        }, 300);
    } else {
        showMessage('至少需要保留一个产品行', 'error');
    }
}

function calculateProductTotal(row) {
    const quantity = parseFloat(row.querySelector('.product-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.product-price').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.product-total').value = total.toFixed(2);
}

function calculateGrandTotal() {
    const totalInputs = document.querySelectorAll('.product-total');
    let subtotal = 0;
    
    totalInputs.forEach(input => {
        subtotal += parseFloat(input.value) || 0;
    });
    
    const shippingFee = parseFloat(document.getElementById('shippingFee').value) || 0;
    const grandTotal = subtotal + shippingFee;
    
    const currency = document.getElementById('currency').value;
    const symbol = currencySymbols[currency];
    
    document.getElementById('subtotalAmount').textContent = `${symbol}${subtotal.toFixed(2)}`;
    document.getElementById('shippingAmount').textContent = `${symbol}${shippingFee.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `${symbol}${grandTotal.toFixed(2)}`;
}

function updateTotalPackages() {
    const quantityInputs = document.querySelectorAll('.product-quantity');
    let totalPackages = 0;
    
    quantityInputs.forEach(input => {
        totalPackages += parseInt(input.value) || 0;
    });
    
    document.getElementById('totalPackages').value = totalPackages;
}

function validateForm() {
    const requiredFields = [
        'customerCompany', 'customerContact', 'customerAddress',
        'customerCity', 'customerPhone', 'customerEmail',
        'customerCountry', 'deliveryMethod', 'paymentMethod', 'currency'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    // 验证产品信息
    const productRows = document.querySelectorAll('#productsTable tbody tr');
    let hasValidProduct = false;
    
    productRows.forEach(row => {
        const name = row.querySelector('.product-name').value.trim();
        const model = row.querySelector('.product-model').value.trim();
        const hsCode = row.querySelector('.product-hs').value.trim();
        const quantity = row.querySelector('.product-quantity').value;
        const price = row.querySelector('.product-price').value;
        
        if (name && model && hsCode && quantity && price) {
            hasValidProduct = true;
        }
    });
    
    if (!hasValidProduct) {
        showMessage('请至少填写一个完整的产品信息', 'error');
        isValid = false;
    }
    
    return isValid;
}

function generatePDF() {
    if (!validateForm()) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // 设置字体
        doc.setFont('helvetica');
        
        // 添加标题
        doc.setFontSize(24);
        doc.text('Invoice', 105, 20, { align: 'center' });
        
        // 添加发票信息
        doc.setFontSize(12);
        doc.text(`Invoice Number: ${document.getElementById('invoiceNumber').value}`, 20, 40);
        doc.text(`Date: ${document.getElementById('invoiceDate').value}`, 20, 50);
        
        // 添加公司信息
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Company Information:', 20, 70);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Dongguan Chuangjiang Electronic Co., Ltd.', 20, 80);
        doc.text('Contact: Eric Huang', 20, 87);
        doc.text('Phone: +86 180 2899 3261', 20, 94);
        
        // 添加客户信息
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Information:', 110, 70);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const customerInfo = [
            `Company: ${document.getElementById('customerCompany').value}`,
            `Contact: ${document.getElementById('customerContact').value}`,
            `Address: ${document.getElementById('customerAddress').value}`,
            `City: ${document.getElementById('customerCity').value}`,
            `Postal Code: ${document.getElementById('customerPostalCode').value}`,
            `Phone: ${document.getElementById('customerPhone').value}`,
            `Email: ${document.getElementById('customerEmail').value}`,
            `Country: ${document.getElementById('customerCountry').options[document.getElementById('customerCountry').selectedIndex].text}`
        ];
        
        customerInfo.forEach((info, index) => {
            doc.text(info, 110, 80 + (index * 7));
        });
        
        // 添加交货方式
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Delivery Method: ${document.getElementById('deliveryMethod').value}`, 20, 140);
        
        // 添加付款方式信息
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Payment Method: ${document.getElementById('paymentMethod').value}`, 20, 150);
        
        // 添加产品表格
        const products = [];
        const productRows = document.querySelectorAll('#productsTable tbody tr');
        const currency = document.getElementById('currency').value;
        const symbol = currencySymbols[currency];
        
        productRows.forEach(row => {
            const name = row.querySelector('.product-name').value.trim();
            const model = row.querySelector('.product-model').value.trim();
            const hsCode = row.querySelector('.product-hs').value.trim();
            const quantity = row.querySelector('.product-quantity').value;
            const price = row.querySelector('.product-price').value;
            const total = row.querySelector('.product-total').value;
            
            if (name && model && hsCode && quantity && price) {
                products.push([
                    name,
                    model,
                    hsCode,
                    'China', // 默认原产国
                    quantity,
                    `${symbol}${parseFloat(price).toFixed(2)}`,
                    `${symbol}${parseFloat(total).toFixed(2)}`
                ]);
            }
        });
        
        // 使用autoTable插件创建表格
        doc.autoTable({
            head: [['Product Name', 'Model', 'HS Code', 'Origin', 'Quantity', `Unit Price (${currency})`, `Total (${currency})`]],
            body: products,
            startY: 160,
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [67, 97, 238],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 25 },
                2: { cellWidth: 15 },
                3: { cellWidth: 15 },
                4: { cellWidth: 15 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 }
            }
        });
        
        // 添加费用明细
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        const subtotal = document.getElementById('subtotalAmount').textContent;
        const shipping = document.getElementById('shippingAmount').textContent;
        const total = document.getElementById('totalAmount').textContent;
        
        doc.text(`Subtotal: ${subtotal}`, 140, finalY);
        doc.text(`Shipping Fee: ${shipping}`, 140, finalY + 7);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`Total Amount: ${total}`, 140, finalY + 14);
        
        // 保存PDF
        const invoiceNumber = document.getElementById('invoiceNumber').value;
        doc.save(`invoice-${invoiceNumber}.pdf`);
        
        showLoading(false);
        showMessage('PDF发票生成成功！', 'success');
        
    } catch (error) {
        showLoading(false);
        showMessage('生成PDF时出错，请重试', 'error');
        console.error('PDF生成错误:', error);
    }
}

function showMessage(message, type) {
    // 移除现有消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 300);
    }, 3000);
}

function showLoading(show) {
    let loadingOverlay = document.querySelector('.loading-overlay');
    
    if (show) {
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(loadingOverlay);
        }
        loadingOverlay.style.display = 'flex';
    } else {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}