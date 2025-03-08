import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SubmitProposalPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    proposalLinks: ['', '', '', ''],
    episodeName: '',
    episodeStatus: 'In Progress',
    episodePriority: 'Yes',
    episodeArchived: 'No',
    newEpisode: false,
  });
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch episodes from the server (mock data for now)
  useEffect(() => {
    // In a real app, this would be an API call
    setEpisodes([
      { id: 1, name: 'Episode 1: DAO Governance Trends' },
      { id: 2, name: 'Episode 2: DeFi Protocol Updates' },
      { id: 3, name: 'Episode 3: NFT Marketplace Governance' },
    ]);
  }, []);

  const handleInputChange = (index, value) => {
    const updatedLinks = [...formData.proposalLinks];
    updatedLinks[index] = value;
    setFormData({ ...formData, proposalLinks: updatedLinks });
  };

  const handleEpisodeChange = (e) => {
    const value = e.target.value;
    if (value === 'new') {
      setFormData({ ...formData, newEpisode: true, episodeName: '' });
    } else {
      setFormData({ ...formData, newEpisode: false, episodeName: value });
    }
  };

  const handleNewEpisodeNameChange = (e) => {
    setFormData({ ...formData, episodeName: e.target.value });
  };

  const handleStatusChange = (e) => {
    setFormData({ ...formData, episodeStatus: e.target.value });
  };

  const handlePriorityChange = (e) => {
    setFormData({ ...formData, episodePriority: e.target.value });
  };

  const handleArchivedChange = (e) => {
    setFormData({ ...formData, episodeArchived: e.target.value });
  };

  const addLinkField = () => {
    setFormData({
      ...formData,
      proposalLinks: [...formData.proposalLinks, ''],
    });
  };

  const removeLinkField = (index) => {
    const updatedLinks = formData.proposalLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, proposalLinks: updatedLinks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form
    const filledLinks = formData.proposalLinks.filter(link => link.trim() !== '');
    if (filledLinks.length === 0) {
      setError('Please enter at least one proposal link');
      setIsLoading(false);
      return;
    }

    if (!formData.episodeName && formData.newEpisode) {
      setError('Please enter a name for the new episode');
      setIsLoading(false);
      return;
    }

    try {
      // In a real app, this would be an API call to process the links
      console.log('Submitting proposal links:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to review page (in a real app, we'd pass the processed data)
      navigate('/review', { 
        state: { 
          proposalLinks: filledLinks,
          episodeName: formData.episodeName,
          episodeStatus: formData.episodeStatus,
          episodePriority: formData.episodePriority,
          episodeArchived: formData.episodeArchived,
          isNewEpisode: formData.newEpisode
        } 
      });
    } catch (err) {
      setError('An error occurred while processing your request. Please try again.');
      console.error('Error submitting proposal links:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Submit DAO Proposals</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-4">Episode Information</h2>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Episode Assignment
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.newEpisode ? 'new' : formData.episodeName}
              onChange={handleEpisodeChange}
              required
            >
              <option value="">Select an episode</option>
              {episodes.map((episode) => (
                <option key={episode.id} value={episode.name}>
                  {episode.name}
                </option>
              ))}
              <option value="new">+ Create New Episode</option>
            </select>
          </div>

          {formData.newEpisode && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                New Episode Name
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter episode name"
                value={formData.episodeName}
                onChange={handleNewEpisodeNameChange}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Status
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.episodeStatus}
                onChange={handleStatusChange}
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
                value={formData.episodePriority}
                onChange={handlePriorityChange}
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
                value={formData.episodeArchived}
                onChange={handleArchivedChange}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Proposal Links</h2>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Enter 3-4 DAO proposal links to process in this batch
            </p>

            {formData.proposalLinks.map((link, index) => (
              <div key={index} className="flex mb-3">
                <input
                  type="url"
                  className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={`Proposal link ${index + 1}`}
                  value={link}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                />
                {formData.proposalLinks.length > 1 && (
                  <button
                    type="button"
                    className="ml-2 p-3 text-red-500 hover:text-red-700"
                    onClick={() => removeLinkField(index)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {formData.proposalLinks.length < 8 && (
              <button
                type="button"
                className="mt-2 flex items-center text-primary-600 hover:text-primary-800"
                onClick={addLinkField}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Another Link
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Process Proposals'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Enter 3-4 DAO proposal links you want to process</li>
          <li>Select an existing episode or create a new one</li>
          <li>Our AI will extract and structure the proposal data</li>
          <li>Review the extracted data before it's added to Notion</li>
          <li>Confirm to save the organized proposals to your Notion database</li>
        </ol>
      </div>
    </div>
  );
};

export default SubmitProposalPage; 