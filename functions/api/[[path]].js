export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // 后端地址
  const backendUrl = 'https://api.quantdinger.31330715.xyz';
  const targetUrl = backendUrl + url.pathname + url.search;

  // ===== 关键修复 1：处理 CORS 预检请求 =====
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // ===== 关键修复 2：正确复制请求头 =====
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // 跳过 Cloudflare 特有头
    if (!key.startsWith('cf-')) {
      headers.set(key, value);
    }
  });
  headers.set('Host', 'api.quantdinger.31330715.xyz');

  try {
    // ===== 关键修复 3：正确转发请求方法和 body =====
    const fetchOptions = {
      method: request.method,  // 必须显式指定方法
      headers: headers,
    };

    // 只有非 GET/HEAD 请求才添加 body
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // 克隆请求体
      fetchOptions.body = request.body;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // ===== 关键修复 4：复制响应并添加 CORS 头 =====
    const modifiedHeaders = new Headers(response.headers);
    modifiedHeaders.set('Access-Control-Allow-Origin', '*');
    modifiedHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    modifiedHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: modifiedHeaders,
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Backend unavailable',
      message: err.message 
    }), {
      status: 502,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
