require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios'); // Add axios for HTTP requests
const path = require('path'); // Add path module
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Handle favicon.ico and logo192.png requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response, stops the browser from requesting again
});

app.get('/logo192.png', (req, res) => {
  res.status(204).end(); // No content response
});

// Middleware
app.use(cors());

// Configure Helmet but allow inline scripts for React
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(morgan('dev'));
app.use(express.json());

// Explicitly serve favicon files with proper content types
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, '../../client/public/favicon.ico');
  if (fs.existsSync(faviconPath)) {
    res.setHeader('Content-Type', 'image/x-icon');
    fs.createReadStream(faviconPath).pipe(res);
  } else {
    res.status(404).end();
  }
});

app.get('/favicon.png', (req, res) => {
  const faviconPath = path.join(__dirname, '../../client/public/favicon.png');
  if (fs.existsSync(faviconPath)) {
    res.setHeader('Content-Type', 'image/png');
    fs.createReadStream(faviconPath).pipe(res);
  } else {
    res.status(404).end();
  }
});

app.get('/logo192.png', (req, res) => {
  const logoPath = path.join(__dirname, '../../client/public/logo192.png');
  if (fs.existsSync(logoPath)) {
    res.setHeader('Content-Type', 'image/png');
    fs.createReadStream(logoPath).pipe(res);
  } else {
    res.status(404).end();
  }
});

app.get('/logo512.png', (req, res) => {
  const logoPath = path.join(__dirname, '../../client/public/logo512.png');
  if (fs.existsSync(logoPath)) {
    res.setHeader('Content-Type', 'image/png');
    fs.createReadStream(logoPath).pipe(res);
  } else {
    res.status(404).end();
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../../client/public')));

// Simple health check endpoint for testing API connectivity
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running properly', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development' 
  });
});

// QWQ API integration - Process proposals using QWQ AI
async function processWithQWQ(proposalLinks) {
  try {
    console.log('Processing proposals with QWQ API...');
    
    // Check if QWQ API key is available
    if (!process.env.QWQ_API_KEY) {
      console.error('QWQ API key is not set in environment variables');
      throw new Error('QWQ API key is not configured. Please add it to your .env file.');
    }
    
    // Prepare the prompts for each proposal link
    const processedProposals = [];
    
    for (let i = 0; i < proposalLinks.length; i++) {
      const link = proposalLinks[i];
      console.log(`Processing link ${i + 1}/${proposalLinks.length}: ${link}`);
      
      try {
        // Call QWQ API
        console.log('Sending request to QWQ API...');
        
        // System prompt for analyzing DAO proposals
        const systemPrompt = `You are an AI governance expert specializing in DAO proposals analysis. You will be given a link to a DAO proposal. 
Analyze the proposal and extract the following information in a structured JSON format:
- title: The title of the proposal
- daoName: The name of the DAO
- status: The status of the proposal (Active, Passed, or Rejected)
- singleSentenceSummary: A single sentence that summarizes the proposal
- amountRequested: The amount of tokens requested (if applicable)
- totalBudget: The total budget for the proposal in USD
- dailyVolume: The daily trading volume (if applicable)
- votingDeadline: The deadline for voting (in YYYY-MM-DD format)
- pros: List the main benefits or advantages of this proposal
- cons: List the main drawbacks or concerns about this proposal
- votingRecommendation: Your recommendation (Yes, No, or Abstain)
- summary: A comprehensive but concise summary of the proposal

Respond with ONLY the JSON object contained in a code block with json syntax highlighting.`;

        // User prompt with the link
        const userPrompt = `Please analyze this DAO proposal and extract the structured information as JSON: ${link}`;
        
        const response = await axios.post(
          "https://api.hyperbolic.xyz/v1/chat/completions",
          {
            "messages": [
              {
                "role": "system",
                "content": systemPrompt
              },
              {
                "role": "user",
                "content": userPrompt
              }
            ],
            "model": "Qwen/QwQ-32B", // Using QwQ model as specified
            "max_tokens": 4000, // Reduced from 40000 to a more reasonable value
            "temperature": 0.3, // Reduced for more consistent output
            "top_p": 0.9,
            "stream": false // Ensuring we get a complete response
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.QWQ_API_KEY}`
            }
          }
        );
        
        console.log('Received response from QWQ API');
        console.log('Response status:', response.status);
        
        // Extract and structure the response
        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
          console.error('Unexpected QWQ API response structure:', JSON.stringify(response.data, null, 2));
          throw new Error('QWQ API returned an unexpected response structure');
        }
        
        const aiResponse = response.data.choices[0].message.content;
        console.log('QWQ AI content (truncated):', aiResponse.substring(0, 200) + '...');
        
        let proposalData;
        
        // First, try to extract JSON from code blocks
        const jsonCodeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                                  aiResponse.match(/```\s*([\s\S]*?)\s*```/);
        
        if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
          try {
            console.log('Found code block, attempting to parse JSON');
            const jsonString = jsonCodeBlockMatch[1].trim();
            proposalData = JSON.parse(jsonString);
            console.log('Successfully parsed JSON from code block');
          } catch (err) {
            console.error('Failed to parse JSON from code block', err);
            // Continue to next method
          }
        }
        
        // If code block extraction failed, try direct parsing
        if (!proposalData) {
          try {
            // Try to parse JSON directly from response
            proposalData = JSON.parse(aiResponse);
            console.log('Successfully parsed JSON directly from response');
          } catch (error) {
            console.log('Could not parse JSON directly, trying to extract from text...');
            // If parsing fails, try to find a JSON object in the text
            const jsonObjectMatch = aiResponse.match(/{[\s\S]*?}/);
            
            if (jsonObjectMatch) {
              try {
                proposalData = JSON.parse(jsonObjectMatch[0]);
                console.log('Successfully parsed JSON object from text');
              } catch (err) {
                console.error('Failed to parse JSON from text match', err);
                // Fallback to mock data
                proposalData = createMockProposalData(i, link);
              }
            } else {
              console.log('No JSON pattern found in response');
              // No JSON found in the response
              proposalData = createMockProposalData(i, link);
            }
          }
        }
        
        // Ensure all required fields are present with defaults if missing
        proposalData = {
          title: proposalData.title || `Untitled Proposal ${i + 1}`,
          daoName: proposalData.daoName || "Unknown DAO",
          status: proposalData.status || "Active",
          singleSentenceSummary: proposalData.singleSentenceSummary || `No summary available for proposal ${i + 1}.`,
          amountRequested: proposalData.amountRequested || "Not specified",
          totalBudget: proposalData.totalBudget || "Not specified",
          dailyVolume: proposalData.dailyVolume || "Not specified",
          votingDeadline: proposalData.votingDeadline || new Date().toISOString().split('T')[0],
          pros: proposalData.pros || "None specified",
          cons: proposalData.cons || "None specified",
          votingRecommendation: proposalData.votingRecommendation || "Abstain",
          summary: proposalData.summary || `No detailed summary available for proposal ${i + 1}.`,
        };
        
        // Add to processed proposals with the original link
        processedProposals.push({
          id: `proposal-${i}`,
          originalLink: link,
          ...proposalData
        });
        
      } catch (error) {
        console.error(`Error processing link ${link}:`, error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data (summarized):', JSON.stringify(error.response.data).substring(0, 500) + '...');
        } else if (error.request) {
          console.error('No response received');
        }
        
        // Add error proposal
        processedProposals.push({
          id: `proposal-${i}`,
          originalLink: link,
          title: `Error: Could not process proposal ${i + 1}`,
          daoName: "Error",
          status: "Active",
          singleSentenceSummary: `Error: ${error.message}`,
          amountRequested: "Unknown",
          totalBudget: "Unknown",
          dailyVolume: "Unknown",
          votingDeadline: new Date().toISOString().split('T')[0],
          pros: "Error occurred during processing.",
          cons: "Please try again or contact support.",
          votingRecommendation: "Abstain",
          summary: `An error occurred while calling the QWQ API: ${error.message}`
        });
      }
      
      // Short delay between requests to avoid rate limiting
      if (i < proposalLinks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased to 1.5 seconds
      }
    }
    
    console.log(`Processed ${processedProposals.length} proposals successfully`);
    return processedProposals;
  } catch (error) {
    console.error('Error calling QWQ API:', error);
    throw new Error(`QWQ API error: ${error.message}`);
  }
}

// Llama API integration - Process proposals using Llama 3.3 model
async function processWithLlama(proposalLinks) {
  try {
    console.log('Processing proposals with Llama 3.3 API...');
    
    // Check if Llama API key is available from environment variables
    if (!process.env.LLAMA_API_KEY) {
      console.error('Llama API key is not set in environment variables');
      throw new Error('Llama API key is not configured. Please add it to your .env file.');
    }
    
    // Prepare the prompts for each proposal link
    const processedProposals = [];
    
    for (let i = 0; i < proposalLinks.length; i++) {
      const link = proposalLinks[i];
      console.log(`Processing link ${i + 1}/${proposalLinks.length}: ${link}`);
      
      try {
        // Call Hyperbolic API with Llama 3.3 model
        console.log('Sending request to Llama 3.3 API...');
        
        // System prompt for analyzing DAO proposals
        const systemPrompt = `You are an AI governance expert specializing in DAO proposals analysis. You will be given a link to a DAO proposal. 
Analyze the proposal and extract the following information in a structured JSON format:
- title: The title of the proposal
- daoName: The name of the DAO
- status: The status of the proposal (Active, Passed, or Rejected)
- singleSentenceSummary: A single sentence that summarizes the proposal
- amountRequested: The amount of tokens requested (if applicable)
- totalBudget: The total budget for the proposal in USD
- dailyVolume: The daily trading volume (if applicable)
- votingDeadline: The deadline for voting (in YYYY-MM-DD format)
- pros: List the main benefits or advantages of this proposal
- cons: List the main drawbacks or concerns about this proposal
- votingRecommendation: Your recommendation (Yes, No, or Abstain)
- summary: A comprehensive but concise summary of the proposal

Respond with ONLY the JSON object contained in a code block with json syntax highlighting.`;

        // User prompt with the link
        const userPrompt = `Please analyze this DAO proposal and extract the structured information as JSON: ${link}`;
        
        const response = await axios.post(
          "https://api.hyperbolic.xyz/v1/chat/completions",
          {
            "messages": [
              {
                "role": "system",
                "content": systemPrompt
              },
              {
                "role": "user",
                "content": userPrompt
              }
            ],
            "model": "meta-llama/Llama-3.3-70B-Instruct",
            "max_tokens": 4000,
            "temperature": 0.1,
            "top_p": 0.9,
            "stream": false
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.LLAMA_API_KEY}`
            }
          }
        );
        
        console.log('Received response from Llama 3.3 API');
        console.log('Response status:', response.status);
        
        // Extract and structure the response
        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
          console.error('Unexpected Llama API response structure:', JSON.stringify(response.data, null, 2));
          throw new Error('Llama API returned an unexpected response structure');
        }
        
        const aiResponse = response.data.choices[0].message.content;
        console.log('Llama AI content (truncated):', aiResponse.substring(0, 200) + '...');
        
        let proposalData;
        
        // First, try to extract JSON from code blocks
        const jsonCodeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                                  aiResponse.match(/```\s*([\s\S]*?)\s*```/);
        
        if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
          try {
            console.log('Found code block, attempting to parse JSON');
            const jsonString = jsonCodeBlockMatch[1].trim();
            proposalData = JSON.parse(jsonString);
            console.log('Successfully parsed JSON from code block');
          } catch (err) {
            console.error('Failed to parse JSON from code block', err);
            // Continue to next method
          }
        }
        
        // If code block extraction failed, try direct parsing
        if (!proposalData) {
          try {
            // Try to parse JSON directly from response
            proposalData = JSON.parse(aiResponse);
            console.log('Successfully parsed JSON directly from response');
          } catch (error) {
            console.log('Could not parse JSON directly, trying to extract from text...');
            // If parsing fails, try to find a JSON object in the text
            const jsonObjectMatch = aiResponse.match(/{[\s\S]*?}/);
            
            if (jsonObjectMatch) {
              try {
                proposalData = JSON.parse(jsonObjectMatch[0]);
                console.log('Successfully parsed JSON object from text');
              } catch (err) {
                console.error('Failed to parse JSON from text match', err);
                // Fallback to mock data
                proposalData = createMockProposalData(i, link);
              }
            } else {
              console.log('No JSON pattern found in response');
              // No JSON found in the response
              proposalData = createMockProposalData(i, link);
            }
          }
        }
        
        // Ensure all required fields are present with defaults if missing
        proposalData = {
          title: proposalData.title || `Untitled Proposal ${i + 1}`,
          daoName: proposalData.daoName || "Unknown DAO",
          status: proposalData.status || "Active",
          singleSentenceSummary: proposalData.singleSentenceSummary || `No summary available for proposal ${i + 1}.`,
          amountRequested: proposalData.amountRequested || "Not specified",
          totalBudget: proposalData.totalBudget || "Not specified",
          dailyVolume: proposalData.dailyVolume || "Not specified",
          votingDeadline: proposalData.votingDeadline || new Date().toISOString().split('T')[0],
          pros: proposalData.pros || "None specified",
          cons: proposalData.cons || "None specified",
          votingRecommendation: proposalData.votingRecommendation || "Abstain",
          summary: proposalData.summary || `No detailed summary available for proposal ${i + 1}.`,
        };
        
        // Add to processed proposals with the original link
        processedProposals.push({
          id: `proposal-${i}`,
          originalLink: link,
          ...proposalData
        });
        
      } catch (error) {
        console.error(`Error processing link ${link} with Llama API:`, error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data (summarized):', JSON.stringify(error.response.data).substring(0, 500) + '...');
        } else if (error.request) {
          console.error('No response received');
        }
        
        // Add error proposal
        processedProposals.push({
          id: `proposal-${i}`,
          originalLink: link,
          title: `Error: Could not process proposal ${i + 1}`,
          daoName: "Error",
          status: "Active",
          singleSentenceSummary: `Error: ${error.message}`,
          amountRequested: "Unknown",
          totalBudget: "Unknown",
          dailyVolume: "Unknown",
          votingDeadline: new Date().toISOString().split('T')[0],
          pros: "Error occurred during processing.",
          cons: "Please try again or contact support.",
          votingRecommendation: "Abstain",
          summary: `An error occurred while calling the Llama API: ${error.message}`
        });
      }
      
      // Short delay between requests to avoid rate limiting
      if (i < proposalLinks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    console.log(`Processed ${processedProposals.length} proposals successfully with Llama API`);
    return processedProposals;
  } catch (error) {
    console.error('Error calling Llama API:', error);
    throw new Error(`Llama API error: ${error.message}`);
  }
}

// Helper function to create mock proposal data
function createMockProposalData(index, link) {
  return {
    title: `Error processing proposal ${index + 1}`,
    daoName: "Unknown DAO",
    status: "Active",
    singleSentenceSummary: "Could not process this proposal correctly.",
    amountRequested: "Unknown",
    totalBudget: "Unknown",
    dailyVolume: "Unknown",
    votingDeadline: new Date().toISOString().split('T')[0],
    pros: "Could not extract pros.",
    cons: "Could not extract cons.",
    votingRecommendation: "Abstain",
    summary: "Failed to extract structured data from the AI response."
  };
}

// Mock processing function - used for Sonar and Llama until they're implemented
async function processMockData(proposalLinks, aiService) {
  // Mock processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return mock processed data
  return proposalLinks.map((link, index) => ({
    id: `proposal-${index}`,
    originalLink: link,
    title: `Example DAO Proposal ${index + 1} (Processed with ${aiService})`,
    daoName: `DAO ${String.fromCharCode(65 + index)}`, // A, B, C, etc.
    status: ['Active', 'Passed', 'Rejected'][Math.floor(Math.random() * 3)],
    singleSentenceSummary: `Brief summary of proposal ${index + 1} (via ${aiService}).`,
    amountRequested: `${Math.floor(Math.random() * 1000)} Tokens`,
    totalBudget: `${Math.floor(Math.random() * 10000)} USD`,
    dailyVolume: `${Math.floor(Math.random() * 1000000)} USD`,
    votingDeadline: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date in next 10 days
    pros: `Pros for proposal ${index + 1} - benefits the DAO by improving infrastructure.`,
    cons: `Cons for proposal ${index + 1} - potential risks include implementation challenges.`,
    votingRecommendation: ['Yes', 'No', 'Abstain'][Math.floor(Math.random() * 3)],
    summary: `This is an automatically generated summary for proposal ${index + 1} using ${aiService}. The AI would extract the actual content from the proposal page.`,
  }));
}

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Get episodes from local storage instead of Notion
app.get('/api/episodes', async (req, res) => {
  try {
    // Return mock data
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
    const { proposalLinks, episodeName, episodeStatus, episodePriority, episodeArchived, newEpisode, aiService } = req.body;

    if (!proposalLinks || proposalLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No proposal links provided',
      });
    }

    console.log(`Processing proposals with AI service: ${aiService || 'Default'}`);

    // Process proposals based on selected AI service
    let processedProposals;
    
    try {
      switch(aiService) {
        case 'QWQ':
          // Use QWQ API integration
          console.log('Attempting to process with QWQ API...');
          processedProposals = await processWithQWQ(proposalLinks);
          console.log('QWQ API processing complete');
          break;
        case 'Llama':
          // Use Llama API integration
          console.log('Attempting to process with Llama API...');
          processedProposals = await processWithLlama(proposalLinks);
          console.log('Llama API processing complete');
          break;
        case 'Sonar':
        default:
          // Use mock data for now (will be replaced with actual integrations later)
          console.log('Using mock data for', aiService);
          processedProposals = await processMockData(proposalLinks, aiService);
          break;
      }
    } catch (serviceError) {
      console.error(`Error with ${aiService} service:`, serviceError.message);
      console.log('Falling back to mock data due to service error');
      // Fallback to mock data if the selected service fails
      processedProposals = await processMockData(proposalLinks, `${aiService} (Fallback)`);
    }

    // Validate that processedProposals contains data
    if (!processedProposals || processedProposals.length === 0) {
      console.error('No proposals were processed, using emergency fallback');
      // Emergency fallback
      processedProposals = proposalLinks.map((link, index) => ({
        id: `proposal-${index}`,
        originalLink: link,
        title: `Emergency Fallback - Proposal ${index + 1}`,
        daoName: `Unknown DAO`,
        status: 'Active',
        singleSentenceSummary: `We couldn't process this proposal through ${aiService}.`,
        amountRequested: 'Unknown',
        totalBudget: 'Unknown',
        dailyVolume: 'Unknown',
        votingDeadline: new Date().toISOString().split('T')[0],
        pros: 'Could not extract pros due to processing error.',
        cons: 'Could not extract cons due to processing error.',
        votingRecommendation: 'Abstain',
        summary: `We encountered an error while processing this proposal with ${aiService}. You may want to try again or select a different AI service.`
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        proposals: processedProposals,
        episodeName,
        episodeStatus,
        episodePriority,
        episodeArchived,
        newEpisode,
        aiService,
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

// Generate and download proposals as Markdown
app.post('/api/proposals/download-md', async (req, res) => {
  try {
    const { episodeName, episodeStatus, episodePriority, episodeArchived, proposals } = req.body;

    if (!proposals || proposals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No proposals provided',
      });
    }

    console.log(`Generating Markdown for ${proposals.length} proposals in episode "${episodeName}"`);

    // Format the data as markdown
    const markdownContent = `# ${episodeName} (DAOWATCH)

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

Proposal link [${p.originalLink}](${p.originalLink})

Proposal : ${p.title}

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

    // Set headers for file download
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${episodeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md"`);
    
    // Send the markdown content
    res.send(markdownContent);
  } catch (error) {
    console.error('Error generating markdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate markdown file',
      error: error.message,
    });
  }
});

// Replace the /api/proposals/save endpoint with a simpler version that just returns success
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

    // Format the data as markdown (similar to download-md endpoint)
    const markdownContent = `# ${episodeName} (DAOWATCH)

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

Proposal link [${p.originalLink}](${p.originalLink})

Proposal : ${p.title}

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

    // Generate a filename based on episode name
    const filename = `${episodeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    
    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return success with filename
    res.status(200).json({
      success: true,
      message: 'Markdown file generated successfully!',
      data: {
        filename,
        contentPreview: markdownContent.substring(0, 200) + '...',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message,
    });
  }
});

// Add a new endpoint to view markdown content
app.post('/api/markdown/view', async (req, res) => {
  try {
    const { markdownContent } = req.body;
    
    if (!markdownContent) {
      return res.status(400).json({
        success: false,
        message: 'No markdown content provided',
      });
    }
    
    // Simply return the markdown content for rendering
    res.status(200).json({
      success: true,
      data: {
        content: markdownContent,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing markdown view request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process markdown view request',
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
}); 