import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReviewDataPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [episodeName, setEpisodeName] = useState('');
  const [episodeStatus, setEpisodeStatus] = useState('In Progress');
  const [episodePriority, setEpisodePriority] = useState('Yes');
  const [episodeArchived, setEpisodeArchived] = useState('No');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeProposalIndex, setActiveProposalIndex] = useState(0);

  useEffect(() => {
    // In a real app, this data would come from the backend after processing
    if (!location.state) {
      setError('No proposal data found. Please submit proposals first.');
      setIsLoading(false);
      return;
    }

    const { proposalLinks, episodeName, episodeStatus, episodePriority, episodeArchived } = location.state;
    setEpisodeName(episodeName);
    setEpisodeStatus(episodeStatus || 'In Progress');
    setEpisodePriority(episodePriority || 'Yes');
    setEpisodeArchived(episodeArchived || 'No');

    // Simulate API call to process links
    const fetchData = async () => {
      try {
        // Mock data - in a real app, this would be the result of AI processing
        const mockProposals = proposalLinks.map((link, index) => ({
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

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setProposals(mockProposals);
      } catch (err) {
        setError('Failed to process proposal data. Please try again.');
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
      // Prepare data in the format for Notion
      const notionData = {
        episodeName,
        episodeStatus,
        episodePriority,
        episodeArchived,
        proposals: proposals.map(p => ({
          daoName: p.daoName,
          proposalLink: p.originalLink,
          proposalTitle: p.title,
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
      
      console.log('Saving to Notion:', notionData);
      
      // In a real app, this would be an API call to save to Notion
      // const response = await fetch('/api/proposals/save', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(notionData),
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessMessage('Proposals successfully saved to Notion!');
      
      // After a delay, redirect to history page
      setTimeout(() => {
        navigate('/history');
      }, 2000);
    } catch (err) {
      setError('Failed to save proposals to Notion. Please try again.');
      console.error('Error saving to Notion:', err);
    } finally {
      setIsSubmitting(false);
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Review Extracted Data</h1>
      <p className="text-gray-600 mb-6">
        Please review and edit the AI-extracted data before saving to Notion.
      </p>

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Episode Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Episode Name
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={episodeName}
              onChange={(e) => setEpisodeName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Status
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={episodeStatus}
              onChange={(e) => setEpisodeStatus(e.target.value)}
            >
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Planned">Planned</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Priority
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={episodePriority}
              onChange={(e) => setEpisodePriority(e.target.value)}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Archived
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={episodeArchived}
              onChange={(e) => setEpisodeArchived(e.target.value)}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
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
                Saving...
              </>
            ) : (
              'Save to Notion'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDataPage; 