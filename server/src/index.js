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
const ELIGIBLE_DAOS_PATH = path.join(__dirname, '../../data/eligible-daos.json');

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `dao-${Date.now()}`;
}

function readEligibleDaos() {
  try {
    const rawData = fs.readFileSync(ELIGIBLE_DAOS_PATH, 'utf8');
    const daos = JSON.parse(rawData);
    return Array.isArray(daos) ? daos : [];
  } catch (error) {
    console.error('Error reading eligible DAO list:', error.message);
    return [];
  }
}

function writeEligibleDaos(daos) {
  fs.mkdirSync(path.dirname(ELIGIBLE_DAOS_PATH), { recursive: true });
  fs.writeFileSync(ELIGIBLE_DAOS_PATH, `${JSON.stringify(daos, null, 2)}\n`);
}

function normalizeEligibleDao(input) {
  const name = String(input.name || '').trim();
  const sources = parseDaoSources(input.sources || input.source || '');

  if (!name) {
    throw new Error('DAO name is required');
  }

  if (sources.length === 0) {
    throw new Error('At least one governance or forum source is required');
  }

  return {
    id: input.id ? slugify(input.id) : slugify(name),
    name,
    sources,
  };
}

function groupNewsArticlesByDao(newsArticles = []) {
  return newsArticles.reduce((groups, article) => {
    const daoName = article.daoName || 'Other DAO News';
    if (!groups[daoName]) groups[daoName] = [];
    groups[daoName].push(article);
    return groups;
  }, {});
}

function formatNewsArticlesMarkdown(newsArticles = []) {
  const groupedNews = groupNewsArticlesByDao(newsArticles);
  const daoNames = Object.keys(groupedNews);

  if (daoNames.length === 0) {
    return '- No recent DAO news articles found';
  }

  return daoNames.map((daoName) => (
    `## ${daoName}\n\n${groupedNews[daoName]
      .map(article => `- [${article.title}](${article.url})${article.source ? ` (${article.source})` : ''}${article.publishedAt ? ` - ${article.publishedAt}` : ''}`)
      .join('\n')}`
  )).join('\n\n');
}

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

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXmlEntities(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getTextBetween(value, tagName) {
  const match = String(value).match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  if (!match) return '';
  return decodeXmlEntities(match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim());
}

function parseDaoSources(rawSources) {
  const unusableValues = new Set(['none', 'cant find it', "can't find it", 'needs repair', 'needs rapair']);

  if (Array.isArray(rawSources)) {
    return rawSources
      .map(source => String(source).trim())
      .filter(source => source && !unusableValues.has(source.toLowerCase()));
  }

  return String(rawSources || '')
    .split(/\r?\n|,/)
    .map(source => source.trim())
    .filter(source => source && !unusableValues.has(source.toLowerCase()));
}

function getSnapshotSpaceId(source) {
  const value = String(source || '').trim();
  const snapshotMatch = value.match(/snapshot\.org\/#\/([^/?#]+)/i) || value.match(/snapshot\.org\/#\/s:([^/?#]+)/i);
  if (snapshotMatch) return snapshotMatch[1].replace(/^s:/, '');

  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(value)) {
    return value;
  }

  return null;
}

function getTallySlug(source) {
  const match = String(source || '').match(/tally\.xyz\/gov\/([^/?#]+)/i);
  return match ? match[1] : null;
}

function getDaoNameFromUrl(source) {
  try {
    const url = new URL(source);
    const host = url.hostname.replace(/^www\./, '');
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (host.includes('tally.xyz') && pathParts[1]) return pathParts[1];
    if (host.includes('mintscan.io') && pathParts[0]) return pathParts[0];
    if (host.includes('explorers.guru')) return host.split('.')[0] || pathParts[0] || host;
    if (host.includes('forum.') || host.includes('discuss.')) return host.split('.')[1] || host;
    if (host.includes('dashcentral')) return 'Dash';
    if (host.includes('pivx')) return 'PIVX';
    if (host.includes('jup')) return 'Jup DAO';
    if (host.includes('dfinity') || host.includes('internetcomputer')) return 'ICP';
    if (host.includes('projectcatalyst')) return 'Cardano';
    if (host.includes('aragon')) return 'Aragon DAO';

    return host;
  } catch (error) {
    return 'Unknown DAO';
  }
}

function getSourceTypeFromUrl(source) {
  try {
    const host = new URL(source).hostname;
    if (host.includes('forum') || host.includes('discuss')) return 'Forum';
    if (host.includes('tally.xyz')) return 'Tally';
    if (host.includes('mintscan.io')) return 'Mintscan';
    if (host.includes('explorers.guru')) return 'Explorer';
    if (host.includes('dashcentral')) return 'DashCentral';
    if (host.includes('aragon.org')) return 'Aragon';
    if (host.includes('vote.jup.ag')) return 'Jup Vote';
    return 'Governance source';
  } catch (error) {
    return 'Governance source';
  }
}

function isLikelyProposalUrl(source) {
  return /\/proposal(s)?\/[^/?#]+|\/proposals?\/[^/?#]+|proposalId=|\/governance\/proposal/i.test(source);
}

function resolveLink(source, href) {
  if (!href || href.startsWith('mailto:') || href.startsWith('javascript:')) return null;
  try {
    return new URL(href, source).toString().split('#')[0];
  } catch (error) {
    return null;
  }
}

function createCandidateFromUrl(source, proposalUrl, index) {
  const daoName = getDaoNameFromUrl(source);
  const sourceType = getSourceTypeFromUrl(source);
  const title = `${daoName} governance proposal`;
  const scored = scoreProposalCandidate({
    title,
    status: 'Active',
    summary: proposalUrl,
  });

  return {
    id: `source-${index}-${Buffer.from(proposalUrl).toString('base64').slice(0, 12)}`,
    originalLink: proposalUrl,
    title,
    daoName,
    status: 'Active',
    singleSentenceSummary: `Proposal candidate discovered from ${sourceType}.`,
    amountRequested: 'Not specified',
    totalBudget: 'Not specified',
    dailyVolume: 'Not specified',
    votingDeadline: new Date().toISOString().split('T')[0],
    pros: 'Review proposal detail for benefits.',
    cons: 'Review proposal detail for risks.',
    votingRecommendation: 'Abstain',
    summary: `Proposal candidate discovered from ${source}. Use AI processing or manual review to extract full detail.`,
    discussionScore: scored.score,
    selectedReason: scored.selectedReason,
    sourceType,
  };
}

function scoreProposalCandidate(candidate) {
  const searchableText = `${candidate.title || ''} ${candidate.summary || ''}`.toLowerCase();
  const keywordWeights = [
    ['treasury', 18],
    ['grant', 16],
    ['budget', 16],
    ['funding', 15],
    ['upgrade', 15],
    ['parameter', 12],
    ['token', 12],
    ['incentive', 12],
    ['security', 12],
    ['emergency', 12],
    ['delegate', 10],
    ['election', 10],
    ['revenue', 10],
    ['partnership', 8],
  ];

  let score = 20;
  const reasons = [];

  if (candidate.status === 'Active') {
    score += 28;
    reasons.push('active vote');
  }

  if (candidate.votingDeadline) {
    const deadline = new Date(candidate.votingDeadline).getTime();
    const daysUntilDeadline = (deadline - Date.now()) / (24 * 60 * 60 * 1000);
    if (daysUntilDeadline >= 0 && daysUntilDeadline <= 7) {
      score += 18;
      reasons.push('near-term voting deadline');
    } else if (daysUntilDeadline > 7 && daysUntilDeadline <= 21) {
      score += 8;
      reasons.push('upcoming deadline');
    }
  }

  keywordWeights.forEach(([keyword, weight]) => {
    if (searchableText.includes(keyword)) {
      score += weight;
      reasons.push(keyword);
    }
  });

  if ((candidate.summary || '').length > 250) {
    score += 8;
    reasons.push('enough detail for discussion');
  }

  return {
    score: Math.min(score, 100),
    selectedReason: reasons.length
      ? `Selected because it has ${Array.from(new Set(reasons)).slice(0, 4).join(', ')}.`
      : 'Selected as one of the newest proposal candidates from this DAO.',
  };
}

function selectDiverseProposalCandidates(candidates, limit = 3) {
  const sortedCandidates = [...candidates].sort((a, b) => (b.discussionScore || 0) - (a.discussionScore || 0));
  const selected = [];
  const selectedDaoNames = new Set();

  for (const candidate of sortedCandidates) {
    const daoKey = String(candidate.daoName || candidate.sourceType || candidate.originalLink || '')
      .trim()
      .toLowerCase();

    if (!daoKey || selectedDaoNames.has(daoKey)) continue;

    selected.push(candidate);
    selectedDaoNames.add(daoKey);

    if (selected.length >= limit) return selected;
  }

  for (const candidate of sortedCandidates) {
    if (selected.some(selectedCandidate => selectedCandidate.originalLink === candidate.originalLink)) continue;

    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
}

async function fetchGenericProposalLinks(source, limit = 20) {
  const response = await axios.get(source, {
    timeout: 12000,
    headers: {
      'User-Agent': 'DAO Watch research assistant',
    },
  });

  const html = String(response.data || '');
  const linkMatches = [...html.matchAll(/href=["']([^"']+)["']/gi)];
  const candidateLinks = [];
  const seen = new Set();

  for (const match of linkMatches) {
    const resolvedLink = resolveLink(source, match[1]);
    if (!resolvedLink || seen.has(resolvedLink)) continue;

    if (/proposal|governance|vote|referendum|motion|discussion|thread/i.test(resolvedLink)) {
      seen.add(resolvedLink);
      candidateLinks.push(resolvedLink);
    }

    if (candidateLinks.length >= limit) break;
  }

  if (candidateLinks.length === 0 && isLikelyProposalUrl(source)) {
    candidateLinks.push(source);
  }

  return candidateLinks.map((proposalUrl, index) => createCandidateFromUrl(source, proposalUrl, index));
}

async function fetchSnapshotProposals(spaceId, limit = 20) {
  const response = await axios.post(
    'https://hub.snapshot.org/graphql',
    {
      query: `query Proposals($space: String!, $first: Int!) {
        proposals(
          first: $first,
          skip: 0,
          where: { space_in: [$space] },
          orderBy: "created",
          orderDirection: desc
        ) {
          id
          title
          body
          state
          start
          end
          link
          choices
          scores_total
          space { id name }
        }
      }`,
      variables: { space: spaceId, first: limit },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
  );

  const proposals = response.data?.data?.proposals || [];

  return proposals.map((proposal) => {
    const status = proposal.state === 'active'
      ? 'Active'
      : proposal.state === 'closed'
        ? 'Passed'
        : proposal.state || 'Active';
    const originalLink = proposal.link || `https://snapshot.org/#/${spaceId}/proposal/${proposal.id}`;
    const summary = stripHtml(proposal.body || '').slice(0, 700);
    const scored = scoreProposalCandidate({
      title: proposal.title,
      summary,
      status,
      votingDeadline: proposal.end ? new Date(proposal.end * 1000).toISOString().split('T')[0] : '',
    });

    return {
      id: `snapshot-${proposal.id}`,
      originalLink,
      title: proposal.title || 'Untitled Snapshot proposal',
      daoName: proposal.space?.name || spaceId,
      status,
      singleSentenceSummary: summary ? `${summary.slice(0, 180)}${summary.length > 180 ? '...' : ''}` : 'No proposal summary available.',
      amountRequested: 'Not specified',
      totalBudget: 'Not specified',
      dailyVolume: 'Not specified',
      votingDeadline: proposal.end ? new Date(proposal.end * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      pros: 'Review the linked proposal for benefits and expected DAO impact.',
      cons: 'Review execution risk, budget impact, and governance tradeoffs before recording.',
      votingRecommendation: 'Abstain',
      summary: summary || 'No detailed body was available from Snapshot.',
      discussionScore: scored.score,
      selectedReason: scored.selectedReason,
      sourceType: 'Snapshot',
    };
  });
}

async function fetchTallyProposalLinks(source, limit = 12) {
  const slug = getTallySlug(source);
  if (!slug) return [];

  const response = await axios.get(`https://www.tally.xyz/gov/${slug}`, {
    timeout: 12000,
    headers: {
      'User-Agent': 'DAO Watch research assistant',
    },
  });

  const seen = new Set();
  const links = [];
  const regex = new RegExp(`/gov/${slug}/proposal/([0-9]+)`, 'gi');
  let match;

  while ((match = regex.exec(response.data)) && links.length < limit) {
    const proposalId = match[1];
    const proposalUrl = `https://www.tally.xyz/gov/${slug}/proposal/${proposalId}`;
    if (seen.has(proposalUrl)) continue;
    seen.add(proposalUrl);
    const scored = scoreProposalCandidate({
      title: `${slug} governance proposal`,
      status: 'Active',
      summary: proposalUrl,
    });
    links.push({
      id: `tally-${slug}-${links.length}`,
      originalLink: proposalUrl,
      title: `${slug} governance proposal`,
      daoName: slug,
      status: 'Active',
      singleSentenceSummary: 'Proposal discovered from Tally governance.',
      amountRequested: 'Not specified',
      totalBudget: 'Not specified',
      dailyVolume: 'Not specified',
      votingDeadline: new Date().toISOString().split('T')[0],
      pros: 'Review proposal detail for benefits.',
      cons: 'Review proposal detail for risks.',
      votingRecommendation: 'Abstain',
      summary: 'Proposal discovered from Tally. Use AI processing or manual review to extract full detail.',
      discussionScore: scored.score,
      selectedReason: scored.selectedReason,
      sourceType: 'Tally',
    });
  }

  return links;
}

async function findNewsSources(query, limit = 4) {
  if (!query) return [];

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'DAO Watch research assistant',
      },
    });

    const itemMatches = String(response.data).match(/<item>[\s\S]*?<\/item>/gi) || [];
    return itemMatches.slice(0, limit).map((item) => ({
      title: stripHtml(getTextBetween(item, 'title')),
      url: getTextBetween(item, 'link'),
      source: stripHtml(getTextBetween(item, 'source')) || 'Google News',
      publishedAt: getTextBetween(item, 'pubDate'),
    })).filter(item => item.title && item.url);
  } catch (error) {
    console.error(`Error fetching news for "${query}":`, error.message);
    return [];
  }
}

async function enrichProposalsWithNews(proposals, includeNews = true) {
  if (!includeNews) return proposals;

  const enriched = [];
  for (const proposal of proposals) {
    const query = `${proposal.daoName || ''} ${proposal.title || ''} DAO governance`;
    let newsSources = await findNewsSources(query, 4);
    if (newsSources.length === 0 && proposal.daoName) {
      newsSources = await findNewsSources(`${proposal.daoName} DAO governance`, 4);
    }
    enriched.push({
      ...proposal,
      newsSources,
    });
  }
  return enriched;
}

async function findRecentDaoNews(daos, perDaoLimit = 2) {
  const newsByDao = [];

  for (const dao of daos) {
    const articlesByUrl = new Map();

    const collectArticles = async (recentOnly) => {
      const dateFilter = recentOnly ? ' when:30d' : '';
      const queries = [
        `"${dao.name}" DAO${dateFilter}`,
        `"${dao.name}" governance${dateFilter}`,
      ];

      for (const query of queries) {
        const articles = await findNewsSources(query, 6);
        articles.forEach((article) => {
          if (!article.url || articlesByUrl.has(article.url)) return;

          articlesByUrl.set(article.url, {
            ...article,
            daoName: dao.name,
            publishedAtTimestamp: article.publishedAt ? new Date(article.publishedAt).getTime() : 0,
          });
        });
      }
    };

    await collectArticles(true);
    if (articlesByUrl.size < perDaoLimit) {
      await collectArticles(false);
    }

    const daoArticles = Array.from(articlesByUrl.values())
      .sort((a, b) => (b.publishedAtTimestamp || 0) - (a.publishedAtTimestamp || 0))
      .slice(0, perDaoLimit)
      .map(({ publishedAtTimestamp, ...article }) => article);

    newsByDao.push(...daoArticles);
  }

  return newsByDao;
}

async function discoverProposalCandidatesFromSources(sources) {
  const candidates = [];
  const scanErrors = [];

  for (const source of sources) {
    try {
      const snapshotSpaceId = getSnapshotSpaceId(source);
      const tallySlug = getTallySlug(source);

      if (snapshotSpaceId) {
        const snapshotCandidates = await fetchSnapshotProposals(snapshotSpaceId);
        candidates.push(...snapshotCandidates);
      } else if (tallySlug) {
        const tallyCandidates = await fetchTallyProposalLinks(source);
        candidates.push(...tallyCandidates);
      } else if (/^https?:\/\//i.test(source)) {
        const genericCandidates = await fetchGenericProposalLinks(source);
        candidates.push(...genericCandidates);
      } else {
        scanErrors.push({ source, message: 'Unsupported DAO source. Use a Snapshot space, Tally governance URL, or proposal URL.' });
      }
    } catch (error) {
      console.error(`Error scanning DAO source "${source}":`, error.message);
      scanErrors.push({ source, message: error.message });
    }
  }

  const dedupedCandidates = Array.from(
    new Map(candidates.map(candidate => [candidate.originalLink, candidate])).values()
  );

  return { candidates: dedupedCandidates, scanErrors };
}

function mergeDiscoveredData(processedProposals, discoveredProposals = []) {
  if (!Array.isArray(discoveredProposals) || discoveredProposals.length === 0) {
    return processedProposals;
  }

  const discoveredByLink = new Map(
    discoveredProposals.map(proposal => [proposal.originalLink, proposal])
  );

  return processedProposals.map((proposal) => {
    const discovered = discoveredByLink.get(proposal.originalLink);
    if (!discovered) return proposal;

    const isMockProcessed = proposal.title?.startsWith('Example DAO Proposal')
      || proposal.summary?.startsWith('This is an automatically generated summary');

    if (isMockProcessed) {
      return {
        ...proposal,
        ...discovered,
        id: proposal.id,
      };
    }

    return {
      ...proposal,
      originalLink: discovered.originalLink || proposal.originalLink,
      title: proposal.title?.startsWith('Example DAO Proposal') ? discovered.title : proposal.title,
      daoName: proposal.daoName?.startsWith('DAO ') ? discovered.daoName : proposal.daoName,
      status: discovered.status || proposal.status,
      singleSentenceSummary: proposal.singleSentenceSummary?.startsWith('Brief summary') ? discovered.singleSentenceSummary : proposal.singleSentenceSummary,
      votingDeadline: discovered.votingDeadline || proposal.votingDeadline,
      summary: proposal.summary?.startsWith('This is an automatically generated summary') ? discovered.summary : proposal.summary,
      discussionScore: discovered.discussionScore,
      selectedReason: discovered.selectedReason,
      sourceType: discovered.sourceType,
    };
  });
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

// Manage the eligible DAO list used by the research scanner
app.get('/api/eligible-daos', (req, res) => {
  res.status(200).json({
    success: true,
    data: readEligibleDaos(),
  });
});

app.post('/api/eligible-daos', (req, res) => {
  try {
    const daos = readEligibleDaos();
    const newDao = normalizeEligibleDao(req.body);
    const existingIndex = daos.findIndex(dao => dao.id === newDao.id);

    const updatedDaos = existingIndex >= 0
      ? daos.map((dao, index) => (index === existingIndex ? newDao : dao))
      : [...daos, newDao];

    writeEligibleDaos(updatedDaos);

    res.status(existingIndex >= 0 ? 200 : 201).json({
      success: true,
      data: newDao,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

app.delete('/api/eligible-daos/:id', (req, res) => {
  const daos = readEligibleDaos();
  const updatedDaos = daos.filter(dao => dao.id !== req.params.id);

  if (updatedDaos.length === daos.length) {
    return res.status(404).json({
      success: false,
      message: 'DAO not found',
    });
  }

  writeEligibleDaos(updatedDaos);

  res.status(200).json({
    success: true,
    data: updatedDaos,
  });
});

app.post('/api/research/scan', async (req, res) => {
  try {
    const daos = readEligibleDaos();
    const selectedDaoIds = Array.isArray(req.body.daoIds) ? req.body.daoIds : daos.map(dao => dao.id);
    const selectedDaos = daos.filter(dao => selectedDaoIds.includes(dao.id));

    if (selectedDaos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible DAOs selected for scanning',
      });
    }

    const sources = selectedDaos.flatMap(dao => dao.sources || []);
    const [{ candidates, scanErrors }, newsArticles] = await Promise.all([
      discoverProposalCandidatesFromSources(sources),
      findRecentDaoNews(selectedDaos, 2),
    ]);

    const selectedProposals = selectDiverseProposalCandidates(candidates, 3);

    const proposalsWithNews = await enrichProposalsWithNews(selectedProposals, true);

    res.status(200).json({
      success: true,
      data: {
        newsArticles,
        proposals: proposalsWithNews,
        proposalLinks: proposalsWithNews.map(proposal => proposal.originalLink),
        candidatesScanned: candidates.length,
        sourcesScanned: sources.length,
        daosScanned: selectedDaos.length,
        scanErrors,
      },
    });
  } catch (error) {
    console.error('Error running DAO research scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run DAO research scan',
      error: error.message,
    });
  }
});

// Discover proposal candidates from DAO governance sources
app.post('/api/proposals/discover', async (req, res) => {
  try {
    const { daoSources, maxProposals = 4, includeNews = true } = req.body;
    const sources = parseDaoSources(daoSources);

    if (sources.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No DAO sources provided',
      });
    }

    const { candidates: dedupedCandidates, scanErrors } = await discoverProposalCandidatesFromSources(sources);
    const selectedProposals = selectDiverseProposalCandidates(dedupedCandidates, Number(maxProposals) || 4);

    const proposalsWithNews = await enrichProposalsWithNews(selectedProposals, includeNews);

    res.status(200).json({
      success: true,
      data: {
        proposals: proposalsWithNews,
        proposalLinks: proposalsWithNews.map(proposal => proposal.originalLink),
        candidatesScanned: dedupedCandidates.length,
        sourcesScanned: sources.length,
        scanErrors,
      },
    });
  } catch (error) {
    console.error('Error discovering proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover proposals',
      error: error.message,
    });
  }
});

// Process proposal links
app.post('/api/proposals/process', async (req, res) => {
  try {
    const {
      proposalLinks,
      episodeName,
      episodeStatus,
      episodePriority,
      episodeArchived,
      newEpisode,
      aiService,
      discoveredProposals,
      includeNews = true,
    } = req.body;

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

    processedProposals = mergeDiscoveredData(processedProposals, discoveredProposals);
    processedProposals = await enrichProposalsWithNews(processedProposals, includeNews);

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
    const { episodeName, episodeStatus, episodePriority, episodeArchived, proposals, newsArticles = [] } = req.body;

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

# **Recent DAO News**

${formatNewsArticlesMarkdown(newsArticles)}

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

Why this was selected: ${p.selectedReason || 'Selected for DAO Watch review.'}

Discussion score: ${p.discussionScore || 'Not scored'}

News sources:
${(p.newsSources || []).length > 0
  ? p.newsSources.map(source => `- [${source.title}](${source.url})${source.source ? ` - ${source.source}` : ''}`).join('\n')
  : '- No related news sources found'}

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
    const { episodeName, episodeStatus, episodePriority, episodeArchived, proposals, newsArticles = [] } = req.body;

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

# **Recent DAO News**

${formatNewsArticlesMarkdown(newsArticles)}

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

Why this was selected: ${p.selectedReason || 'Selected for DAO Watch review.'}

Discussion score: ${p.discussionScore || 'Not scored'}

News sources:
${(p.newsSources || []).length > 0
  ? p.newsSources.map(source => `- [${source.title}](${source.url})${source.source ? ` - ${source.source}` : ''}`).join('\n')
  : '- No related news sources found'}

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
