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
    
    // 运费、折扣和定制费用变化时重新计算总金额
    document.getElementById('shippingFee').addEventListener('input', calculateGrandTotal);
    document.getElementById('discount').addEventListener('input', calculateGrandTotal);
    document.getElementById('customFee').addEventListener('input', calculateGrandTotal);
    
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
    const customFee = parseFloat(document.getElementById('customFee').value) || 0;
    const grandTotal = subtotal + shippingFee + customFee - discountAmount;
    
    const currency = document.getElementById('currency').value;
    const symbol = currencySymbols[currency];
    
    // 格式化货币，使用紧凑格式避免分行
    function formatCurrency(amount) {
        // 对于大额数字，使用更紧凑的格式
        const numStr = amount.toFixed(2);
        if (amount >= 10000) {
            // 对于10000及以上的数字，不使用千位分隔符
            return `${symbol}${numStr}`;
        } else {
            // 对于较小的数字，使用千位分隔符
            const formattedAmount = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return `${symbol}${formattedAmount}`;
        }
    }
    
    document.getElementById('subtotalAmount').textContent = formatCurrency(subtotal);
    document.getElementById('shippingAmount').textContent = formatCurrency(shippingFee);
    document.getElementById('discountAmount').textContent = formatCurrency(discountAmount);
    document.getElementById('customFeeAmount').textContent = formatCurrency(customFee);
    document.getElementById('totalAmount').textContent = formatCurrency(grandTotal);
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
        
        // 蓝白极简风格色彩方案 - 增强层次感和品牌识别度
        const primaryColor = [30, 115, 190]; // 品牌蓝 (#1E73BE)
        const darkPrimaryColor = [0, 90, 167]; // 深品牌蓝 (#005AA7)
        const accentColor = [192, 57, 43]; // 强调红 (#C0392B)
        const blackColor = [51, 51, 51]; // 深黑色 (#333333)
        const darkGrayColor = [34, 34, 34]; // 深灰色 (#222222)
        const grayColor = [102, 102, 102]; // 中性灰 (#666666)
        const lightGrayColor = [245, 247, 250]; // 浅背景灰 (#F5F7FA)
        const borderColor = [226, 229, 233]; // 边框灰 (#E2E5E9)
        const alternateRowColor = [250, 250, 250]; // 隔行浅灰 (#FAFAFA)
        const headerBgColor = [234, 243, 251]; // 表头背景浅蓝 (#EAF3FB)
        const sectionBgColor = [247, 249, 252]; // 区块背景浅蓝 (#F7F9FC)
        const totalBgColor = [221, 235, 251]; // 总计背景浅蓝 (#DDEBFB)
        
        // 设置页边距 - 四周至少15mm留白
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);
        
        // 格式化货币，使用紧凑格式避免分行
        function formatCurrency(amount) {
            const currency = document.getElementById('currency').value;
            const symbol = currencySymbols[currency];
            // 对于大额数字，使用更紧凑的格式
            const numStr = amount.toFixed(2);
            if (amount >= 10000) {
                // 对于10000及以上的数字，不使用千位分隔符
                return `${symbol}${numStr}`;
            } else {
                // 对于较小的数字，使用千位分隔符
                const formattedAmount = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return `${symbol}${formattedAmount}`;
            }
        }
        
        // 顶部标题区域 - 品牌蓝背景条
        doc.setFillColor(...primaryColor);
        doc.rect(margin, 15, pageWidth - (margin * 2), 30, 'F');
        
        // 公司Logo - 白色文字
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('CHJ', margin + 10, 35);
        
        // INVOICE标题 - 白色文字，居中
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('INVOICE', pageWidth / 2, 35, { align: 'center' });
        
        // 发票号和日期 - 右上角，白色文字
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Invoice #: ${document.getElementById('invoiceNumber').value}`, pageWidth - margin - 10, 25, { align: 'right' });
        doc.text(`Date: ${document.getElementById('invoiceDate').value}`, pageWidth - margin - 10, 35, { align: 'right' });
        
        // Seller信息区域 - 左侧，区块背景浅蓝
        doc.setFillColor(...sectionBgColor);
        doc.rect(margin, 55, contentWidth * 0.48, 55, 'F');
        doc.setDrawColor(...borderColor);
        doc.rect(margin, 55, contentWidth * 0.48, 55);
        
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('SELLER', margin + 5, 65);
        
        doc.setTextColor(...blackColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Dongguan Chuangjiang Electronic Co., Ltd.', margin + 5, 73);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text('8th Floor, Building 1, Huawei Kegu Industrial Park', margin + 5, 80);
        doc.text('Dalingshan Town, Dongguan City', margin + 5, 86);
        doc.text('Guangdong Province, China', margin + 5, 92);
        doc.text('Contact: Eric Huang', margin + 5, 98);
        doc.text('+86 180 2899 3261', margin + 5, 104);
        
        // Buyer信息区域 - 右侧，相同宽度和左对齐
        const buyerX = margin + contentWidth * 0.52;
        doc.setFillColor(...sectionBgColor);
        doc.rect(buyerX, 55, contentWidth * 0.48, 55, 'F');
        doc.setDrawColor(...borderColor);
        doc.rect(buyerX, 55, contentWidth * 0.48, 55);
        
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('BUYER', buyerX + 5, 65);
        
        doc.setTextColor(...blackColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const customerCompany = document.getElementById('customerCompany').value;
        doc.text(customerCompany || 'Individual', buyerX + 5, 73);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        const customerContact = document.getElementById('customerContact').value;
        const customerAddress = document.getElementById('customerAddress').value;
        const customerCity = document.getElementById('customerCity').value;
        const customerCountry = document.getElementById('customerCountry').value;
        const customerPostalCode = document.getElementById('customerPostalCode').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const customerEmail = document.getElementById('customerEmail').value;
        const customerTaxId = document.getElementById('customerTaxId').value;
        
        doc.text(`Attn: ${customerContact}`, buyerX + 5, 80);
        doc.text(customerAddress, buyerX + 5, 86);
        doc.text(`${customerCity}, ${customerCountry} ${customerPostalCode}`, buyerX + 5, 92);
        doc.text(customerPhone, buyerX + 5, 98);
        if (customerTaxId) {
            doc.text(`Tax ID: ${customerTaxId}`, buyerX + 5, 104);
        }
        
        // 贸易条款
        doc.setTextColor(...blackColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Terms: ${document.getElementById('deliveryMethod').value} / ${document.getElementById('paymentMethod').value}`, margin, 120);
        
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
                    formatCurrency(parseFloat(price)),
                    formatCurrency(parseFloat(total))
                ]);
            }
        });
        
        // 优化的表格设计 - 国际标准，均匀列宽
        doc.autoTable({
            head: [['Product Name', 'Model', 'HS Code', 'Qty', `Unit Price (${currency})`, `Total (${currency})`]],
            body: products,
            startY: 123,
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 6,
                lineColor: [...borderColor],
                lineWidth: 0.1,
                minCellHeight: 12
            },
            headStyles: {
                fillColor: [...primaryColor],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 7
            },
            alternateRowStyles: {
                fillColor: [...alternateRowColor]
            },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.27, fontStyle: 'normal', halign: 'left' }, // Product Name
                1: { cellWidth: contentWidth * 0.17, fontSize: 8, halign: 'left' }, // Model - 稍宽
                2: { cellWidth: contentWidth * 0.16, halign: 'right', fontSize: 8 }, // HS Code
                3: { cellWidth: contentWidth * 0.12, halign: 'center' }, // Quantity
                4: { cellWidth: contentWidth * 0.14, halign: 'right' }, // Unit Price
                5: { cellWidth: contentWidth * 0.14, halign: 'right', fontStyle: 'bold', fillColor: [...lightGrayColor] } // Total
            },
            margin: { left: margin, right: margin }
        });
        
        // 费用汇总区域 - 专业布局，与表格主内容间留出15px间距
        const finalY = doc.lastAutoTable.finalY + 15;
        const totalsX = margin + contentWidth * 0.6;
        
        // 费用明细
        const subtotal = document.getElementById('subtotalAmount').textContent;
        const shipping = document.getElementById('shippingAmount').textContent;
        const discount = document.getElementById('discountAmount').textContent;
        const customFee = document.getElementById('customFeeAmount').textContent;
        const total = document.getElementById('totalAmount').textContent;
        const shippingFee = parseFloat(document.getElementById('shippingFee').value) || 0;
        const discountAmount = parseFloat(document.getElementById('discount').value) || 0;
        const customFeeAmount = parseFloat(document.getElementById('customFee').value) || 0;
        
        // 汇总背景
        doc.setFillColor(...lightGrayColor);
        doc.rect(totalsX, finalY, contentWidth * 0.4, 55, 'F');
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.rect(totalsX, finalY, contentWidth * 0.4, 55);
        
        // 费用明细文字 - 右对齐，统一格式
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text('Subtotal:', totalsX + 5, finalY + 12);
        doc.text(subtotal, totalsX + contentWidth * 0.4 - 5, finalY + 12, { align: 'right' });
        
        if (shippingFee > 0) {
            doc.text('Shipping:', totalsX + 5, finalY + 22);
            doc.text(shipping, totalsX + contentWidth * 0.4 - 5, finalY + 22, { align: 'right' });
        }
        
        if (customFeeAmount > 0) {
            doc.text('Custom Fee:', totalsX + 5, finalY + 32);
            doc.text(customFee, totalsX + contentWidth * 0.4 - 5, finalY + 32, { align: 'right' });
        }
        
        if (discountAmount > 0) {
            doc.setTextColor(...accentColor);
            doc.text('Discount:', totalsX + 5, finalY + 42);
            doc.text(discount, totalsX + contentWidth * 0.4 - 5, finalY + 42, { align: 'right' });
            doc.setTextColor(...grayColor);
        }
        
        // 总计 - 突出显示
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.line(totalsX, finalY + 48, totalsX + contentWidth * 0.4, finalY + 48);
        
        // 总计背景
        doc.setFillColor(...totalBgColor);
        doc.rect(totalsX, finalY + 48, contentWidth * 0.4, 12, 'F');
        
        doc.setTextColor(...darkPrimaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('TOTAL:', totalsX + 5, finalY + 56);
        doc.setFontSize(12);
        doc.text(total, totalsX + contentWidth * 0.4 - 5, finalY + 56, { align: 'right' });
        
        // 保存PDF
        const invoiceNumber = document.getElementById('invoiceNumber').value;
        doc.save(`${invoiceNumber}.pdf`);
        
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