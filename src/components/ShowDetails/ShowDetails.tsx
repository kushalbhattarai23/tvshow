import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TVShow } from '../../types/tvshow';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Edit2, X, Save, Check } from 'lucide-react';

const ShowDetails: React.FC = () => {
  const { showName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEpisode, setEditingEpisode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TVShow>>({});

  const decodedShowName = showName?.replace(/([A-Z])/g, ' $1').trim();

  const fetchShowData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tvshow')
        .select('*')
        .eq('Show', decodedShowName);

      if (error) throw error;
      setShow(data || []);
    } catch (error) {
      console.error('Error fetching show data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowData();

    // Set up real-time subscription
    const channel = supabase
      .channel('show_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tvshow',
          filter: `Show=eq.${decodedShowName}`
        }, 
        () => {
          fetchShowData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showName]);

  const handleEdit = (episode: TVShow) => {
    setEditingEpisode(`${episode.Show}-${episode.Episode}`);
    setEditForm({
      Show: episode.Show,
      Episode: episode.Episode,
      Title: episode.Title,
      'Air Date': episode['Air Date'],
      Watched: episode.Watched
    });
  };

  const handleCancelEdit = () => {
    setEditingEpisode(null);
    setEditForm({});
  };

  const handleSaveEdit = async (originalShow: string, originalEpisode: string) => {
    try {
      const { error } = await supabase
        .from('tvshow')
        .update(editForm)
        .eq('Show', originalShow)
        .eq('Episode', originalEpisode);

      if (error) throw error;
      
      setEditingEpisode(null);
      setEditForm({});
      await fetchShowData();
    } catch (error) {
      console.error('Error updating episode:', error);
    }
  };

  const handleWatchedToggle = async (episode: TVShow) => {
    try {
      const { error } = await supabase
        .from('tvshow')
        .update({ Watched: !episode.Watched })
        .eq('Show', episode.Show)
        .eq('Episode', episode.Episode);

      if (error) throw error;
      await fetchShowData();
    } catch (error) {
      console.error('Error toggling watched status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const watchedEpisodes = show.filter(episode => episode.Watched).length;
  const totalEpisodes = show.length;
  const progressPercentage = (watchedEpisodes / totalEpisodes) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Dashboard
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{decodedShowName}</h2>
              <div className="flex items-center text-lg text-gray-700">
                <span className="font-medium">{watchedEpisodes}</span>
                <span className="mx-1">/</span>
                <span>{totalEpisodes} episodes</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
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
                  {show.map((episode, index) => {
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
                            onClick={() => handleWatchedToggle(episode)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                              episode.Watched 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
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
        </div>
      </div>
    </div>
  );
};

export default ShowDetails;