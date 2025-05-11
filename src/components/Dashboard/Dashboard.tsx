import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Tv, Eye, ListChecks, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { TVShow } from '../../types/tvshow';
import { supabase } from '../../lib/supabase';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // Show 12 cards per page for better grid layout

  const { 
    data: shows, 
    loading, 
    error,
    totalCount,
    totalPages 
  } = useSupabaseQuery<TVShow>({
    tableName: 'tvshow',
    columns: '*',
    orderBy: { column: 'Show' },
    page: currentPage,
    pageSize
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Calculate statistics from the complete dataset
  const uniqueShows = shows ? Array.from(new Set(shows.map(show => show.Show))) : [];
  const totalShows = uniqueShows.length;
  const totalEpisodes = totalCount || 0;
  const watchedEpisodes = shows?.filter(show => show.Watched).length || 0;
  const watchedPercentage = totalEpisodes > 0 
    ? Math.round((watchedEpisodes / totalEpisodes) * 100) 
    : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  const handleWatchToggle = async (show: TVShow) => {
    try {
      const { error: updateError } = await supabase
        .from('tvshow')
        .update({ Watched: !show.Watched })
        .eq('Show', show.Show)
        .eq('Episode', show.Episode);

      if (updateError) throw updateError;

      // Refresh the data
      window.location.reload();
    } catch (err) {
      console.error('Error updating watch status:', err);
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-900">TV Show Tracker</h1>
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
        {/* Statistics */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {/* Show Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-4">
              Error loading shows: {error.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shows?.map((show, index) => (
                <div key={`${show.Show}-${show.Episode}-${index}`} 
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:transform hover:scale-105">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <img
                      src={`https://picsum.photos/seed/${show.Show.replace(/\s+/g, '')}/400/225`}
                      alt={show.Show}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{show.Show}</h3>
                    <p className="text-sm text-gray-600 mb-2">Episode {show.Episode}: {show.Title}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {new Date(show['Air Date']).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleWatchToggle(show)}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        show.Watched
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                      }`}
                    >
                      <Check size={16} className={`mr-1 ${show.Watched ? 'opacity-100' : 'opacity-0'}`} />
                      {show.Watched ? 'Watched' : 'Mark as Watched'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && shows && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> episodes
                  </p>
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const distance = Math.abs(page - currentPage);
                      return distance === 0 || distance === 1 || page === 1 || page === totalPages;
                    })
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return [
                          <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>,
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ];
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;