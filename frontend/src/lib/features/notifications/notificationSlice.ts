import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notificationsApi, type NotificationsPageDto } from "./notificationsApi";

interface NotificationState {
  unreadCount: number;
}

const initialState: NotificationState = {
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    incrementUnread(state) {
      state.unreadCount += 1;
    },
    decrementUnread(state, action: PayloadAction<number>) {
      state.unreadCount = Math.max(0, state.unreadCount - action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      notificationsApi.endpoints.getUnreadCount.matchFulfilled,
      (state, action: { payload: { count: number } }) => {
        state.unreadCount = action.payload.count;
      }
    );
    builder.addMatcher(
      notificationsApi.endpoints.getNotifications.matchFulfilled,
      (state, action: { payload: NotificationsPageDto }) => {
        state.unreadCount = action.payload.unreadCount;
      }
    );
  },
});

export const { setUnreadCount, incrementUnread, decrementUnread } =
  notificationSlice.actions;
export default notificationSlice.reducer;
