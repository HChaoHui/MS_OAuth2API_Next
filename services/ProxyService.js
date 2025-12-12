const { SocksProxyAgent } = require('socks-proxy-agent');
const { fetch, ProxyAgent } = require('undici')
const { URL } = require('url');
const nodefetch = require('node-fetch');


const SocksAgent = (socks5) => {

    if (!socks5) {
        return null;
    }

    if (!socks5 || typeof socks5 !== 'string') {
        console.error('[SocksAgent] 错误: socks5 必须是字符串');
        return null;
    }

    let normalizedUrl = socks5.trim();
    if (!normalizedUrl.startsWith('socks5://')) {
        if (!normalizedUrl.includes('://')) {
            normalizedUrl = `socks5://${normalizedUrl}`;
            console.warn(`[SocksAgent] 警告: 自动添加协议前缀 -> ${normalizedUrl}`);
        } else {
            console.error('[SocksAgent] 错误: 仅支持 SOCKS5 协议');
            return null;
        }
    }

    try {
        const parsedUrl = new URL(normalizedUrl);

        const authInfo = parsedUrl.username && parsedUrl.password
            ? {
                username: decodeURIComponent(parsedUrl.username),
                password: decodeURIComponent(parsedUrl.password)
            }
            : undefined;

        const defaultOptions = {
            timeout: 10000,
            keepAlive: false,

            authentication: authInfo,

            socketOptions: {
                noDelay: true,
                keepAlive: false
            },

            lookup: undefined,
            shouldLookup: true
        };

        const finalOptions = {
            ...defaultOptions,
        };

        const agent = new SocksProxyAgent(normalizedUrl, finalOptions);

        agent.on('error', (error) => {
            console.error('[SocksAgent] 代理连接错误:', error.message);
        });

        console.log(`[SocksAgent] 代理创建成功: ${parsedUrl.hostname}:${parsedUrl.port}`);

        return agent;

    } catch (error) {
        console.error('[SocksAgent] 创建代理失败:', error.message);
        console.error('[SocksAgent] 原始URL:', socks5);
        return null;
    }
}

const HttpAgent = (http) => {

    if (!http) {
        return null;
    }
    return new ProxyAgent(http);

}

const autoAgent = (socks5, http) => {

    let agentOptions = {
        fetch,
        proxy: {}
    };

    if (socks5) {
        agentOptions.proxy.agent = SocksAgent(socks5);
        agentOptions.type = 'socks5';
        agentOptions.fetch = nodefetch;
    }

    if (http) {
        agentOptions.proxy.dispatcher = HttpAgent(http);
        agentOptions.type = 'http';
        agentOptions.fetch = fetch;
    }

    return agentOptions;

}

module.exports = {
    SocksAgent,
    HttpAgent,
    autoAgent,
}