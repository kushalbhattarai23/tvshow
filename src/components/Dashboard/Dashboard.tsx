import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Tv, Eye, ListChecks, Calendar, Check, ChevronDown, ChevronUp, ArrowLeft, Edit2, X, Save, RefreshCw } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../../hooks/useSupabaseMutation';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime';
import { TVShow } from '../../types/tvshow';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProgress, setShowProgress] = useState(true);
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TVShow>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'watching' | 'not-started' | 'stopped'>('watching');
  
  const { data: shows, loading, error, refetch } = useSupabaseQuery<TVShow>({
    tableName: 'tvshow',
    columns: '*',
    orderBy: { column: 'Show' }
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching data:', error);
      refetch();
    }
  }, [error, refetch]);
  
  const { updateRecord, loading: updating, error: updateError } = useSupabaseMutation({ tableName: 'tvshow' });

  useEffect(() => {
    if (updateError) {
      console.error('Error updating data:', updateError);
      navigate('/dashboard');
    }
  }, [updateError, navigate]);

  useSupabaseRealtime({
    tableName: 'tvshow',
    event: '*',
    callback: () => {
      refetch();
    },
  });

  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 99) return prev;
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(timer);
    } else {
      setImportProgress(100);
    }
  }, [loading]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
      navigate('/dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/signin');
    }
  };

  const handleEdit = (episode: TVShow) => {
    try {
      setEditingEpisode(`${episode.Show}-${episode.Episode}`);
      setEditForm({
        Show: episode.Show,
        Episode: episode.Episode,
        Title: episode.Title,
        'Air Date': episode['Air Date'],
        Watched: episode.Watched
      });
    } catch (error) {
      console.error('Error editing episode:', error);
      navigate('/dashboard');
    }
  };

  const handleCancelEdit = () => {
    try {
      setEditingEpisode(null);
      setEditForm({});
    } catch (error) {
      console.error('Error canceling edit:', error);
      navigate('/dashboard');
    }
  };

  const handleSaveEdit = async (originalShow: string, originalEpisode: string) => {
    try {
      const success = await updateRecord(
        editForm,
        [
          { column: 'Show', value: originalShow },
          { column: 'Episode', value: originalEpisode }
        ]
      );

      if (success) {
        setEditingEpisode(null);
        setEditForm({});
      } else {
        throw new Error('Failed to update record');
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      navigate('/dashboard');
    }
  };

  const handleWatchedToggle = async (show: string, episode: string, currentStatus: boolean) => {
    try {
      const success = await updateRecord(
        { Watched: !currentStatus },
        [
          { column: 'Show', value: show },
          { column: 'Episode', value: episode }
        ]
      );
      
      if (!success) {
        throw new Error('Failed to update watched status');
      }
    } catch (error) {
      console.error('Error toggling watched status:', error);
      navigate('/dashboard');
    }
  };

  const totalShows = shows ? new Set(shows.map(show => show.Show)).size : 0;
  const totalEpisodes = shows ? shows.length : 0;
  const watchedEpisodes = shows ? shows.filter(show => show.Watched).length : 0;
  const watchedPercentage = totalEpisodes > 0 
    ? Math.round((watchedEpisodes / totalEpisodes) * 100) 
    : 0;

  const categorizeShows = () => {
    if (!shows) return { watching: [], notStarted: [], stopped: [] };

    const showMap = new Map();
    shows.forEach(episode => {
      if (!showMap.has(episode.Show)) {
        showMap.set(episode.Show, {
          name: episode.Show,
          episodes: [],
          watchedCount: 0,
          totalEpisodes: 0
        });
      }
      const showData = showMap.get(episode.Show);
      showData.episodes.push(episode);
      if (episode.Watched) showData.watchedCount++;
      showData.totalEpisodes++;
    });

    const watching = [];
    const notStarted = [];
    const stopped = [];

    showMap.forEach(show => {
      const progress = (show.watchedCount / show.totalEpisodes) * 100;
      if (progress === 0) {
        notStarted.push(show);
      } else if (progress === 100) {
        stopped.push(show);
      } else {
        watching.push(show);
      }
    });

    return {
      watching: watching.sort((a, b) => b.watchedCount / b.totalEpisodes - a.watchedCount / a.totalEpisodes),
      notStarted: notStarted.sort((a, b) => b.totalEpisodes - a.totalEpisodes),
      stopped: stopped.sort((a, b) => b.totalEpisodes - a.totalEpisodes)
    };
  };

  const { watching, notStarted, stopped } = categorizeShows();

  const selectedShowEpisodes = shows?.filter(show => show.Show === selectedShow)
    .sort((a, b) => {
      if (a.Watched !== b.Watched) {
        return a.Watched ? 1 : -1;
      }
      return new Date(a['Air Date']).getTime() - new Date(b['Air Date']).getTime();
    });

  const selectedShowProgress = shows ? {
    name: selectedShow,
    watched: shows.filter(s => s.Show === selectedShow && s.Watched).length,
    total: shows.filter(s => s.Show === selectedShow).length,
  } : null;

  const StatCard = ({ icon: Icon, title, value, subtitle }: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number,
    subtitle?: string 
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <Icon className="h-6 w-6 text-indigo-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );

  const ShowProgressTab = ({ shows, title }: { shows: any[], title: string }) => (
    <div className="space-y-4">
      {shows.map((show) => (
        <div 
          key={show.name} 
          className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors duration-200"
          onClick={() => setSelectedShow(show.name)}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">{show.name}</span>
            <span className="text-sm text-gray-500">
              {show.watchedCount} / {show.totalEpisodes} episodes
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(show.watchedCount / show.totalEpisodes) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {shows.length === 0 && (
        <p className="text-gray-500 text-center py-4">No shows in this category</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Episode Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out disabled:opacity-50"
              >
                <RefreshCw size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out"
              >
                <LogOut size={16} className="mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!selectedShow ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                  icon={Tv} 
                  title="Total Shows" 
                  value={totalShows} 
                />
                <StatCard 
                  icon={ListChecks} 
                  title="Total Episodes" 
                  value={totalEpisodes} 
                />
                <StatCard 
                  icon={Eye} 
                  title="Watched Episodes" 
                  value={watchedEpisodes}
                  subtitle={`${watchedPercentage}% Complete`} 
                />
              </div>

              <div className="bg-white rounded-lg shadow-md mb-8">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => setShowProgress(!showProgress)}
                >
                  <h2 className="text-lg font-semibold text-gray-900">Show Progress</h2>
                  {showProgress ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {showProgress && (
                  <div className="border-t border-gray-200">
                    <div className="flex border-b border-gray-200">
                      <button
                        className={`flex-1 px-4 py-2 text-sm font-medium ${
                          activeTab === 'watching'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('watching')}
                      >
                        Watching ({watching.length})
                      </button>
                      <button
                        className={`flex-1 px-4 py-2 text-sm font-medium ${
                          activeTab === 'not-started'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('not-started')}
                      >
                        Not Started ({notStarted.length})
                      </button>
                      <button
                        className={`flex-1 px-4 py-2 text-sm font-medium ${
                          activeTab === 'stopped'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('stopped')}
                      >
                        Completed ({stopped.length})
                      </button>
                    </div>
                    <div className="p-4">
                      {activeTab === 'watching' && <ShowProgressTab shows={watching} title="Currently Watching" />}
                      {activeTab === 'not-started' && <ShowProgressTab shows={notStarted} title="Not Started" />}
                      {activeTab === 'stopped' && <ShowProgressTab shows={stopped} title="Completed" />}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setSelectedShow(null)}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Back to All Shows
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedShow}</h2>
                <div className="flex items-center text-lg text-gray-700">
                  <span className="font-medium">{selectedShowProgress?.watched}</span>
                  <span className="mx-1">/</span>
                  <span>{selectedShowProgress?.total} episodes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedShowProgress?.watched ?? 0) / (selectedShowProgress?.total ?? 1) * 100}%` }}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Episode</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Air Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedShowEpisodes?.map((episode, index) => {
                      const isEditing = editingEpisode === `${episode.Show}-${episode.Episode}`;
                      return (
                        <tr key={`${episode.Show}-${episode.Episode}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.Episode || ''}
                                onChange={(e) => setEditForm({ ...editForm, Episode: e.target.value })}
                                className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              />
                            ) : (
                              episode.Episode
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.Title || ''}
                                onChange={(e) => setEditForm({ ...editForm, Title: e.target.value })}
                                className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              />
                            ) : (
                              episode.Title
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editForm['Air Date'] || ''}
                                onChange={(e) => setEditForm({ ...editForm, 'Air Date': e.target.value })}
                                className="rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              />
                            ) : (
                              new Date(episode['Air Date']).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleWatchedToggle(episode.Show, episode.Episode, episode.Watched)}
                              disabled={updating || isEditing}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                                episode.Watched 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              } ${(updating || isEditing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {episode.Watched ? (
                                <>
                                  <Check size={12} className="mr-1" />
                                  Watched
                                </>
                              ) : 'Mark as Watched'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isEditing ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(episode.Show, episode.Episode)}
                                  disabled={updating}
                                  className="inline-flex items-center p-1 text-green-600 hover:text-green-900"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="inline-flex items-center p-1 text-gray-600 hover:text-gray-900"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(episode)}
                                className="inline-flex items-center p-1 text-gray-600 hover:text-gray-900"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && (
            <div className="mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Importing data...</span>
                  <span className="text-sm font-medium text-gray-700">{importProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {!loading && shows && !selectedShow && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Import Complete - {shows.length} episodes loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;