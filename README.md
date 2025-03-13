# DAO Watch Automation Tool

![DAO Watch Logo](https://via.placeholder.com/150?text=DAO+Watch)

## Overview

The DAO Watch Automation Tool revolutionizes how DAO governance proposals are researched and organized for the DAO Watch series. By automating data collection and integrating with multiple AI services (QWQ, Llama, Sonar), it slashes manual effort by up to 70%, ensures data accuracy, and creates a scalable workflow for episode planning and content creation.

Say goodbye to tedious manual research and hello to a streamlined, automated process that frees up your time for what matters most—creating great content.

## Key Features

### Frontend (React.js)
- **Intuitive UI**: A sleek, mobile-optimized interface for submitting 3-4 DAO proposal links per batch
- **Episode Assignment**: Dropdown menu for assigning proposals to existing episodes or creating new ones
- **Data Validation**: Post-processing review page to edit extracted data before generating markdown
- **Markdown Viewer**: Built-in viewer for rendered markdown content with download capability
- **AI Service Selection**: Choose between multiple AI services (QWQ, Llama, Sonar) for proposal analysis

### Backend (Node.js + Express)
- **AI-Driven Processing**: Multiple AI integrations for scraping and structuring proposal data:
  - QWQ API integration for high-quality analysis
  - Llama integration for alternative processing
  - Sonar integration for specialized analysis
- **Markdown Generation**: Generates well-formatted markdown files from processed proposals
- **Robust Error Handling**: Manages invalid links or API failures with fallback mechanisms

### Data Organization
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
- QWQ AI API credentials (optional, for enhanced AI processing)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/dao-watch-automation.git

# Navigate to the project directory
cd dao-watch-automation

# Install server dependencies
cd server
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys (especially QWQ_API_KEY if using QWQ service)

# Return to project root and install client dependencies
cd ..
cd client
npm install
```

### Usage
1. Start the server:
```bash
# From the server directory
npm run dev
```

2. Start the client (in a new terminal):
```bash
# From the client directory
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

4. Follow the guided workflow:
   - Submit DAO proposal links
   - Select your preferred AI service
   - Review and edit the extracted data
   - Generate and download markdown files
   - View rendered markdown in the built-in viewer

## Workflow

1. **Submit Proposals**:
   - Enter 3-4 DAO proposal links
   - Select or create an episode
   - Choose your preferred AI service (QWQ/Llama/Sonar)
   - Submit for processing

2. **Review Data**:
   - Verify and edit the AI-extracted information
   - Navigate between proposals using the tabs
   - Edit any field as needed

3. **Generate Markdown**:
   - Click "View as Markdown" to see the formatted content
   - Opens in the built-in Markdown Viewer
   - Can download as a .md file for your content workflow

4. **Download Show Notes**:
   - Click "Download Show Notes" to save the markdown file locally
   - Perfect for importing into your preferred editing tool

## Technologies Used

- **Frontend**: React.js, Tailwind CSS, React Router
- **Backend**: Node.js, Express
- **AI Services**: QWQ API, Llama (mock), Sonar (mock)
- **Markdown**: React-Markdown for rendering

## Troubleshooting

### Port Conflicts
If you encounter port conflicts when starting the application:

1. Kill processes using the ports:
```bash
# Find processes using ports 3000 and 5001
lsof -i :3000 -i :5001

# Kill processes by PID
kill -9 <PID>
```

2. Restart the application as described in the Usage section

### API Connection Issues
If you encounter issues with the AI services:

1. Check that your API keys are correctly set in the `.env` file
2. Verify that the server is running on port 5001
3. Check that the client's proxy setting in `package.json` points to `http://localhost:5001`
4. Use the API Test tool on the home page to verify connectivity

## Future Development
- **AI-Powered Discussion**: Ability to discuss proposals with reasoning AI for deeper analysis
- **Favicon Improvements**: Enhanced favicon implementation for better cross-browser compatibility
- **User Authentication**: Token-gated crypto wallet login for secure access
- **Automated Media Generation**: Text-to-speech and podcast generation based on processed proposals
- Integration with additional AI services
- PDF export capability
- Enhanced markdown editing features
- Collaboration tools for team workflows

## Contributing

We welcome contributions to the DAO Watch Automation Tool! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please reach out to the project maintainers or open an issue on GitHub.

---

*Built with ❤️ for the DAO Watch team* 