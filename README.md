# 🏙️ JANVANI– Crowdsourced Civic Issue Reporting System


---

## 📌 Project Overview

**JANVANI** is a web-based civic issue reporting and resolution platform designed to bridge the gap between citizens and local authorities. The platform enables users to report civic problems such as potholes, garbage, water issues, streetlight failures, etc., using images, geolocation, and structured issue categorization.

The system ensures **transparency, accountability, and efficient grievance redressal** through real-time dashboards, role-based access, and data-driven insights.

---

## 🚀 Key Features

### 👥 Citizen Features

* 📍 Report civic issues with location, images, and description
* 📊 Track complaint status in real time
* 👍 Upvote existing issues to increase priority
* 🗺️ Map-based issue visualization
* 🌐 Multilingual support

### 🛠️ Admin & Authority Dashboard

* 📋 View and manage reported issues
* 🧭 District-wise and category-wise analytics
* 🧠 Smart filtering & prioritization
* 📈 Custom reports and insights
* 🔐 Role-based admin access

### 🔒 Security & Reliability

* Role-based access control (RBAC)
* Secure API communication
* Data validation & integrity checks
* Scalable and modular architecture

---

## 🧱 Tech Stack

### Frontend

* React.js (Vite)
* HTML5, CSS3, JavaScript
* Context API
* Responsive UI

### Backend & Services

* Node.js
* Express.js
* Appwrite (Auth + Database)

### Additional Tools

* Map integration for geo-location
* ESLint for code quality
* Modular architecture for scalability

---

## 📁 Project Structure

```
JANVANI-TechSprint/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── data/
│   └── utils/
│
├── public/
├── server.js
├── package.json
├── proxy.js
├── README.md
├── SETUP_APPWRITE.md
└── FIX_PERMISSIONS.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js (v18+ recommended)
* npm or yarn
* Appwrite instance (local or cloud)

### Steps to Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git

# Navigate to project directory
cd JANVANI-TechSprint 

# Install dependencies
npm install

# Start development server
npm run dev
```

➡️ Open in browser: `http://localhost:5173`

---

## 🔐 Environment Configuration

Create a `.env` file and configure the following:

```
VITE_APPWRITE_ENDPOINT=
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=
VITE_APPWRITE_COLLECTION_ID=
```

Refer to `SETUP_APPWRITE.md` for full configuration instructions.

---

## 🧠 Problem Statement (SIH 2025)

**Title:** Crowdsourced Civic Issue Reporting and Resolution System
**Theme:** Clean & Green Technology

The project aims to create a transparent, scalable, and citizen-centric platform that enables efficient issue reporting, tracking, and resolution by local authorities.

---

## 🏆 Achievements

* ✅ Selected for **Smart India Hackathon 2025 – Grand Finale**
* 🏅 Represented **Team Sankalp_ (Team ID: 63008)**
* 💡 Designed with real-world scalability and governance in mind

---

## 🚀 Future Enhancements

* AI-based issue validation & classification
* Fake report detection using ML
* Heatmap-based civic analytics
* Mobile application (React Native)
* Integration with government portals

---

## 🤝 Team Sankalp_

A passionate team committed to building impactful civic-tech solutions for a smarter and cleaner India 🇮🇳

---

## 📄 License

This project is developed for academic and hackathon purposes. Usage beyond this scope requires prior permission.


