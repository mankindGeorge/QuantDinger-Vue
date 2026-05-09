export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // 代理到 Cloudflare Tunnel 暴露的后端
  const backendUrl = 'https://api.quantdinger.31330715.xyz';
  const targetPath = url.pathname.replace(/^\/api/, '/api') + url.search;
  const targetUrl = backendUrl + targetPath;

  // 构建代理请求
  const headers = new Headers(request.headers);
  headers.set('Host', new URL(backendUrl).host);
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    // 复制响应
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // 添加 CORS 头
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return modifiedResponse;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
