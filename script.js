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
    
    // 为初始产品行添加HS Code自动填充功能
    const initialProductNameSelect = document.querySelector('.product-name');
    const initialHsCodeSelect = document.querySelector('.product-hs');
    
    if (initialProductNameSelect && initialHsCodeSelect) {
        initialProductNameSelect.addEventListener('change', function() {
            const selectedProduct = this.value;
            if (selectedProduct === 'Gate Remote') {
                initialHsCodeSelect.value = '8526920000';
            } else if (selectedProduct === 'Gate Receiver') {
                initialHsCodeSelect.value = '8529909090';
            }
        });
    }
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
    const countryInput = document.getElementById('customerCountry');
    const countryName = countryInput.value.trim() || 'International';
    
    // 特殊处理英国，确保使用UK而不是UN
    let countryCode;
    if (countryName.toLowerCase() === 'united kingdom' ||
        countryName.toLowerCase() === 'uk' ||
        countryName.toLowerCase() === 'england' ||
        countryName.toLowerCase().includes('british')) {
        countryCode = 'UK';
    } else {
        // 从国家名称生成简码
        countryCode = countryName.substring(0, 2).toUpperCase() || 'XX';
    }
    
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
    // 客户信息输入框自动解析
    document.getElementById('customerInfoPaste').addEventListener('input', function() {
        // 延迟执行，避免频繁解析
        clearTimeout(this.parseTimeout);
        this.parseTimeout = setTimeout(() => {
            parseCustomerInfo();
        }, 1000); // 1秒后自动解析
    });
    
    // 解析客户信息按钮（保留手动触发）
    document.getElementById('parseCustomerInfo').addEventListener('click', parseCustomerInfo);
    
    // 添加产品按钮
    document.getElementById('addProduct').addEventListener('click', addProductRow);
    
    // 生成PDF按钮
    document.getElementById('generatePDF').addEventListener('click', generatePDF);
    
    // 国家输入变化时重新生成发票编号
    document.getElementById('customerCountry').addEventListener('input', generateInvoiceNumber);
    
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
    
    // 运费和折扣变化时重新计算总金额
    document.getElementById('shippingFee').addEventListener('input', calculateGrandTotal);
    document.getElementById('discount').addEventListener('input', calculateGrandTotal);
    
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
        return; // 静默返回，不显示错误
    }
    
    try {
        const parsedInfo = extractCustomerInfo(pastedInfo);
        fillCustomerForm(parsedInfo);
        showMessage('客户信息解析成功！', 'success');
        
        // 清空输入框
        document.getElementById('customerInfoPaste').value = '';
    } catch (error) {
        // 静默处理错误，不显示错误信息
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
        country: '',
        taxId: ''
    };
    
    // 提取税号 (VAT/TAX ID)
    const taxIdRegex = /(?:VAT|TAX|Tax\s*ID|税号)?\s*:?\s*([A-Z0-9]{8,15})/gi;
    const taxIdMatch = text.match(taxIdRegex);
    if (taxIdMatch) {
        info.taxId = taxIdMatch[0].replace(/(?:VAT|TAX|Tax\s*ID|税号)?\s*:?\s*/, '').trim();
    }
    
    // 提取邮箱
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
        info.email = emailMatch[0];
    }
    
    // 提取电话号码 - 支持更多格式
    const phoneRegex = /(?:Phone|Tel|Telephone|Mobile|电话|手机)?\s*:?\s*(\+?\d[\d\s\-\(\)]{7,})/gi;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
        info.phone = phoneMatch[0].replace(/(?:Phone|Tel|Telephone|Mobile|电话|手机)?\s*:?\s*/, '').trim();
    }
    
    // 提取邮政编码 - 支持更多国际格式
    const postalRegex = /\b(\d{5}(-\d{4})?|\d{3}\s\d{2}\s\d{2}|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[A-Z]{2}\d{2}\s?\d{2}[A-Z]{2})\b/g;
    const postalMatch = text.match(postalRegex);
    if (postalMatch) {
        info.postalCode = postalMatch[postalMatch.length - 1];
    }
    
    // 移除已提取的信息
    let remainingText = text;
    if (info.email) remainingText = remainingText.replace(info.email, '');
    if (info.phone) remainingText = remainingText.replace(phoneMatch[0], '');
    if (info.postalCode) remainingText = remainingText.replace(info.postalCode, '');
    if (info.taxId) remainingText = remainingText.replace(taxIdMatch[0], '');
    
    // 提取国家 - 支持更多国家名称
    const countryPatterns = [
        { name: 'United States', patterns: ['USA', 'US', 'United States', 'America'] },
        { name: 'United Kingdom', patterns: ['UK', 'GB', 'United Kingdom', 'England'] },
        { name: 'Germany', patterns: ['Germany', 'Deutschland', 'DE'] },
        { name: 'France', patterns: ['France', 'FR'] },
        { name: 'Italy', patterns: ['Italy', 'Italia', 'IT'] },
        { name: 'Spain', patterns: ['Spain', 'España', 'ES'] },
        { name: 'Canada', patterns: ['Canada', 'CA'] },
        { name: 'Australia', patterns: ['Australia', 'AU'] },
        { name: 'Japan', patterns: ['Japan', 'JP', '日本'] },
        { name: 'South Korea', patterns: ['South Korea', 'Korea', 'KR', '韩国'] },
        { name: 'China', patterns: ['China', 'CN', '中国'] },
        { name: 'India', patterns: ['India', 'IN'] },
        { name: 'Singapore', patterns: ['Singapore', 'SG'] },
        { name: 'Netherlands', patterns: ['Netherlands', 'NL', 'Holland'] }
    ];
    
    for (const country of countryPatterns) {
        for (const pattern of country.patterns) {
            if (remainingText.toLowerCase().includes(pattern.toLowerCase())) {
                info.country = country.name;
                remainingText = remainingText.replace(new RegExp(pattern, 'gi'), '');
                break;
            }
        }
        if (info.country) break;
    }
    
    // 分割剩余文本
    const parts = remainingText.split(/[,;\n]+/).map(part => part.trim()).filter(part => part);
    
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
        if (parts[i] && !parts[i].match(/^(Phone|Tel|Email|Mobile|电话|手机)/i)) {
            addressParts.push(parts[i]);
        }
    }
    
    if (addressParts.length > 0) {
        const addressText = addressParts.join(', ');
        
        // 尝试分离城市和地址
        const cityRegex = /(?:,\s*|\n\s*)([A-Za-z\s\u4e00-\u9fa5]+?)(?:,\s*[A-Z]{2}|,\s*\d{5}|$)/;
        const cityMatch = addressText.match(cityRegex);
        
        if (cityMatch) {
            info.city = cityMatch[1].trim();
            info.address = addressText.replace(cityMatch[0], '').replace(/^[,\s]+/, '').trim();
        } else {
            info.address = addressText;
        }
    }
    
    return info;
}

function fillCustomerForm(info) {
    // 只在字段为空时填充，避免覆盖用户已输入的内容
    if (info.company && !document.getElementById('customerCompany').value) {
        document.getElementById('customerCompany').value = info.company;
    }
    if (info.contact && !document.getElementById('customerContact').value) {
        document.getElementById('customerContact').value = info.contact;
    }
    if (info.address && !document.getElementById('customerAddress').value) {
        document.getElementById('customerAddress').value = info.address;
    }
    if (info.city && !document.getElementById('customerCity').value) {
        document.getElementById('customerCity').value = info.city;
    }
    if (info.postalCode && !document.getElementById('customerPostalCode').value) {
        document.getElementById('customerPostalCode').value = info.postalCode;
    }
    if (info.phone && !document.getElementById('customerPhone').value) {
        document.getElementById('customerPhone').value = info.phone;
    }
    if (info.email && !document.getElementById('customerEmail').value) {
        document.getElementById('customerEmail').value = info.email;
    }
    if (info.taxId && !document.getElementById('customerTaxId').value) {
        document.getElementById('customerTaxId').value = info.taxId;
    }
    if (info.country && !document.getElementById('customerCountry').value) {
        document.getElementById('customerCountry').value = info.country;
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
        <td>
            <select class="form-control form-control-sm product-name" required>
                <option value="">选择产品</option>
                <option value="Gate Remote">Gate Remote</option>
                <option value="Gate Receiver">Gate Receiver</option>
                <option value="Gate remote and receiver kit">Gate remote and receiver kit</option>
                <option value="Wifi Switch">Wifi Switch</option>
                <option value="Wifi Socket">Wifi Socket</option>
                <option value="Infrared Beam Detector">Infrared Beam Detector</option>
            </select>
        </td>
        <td><input type="text" class="form-control form-control-sm product-model" required></td>
        <td>
            <select class="form-control form-control-sm product-hs" required>
                <option value="">选择或输入</option>
                <option value="8526920000">8526920000</option>
                <option value="8529909090">8529909090</option>
            </select>
        </td>
        <td class="d-flex gap-1">
            <input type="number" class="form-control form-control-sm product-quantity" min="1" value="1" required style="width: 60px;">
            <select class="form-control form-control-sm product-unit" required style="width: 60px;">
                <option value="pcs">pcs</option>
                <option value="set">set</option>
            </select>
        </td>
        <td><input type="number" class="form-control form-control-sm product-price" min="0" step="0.01" required></td>
        <td><input type="number" class="form-control form-control-sm product-total" min="0" step="0.01" readonly></td>
        <td><button type="button" class="btn btn-sm btn-outline-danger remove-product"><i class="bi bi-trash"></i></button></td>
    `;
    
    tbody.appendChild(newRow);
    productRowCounter++;
    
    // 添加产品名称变化事件，自动填充HS Code
    const productNameSelect = newRow.querySelector('.product-name');
    const hsCodeSelect = newRow.querySelector('.product-hs');
    
    productNameSelect.addEventListener('change', function() {
        const selectedProduct = this.value;
        if (selectedProduct === 'Gate Remote') {
            hsCodeSelect.value = '8526920000';
        } else if (selectedProduct === 'Gate Receiver') {
            hsCodeSelect.value = '8529909090';
        }
    });
    
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
    const discountAmount = parseFloat(document.getElementById('discount').value) || 0;
    const grandTotal = subtotal + shippingFee - discountAmount;
    
    const currency = document.getElementById('currency').value;
    const symbol = currencySymbols[currency];
    
    document.getElementById('subtotalAmount').textContent = `${symbol}${subtotal.toFixed(2)}`;
    document.getElementById('shippingAmount').textContent = `${symbol}${shippingFee.toFixed(2)}`;
    document.getElementById('discountAmount').textContent = `${symbol}${discountAmount.toFixed(2)}`;
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
        'customerContact', 'customerAddress',
        'customerCity', 'customerCountry', 'customerPostalCode',
        'customerPhone', 'deliveryMethod', 'paymentMethod', 'currency'
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
        
        // 专业商务风格色彩方案
        const primaryColor = [41, 98, 155]; // 深蓝色，企业色
        const blackColor = [33, 33, 33]; // 深黑色
        const grayColor = [102, 102, 102]; // 中性灰
        const lightGrayColor = [245, 245, 245]; // 浅灰色背景
        const borderColor = [220, 220, 220]; // 边框色
        
        // 简版公司Logo (文字Logo)
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('CHJ', 20, 20);
        
        // 顶部标题区域 - 更清晰的层次
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.text('INVOICE', 20, 38);
        
        // 发票号和日期 - 右上角对齐到版面右边缘
        doc.setTextColor(...grayColor);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Invoice #: ${document.getElementById('invoiceNumber').value}`, 195, 25, { align: 'right' });
        doc.text(`Date: ${document.getElementById('invoiceDate').value}`, 195, 32, { align: 'right' });
        
        // 品牌装饰线
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(2);
        doc.line(20, 45, 65, 45);
        
        // Seller信息区域 - 添加背景
        doc.setFillColor(...lightGrayColor);
        doc.roundedRect(15, 55, 85, 50, 3, 3, 'F');
        doc.setDrawColor(...borderColor);
        doc.roundedRect(15, 55, 85, 50, 3, 3);
        
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('SELLER', 20, 65);
        
        doc.setTextColor(...blackColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Dongguan Chuangjiang Electronic Co., Ltd.', 20, 73);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...grayColor);
        doc.text('8th Floor, Building 1, Huawei Kegu Industrial Park', 20, 80);
        doc.text('Dalingshan Town, Dongguan City', 20, 86);
        doc.text('Guangdong Province, China', 20, 92);
        doc.text('Contact: Eric Huang | +86 180 2899 3261', 20, 98);
        
        // Buyer信息区域 - 添加背景
        doc.setFillColor(...lightGrayColor);
        doc.roundedRect(110, 55, 85, 50, 3, 3, 'F');
        doc.setDrawColor(...borderColor);
        doc.roundedRect(110, 55, 85, 50, 3, 3);
        
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('BUYER', 115, 65);
        
        doc.setTextColor(...blackColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const customerCompany = document.getElementById('customerCompany').value;
        doc.text(customerCompany || 'Individual', 115, 73);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...grayColor);
        const customerContact = document.getElementById('customerContact').value;
        const customerAddress = document.getElementById('customerAddress').value;
        const customerCity = document.getElementById('customerCity').value;
        const customerCountry = document.getElementById('customerCountry').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const customerEmail = document.getElementById('customerEmail').value;
        const customerTaxId = document.getElementById('customerTaxId').value;
        
        doc.text(`Attn: ${customerContact}`, 115, 80);
        doc.text(customerAddress, 115, 86);
        doc.text(`${customerCity}, ${customerCountry}`, 115, 92);
        doc.text(customerPhone, 115, 98);
        if (customerTaxId) {
            doc.text(`Tax ID: ${customerTaxId}`, 115, 104);
        }
        if (customerEmail) {
            doc.text(customerEmail, 115, 110);
        }
        
        // 贸易条款
        doc.setTextColor(...blackColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Terms: ${document.getElementById('deliveryMethod').value} / ${document.getElementById('paymentMethod').value}`, 20, 120);
        
        // 产品表格
        const products = [];
        const productRows = document.querySelectorAll('#productsTable tbody tr');
        const currency = document.getElementById('currency').value;
        const symbol = currencySymbols[currency];
        
        productRows.forEach(row => {
            const name = row.querySelector('.product-name').value.trim();
            const model = row.querySelector('.product-model').value.trim();
            const hsCode = row.querySelector('.product-hs').value.trim();
            const unit = row.querySelector('.product-unit').value;
            const quantity = row.querySelector('.product-quantity').value;
            const price = row.querySelector('.product-price').value;
            const total = row.querySelector('.product-total').value;
            
            if (name && model && hsCode && quantity && price) {
                products.push([
                    name,
                    model,
                    hsCode,
                    `${quantity} ${unit}`,
                    `${symbol}${parseFloat(price).toFixed(2)}`,
                    `${symbol}${parseFloat(total).toFixed(2)}`
                ]);
            }
        });
        
        // 优化的表格设计 - 增加行距，统一字体
        doc.autoTable({
            head: [['Product Name', 'Model', 'HS Code', 'Qty', `Price (${currency})`, `Total (${currency})`]],
            body: products,
            startY: 130,
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 6, // 增加内边距
                lineColor: [...borderColor],
                lineWidth: 0.2,
                minCellHeight: 12 // 增加最小行高
            },
            headStyles: {
                fillColor: [...primaryColor],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 7
            },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            },
            columnStyles: {
                0: { cellWidth: 38, fontStyle: 'normal' }, // Product Name - 更窄
                1: { cellWidth: 22, fontSize: 8 }, // Model - 更窄，字体更小
                2: { cellWidth: 35, halign: 'right', fontSize: 8 }, // HS Code - 更宽，右对齐，字体更小
                3: { cellWidth: 22, halign: 'center' }, // Qty - 稍宽
                4: { cellWidth: 31, halign: 'right' }, // Price
                5: {
                    cellWidth: 27,
                    halign: 'right',
                    fontStyle: 'bold',
                    fillColor: [240, 240, 240] // Total列背景稍深
                }
            },
            margin: { left: 15, right: 15 }
        });
        
        // 费用汇总区域 - 增加留白
        const finalY = doc.lastAutoTable.finalY + 20;
        
        // 汇总背景
        doc.setFillColor(...lightGrayColor);
        doc.roundedRect(130, finalY, 60, 40, 3, 3, 'F');
        doc.setDrawColor(...borderColor);
        doc.roundedRect(130, finalY, 60, 40, 3, 3);
        
        // 费用明细
        const subtotal = document.getElementById('subtotalAmount').textContent;
        const shipping = document.getElementById('shippingAmount').textContent;
        const discount = document.getElementById('discountAmount').textContent;
        const total = document.getElementById('totalAmount').textContent;
        const shippingFee = parseFloat(document.getElementById('shippingFee').value) || 0;
        const discountAmount = parseFloat(document.getElementById('discount').value) || 0;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text('Subtotal:', 135, finalY + 12);
        doc.text(subtotal, 185, finalY + 12, { align: 'right' });
        
        if (shippingFee > 0) {
            doc.text('Shipping:', 135, finalY + 20);
            doc.text(shipping, 185, finalY + 20, { align: 'right' });
        }
        
        if (discountAmount > 0) {
            doc.text('Discount:', 135, finalY + 28);
            doc.text(discount, 185, finalY + 28, { align: 'right' });
        }
        
        // 总计 - 突出显示
        doc.setFillColor(...primaryColor);
        doc.roundedRect(130, finalY + 30, 60, 10, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL:', 135, finalY + 37);
        doc.setFontSize(13);
        doc.text(total, 185, finalY + 37, { align: 'right' });
        
        // 页脚 - 品牌信息
        const footerY = 270;
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(20, footerY, 190, footerY);
        
        doc.setTextColor(...grayColor);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('Creating More Value for Customers', 105, footerY + 8, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.text('Website: www.chjremote.com | Email: sales@chjremote.com', 105, footerY + 14, { align: 'center' });
        
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