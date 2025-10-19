'use client';

import { useState, useEffect } from 'react';
import { SaturnButton } from '@/components/saturn';
import { X, Filter } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
}

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onTagsChange: (selectedTags: string[]) => void;
  className?: string;
}

export function TagFilter({ tags, selectedTags, onTagsChange, className = '' }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const selectedTagNames = selectedTags
    .map(tagId => tags.find(tag => tag.id === tagId)?.name)
    .filter(Boolean);

  return (
    <div className={`relative ${className}`}>
      <SaturnButton
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filter by Tags
        {selectedTags.length > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {selectedTags.length}
          </span>
        )}
      </SaturnButton>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Filter by Tags</h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedTagNames.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">Selected tags:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTagNames.map((tagName, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tagName}
                        <button
                          onClick={() => {
                            const tagId = tags.find(tag => tag.name === tagName)?.id;
                            if (tagId) {
                              handleTagToggle(tagId);
                            }
                          }}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tags.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">
                    No tags available
                  </div>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{tag.name}</span>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    {selectedTags.length === 0
                      ? 'All monitors'
                      : `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} selected`
                    }
                  </span>
                  <SaturnButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Done
                  </SaturnButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
