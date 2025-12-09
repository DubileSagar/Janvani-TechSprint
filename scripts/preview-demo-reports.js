import fs from 'fs';

// Configuration
const TARGET_USER_NAME = "Sagar";
// Placeholder ID - In a real scenario, we'd fetch this or ask the user. 
// For the preview, we'll use a placeholder.
const USER_ID = "REPLACE_WITH_ACTUAL_USER_ID";

const DISTRICTS = [
    { name: "Guntur", lat: 16.3067, lng: 80.4365 },
    { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
    { name: "Kurnool", lat: 15.8281, lng: 78.0373 },
    { name: "Tirupati", lat: 13.6288, lng: 79.4192 },
    { name: "Anantapur", lat: 14.6819, lng: 77.6006 }
];

const ISSUE_TYPES = [
    "Pothole", "Garbage Dump", "Water Leakage", "Broken Streetlight",
    "Illegal Parking", "Drainage Blockage", "Stray Animal Menace"
];

const STATUSES = ["open", "in-progress", "resolved"];

// Helper to get random float between min and max
function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    // .toFixed() returns string, so * 1 converts to number
}

// Helper to generate random coordinate near a center point (approx 5-10km radius)
function getRandomCoordinate(centerLat, centerLng) {
    const r = 0.05; // Roughly 5km
    const lat = centerLat + (Math.random() - 0.5) * r * 2;
    const lng = centerLng + (Math.random() - 0.5) * r * 2;
    return { lat, lng };
}

const reports = [];

DISTRICTS.forEach(district => {
    for (let i = 0; i < 20; i++) {
        const coords = getRandomCoordinate(district.lat, district.lng);
        const issueType = ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)];
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

        const report = {
            userId: USER_ID,
            name: TARGET_USER_NAME,
            issueTitle: `${issueType} in ${district.name}`,
            description: `This is a demo report for a ${issueType.toLowerCase()} observed in ${district.name}. Please attend to this.`,
            category: issueType,
            status: status,
            lat: coords.lat,
            lng: coords.lng,
            address: JSON.stringify({
                street: `${Math.floor(Math.random() * 100)}th Street`,
                city: district.name,
                district: district.name, // Important for our logic
                state: "Andhra Pradesh",
                country: "India",
                postalCode: "500000" // Dummy
            }),
            state: "Andhra Pradesh", // For the dual-write logic
            district: district.name,
            images: [], // Empty for demo
            imageId: "demo_image_id",
            $createdAt: new Date().toISOString(),
            upvotes: Math.floor(Math.random() * 50)
        };

        reports.push(report);
    }
});

// Output
const outputPath = 'demo_reports_preview.json';
fs.writeFileSync(outputPath, JSON.stringify(reports, null, 2));

console.log(`Generated ${reports.length} demo reports.`);
console.log(`Preview saved to ${outputPath}`);

// Print a summary for the user
console.log("\n--- Preview Summary ---");
DISTRICTS.forEach(d => {
    const count = reports.filter(r => r.district === d.name).length;
    console.log(`${d.name}: ${count} reports`);
    // Show one example
    const example = reports.find(r => r.district === d.name);
    console.log(`   Example: [${example.status.toUpperCase()}] ${example.issueTitle} @ ${example.lat.toFixed(4)}, ${example.lng.toFixed(4)}`);
});
