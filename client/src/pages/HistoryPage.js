import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // In a real app, this would be an API call to fetch history
    const fetchHistory = async () => {
      try {
        // Mock data
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

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setHistory(mockHistory);
      } catch (err) {
        setError('Failed to load history. Please try again later.');
        console.error('Error loading history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  const filteredHistory = history.filter(batch => {
    if (filter === 'all') return true;
    return batch.proposals.some(proposal => proposal.status === filter);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Processing History</h1>
          <p className="text-gray-600">
            View all previously processed DAO proposals
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            to="/submit"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Process New Proposals
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-xl font-semibold mb-2 sm:mb-0">Processed Proposals</h2>
            
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Filter:</span>
              <select
                className="border border-gray-300 rounded-md p-1"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Passed">Passed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No proposals found matching the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((batch) => (
              <div key={batch.id} className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary-700">
                    {batch.episodeName}
                  </h3>
                  <span className="text-gray-500 text-sm mt-1 sm:mt-0">
                    Processed on {formatDate(batch.timestamp)}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proposal
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          DAO
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processed
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batch.proposals.map((proposal) => (
                        <tr key={proposal.id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {proposal.title}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {proposal.daoName}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}>
                              {proposal.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(proposal.processedAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a
                              href={proposal.notionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View in Notion
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage; 