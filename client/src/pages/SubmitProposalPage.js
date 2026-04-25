import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const emptyDaoForm = {
  name: '',
  sources: '',
};

const SubmitProposalPage = () => {
  const navigate = useNavigate();
  const [eligibleDaos, setEligibleDaos] = useState([]);
  const [selectedDaoIds, setSelectedDaoIds] = useState([]);
  const [daoForm, setDaoForm] = useState(emptyDaoForm);
  const [episodeName, setEpisodeName] = useState('');
  const [episodeStatus, setEpisodeStatus] = useState('In Progress');
  const [episodePriority, setEpisodePriority] = useState('Yes');
  const [episodeArchived, setEpisodeArchived] = useState('No');
  const [aiService, setAiService] = useState('Sonar');
  const [isLoadingDaos, setIsLoadingDaos] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const fetchEligibleDaos = async () => {
    setIsLoadingDaos(true);
    setError('');

    try {
      const response = await fetch('/api/eligible-daos');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load eligible DAO list');
      }

      setEligibleDaos(data.data);
      setSelectedDaoIds(data.data.map((dao) => dao.id));
    } catch (err) {
      setError(err.message || 'Failed to load eligible DAO list');
    } finally {
      setIsLoadingDaos(false);
    }
  };

  useEffect(() => {
    fetchEligibleDaos();
  }, []);

  const toggleDaoSelection = (daoId) => {
    setSelectedDaoIds((currentIds) => (
      currentIds.includes(daoId)
        ? currentIds.filter((id) => id !== daoId)
        : [...currentIds, daoId]
    ));
  };

  const handleAddDao = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/eligible-daos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(daoForm),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to add DAO');
      }

      setDaoForm(emptyDaoForm);
      await fetchEligibleDaos();
    } catch (err) {
      setError(err.message || 'Failed to add DAO');
    }
  };

  const handleRemoveDao = async (daoId) => {
    setError('');

    try {
      const response = await fetch(`/api/eligible-daos/${daoId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove DAO');
      }

      setEligibleDaos(data.data);
      setSelectedDaoIds((currentIds) => currentIds.filter((id) => id !== daoId));
    } catch (err) {
      setError(err.message || 'Failed to remove DAO');
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError('');

    if (selectedDaoIds.length === 0) {
      setError('Select at least one eligible DAO to scan.');
      setIsScanning(false);
      return;
    }

    try {
      const response = await fetch('/api/research/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daoIds: selectedDaoIds }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Research scan failed');
      }

      if (!data.data.proposals?.length) {
        throw new Error('No proposal candidates were found for the selected DAO list.');
      }

      navigate('/review', {
        state: {
          proposalLinks: data.data.proposalLinks,
          discoveredProposals: data.data.proposals,
          discoverySummary: {
            candidatesScanned: data.data.candidatesScanned,
            sourcesScanned: data.data.sourcesScanned,
            daosScanned: data.data.daosScanned,
            scanErrors: data.data.scanErrors || [],
          },
          newsArticles: data.data.newsArticles || [],
          includeNews: true,
          researchMode: 'auto',
          episodeName: episodeName || `DAO Watch Research ${new Date().toISOString().split('T')[0]}`,
          episodeStatus,
          episodePriority,
          episodeArchived,
          isNewEpisode: true,
          aiService,
        },
      });
    } catch (err) {
      setError(err.message || 'Research scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">DAO Research Scan</h1>
        <p className="text-gray-600">
          Manage the eligible DAO list, pull the top 2 recent news stories for each selected DAO, and choose from 3 proposal candidates for the next episode.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Eligible DAOs</h2>
            <button
              type="button"
              className="text-sm text-primary-700 hover:text-primary-900 font-semibold"
              onClick={() => setSelectedDaoIds(eligibleDaos.map((dao) => dao.id))}
            >
              Select all
            </button>
          </div>

          {isLoadingDaos ? (
            <p className="text-gray-500">Loading eligible DAO list...</p>
          ) : (
            <div className="space-y-3">
              {eligibleDaos.map((dao) => (
                <div key={dao.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedDaoIds.includes(dao.id)}
                        onChange={() => toggleDaoSelection(dao.id)}
                      />
                      <span>
                        <span className="block font-semibold text-gray-900">{dao.name}</span>
                        <span className="block text-sm text-gray-500">
                          {(dao.sources || []).length} source{(dao.sources || []).length === 1 ? '' : 's'}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-800 font-semibold"
                      onClick={() => handleRemoveDao(dao.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(dao.sources || []).map((source) => (
                      <a
                        key={source}
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1 hover:bg-gray-200"
                      >
                        {source}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add DAO</h2>
            <form onSubmit={handleAddDao} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">DAO Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={daoForm.name}
                  onChange={(event) => setDaoForm({ ...daoForm, name: event.target.value })}
                  placeholder="Example DAO"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Sources</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg h-32"
                  value={daoForm.sources}
                  onChange={(event) => setDaoForm({ ...daoForm, sources: event.target.value })}
                  placeholder="One governance, Snapshot, Tally, forum, or proposal source per line"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg"
              >
                Add to Eligible List
              </button>
            </form>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Episode Setup</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Episode Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={episodeName}
                  onChange={(event) => setEpisodeName(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">AI Service</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={aiService}
                  onChange={(event) => setAiService(event.target.value)}
                >
                  <option value="Sonar">Sonar</option>
                  <option value="QWQ">QWQ</option>
                  <option value="Llama">Llama</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Status</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={episodeStatus}
                    onChange={(event) => setEpisodeStatus(event.target.value)}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Priority</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={episodePriority}
                    onChange={(event) => setEpisodePriority(event.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Archived</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={episodeArchived}
                  onChange={(event) => setEpisodeArchived(event.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <button
                type="button"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg disabled:bg-gray-400"
                onClick={handleScan}
                disabled={isScanning || isLoadingDaos}
              >
                {isScanning ? 'Scanning eligible DAOs...' : 'Scan News and Proposals'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default SubmitProposalPage;
