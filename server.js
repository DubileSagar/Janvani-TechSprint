import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';
import axios from 'axios';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

// Routes
app.get('/', (req, res) => {
    res.send('Citizen Connect API Server is running.');
});

app.post('/api/send-sms', async (req, res) => {
    console.log("Incoming SMS Request:", req.body);
    const { phone, message } = req.body;

    if (!phone || !message) {
        console.error("Missing phone/message");
        return res.status(400).json({ success: false, error: 'Phone and message are required.' });
    }

    if (!client) {
        console.warn("Twilio Credentials missing. Mocking SMS send.");
        console.log(`[MOCK SMS] To: ${phone}, Msg: ${message}`);
        return res.status(200).json({ success: true, mock: true, message: 'SMS logged (Twilio not configured)' });
    }

    try {
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        // Normalize phone number to E.164
        let cleanPhone = phone.replace(/\D/g, '');
        console.log(`📱 Original phone: ${phone}, Cleaned: ${cleanPhone}`);

        // If 10 digits, assume India (+91)
        if (cleanPhone.length === 10) {
            cleanPhone = `91${cleanPhone}`;
        }
        // If 12 digits and starts with 91, it's correct (just add +)
        // If other length, try as is (or default to 91 if reasonable?)

        const to = `+${cleanPhone}`;

        console.log(`📤 Sending SMS to: ${to} (from ${fromNumber})`);
        console.log(`📝 Message: ${message}`);

        const response = await client.messages.create({
            body: message,
            from: fromNumber,
            to: to
        });

        console.log(`✅ SMS Sent Successfully! SID: ${response.sid}`);
        res.json({ success: true, sid: response.sid });
    } catch (error) {
        console.error('❌ Twilio Error:', error.message);
        console.error('Error Code:', error.code);
        console.error('Error Details:', error);
        res.status(500).json({ success: false, error: error.message, code: error.code });
    }
});

// Get Public IP endpoint (to avoid CORS issues in frontend)
app.get('/api/get-ip', (req, res) => {
    try {
        const xForwardedFor = req.headers['x-forwarded-for'];
        // The x-forwarded-for header can contain multiple IPs (client, proxy1, proxy2...)
        // We want the first one (the client)
        let clientIp = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;

        // Normalize IPv6 localhost
        if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
            clientIp = '127.0.0.1';
        }

        console.log(`✅ IP detected (from headers): ${clientIp}`);
        res.json({ success: true, ip: clientIp });
    } catch (error) {
        console.error('IP detection error:', error);
        res.json({ success: false, ip: '', error: error.message });
    }
});

app.get('/api/check-access', async (req, res) => {
    // Priority: query param (for local dev testing) -> x-forwarded-for -> remoteAddress
    const queryIp = req.query.ip;
    let clientIp = queryIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Normalize IPv6 localhost
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
        clientIp = '127.0.0.1';
    }

    console.log(`🔍 [VPN Check] Source: ${queryIp ? 'Frontend' : 'Socket'} | IP: ${clientIp}`);

    // If Frontend failed to send IP (empty string) AND we are localhost, we might inadvertently allow.
    // However, if we block localhost, dev becomes impossible without internet.

    // MOCK MODE: Force block
    if (req.query.mock === 'vpn') {
        return res.status(403).json({
            success: false,
            error: 'VPN Detected (Mock)',
            details: { vpn: true }
        });
    }

    const API_TOKEN = process.env.VPN_API_TOKEN;
    if (!API_TOKEN) {
        console.warn("VPN Check Skipped: No VPN_API_TOKEN configured.");
        return res.json({ success: true, message: 'Skipped check' });
    }

    // 2. Call IPInfo API
    // https://ipinfo.io/<ip>/json?token=<token>

    try {
        const response = await axios.get(`https://ipinfo.io/${clientIp}/json?token=${API_TOKEN}`);
        const data = response.data;

        // IPInfo Privacy Detection
        // Note: Standard plans provide a 'privacy' object.

        if (data.privacy) {
            if (data.privacy.vpn || data.privacy.proxy || data.privacy.tor || data.privacy.hosting) {
                console.log(`❌ Blocked Access: ${clientIp} is Restricted (${JSON.stringify(data.privacy)})`);
                return res.status(403).json({
                    success: false,
                    error: 'Restricted Network Detected',
                    details: data.privacy
                });
            }
        } else {
            // Heuristic Fallback for Lite Tokens (No privacy field)
            // Check Org and Hostname for common Datacenter/VPN keywords
            const blockedKeywords = [
                'VPN', 'Proxy', // Keep these (Explicit)
                // Specific known VPN/Hosting providers
                'QuadraNet', 'HostPapa', 'DigitalOcean', 'Choopa', 'M247', 'LeaseWeb',
                'Vultr', 'Linode', 'Hetzner', 'OVH', 'Amazon', 'AWS', 'Google Cloud',
                'Azure', 'Oracle', 'Alibaba', 'M247', 'Tzulo', 'GSL Networks', 'Datacamp',
                'CDN77', 'Uninet', 'Psychz', 'FranTech', 'PONYNET', 'Melbikomas'
            ];

            const org = (data.org || '').toLowerCase();
            const hostname = (data.hostname || '').toLowerCase();

            const isSuspicious = blockedKeywords.some(keyword => {
                const k = keyword.toLowerCase();
                return org.includes(k) || hostname.includes(k);
            });

            if (isSuspicious) {
                console.log(`❌ Blocked Access (Heuristic): ${clientIp} matches '${org}'/'${hostname}'`);
                return res.status(403).json({
                    success: false,
                    error: 'Restricted Network Detected (Heuristic)',
                    details: { org: data.org, hostname: data.hostname }
                });
            }
        }

        console.log(`✅ Allowed Access: ${clientIp}`);
        res.json({ success: true, details: data });

    } catch (apiError) {
        console.error("IPInfo API Error:", apiError.message);
        // Allow access on API error
        res.json({ success: true, message: 'API check failed, allowing access' });
    }
});

app.listen(port, () => {
    console.log(`API Server running at http://0.0.0.0:${port}`);
});
