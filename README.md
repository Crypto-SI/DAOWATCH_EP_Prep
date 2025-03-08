# DAO Watch Automation Tool

![DAO Watch Logo](https://via.placeholder.com/150?text=DAO+Watch)

## Overview

The DAO Watch Automation Tool revolutionizes how DAO governance proposals are researched and organized for the DAO Watch series. By automating data collection and integrating with Perplexity AI and the Notion API, it slashes manual effort by up to 70%, ensures data accuracy, and creates a scalable workflow for episode planning and content creation.

Say goodbye to tedious manual research and hello to a streamlined, automated process that frees up your time for what matters most—creating great content.

## Key Features

### Frontend (React.js)
- **Intuitive UI**: A sleek, mobile-optimized interface for submitting 3-4 DAO proposal links per batch
- **Episode Assignment**: Dropdown menu syncs with Notion to assign proposals to existing episodes or create new ones
- **Data Validation**: Post-processing review page to edit extracted data before Notion submission

### Backend (Node.js + Express)
- **AI-Driven Processing**: Perplexity AI-powered scraping and structuring of proposal data
- **Notion Integration**: Populates Notion database with structured data, grouped by episode
- **Robust Error Handling**: Manages invalid links or API failures with fallback mechanisms

### Data Organization (Notion)
Each episode is structured with:
- Episode Name
- Status (In Progress, Done, Planned)
- Priority (Yes, No)
- Archived status

Each proposal within an episode contains:
- DAO Name
- Proposal Title
- Single Sentence Summary
- Amount Requested
- Total Budget
- Daily Volume
- Pros and Cons analysis
- Voting Recommendation (Yes, No, Abstain)
- Status (Active, Passed, Rejected)
- Voting Deadline
- Original Link

Additionally, the system generates:
- Timestamps for video editing
- Marketing routine checklist

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Notion account with API access
- Perplexity AI API credentials

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/dao-watch-automation.git

# Install dependencies
cd dao-watch-automation
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Usage
1. Start the development server:
```bash
npm run dev
```
2. Open your browser and navigate to `http://localhost:3000`
3. Log in using OAuth (Google/Twitter)
4. Submit DAO proposal links and follow the guided workflow

## Technologies Used

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express
- **APIs**: Perplexity AI, Notion API
- **Deployment**: AWS/Vercel
- **Authentication**: OAuth 2.0

## Contributing

We welcome contributions to the DAO Watch Automation Tool! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please reach out to the project maintainers or open an issue on GitHub.

---

*Built with ❤️ for the DAO Watch team* 