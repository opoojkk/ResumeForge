const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * 自动检测系统中可用的 Chromium 内核浏览器路径
 * 优先级：环境变量 > Chrome > Edge > Puppeteer 默认
 */
function findBrowser() {
  // 1. 允许用户通过环境变量指定
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  if (process.platform === 'win32') {
    const prefixes = [
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
      process.env.LOCALAPPDATA,
    ].filter(Boolean);

    // Chrome 路径
    for (const prefix of prefixes) {
      const p = path.join(prefix, 'Google', 'Chrome', 'Application', 'chrome.exe');
      if (fs.existsSync(p)) return p;
    }

    // Edge 路径（Windows 10/11 自带）
    for (const prefix of prefixes) {
      const p = path.join(prefix, 'Microsoft', 'Edge', 'Application', 'msedge.exe');
      if (fs.existsSync(p)) return p;
    }
  } else if (process.platform === 'darwin') {
    const paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  } else {
    // Linux
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/microsoft-edge',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  }

  return null; // 回退到 Puppeteer 自带的 Chromium
}

(async () => {
  console.log('🚀 开始生成 PDF...');

  // 检查 out 目录是否存在
  const outDir = path.resolve(__dirname, '../out');
  if (!fs.existsSync(outDir)) {
    console.error('❌ 错误: out 目录不存在，请先运行 pnpm run build');
    process.exit(1);
  }

  const htmlPath = path.resolve(outDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ 错误: index.html 不存在');
    process.exit(1);
  }

  console.log('📄 HTML 文件路径:', htmlPath);

  const executablePath = findBrowser();
  if (executablePath) {
    console.log('🔍 使用浏览器:', executablePath);
  } else {
    console.log('🔍 使用 Puppeteer 内置 Chromium');
  }

  const launchOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOptions);

  console.log('🌐 启动浏览器...');

  const page = await browser.newPage();

  // 设置视口宽度为 A4 宽度 (210mm ≈ 794px at 96dpi)
  await page.setViewport({ width: 794, height: 1123 });

  // 访问本地 HTML 文件
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  console.log('⏳ 等待页面加载完成...');

  // 等待字体加载
  await page.evaluateHandle('document.fonts.ready');

  // 注入样式：隐藏编辑器面板和导出按钮，让简历内容独占页面
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏编辑器和导出按钮 */
      .resume-editor-panel,
      .btn-export-pdf-floating {
        display: none !important;
      }

      /* 重置布局：让简历预览区独占全部宽度 */
      .resume-layout {
        display: block !important;
        height: auto !important;
        overflow: visible !important;
      }

      .resume-preview {
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        padding: 0 !important;
        background: white !important;
        display: block !important;
      }

      /* 简历容器：去掉阴影和圆角，撑满宽度 */
      .resume-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 30px 20px !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: white !important;
        min-height: auto !important;
      }

      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
    `;
    document.head.appendChild(style);
  });

  // 等待样式生效
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 获取简历容器的实际内容高度
  const contentHeight = await page.evaluate(() => {
    const container = document.querySelector('.resume-container');
    if (!container) {
      throw new Error('找不到 .resume-container 元素');
    }
    return container.scrollHeight;
  });

  console.log(`📐 简历内容高度: ${contentHeight}px`);
  console.log('📝 生成 PDF...');

  // 生成 PDF：使用动态高度，一页装下所有内容
  const pdfPath = path.resolve(__dirname, '../resume.pdf');
  await page.pdf({
    path: pdfPath,
    printBackground: true,
    width: '210mm',
    height: `${contentHeight + 1}px`, // +1 避免精度问题导致多出一页空白
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
    },
    displayHeaderFooter: false,
    preferCSSPageSize: false,
  });

  console.log('✅ PDF 生成成功:', pdfPath);

  await browser.close();
  console.log('🎉 完成！');
})().catch((error) => {
  console.error('❌ 生成 PDF 时出错:', error);
  process.exit(1);
});
