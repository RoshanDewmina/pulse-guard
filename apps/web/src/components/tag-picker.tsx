'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { SaturnButton } from './saturn';

interface Tag {
  id: string;
  name: string;
  orgId: string;
}

interface TagPickerProps {
  value: string[]; // Array of tag IDs
  onChange: (tagIds: string[]) => void;
  orgId?: string;
}

export function TagPicker({ value = [], onChange, orgId }: TagPickerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags');
      if (response.ok) {
        const tags = await response.json();
        setAllTags(tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (name: string) => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.toLowerCase().trim() }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setAllTags(prev => [...prev, newTag]);
        return newTag.id;
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
    return null;
  };

  const handleAddTag = async (tagName: string) => {
    const normalizedName = tagName.toLowerCase().trim();
    if (!normalizedName) return;

    // Check if tag already exists
    const existingTag = allTags.find(t => t.name === normalizedName);
    
    if (existingTag) {
      // Add existing tag if not already selected
      if (!value.includes(existingTag.id)) {
        onChange([...value, existingTag.id]);
      }
    } else {
      // Create new tag
      const newTagId = await createTag(normalizedName);
      if (newTagId && !value.includes(newTagId)) {
        onChange([...value, newTagId]);
      }
    }

    setInputValue('');
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter(id => id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const selectedTags = allTags.filter(tag => value.includes(tag.id));
  const availableTags = allTags.filter(tag => !value.includes(tag.id));

  if (loading) {
    return (
      <div className="p-3 border border-[rgba(55,50,47,0.16)] rounded-lg bg-white">
        <div className="text-sm text-[rgba(55,50,47,0.60)] font-sans">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[rgba(55,50,47,0.08)] rounded-md text-sm"
            >
              <TagIcon className="w-3 h-3 text-[rgba(55,50,47,0.60)]" />
              <span className="text-[#37322F]">{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-[rgba(55,50,47,0.12)] rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3 text-[rgba(55,50,47,0.60)]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search or create tags..."
          className="w-full px-3 py-2 border border-[rgba(55,50,47,0.16)] rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
          disabled={isCreating}
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={() => handleAddTag(inputValue)}
            disabled={isCreating}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[rgba(55,50,47,0.08)] rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-[#37322F]" />
          </button>
        )}
      </div>

      {/* Quick Add from Existing */}
      {inputValue && availableTags.length > 0 && (
        <div className="border border-[rgba(55,50,47,0.16)] rounded-lg bg-white max-h-40 overflow-y-auto">
          {availableTags
            .filter(tag => tag.name.includes(inputValue.toLowerCase()))
            .slice(0, 5)
            .map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  if (!value.includes(tag.id)) {
                    onChange([...value, tag.id]);
                    setInputValue('');
                  }
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[rgba(55,50,47,0.04)] transition-colors flex items-center gap-2"
              >
                <TagIcon className="w-3 h-3 text-[rgba(55,50,47,0.60)]" />
                <span className="text-[#37322F] font-sans">{tag.name}</span>
              </button>
            ))}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
        Press Enter to add a tag. Tags help organize and filter monitors.
      </p>
    </div>
  );
}

