# 外贸发票生成器

一个功能完整的外贸发票生成器，支持自动填充客户信息、生成专业PDF发票。

## 功能特点

### 🚀 核心功能
- **智能客户信息解析**：粘贴完整客户信息，自动解析并填充表单字段
- **自动发票编号生成**：格式为 `INV-国家缩写-日期-随机数`
- **专业PDF生成**：生成符合国际标准的发票PDF文件
- **多产品支持**：支持添加多个产品，自动计算总价
- **多货币支持**：支持USD、EUR、CNY三种货币报价
- **付款方式管理**：支持T/T、L/C、D/P、D/A等多种国际贸易付款方式
- **运费计算**：自动计算产品总额、运费和总金额
- **报关信息**：包含HS Code、原产国、包装件数等报关必需信息
- **表单验证**：确保所有必填字段完整填写

### 📋 表单字段
- **客户信息**：公司名、联系人、地址、城市、邮政编码、电话、邮箱、国家
- **交货方式**：EXW、FOB、DAP、DDP、CIF、CFR等国际贸易术语
- **付款方式**：T/T、L/C、D/P、D/A、Western Union、PayPal、支付宝、微信支付
- **货币选择**：USD美元、EUR欧元、CNY人民币
- **产品信息**：产品名称、型号、HS Code、原产国、包装件数、数量、单价、总价
- **费用明细**：产品总额、运费、总金额自动计算

### 🎨 用户界面
- 响应式设计，支持桌面和移动设备
- 专业的商务风格界面
- 清晰的表单布局和提示
- 实时计算和验证反馈

## 使用方法

### 1. 自动填充客户信息
在"客户信息自动填充"区域粘贴完整的客户信息，例如：
```
Acme Electronics, Inc. John Doe 1234 Elm Street, Suite 567 Los Angeles, CA 90001 Phone: +1 323-555-1234 Email: johndoe@acmeelectronics.com United States
```

点击"自动解析并填充表单"按钮，系统会自动解析并填充以下字段：
- 公司名称：Acme Electronics, Inc.
- 联系人：John Doe
- 地址：1234 Elm Street, Suite 567
- 城市：Los Angeles
- 邮政编码：90001
- 电话：+1 323-555-1234
- 邮箱：johndoe@acmeelectronics.com
- 国家：United States

### 2. 填写产品信息
- 在产品表格中填写产品信息
- 可以点击"添加产品"按钮添加更多产品
- 系统会自动计算每个产品的总价和所有产品的总金额

### 3. 选择货币和付款方式
- 选择报价货币（USD/EUR/CNY）
- 选择付款方式（T/T、L/C等）
- 输入运费（如适用）

### 4. 填写产品信息
- 在产品表格中填写产品信息
- 包含HS Code、原产国、包装件数等报关信息
- 可以点击"添加产品"按钮添加更多产品
- 系统会自动计算每个产品的总价和所有产品的总金额

### 5. 生成PDF发票
- 填写完所有必填信息后
- 点击"生成并下载PDF发票"按钮
- 系统会生成专业的PDF发票文件，文件名格式为 `invoice-[发票编号].pdf`
- PDF包含完整的费用明细和报关信息

## 技术实现

### 前端技术
- **HTML5**：语义化标记和表单结构
- **CSS3**：响应式设计和专业样式
- **JavaScript ES6+**：现代JavaScript功能实现
- **Bootstrap 5**：UI组件和响应式框架

### PDF生成
- **jsPDF**：PDF文档生成库
- **jsPDF-AutoTable**：表格生成插件

### 核心算法
- **正则表达式解析**：智能解析客户信息
- **发票编号生成**：基于国家代码和日期的唯一编号
- **多货币计算**：支持USD、EUR、CNY的动态计算
- **实时计算**：产品总价、运费和总金额的动态计算
- **报关信息处理**：HS Code、原产国、包装件数的标准化处理

## 文件结构

```
invoice-V1.0/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # JavaScript功能
└── README.md           # 说明文档
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 使用示例

### 客户信息解析示例
输入：
```
Tech Solutions GmbH Hans Mueller Hauptstraße 123 Berlin 10115 Phone: +49 30 12345678 Email: h.mueller@techsolutions.de Germany
```

自动解析结果：
- 公司名称：Tech Solutions GmbH
- 联系人：Hans Mueller
- 地址：Hauptstraße 123
- 城市：Berlin
- 邮政编码：10115
- 电话：+49 30 12345678
- 邮箱：h.mueller@techsolutions.de
- 国家：Germany

### 发票编号示例
- 美国客户：INV-US-181025-001
- 德国客户：INV-DE-181025-002
- 英国客户：INV-GB-181025-003

### 付款方式示例
- **T/T (Telegraphic Transfer)**：电汇，最常用的国际贸易付款方式
- **L/C (Letter of Credit)**：信用证，银行担保的付款方式
- **D/P (Documents Against Payment)**：付款交单
- **D/A (Documents Against Acceptance)**：承兑交单

### 报关信息示例
- **HS Code**：8542310000 (电子处理器)
- **原产国**：China
- **包装件数**：10 cartons
- **数量**：1000 pcs

## 更新日志

### v1.1.0 (2025-10-18)
- 新增多货币支持（USD/EUR/CNY）
- 新增付款方式管理功能
- 新增运费计算功能
- 新增报关信息字段（HS Code、原产国、包装件数）
- 优化PDF布局，包含费用明细
- 改进用户界面和响应式设计

### v1.0.0 (2025-10-18)
- 初始版本发布
- 实现客户信息自动解析功能
- 实现PDF发票生成功能
- 实现发票编号自动生成
- 添加表单验证和用户体验优化

## 许可证

MIT License

## 联系信息

如有问题或建议，请联系：
- 公司：Dongguan Chuangjiang Electronic Co., Ltd.
- 联系人：Eric Huang
- 电话：+86 180 2899 3261