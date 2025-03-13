import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReviewDataPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [episodeName, setEpisodeName] = useState('');
  const [episodeStatus, setEpisodeStatus] = useState('In Progress');
  const [episodePriority, setEpisodePriority] = useState('Yes');
  const [episodeArchived, setEpisodeArchived] = useState('No');
  const [aiService, setAiService] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeProposalIndex, setActiveProposalIndex] = useState(0);
  const apiCallMadeRef = useRef(false);

  useEffect(() => {
    // In a real app, this data would come from the backend after processing
    if (!location.state) {
      setError('No proposal data found. Please submit proposals first.');
      setIsLoading(false);
      return;
    }

    const { proposalLinks, episodeName, episodeStatus, episodePriority, episodeArchived, aiService } = location.state;
    setEpisodeName(episodeName);
    setEpisodeStatus(episodeStatus || 'In Progress');
    setEpisodePriority(episodePriority || 'Yes');
    setEpisodeArchived(episodeArchived || 'No');
    setAiService(aiService || 'Default');

    // Simulate API call to process links
    const fetchData = async () => {
      if (apiCallMadeRef.current) return;
      
      try {
        apiCallMadeRef.current = true;
        
        // In a real app, we would call the server with the selected AI service
        const response = await fetch('/api/proposals/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proposalLinks,
            episodeName,
            episodeStatus,
            episodePriority,
            episodeArchived,
            newEpisode: location.state.isNewEpisode,
            aiService,
          }),
        });

        // Log response details to help with debugging
        console.log(`API Response Status: ${response.status} ${response.statusText}`);
        
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          // Try to get the error message from the response
          let errorText;
          try {
            // Attempt to read as JSON first
            const errorData = await response.json();
            errorText = errorData.message || `Error ${response.status}: ${response.statusText}`;
          } catch (jsonError) {
            // If not JSON, read as text
            errorText = await response.text();
            errorText = `Server Error (${response.status}): ${errorText.substring(0, 100)}...`;
          }
          throw new Error(errorText);
        }

        // Parse JSON response
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to process proposals');
        }

        setProposals(data.data.proposals);
      } catch (err) {
        setError('Failed to process proposal data: ' + (err.message || 'Please try again.'));
        console.error('Error processing proposals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  const handleInputChange = (proposalId, field, value) => {
    setProposals(proposals.map(proposal => 
      proposal.id === proposalId ? { ...proposal, [field]: value } : proposal
    ));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Prepare data for markdown generation
      const markdownData = {
        episodeName,
        episodeStatus,
        episodePriority,
        episodeArchived,
        proposals: proposals.map(p => ({
          daoName: p.daoName,
          originalLink: p.originalLink,
          title: p.title,
          singleSentenceSummary: p.singleSentenceSummary,
          amountRequested: p.amountRequested,
          totalBudget: p.totalBudget,
          dailyVolume: p.dailyVolume,
          pros: p.pros,
          cons: p.cons,
          votingRecommendation: p.votingRecommendation,
          status: p.status,
          votingDeadline: p.votingDeadline,
          summary: p.summary
        }))
      };
      
      console.log('Generating markdown preview');
      
      // Call the API to generate markdown content
      const response = await fetch('/api/proposals/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markdownData),
      });
      
      // Log response details to help with debugging
      console.log(`API Response Status: ${response.status} ${response.statusText}`);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get the error message from the response
        let errorText;
        try {
          // Attempt to read as JSON first
          const errorData = await response.json();
          errorText = errorData.message || `Error ${response.status}: ${response.statusText}`;
        } catch (jsonError) {
          // If not JSON, read as text
          errorText = await response.text();
          errorText = `Server Error (${response.status}): ${errorText.substring(0, 100)}...`;
        }
        throw new Error(errorText);
      }
      
      const data = await response.json();
      
      setSuccessMessage(data.message || 'Markdown generated successfully!');
      
      // Format the data as markdown (for preview)
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
      
      // Navigate to the markdown viewer page with the content
      navigate('/markdown-viewer', { 
        state: { 
          markdownContent: markdownContent,
          fileName: data.data?.filename || `${episodeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md` 
        } 
      });
    } catch (err) {
      setError('Failed to generate markdown: ' + (err.message || 'Please try again.'));
      console.error('Error generating markdown:', err);
      setIsSubmitting(false);
    }
  };

  const handleDownloadMd = async () => {
    setIsDownloading(true);
    setError('');
    
    try {
      // Prepare data in the same format as for Notion
      const downloadData = {
        episodeName,
        episodeStatus,
        episodePriority,
        episodeArchived,
        proposals: proposals.map(p => ({
          daoName: p.daoName,
          originalLink: p.originalLink,
          title: p.title,
          singleSentenceSummary: p.singleSentenceSummary,
          amountRequested: p.amountRequested,
          totalBudget: p.totalBudget,
          dailyVolume: p.dailyVolume,
          pros: p.pros,
          cons: p.cons,
          votingRecommendation: p.votingRecommendation,
          status: p.status,
          votingDeadline: p.votingDeadline,
          summary: p.summary
        }))
      };
      
      console.log('Downloading show notes as markdown');
      
      // Use fetch to get the markdown content
      const response = await fetch('/api/proposals/download-md', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(downloadData),
      });
      
      // Log response details to help with debugging
      console.log(`API Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Try to get the error message from the response
        let errorText;
        try {
          // Attempt to read as JSON first
          const errorData = await response.json();
          errorText = errorData.message || `Error ${response.status}: ${response.statusText}`;
        } catch (jsonError) {
          // If not JSON, read as text
          errorText = await response.text();
          errorText = `Server Error (${response.status}): ${errorText.substring(0, 100)}...`;
        }
        throw new Error(errorText);
      }
      
      // Get the content and filename from the response
      const markdownContent = await response.text();
      let filename = 'show_notes.md';
      
      // Try to get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      } else {
        // Create a default filename based on episode name
        filename = `${episodeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      }
      
      // Create a blob and download link
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccessMessage('Show notes downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to download show notes: ' + err.message);
      console.error('Error downloading markdown:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-800';
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Processing proposals...</p>
        </div>
      </div>
    );
  }

  if (error && proposals.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Back to Submission
        </button>
      </div>
    );
  }

  const activeProposal = proposals[activeProposalIndex] || {};

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Review Extracted Data</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={() => navigate('/submit')}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
          >
            Back to Submission
          </button>
        </div>
      ) : (
        <>
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <p>{successMessage}</p>
              <button 
                onClick={() => navigate('/submit')}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
              >
                Submit New Proposals
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Episode Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Episode Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    value={episodeName}
                    onChange={(e) => setEpisodeName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    value={episodeStatus}
                    onChange={(e) => setEpisodeStatus(e.target.value)}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Priority</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    value={episodePriority}
                    onChange={(e) => setEpisodePriority(e.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Archived</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    value={episodeArchived}
                    onChange={(e) => setEpisodeArchived(e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">AI Service Used</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                    value={aiService}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Proposals</h2>
            
            {/* Horizontal proposal tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex -mb-px overflow-x-auto">
                {proposals.map((proposal, index) => (
                  <button
                    key={proposal.id}
                    onClick={() => setActiveProposalIndex(index)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap
                      ${activeProposalIndex === index
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full mr-2 ${getStatusBadgeClass(proposal.status)}`}>
                        {index + 1}
                      </span>
                      <span className="truncate max-w-[150px]">{proposal.daoName}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Active proposal details */}
            {activeProposal.id && (
              <div className={`border rounded-lg p-4 mb-6 ${
                activeProposal.status === 'Active' ? 'border-blue-300 bg-blue-50' :
                activeProposal.status === 'Passed' ? 'border-green-300 bg-green-50' :
                'border-red-300 bg-red-50'
              }`}>
                <h3 className="text-lg font-semibold mb-3">
                  {activeProposal.daoName} Proposal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      DAO Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.daoName}
                      onChange={(e) => handleInputChange(activeProposal.id, 'daoName', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Proposal Title
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.title}
                      onChange={(e) => handleInputChange(activeProposal.id, 'title', e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Single Sentence Summary
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.singleSentenceSummary}
                      onChange={(e) => handleInputChange(activeProposal.id, 'singleSentenceSummary', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Amount Requested
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.amountRequested}
                      onChange={(e) => handleInputChange(activeProposal.id, 'amountRequested', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Total Budget
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.totalBudget}
                      onChange={(e) => handleInputChange(activeProposal.id, 'totalBudget', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Daily Volume
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.dailyVolume}
                      onChange={(e) => handleInputChange(activeProposal.id, 'dailyVolume', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Status
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.status}
                      onChange={(e) => handleInputChange(activeProposal.id, 'status', e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Passed">Passed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Voting Deadline
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.votingDeadline}
                      onChange={(e) => handleInputChange(activeProposal.id, 'votingDeadline', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Voting Recommendation
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={activeProposal.votingRecommendation}
                      onChange={(e) => handleInputChange(activeProposal.id, 'votingRecommendation', e.target.value)}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Abstain">Abstain</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Pros
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-lg h-20"
                      value={activeProposal.pros}
                      onChange={(e) => handleInputChange(activeProposal.id, 'pros', e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Cons
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-lg h-20"
                      value={activeProposal.cons}
                      onChange={(e) => handleInputChange(activeProposal.id, 'cons', e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Summary
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-lg h-24"
                      value={activeProposal.summary}
                      onChange={(e) => handleInputChange(activeProposal.id, 'summary', e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Original Link
                    </label>
                    <input
                      type="url"
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                      value={activeProposal.originalLink}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => navigate('/submit')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg"
              >
                Back
              </button>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    const prevIndex = (activeProposalIndex - 1 + proposals.length) % proposals.length;
                    setActiveProposalIndex(prevIndex);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                  disabled={proposals.length <= 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextIndex = (activeProposalIndex + 1) % proposals.length;
                    setActiveProposalIndex(nextIndex);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                  disabled={proposals.length <= 1}
                >
                  Next
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleDownloadMd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    'Download Show Notes'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'View as Markdown'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewDataPage; 