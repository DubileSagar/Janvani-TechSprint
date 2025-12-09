export const civicIssues = [
    {
        id: 1,
        title: "Potholes & Road Damage",
        description: "Report damaged roads, potholes, and infrastructure issues affecting traffic safety.",
        icon: "🛣️",
        color: "#424242", 
        category: "Infrastructure"
    },
    {
        id: 2,
        title: "Street Lighting",
        description: "Report broken streetlights, dark areas, and lighting maintenance needs.",
        icon: "💡",
        color: "#FBC02D", 
        category: "Infrastructure"
    },
    {
        id: 3,
        title: "Waste Management",
        description: "Report overflowing bins, illegal dumping, and garbage collection issues.",
        icon: "🗑️",
        color: "#43A047", 
        category: "Sanitation"
    },
    {
        id: 4,
        title: "Water & Sewage",
        description: "Report water leaks, blocked drains, and sewage system problems.",
        icon: "💧",
        color: "#0288D1", 
        category: "Sanitation"
    },
    {
        id: 5,
        title: "Public Spaces",
        description: "Report issues with parks, playgrounds, and community facilities.",
        icon: "🌳",
        color: "#8E24AA", 
        category: "Community"
    },
    {
        id: 6,
        title: "Traffic & Safety",
        description: "Report traffic violations, missing signs, and safety hazards.",
        icon: "🚦",
        color: "#D32F2F", 
        category: "Safety"
    },
    {
        id: 7,
        title: "Sidewalk Maintenance",
        description: "Report broken sidewalks, missing pavers, and pedestrian obstructions.",
        icon: "🚶",
        color: "#795548", 
        category: "Infrastructure"
    },
    {
        id: 8,
        title: "Illegal Dumping",
        description: "Report large scale dumping of trash or debris in unauthorized areas.",
        icon: "🚯",
        color: "#33691E", 
        category: "Sanitation"
    },
    {
        id: 9,
        title: "Graffiti & Vandalism",
        description: "Report graffiti on public property or vandalism of civic assets.",
        icon: "🎨",
        color: "#607D8B", 
        category: "Safety"
    },
    {
        id: 10,
        title: "Abandoned Vehicles",
        description: "Report vehicles abandoned on public roads for long periods.",
        icon: "🚗",
        color: "#546E7A", 
        category: "Safety"
    },
    {
        id: 11,
        title: "Noise Complaints",
        description: "Report excessive noise from construction, loudspeakers, or events.",
        icon: "📢",
        color: "#F06292", 
        category: "Community"
    },
    {
        id: 12,
        title: "Broken Playground Equipment",
        description: "Report damaged swings, slides, or gym equipment in parks.",
        icon: "🎠",
        color: "#9C27B0", 
        category: "Community"
    },
    {
        id: 13,
        title: "Fallen Trees",
        description: "Report trees or branches blocking roads or posing danger.",
        icon: "🌲",
        color: "#2E7D32", 
        category: "Infrastructure"
    },
    {
        id: 14,
        title: "Flooding",
        description: "Report water logging or flooding on streets.",
        icon: "🌊",
        color: "#01579B", 
        category: "Infrastructure"
    },
    {
        id: 15,
        title: "Public Transport Issues",
        description: "Report issues with bus stops, schedules, or public transit facilities.",
        icon: "🚌",
        color: "#FF9800", 
        category: "Transport"
    },
    {
        id: 16,
        title: "Utility Pole Fire/Electrical Hazard",
        description: "Report short circuits, sparking wires, or fire on utility poles.",
        icon: "⚡️",
        color: "#BF360C", 
        category: "Safety"
    },
    {
        id: 17,
        title: "Others",
        description: "Any other civic issue not listed above.",
        icon: "‼️",
        color: "#9E9E9E", 
        category: "Other"
    }
];

export const getIssueTypeById = (id) => {
    return civicIssues.find(issue => String(issue.id) === String(id)) || civicIssues[16]; 
};

export const getIssueColor = (id) => {
    const issue = getIssueTypeById(id);
    return issue ? issue.color : '#9E9E9E';
};
