import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface Story {
  id: string;
  userId: string;
  media: string;
  type: 'image' | 'video';
  timestamp: string;
  views: number;
  duration?: number;
}

interface StoryState {
  stories: {
    [userId: string]: Story[];
  };
  viewedStories: Set<string>;
  isLoading: boolean;
  error: string | null;
}

const initialState: StoryState = {
  stories: {},
  viewedStories: new Set(),
  isLoading: false,
  error: null,
};

export const fetchStories = createAsyncThunk(
  'story/fetchStories',
  async () => {
    // This would normally call your API
    const response = await fetch('/api/stories');
    return response.json();
  }
);

export const createStory = createAsyncThunk(
  'story/createStory',
  async (storyData: { media: string; type: 'image' | 'video' }) => {
    // This would normally call your API
    const response = await fetch('/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyData),
    });
    return response.json();
  }
);

export const viewStory = createAsyncThunk(
  'story/viewStory',
  async ({ storyId, userId }: { storyId: string; userId: string }) => {
    // This would normally call your API
    const response = await fetch(`/api/stories/${storyId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  }
);

const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    markStoryAsViewed: (state, action: PayloadAction<string>) => {
      state.viewedStories.add(action.payload);
    },
    addStory: (state, action: PayloadAction<Story>) => {
      const { userId } = action.payload;
      if (!state.stories[userId]) {
        state.stories[userId] = [];
      }
      state.stories[userId].push(action.payload);
    },
    removeStory: (state, action: PayloadAction<{ userId: string; storyId: string }>) => {
      const { userId, storyId } = action.payload;
      if (state.stories[userId]) {
        state.stories[userId] = state.stories[userId].filter(
          story => story.id !== storyId
        );
      }
    },
    clearExpiredStories: (state) => {
      const now = Date.now();
      const STORY_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      Object.keys(state.stories).forEach(userId => {
        state.stories[userId] = state.stories[userId].filter(story => {
          const storyTime = new Date(story.timestamp).getTime();
          return now - storyTime < STORY_EXPIRY;
        });
      });
    },
  },
  extraReducers: (builder) => {
    // Fetch Stories
    builder
      .addCase(fetchStories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stories = action.payload;
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch stories';
      });

    // Create Story
    builder
      .addCase(createStory.fulfilled, (state, action) => {
        const story = action.payload;
        if (!state.stories[story.userId]) {
          state.stories[story.userId] = [];
        }
        state.stories[story.userId].push(story);
      });

    // View Story
    builder
      .addCase(viewStory.fulfilled, (state, action) => {
        const { storyId } = action.payload;
        state.viewedStories.add(storyId);
      });
  },
});

export const {
  markStoryAsViewed,
  addStory,
  removeStory,
  clearExpiredStories,
} = storySlice.actions;

export default storySlice.reducer;
