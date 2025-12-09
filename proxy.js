import http from 'http';
import httpProxy from 'http-proxy';

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({
    target: 'https://localhost:5173',
    secure: false, // Ignore self-signed certs
    changeOrigin: true
});

const server = http.createServer(function (req, res) {
    proxy.web(req, res);
});

console.log("Listening on http://localhost:5174 -> forwarding to https://localhost:5173");
server.listen(5174);
