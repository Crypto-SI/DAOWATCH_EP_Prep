require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Client } = require('@notionhq/client');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize Notion client (if API key is available)
let notionClient;
if (process.env.NOTION_API_KEY) {
  notionClient = new Client({
    auth: process.env.NOTION_API_KEY,
  });
}

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Get episodes from Notion
app.get('/api/episodes', async (req, res) => {
  try {
    if (!notionClient) {
      // Return mock data if Notion client is not initialized
      return res.status(200).json({
        success: true,
        data: [
          { id: 1, name: 'Episode 1: DAO Governance Trends' },
          { id: 2, name: 'Episode 2: DeFi Protocol Updates' },
          { id: 3, name: 'Episode 3: NFT Marketplace Governance' },
        ],
      });
    }

    // In a real app, this would query the Notion database
    // const response = await notionClient.databases.query({
    //   database_id: process.env.NOTION_DATABASE_ID,
    //   filter: {
    //     property: 'Type',
    //     select: {
    //       equals: 'Episode',
    //     },
    //   },
    // });

    // Mock response for now
    res.status(200).json({
      success: true,
      data: [
        { id: 1, name: 'Episode 1: DAO Governance Trends' },
        { id: 2, name: 'Episode 2: DeFi Protocol Updates' },
        { id: 3, name: 'Episode 3: NFT Marketplace Governance' },
      ],
    });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch episodes',
      error: error.message,
    });
  }
});

// Process proposal links
app.post('/api/proposals/process', async (req, res) => {
  try {
    const { proposalLinks, episodeName, episodeStatus, episodePriority, episodeArchived, newEpisode } = req.body;

    if (!proposalLinks || proposalLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No proposal links provided',
      });
    }

    // In a real app, this would:
    // 1. Use Perplexity AI to scrape and process each link
    // 2. Extract structured data from the proposals
    // 3. Return the processed data for validation

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mock processed data
    const processedProposals = proposalLinks.map((link, index) => ({
      id: `proposal-${index}`,
      originalLink: link,
      title: `Example DAO Proposal ${index + 1}`,
      daoName: `DAO ${String.fromCharCode(65 + index)}`, // A, B, C, etc.
      status: ['Active', 'Passed', 'Rejected'][Math.floor(Math.random() * 3)],
      singleSentenceSummary: `Brief summary of proposal ${index + 1}.`,
      amountRequested: `${Math.floor(Math.random() * 1000)} Tokens`,
      totalBudget: `${Math.floor(Math.random() * 10000)} USD`,
      dailyVolume: `${Math.floor(Math.random() * 1000000)} USD`,
      votingDeadline: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date in next 10 days
      pros: `Pros for proposal ${index + 1} - benefits the DAO by improving infrastructure.`,
      cons: `Cons for proposal ${index + 1} - potential risks include implementation challenges.`,
      votingRecommendation: ['Yes', 'No', 'Abstain'][Math.floor(Math.random() * 3)],
      summary: `This is an automatically generated summary for proposal ${index + 1}. The AI would extract the actual content from the proposal page.`,
    }));

    res.status(200).json({
      success: true,
      data: {
        proposals: processedProposals,
        episodeName,
        episodeStatus,
        episodePriority,
        episodeArchived,
        newEpisode,
      },
    });
  } catch (error) {
    console.error('Error processing proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process proposals',
      error: error.message,
    });
  }
});

// Save proposals to Notion
app.post('/api/proposals/save', async (req, res) => {
  try {
    const { episodeName, episodeStatus, episodePriority, episodeArchived, proposals } = req.body;

    if (!proposals || proposals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No proposals provided',
      });
    }

    console.log(`Processing ${proposals.length} proposals for episode "${episodeName}"`);

    // In a real app with Notion integration, we would:
    // 1. Create or update the episode in Notion
    if (notionClient) {
      // Example of creating episode page in Notion
      /*
      const episodePage = await notionClient.pages.create({
        parent: {
          database_id: process.env.NOTION_DATABASE_ID,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: episodeName,
                },
              },
            ],
          },
          Status: {
            select: {
              name: episodeStatus,
            },
          },
          Priority: {
            select: {
              name: episodePriority,
            },
          },
          Archived: {
            select: {
              name: episodeArchived,
            },
          },
        },
      });

      // 2. Add each proposal to the Notion database with the correct format
      for (const proposal of proposals) {
        await notionClient.pages.create({
          parent: {
            database_id: process.env.NOTION_PROPOSALS_DATABASE_ID,
          },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: proposal.proposalTitle,
                  },
                },
              ],
            },
            "DAO Name": {
              rich_text: [
                {
                  text: {
                    content: proposal.daoName,
                  },
                },
              ],
            },
            "Proposal Link": {
              url: proposal.proposalLink,
            },
            "Single Sentence Summary": {
              rich_text: [
                {
                  text: {
                    content: proposal.singleSentenceSummary,
                  },
                },
              ],
            },
            "Amount Requested": {
              rich_text: [
                {
                  text: {
                    content: proposal.amountRequested,
                  },
                },
              ],
            },
            "Total Budget": {
              rich_text: [
                {
                  text: {
                    content: proposal.totalBudget,
                  },
                },
              ],
            },
            "Daily Volume": {
              rich_text: [
                {
                  text: {
                    content: proposal.dailyVolume,
                  },
                },
              ],
            },
            "Pros": {
              rich_text: [
                {
                  text: {
                    content: proposal.pros,
                  },
                },
              ],
            },
            "Cons": {
              rich_text: [
                {
                  text: {
                    content: proposal.cons,
                  },
                },
              ],
            },
            "Voting Recommendation": {
              select: {
                name: proposal.votingRecommendation,
              },
            },
            "Status": {
              select: {
                name: proposal.status,
              },
            },
            "Voting Deadline": {
              date: {
                start: proposal.votingDeadline,
              },
            },
            "Episode": {
              relation: [
                {
                  id: episodePage.id,
                },
              ],
            },
          },
          children: [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: proposal.summary || "No summary provided.",
                    },
                  },
                ],
              },
            },
          ],
        });
      }
      */
    }

    // Format the data in the structure shown in dataexample.md
    const formattedData = `# ${episodeName} (DAOWATCH)

Status: ${episodeStatus}
Priority: ${episodePriority}
Archived: ${episodeArchived}

# **Overview & Purpose**

Identify interesting proposals and appraise them.

# **Template**

Introduction:

Hello -

Episode name and features

Please like and subscribe

Dont forget to follow on socials

Finally Join our Discord

${proposals.map(p => `
## ${p.daoName} –

Proposal link [${p.proposalLink}](${p.proposalLink})

Proposal : ${p.proposalTitle}

Single sentence summary: ${p.singleSentenceSummary}

Amount requested: ${p.amountRequested}

Total budget: ${p.totalBudget}

Daily volume (coingecko): ${p.dailyVolume}

Pros: ${p.pros}

Cons: ${p.cons}

What am I voting: ${p.votingRecommendation}

OFFER DISCUSSION in the comments!
`).join('\n')}

# **Timestamps**

*Timestamps for certain things*

Intro 00:00

${proposals.map((p, index) => `${p.daoName} proposal - ${(index + 1) * 5}:00`).join('\n\n')}

# Marketing routine

- [ ]  Tweet- tag in all featured projects
- [ ]  Instagram
- [ ]  Linkedin - tag in all featured projects
- [ ]  Discord of All featured projects
- [ ]  Forums of all featured projects
- [ ]  Reddit of all featured projects
- [ ]  Cryptodevs discord
- [ ]  Create clips
- [ ]  Post ALL clips to twitter scheduled
- [ ]  Give clips numbers 1-10
- [ ]  Decide which clips are going to insta
- [ ]  Post 1 clip from each project to instagram with captions
- [ ]  Post ALL clips to reddit of featured projects`;

    console.log('Formatted data for Notion:', formattedData);

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.status(200).json({
      success: true,
      message: 'Proposals successfully saved to Notion',
      data: {
        savedCount: proposals.length,
        episodeName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving proposals to Notion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save proposals to Notion',
      error: error.message,
    });
  }
});

// Get processing history
app.get('/api/history', async (req, res) => {
  try {
    // In a real app, this would query the Notion database for history

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock history data
    const mockHistory = [
      {
        id: 'batch-1',
        timestamp: '2023-11-15T14:30:00Z',
        episodeName: 'Episode 1: DAO Governance Trends',
        proposals: [
          {
            id: 'prop-1',
            title: 'Treasury Diversification Proposal',
            daoName: 'MakerDAO',
            status: 'Passed',
            processedAt: '2023-11-15T14:30:00Z',
            notionLink: 'https://notion.so/example1',
          },
          {
            id: 'prop-2',
            title: 'Protocol Upgrade v2.5',
            daoName: 'Uniswap',
            status: 'Active',
            processedAt: '2023-11-15T14:30:00Z',
            notionLink: 'https://notion.so/example2',
          },
        ],
      },
      {
        id: 'batch-2',
        timestamp: '2023-11-10T09:15:00Z',
        episodeName: 'Episode 2: DeFi Protocol Updates',
        proposals: [
          {
            id: 'prop-3',
            title: 'Governance Parameter Adjustment',
            daoName: 'Compound',
            status: 'Passed',
            processedAt: '2023-11-10T09:15:00Z',
            notionLink: 'https://notion.so/example3',
          },
          {
            id: 'prop-4',
            title: 'Community Fund Allocation',
            daoName: 'Aave',
            status: 'Rejected',
            processedAt: '2023-11-10T09:15:00Z',
            notionLink: 'https://notion.so/example4',
          },
          {
            id: 'prop-5',
            title: 'Staking Rewards Adjustment',
            daoName: 'Curve',
            status: 'Passed',
            processedAt: '2023-11-10T09:15:00Z',
            notionLink: 'https://notion.so/example5',
          },
        ],
      },
      {
        id: 'batch-3',
        timestamp: '2023-11-05T16:45:00Z',
        episodeName: 'Episode 3: NFT Marketplace Governance',
        proposals: [
          {
            id: 'prop-6',
            title: 'Creator Royalties Implementation',
            daoName: 'OpenSea DAO',
            status: 'Active',
            processedAt: '2023-11-05T16:45:00Z',
            notionLink: 'https://notion.so/example6',
          },
        ],
      },
    ];

    res.status(200).json({
      success: true,
      data: mockHistory,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Notion API: ${notionClient ? 'Connected' : 'Not connected'}`);
}); 