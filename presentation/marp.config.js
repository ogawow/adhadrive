module.exports = {
  // Marpの設定
  theme: 'default',
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  
  // カスタムCSS
  css: `
    section {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    
    h1 {
      color: #007AFF;
      font-size: 2.5em;
      margin-bottom: 0.5em;
    }
    
    h2 {
      color: #1A1A1A;
      font-size: 1.8em;
      margin-bottom: 0.3em;
    }
    
    h3 {
      color: #666666;
      font-size: 1.3em;
      margin-bottom: 0.2em;
    }
    
    .highlight {
      background-color: #fff3cd;
      padding: 0.2em 0.4em;
      border-radius: 0.3em;
    }
    
    .important {
      color: #FF3B30;
      font-weight: bold;
    }
    
    .success {
      color: #28a745;
      font-weight: bold;
    }
    
    ul li {
      margin-bottom: 0.3em;
    }
    
    code {
      background-color: #f8f9fa;
      padding: 0.2em 0.4em;
      border-radius: 0.3em;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    
    pre {
      background-color: #f8f9fa;
      padding: 1em;
      border-radius: 0.5em;
      overflow-x: auto;
    }
  `,
  
  // 出力設定
  output: {
    format: 'html',
    filename: 'adhadrive_presentation.html'
  }
};
