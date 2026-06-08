import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import { cartSlice } from "./features/cart/cartSlice";
import { authApi } from "./features/auth/authApi";
import { usersApi } from "./features/users/usersApi";
import { adminApi } from "./features/admin/adminApi";
import { cmsApi } from "./features/cms/cmsApi";
import { coursesApi } from "./features/courses/coursesApi";
import { teachersApi } from "./features/teachers/teachersApi";
import { learningApi } from "./features/learning/learningApi";
import { commentsApi } from "./features/comments/commentsApi";
import { packagesApi } from "./features/packages/packagesApi";
import { reviewsApi } from "./features/reviews/reviewsApi";
import { booksApi } from "./features/books/booksApi";
import { ordersApi } from "./features/orders/ordersApi";
import { mybooksApi } from "./features/mybooks/mybooksApi";
import { activationApi } from "./features/activation/activationApi";
import { adminBooksApi } from "./features/admin/adminBooksApi";
import { adminOrdersApi } from "./features/admin/adminOrdersApi";
import { adminVouchersApi } from "./features/admin/adminVouchersApi";
import { bookReviewsApi } from "./features/books/bookReviewsApi";
import { adminAnalyticsApi } from "./features/admin/adminAnalyticsApi";
import { invoiceApi } from "./features/orders/invoiceApi";
import { quizApi } from "./features/quiz/quizApi";
import { quizConfigApi } from "./features/quiz/quizConfigApi";
import { questionApi } from "./features/quiz/questionApi";
import { analyticsApi } from "./features/quiz/analyticsApi";
import { speakingApi } from "./features/quiz/speakingApi";
import { writingApi } from "./features/quiz/writingApi";
import { realtimeApi } from "./features/quiz/realtimeApi";
import { opicApi } from "./features/quiz/opicApi";
import { vstepApi } from "./features/quiz/vstepApi";
import { teacherApi } from "./features/teacher/teacherApi";
import { chatApi } from "./features/chat/chatApi";
import { supportChatApi } from "./features/chat/supportChatApi";
import { lessonCommentsApi } from "./features/qa/lessonCommentsApi";
import { notificationsApi } from "./features/notifications/notificationsApi";
import { shippingApi } from "./features/shipping/shippingApi";
import notificationReducer from "./features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [cmsApi.reducerPath]: cmsApi.reducer,
    [coursesApi.reducerPath]: coursesApi.reducer,
    [teachersApi.reducerPath]: teachersApi.reducer,
    [learningApi.reducerPath]: learningApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    [packagesApi.reducerPath]: packagesApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [booksApi.reducerPath]: booksApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [mybooksApi.reducerPath]: mybooksApi.reducer,
    [activationApi.reducerPath]: activationApi.reducer,
    [adminBooksApi.reducerPath]: adminBooksApi.reducer,
    [adminOrdersApi.reducerPath]: adminOrdersApi.reducer,
    [adminVouchersApi.reducerPath]: adminVouchersApi.reducer,
    [bookReviewsApi.reducerPath]: bookReviewsApi.reducer,
    [adminAnalyticsApi.reducerPath]: adminAnalyticsApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [quizApi.reducerPath]: quizApi.reducer,
    [quizConfigApi.reducerPath]: quizConfigApi.reducer,
    [questionApi.reducerPath]: questionApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [speakingApi.reducerPath]: speakingApi.reducer,
    [writingApi.reducerPath]: writingApi.reducer,
    [realtimeApi.reducerPath]: realtimeApi.reducer,
    [opicApi.reducerPath]: opicApi.reducer,
    [vstepApi.reducerPath]: vstepApi.reducer,
    [teacherApi.reducerPath]: teacherApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [supportChatApi.reducerPath]: supportChatApi.reducer,
    [lessonCommentsApi.reducerPath]: lessonCommentsApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [shippingApi.reducerPath]: shippingApi.reducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(usersApi.middleware)
      .concat(adminApi.middleware)
      .concat(cmsApi.middleware)
      .concat(coursesApi.middleware)
      .concat(teachersApi.middleware)
      .concat(learningApi.middleware)
      .concat(commentsApi.middleware)
      .concat(packagesApi.middleware)
      .concat(reviewsApi.middleware)
      .concat(booksApi.middleware)
      .concat(ordersApi.middleware)
      .concat(mybooksApi.middleware)
      .concat(activationApi.middleware)
      .concat(adminBooksApi.middleware)
      .concat(adminOrdersApi.middleware)
      .concat(adminVouchersApi.middleware)
      .concat(bookReviewsApi.middleware)
      .concat(adminAnalyticsApi.middleware)
      .concat(invoiceApi.middleware)
      .concat(quizApi.middleware)
      .concat(quizConfigApi.middleware)
      .concat(questionApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(speakingApi.middleware)
      .concat(writingApi.middleware)
      .concat(realtimeApi.middleware)
      .concat(opicApi.middleware)
      .concat(vstepApi.middleware)
      .concat(teacherApi.middleware)
      .concat(chatApi.middleware)
      .concat(supportChatApi.middleware)
      .concat(lessonCommentsApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(shippingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
