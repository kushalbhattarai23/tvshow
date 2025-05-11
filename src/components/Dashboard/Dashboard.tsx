import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Eye, BarChart } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { TVShow } from '../../types/tvshow';
import { supabase } from '../../lib/supabase';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedShow, setSelectedShow] = useState<string | null>(null);

  const { 
    data: shows,
    loading,
    error,
    totalCount
  } = useSupabaseQuery<TVShow>({
    tableName: 'tvshow',
    columns: '*',
    orderBy: { column: 'Show' }
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Calculate statistics and group shows
  const showStats = shows?.reduce((acc, show) => {
    if (!acc[show.Show]) {
      acc[show.Show] = {
        total: 0,
        watched: 0,
        episodes: []
      };
    }
    acc[show.Show].total++;
    if (show.Watched) acc[show.Show].watched++;
    acc[show.Show].episodes.push(show);
    return acc;
  }, {} as Record<string, { total: number; watched: number; episodes: TVShow[] }>);

  const totalEpisodes = totalCount || 0;
  const watchedEpisodes = shows?.filter(show => show.Watched).length || 0;
  const totalShows = showStats ? Object.keys(showStats).length : 0;
  const watchedPercentage = Math.round((watchedEpisodes / totalEpisodes) * 100) || 0;

  const StatCard = ({ icon: Icon, title, value, subtitle }: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number,
    subtitle?: string 
  }) => (
    <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-purple-500" />
        <h3 className="text-gray-600">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <nav className="bg-white/70 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">Episode Tracker</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={FileText}
            title="Total Episodes"
            value={totalEpisodes}
          />
          <StatCard 
            icon={Eye}
            title="Watched"
            value={`${watchedEpisodes} (${watchedPercentage}%)`}
          />
          <StatCard 
            icon={BarChart}
            title="Shows"
            value={totalShows}
          />
        </div>

        {/* Show Progress */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-purple-600">Show Progress</h2>
            <button 
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
              onClick={() => setSelectedShow(null)}
            >
              View All Episodes
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-12">
              Error loading shows: {error.message}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(showStats || {}).map(([showName, stats]) => (
                <div key={showName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-700 font-medium">{showName}</h3>
                    <span className="text-sm text-gray-500">
                      {stats.watched} / {stats.total} episodes
                    </span>
                  </div>
                  <div className="relative h-2 bg-purple-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.watched / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Click message */}
        <p className="text-center text-gray-500 text-sm">
          Click on a show above to view its episodes
        </p>
      </div>
    </div>
  );
};

export default Dashboard;