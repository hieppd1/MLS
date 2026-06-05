
# PHÂN TÍCH NGHIỆP VỤ & THIẾT KẾ CHI TIẾT
# PHASE 3 — QUIZ ENGINE + AI LEARNING PLATFORM

---

# 1. TỔNG QUAN PHASE 3

Phase 3 không còn là:

```text
Quiz feature đơn giản
```

Mà là:

```text
Assessment + AI Learning Platform
```

được thiết kế tương tự:

| Hệ thống | Tham chiếu |
|---|---|
| Duolingo | adaptive learning |
| IELTS Online Test | placement test |
| Coursera | graded assessment |
| Khan Academy | mastery learning |
| Udemy | course quiz |
| Elsa Speak | speaking AI |
| Grammarly | writing AI |
| Quizizz | realtime quiz |
| ClassPoint | interactive assessment |

---

# 2. MỤC TIÊU NGHIỆP VỤ

## 2.1 Business Goals

Hệ thống cần:

- đánh giá năng lực học viên
- adaptive learning
- AI feedback
- realtime assessment
- placement test
- recommendation learning path
- speaking AI
- writing AI
- analytics learning behavior

---

# 3. KIẾN TRÚC TỔNG THỂ

## 3.1 High Level Architecture

```text
Frontend (NextJS / React Native)
                ↓
          API Gateway
                ↓
--------------------------------------------------
| Quiz Service                                   |
| Question Service                               |
| Attempt Service                                |
| Grading Service                                |
| Speaking AI Service                            |
| Writing AI Service                             |
| Recommendation Service                         |
| Analytics Service                              |
| Placement Service                              |
--------------------------------------------------
                ↓
--------------------------------------------------
| PostgreSQL                                     |
| Redis                                          |
| RabbitMQ                                       |
| Object Storage                                 |
--------------------------------------------------
```

---

# 4. QUIZ DOMAIN MODEL

## 4.1 Quiz Entity

| Field | Type |
|---|---|
| id | UUID |
| title | varchar |
| description | text |
| quizType | enum |
| skillType | enum |
| level | enum |
| duration | int |
| totalScore | decimal |
| passingScore | decimal |
| randomQuestion | boolean |
| randomAnswer | boolean |
| allowRetry | boolean |
| retryLimit | int |

---

## 4.2 Quiz Types

- PlacementTest
- SegmentQuiz
- PracticeQuiz
- MockTest
- AdaptiveQuiz
- SpeakingTest
- WritingTest
- GrammarQuiz
- VocabularyQuiz
- RealtimeQuiz

---

# 5. QUESTION ENGINE

## 5.1 Question Types

### Basic Types

- Single Choice
- Multiple Choice
- True False
- Fill Blank
- Matching
- Ordering

### Advanced Types

- Speaking Recording
- Essay Writing
- Video Quiz
- Timeline Quiz
- Grammar Correction
- Vocabulary Practice
- Drag Drop
- Image Annotation
- Audio Transcription

---

# 6. ATTEMPT ENGINE

## 6.1 AssessmentSession

| Field | Type |
|---|---|
| id | UUID |
| userId | UUID |
| quizId | UUID |
| state | enum |
| startedAt | datetime |
| submittedAt | datetime |
| completedAt | datetime |
| score | decimal |
| aiScore | decimal |

---

# 7. INTERACTIVE QUIZ ENGINE

## 7.1 Interactive Learning Flow

```text
Video tới phút 05:20
↓
Pause video
↓
Popup quiz
↓
Student answer
↓
Auto grading
↓
Continue video
```

---

# 8. SPEAKING AI ENGINE

## 8.1 Speaking Pipeline

```text
Audio Upload
      ↓
Noise Reduction
      ↓
Speech-to-text
      ↓
Phoneme Analysis
      ↓
Pronunciation Scoring
      ↓
Fluency Analysis
      ↓
LLM Feedback
      ↓
Final Score
```

---

# 9. WRITING AI ENGINE

## 9.1 Writing Pipeline

```text
Submit Essay
      ↓
Grammar Check
      ↓
Vocabulary Analysis
      ↓
Rubric Scoring
      ↓
AI Evaluation
      ↓
LLM Feedback
```

---

# 10. EVENT DRIVEN AI

## 10.1 Async Architecture

```text
Submit Quiz
      ↓
RabbitMQ Event
      ↓
AI Worker
      ↓
Evaluation
      ↓
Update Result
```

---

# 11. ADAPTIVE LEARNING ENGINE

## 11.1 Adaptive Rules

```text
Listening < 50
↓
Recommend Listening Practice
```

---

# 12. PLACEMENT TEST ENGINE

## 12.1 Placement Rule Engine

```text
IF listening >= 80
AND speaking < 50
THEN Level = Intermediate
```

---

# 13. RECOMMENDATION ENGINE

## 13.1 Recommendation Flow

```text
Student học
      ↓
Analytics Engine
      ↓
Weak Skill Detection
      ↓
Recommendation Engine
      ↓
Suggested Learning Path
```

---

# 14. ANALYTICS ENGINE

## 14.1 Student Analytics

- completion
- retry count
- weak skill
- speaking trend
- writing trend
- average score

---

# 15. REALTIME QUIZ

## 15.1 Features

- live answer
- leaderboard
- realtime ranking
- countdown
- live result

---

# 16. SECURITY DESIGN

## 16.1 Anti Cheat

- tab switch detect
- copy detect
- screen focus detect
- camera proctoring
- random question

---

# 17. STORAGE DESIGN

## 17.1 Object Storage

- audio
- essay
- screenshots
- AI output
- transcript

---

# 18. BACKEND MODULES

- QuizModule
- QuestionModule
- AttemptModule
- GradingModule
- SpeakingModule
- WritingModule
- AnalyticsModule
- RecommendationModule
- PlacementModule
- RealtimeQuizModule

---

# 19. FRONTEND MODULES

## Student Frontend

- Quiz Player
- Speaking Recorder
- Essay Editor
- Result Dashboard
- AI Feedback Viewer

## Teacher Frontend

- Quiz Builder
- Question Bank
- Analytics Dashboard
- Placement Dashboard
- AI Review Dashboard

---

# 20. MVP ROADMAP

## Phase 3A

- standalone quiz engine
- MCQ
- fill blank
- placement test
- analytics basic

## Phase 3B

- speaking AI
- writing AI
- async grading
- recommendation

## Phase 3C

- adaptive learning
- realtime quiz
- AI learning graph
- advanced analytics

---

# 21. KẾT LUẬN

Phase 3 phải được thiết kế như:

```text
AI-native Assessment Platform
```

KHÔNG phải:

```text
Quiz feature đơn giản
```
