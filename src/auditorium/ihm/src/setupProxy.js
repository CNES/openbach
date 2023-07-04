const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (app) => {
    app.use(
        ['/openbach', '/kibana', '/chronograf'],
        createProxyMiddleware({
            target: 'http://172.20.34.75',
            changeOrigin: true,
        }),
    );
};
