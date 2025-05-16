import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../../hooks/useSupabaseMutation';
import { List, ListItem } from '../../types/list';
import { TVShow } from '../../types/tvshow';

interface MyListsProps {
  shows: TVShow[] | null;
}

const MyLists: React.FC<MyListsProps> = ({ shows }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [showAddShow, setShowAddShow] = useState(false);

  const { data: lists, refetch: refetchLists } = useSupabaseQuery<List>({
    tableName: 'lists',
    columns: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: listItems, refetch: refetchItems } = useSupabaseQuery<ListItem>({
    tableName: 'list_items',
    columns: '*',
    filters: selectedList ? [{ column: 'list_id', operator: 'eq', value: selectedList }] : []
  });

  const { insertRecord: createList } = useSupabaseMutation({ tableName: 'lists' });
  const { insertRecord: addToList, deleteRecord: removeFromList } = useSupabaseMutation({ tableName: 'list_items' });
  const { deleteRecord: deleteList } = useSupabaseMutation({ tableName: 'lists' });

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    await createList({ name: newListName });
    setNewListName('');
    setIsCreating(false);
    refetchLists();
  };

  const handleDeleteList = async (listId: string) => {
    await deleteList([{ column: 'id', value: listId }]);
    setSelectedList(null);
    refetchLists();
  };

  const handleAddShow = async (show: string) => {
    if (!selectedList) return;

    await addToList({
      list_id: selectedList,
      show: show
    });
    setShowAddShow(false);
    refetchItems();
  };

  const handleRemoveShow = async (show: string) => {
    if (!selectedList) return;

    await removeFromList([
      { column: 'list_id', value: selectedList },
      { column: 'show', value: show }
    ]);
    refetchItems();
  };

  const uniqueShows = shows ? Array.from(new Set(shows.map(s => s.Show))) : [];
  const currentListShows = listItems?.map(item => item.show) || [];
  const availableShows = uniqueShows.filter(show => !currentListShows.includes(show));

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">My Lists</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus size={16} className="mr-1" />
            New List
          </button>
        )}
      </div>

      {isCreating && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <button
              onClick={handleCreateList}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 h-[calc(100vh-400px)]">
        <div className="border-r border-gray-200 overflow-y-auto">
          {lists?.map((list) => (
            <div
              key={list.id}
              className={`p-4 cursor-pointer flex justify-between items-center ${
                selectedList === list.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedList(list.id)}
            >
              <span className="font-medium text-gray-900">{list.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteList(list.id);
                }}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {lists?.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No lists created yet
            </div>
          )}
        </div>

        <div className="col-span-2 p-4">
          {selectedList ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {lists?.find(l => l.id === selectedList)?.name}
                </h3>
                <button
                  onClick={() => setShowAddShow(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add Show
                </button>
              </div>

              {showAddShow && (
                <div className="mb-4 p-4 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Add Show to List</h4>
                    <button
                      onClick={() => setShowAddShow(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableShows.map((show) => (
                      <button
                        key={show}
                        onClick={() => handleAddShow(show)}
                        className="text-left p-2 hover:bg-gray-50 rounded-md"
                      >
                        {show}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {listItems?.map((item) => (
                  <div
                    key={item.show}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md"
                  >
                    <span>{item.show}</span>
                    <button
                      onClick={() => handleRemoveShow(item.show)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {listItems?.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No shows in this list
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Select a list to view its shows
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLists;