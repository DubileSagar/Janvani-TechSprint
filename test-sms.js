// Native fetch is available in Node 18+
async function testSms() {
    try {
        console.log("Sending test SMS...");
        const response = await fetch('http://localhost:4000/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: '15806811252', // User's number
                message: 'Verifying Twilio Config: Hello! - Connect App'
            })
        });
        const data = await response.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

testSms();
