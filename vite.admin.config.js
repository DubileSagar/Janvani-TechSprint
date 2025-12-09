import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        basicSsl(),
        {
            name: 'index-html-rewrite',
            configureServer(server) {
                server.middlewares.use(async (req, res, next) => {
                    // Force serve admin.html for root and SPA routes
                    if (req.url === '/' || (!req.url.includes('.') && req.headers.accept?.includes('text/html'))) {
                        try {
                            const fs = await import('fs');
                            const path = await import('path');

                            // Read admin.html
                            const template = fs.readFileSync(resolve(__dirname, 'admin.html'), 'utf-8');

                            // Transform HTML (inject Vite scripts)
                            const html = await server.transformIndexHtml(req.url, template);

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'text/html');
                            res.end(html);
                            return;
                        } catch (e) {
                            console.error('Error serving admin.html:', e);
                            next(e);
                        }
                    }
                    next();
                });
            }
        }
    ],
    cacheDir: './node_modules/.vite_admin',
    server: {
        port: 5174,
        open: '/admin.html',
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                secure: false, // Allow self-signed certs
            },
        },
    },
    build: {
        rollupOptions: {
            input: {
                admin: resolve(__dirname, 'admin.html')
            }
        }
    }
})
