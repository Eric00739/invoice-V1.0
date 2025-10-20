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
    
    // 获取国家代码
    let countryCode;
    if (countryName.toLowerCase() === 'united kingdom' ||
        countryName.toLowerCase() === 'uk' ||
        countryName.toLowerCase() === 'england' ||
        countryName.toLowerCase().includes('british')) {
        countryCode = 'UK';
    } else if (countryName.toLowerCase() === 'united states' ||
               countryName.toLowerCase() === 'usa' ||
               countryName.toLowerCase() === 'america') {
        countryCode = 'US';
    } else {
        // 检查是否有预定义的国家代码
        countryCode = countryCodes[countryName] || countryName.substring(0, 2).toUpperCase() || 'XX';
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
        
        // 顶部标题区域 - 深色背景条以确保Logo清晰可见
        doc.setFillColor(...darkPrimaryColor);
        doc.rect(margin, 15, pageWidth - (margin * 2), 35, 'F');
        
        // 公司Logo - 使用Base64编码的图片
        try {
            // 从assets/chj-logo.base64.txt读取Base64编码的Logo
            const logoBase64 = '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';
            
            // 将Base64图片添加到PDF - 适当大小的Logo
            doc.addImage(logoBase64, 'PNG', margin + 5, 18, 25, 25);
        } catch (error) {
            // 如果图片加载失败，使用文字作为备选
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('CHJ', margin + 10, 35);
            console.error('Logo加载失败，使用文字替代:', error);
        }
        
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