import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Tv, Eye, ListChecks, Calendar, Check, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { TVShow } from '../../types/tvshow';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProgress, setShowProgress] = useState(true);
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const { data: shows, loading, error } = useSupabaseQuery<TVShow>({
    tableName: 'tvshow',
    columns: '*',
    orderBy: { column: 'Show' }
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Calculate statistics
  const totalShows = shows ? new Set(shows.map(show => show.Show)).size : 0;
  const totalEpisodes = shows ? shows.length : 0;
  const watchedEpisodes = shows ? shows.filter(show => show.Watched).length : 0;
  const watchedPercentage = totalEpisodes > 0 
    ? Math.round((watchedEpisodes / totalEpisodes) * 100) 
    : 0;

  // Calculate show-specific progress
  const showProgressData = shows ? Array.from(new Set(shows.map(show => show.Show))).map(showName => {
    const showEpisodes = shows.filter(s => s.Show === showName);
    const watchedShowEpisodes = showEpisodes.filter(s => s.Watched).length;
    const totalShowEpisodes = showEpisodes.length;
    return {
      name: showName,
      watched: watchedShowEpisodes,
      total: totalShowEpisodes,
    };
  }).sort((a, b) => b.total - a.total) : [];

  // Get selected show episodes
  const selectedShowEpisodes = shows?.filter(show => show.Show === selectedShow)
    .sort((a, b) => {
      // Sort by watched status first (unwatched first)
      if (a.Watched !== b.Watched) {
        return a.Watched ? 1 : -1;
      }
      // Then sort by air date
      return new Date(a['Air Date']).getTime() - new Date(b['Air Date']).getTime();
    });

  const selectedShowProgress = showProgressData.find(show => show.name === selectedShow);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Episode Tracker</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-4">{user?.email}</span>
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

              {/* Show Progress Section */}
              <div className="bg-white rounded-lg shadow-md mb-8">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => setShowProgress(!showProgress)}
                >
                  <h2 className="text-lg font-semibold text-gray-900">Show Progress</h2>
                  {showProgress ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {showProgress && (
                  <div className="p-4 border-t border-gray-200">
                    {showProgressData.map((show) => (
                      <div 
                        key={show.name} 
                        className="mb-4 last:mb-0 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors duration-200"
                        onClick={() => setSelectedShow(show.name)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">{show.name}</span>
                          <span className="text-sm text-gray-500">
                            {show.watched} / {show.total} episodes
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(show.watched / show.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedShowEpisodes?.map((episode, index) => (
                      <tr key={`${episode.Show}-${episode.Episode}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {episode.Episode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {episode.Title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(episode['Air Date']).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            episode.Watched 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {episode.Watched ? (
                              <>
                                <Check size={12} className="mr-1" />
                                Watched
                              </>
                            ) : 'Unwatched'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Progress */}
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

          {/* Import Complete Message */}
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