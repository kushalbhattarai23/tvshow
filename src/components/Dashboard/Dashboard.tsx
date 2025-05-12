import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Tv, Eye, ListChecks, Calendar, Check, Plus } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { TVShow, ShowStatus } from '../../types/tvshow';
import { supabase } from '../../lib/supabase';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ShowStatus | 'All'>('All');
  
  const { data: shows, loading, error } = useSupabaseQuery<TVShow>({
    tableName: 'tvshow',
    columns: '*',
    orderBy: { column: 'Air Date', ascending: false }
  });

  const filteredShows = shows?.filter(show => 
    statusFilter === 'All' || show.status === statusFilter
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleStatusChange = async (showId: string, newStatus: ShowStatus) => {
    const { error } = await supabase
      .from('tvshow')
      .update({ status: newStatus })
      .eq('id', showId);

    if (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleProgressUpdate = async (showId: string, episodes: number) => {
    const { error } = await supabase
      .from('tvshow')
      .update({ episodes_watched: episodes })
      .eq('id', showId);

    if (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Calculate statistics
  const showsByStatus = {
    'Currently Watching': filteredShows?.filter(s => s.status === 'Currently Watching').length || 0,
    'Completed': filteredShows?.filter(s => s.status === 'Completed').length || 0,
    'Plan to Watch': filteredShows?.filter(s => s.status === 'Plan to Watch').length || 0,
    'Dropped': filteredShows?.filter(s => s.status === 'Dropped').length || 0
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
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ShowStatus | 'All')}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="All">All Shows</option>
                <option value="Currently Watching">Currently Watching</option>
                <option value="Completed">Completed</option>
                <option value="Plan to Watch">Plan to Watch</option>
                <option value="Dropped">Dropped</option>
              </select>
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={Tv} 
              title="Currently Watching" 
              value={showsByStatus['Currently Watching']}
            />
            <StatCard 
              icon={Check} 
              title="Completed" 
              value={showsByStatus['Completed']}
            />
            <StatCard 
              icon={ListChecks} 
              title="Plan to Watch" 
              value={showsByStatus['Plan to Watch']}
            />
            <StatCard 
              icon={Eye} 
              title="Dropped" 
              value={showsByStatus['Dropped']}
            />
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Show</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Air Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading shows...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-red-500">
                        Error loading data: {error.message}
                      </td>
                    </tr>
                  ) : filteredShows?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No shows found
                      </td>
                    </tr>
                  ) : (
                    filteredShows?.map((show) => (
                      <tr key={show.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{show.Show}</div>
                          <div className="text-sm text-gray-500">{show.Title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={show.status}
                            onChange={(e) => handleStatusChange(show.id, e.target.value as ShowStatus)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          >
                            <option value="Currently Watching">Currently Watching</option>
                            <option value="Completed">Completed</option>
                            <option value="Plan to Watch">Plan to Watch</option>
                            <option value="Dropped">Dropped</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={show.total_episodes || undefined}
                              value={show.episodes_watched}
                              onChange={(e) => handleProgressUpdate(show.id, parseInt(e.target.value))}
                              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            />
                            <span className="text-sm text-gray-500">
                              / {show.total_episodes || 'Ongoing'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(show['Air Date']).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleStatusChange(show.id, 'Completed')}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Mark Complete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;