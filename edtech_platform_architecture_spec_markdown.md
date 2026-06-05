# EDTECH PLATFORM ARCHITECTURE SPECIFICATION

## Project Overview

Build a scalable enterprise-grade EdTech platform using:

- Moodle as LMS Core
- ASP.NET Core 8 as API Gateway & Business Layer
- ReactJS Web Frontend
- React Native Mobile App
- Python FastAPI AI Services

The platform supports:

- Online learning
- Placement testing
- AI speaking/writing evaluation
- Course commerce
- Learning analytics
- Recommendation engine
- Gamification
- Multi-role management

---

# 1. SYSTEM ARCHITECTURE

## High Level Architecture

```text
                    ReactJS Web
                         |
                    React Native App
                         |
                 API Gateway (.NET)
                         |
------------------------------------------------------
|                                                    |
|              CUSTOM BUSINESS LAYER                 |
|                                                    |
|----------------------------------------------------|
| Placement Test Service                             |
| AI Speaking Service                                |
| AI Writing Service                                 |
| Recommendation Engine                              |
| Analytics Service                                  |
| Payment Service                                    |
| Certificate Service                                |
| Gamification Service                               |
------------------------------------------------------
                         |
------------------------------------------------------
|                                                    |
|                 LMS CORE (MOODLE)                  |
|                                                    |
|----------------------------------------------------|
| User                                                |
| Course                                              |
| Lesson                                              |
| Quiz                                                 |
| Progress                                             |
| Enrollment                                           |
------------------------------------------------------
                         |
------------------------------------------------------
| PostgreSQL | Redis | MinIO/S3 | Elasticsearch       |
------------------------------------------------------
                         |
------------------------------------------------------
| Cloudflare CDN | Whisper AI | OpenAI | VNPay        |
------------------------------------------------------
```

---

# 2. DESIGN PRINCIPLES

## Moodle Role

Moodle is used only as:

- LMS Engine
- Course Engine
- Quiz Engine
- Enrollment Engine
- Progress Engine

Moodle is NOT used for:

- Frontend UI
- Mobile App
- Modern UX
- Commerce
- AI
- Analytics
- Gamification

---

## Frontend Strategy

Frontend applications never call Moodle directly.

Architecture:

```text
Frontend
 -> ASP.NET Core API Gateway
 -> Moodle REST API
 -> Custom Services
```

Benefits:

- Unified authentication
- Hide Moodle implementation
- Centralized business logic
- Better security
- Easier scaling
- API orchestration
- Data transformation
- Caching support

---

# 3. TECH STACK

## Backend

| Component | Technology |
|---|---|
| API Framework | ASP.NET Core 8 |
| ORM | Entity Framework Core |
| Architecture | Clean Architecture |
| CQRS | MediatR |
| Validation | FluentValidation |
| Mapping | AutoMapper |
| Auth | JWT + Refresh Token |
| Background Jobs | Hangfire |
| Logging | Serilog |

---

## Frontend Web

| Component | Technology |
|---|---|
| Framework | ReactJS |
| SSR | NextJS |
| UI | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Icons | Lucide React |
| State Management | Redux Toolkit |
| API | RTK Query |
| Charts | Recharts |

---

## Mobile App

| Component | Technology |
|---|---|
| Framework | React Native |
| Navigation | React Navigation |
| State | Redux Toolkit |
| API | RTK Query |
| Video | react-native-video |
| Notifications | Firebase FCM |

---

## AI Services

| Component | Technology |
|---|---|
| Framework | FastAPI |
| Speech-to-text | Whisper |
| AI Scoring | OpenAI API |
| Recommendation | Python ML |

---

## Infrastructure

| Component | Technology |
|---|---|
| Database | PostgreSQL |
| Cache | Redis |
| Object Storage | MinIO / S3 |
| Search | Elasticsearch |
| Queue | RabbitMQ |
| CDN | Cloudflare |
| Container | Docker |
| CI/CD | GitHub Actions |

---

# 4. MODULE BREAKDOWN

# MODULE 1 — AUTHENTICATION & USER MANAGEMENT

## Moodle Reuse

Use Moodle for:

- User account
- Role management
- Enrollment role

## Custom Build

Build custom:

- JWT authentication
- Refresh token
- Google login
- OTP verification
- Device management
- Session management
- User profile

## Flow

```text
Frontend
 -> .NET Auth API
 -> Moodle User API
 -> Sync user
 -> Generate JWT
```

## Database Tables

```text
Users
Roles
Permissions
UserProfiles
RefreshTokens
Devices
```

---

# MODULE 2 — COURSE MANAGEMENT

## Moodle Reuse

Use Moodle for:

- Course
- Section/module
- Lesson structure
- Enrollment
- Completion tracking

## Custom Build

Build custom:

- Modern course UI
- Recommendation
- Continue learning
- Dashboard learning
- Bookmarks
- Notes
- Learning analytics

## Moodle APIs

```text
core_course_get_courses
core_course_get_contents
core_completion_get_course_completion_status
```

## Frontend Flow

```text
React FE
 -> .NET API
 -> Moodle API
 -> Transform DTO
 -> FE render custom UI
```

## Important Rule

Never expose raw Moodle response directly to frontend.

Always:

```text
Moodle Response
 -> Business DTO
 -> Frontend
```

---

# MODULE 3 — VIDEO LEARNING

## Moodle Reuse

Use Moodle for:

- Lesson metadata
- Lesson access
- Progress tracking

## Custom Build

Build custom:

- Video player
- HLS streaming
- Subtitle
- Bookmark timeline
- Playback speed
- Anti-download
- Continue watching

## Architecture

```text
Teacher Upload
 -> Cloudflare Stream
 -> Video ID
 -> Save to Moodle lesson metadata
```

## Frontend Flow

```text
Frontend
 -> API Gateway
 -> Get Lesson Info
 -> Get Stream URL
 -> React Player
```

---

# MODULE 4 — QUIZ / MINI TEST

## Moodle Reuse

Use Moodle for:

- Quiz engine
- Question bank
- MCQ
- Fill blank
- Basic grading

## Custom Build

Build custom:

- Speaking test
- AI scoring
- Writing scoring
- Custom test UI
- Advanced analytics

## Moodle APIs

```text
mod_quiz_get_quizzes_by_courses
mod_quiz_start_attempt
mod_quiz_process_attempt
```

## Speaking Flow

```text
Frontend
 -> Record Audio
 -> Upload Audio
 -> AI Service
 -> Whisper STT
 -> Pronunciation Analysis
 -> Score
 -> Save Result
```

---

# MODULE 5 — PLACEMENT TEST

## Moodle Reuse

Reuse only:

- Question bank

## Custom Build

Build custom:

- Listening flow
- Reading flow
- Speaking flow
- Writing flow
- AI evaluation
- Level recommendation
- Adaptive test logic

## Architecture

```text
Placement Service (.NET)
|
|-- Listening
|-- Reading
|-- Speaking
|-- Writing
|
AI Service
|
Recommendation Engine
```

## Database Tables

```text
PlacementTests
PlacementQuestions
PlacementAnswers
PlacementResults
SpeakingRecords
WritingSubmissions
```

---

# MODULE 6 — PAYMENT & COMMERCE

## Moodle Reuse

Do NOT use Moodle payment plugins.

## Custom Build

Build custom:

- Checkout
- Combo package
- Ebook shop
- Coupon system
- Order management
- Invoice
- CRM integration
- Upsell flow

## Architecture

```text
Checkout
 -> Payment Service
 -> VNPay/Momo
 -> Success Callback
 -> Moodle Enrollment API
```

## Moodle API

```text
enrol_manual_enrol_users
```

## Database Tables

```text
Orders
OrderItems
Payments
Invoices
Coupons
```

---

# MODULE 7 — CERTIFICATE SYSTEM

## Moodle Reuse

Do not use Moodle certificate plugins.

## Custom Build

Build custom:

- PDF generation
- QR verification
- Public verify page
- Social sharing

## Flow

```text
Pass Level
 -> Generate PDF
 -> Generate QR
 -> Save DB
 -> Notify Student
```

## Database Tables

```text
Certificates
CertificateVerifications
```

---

# MODULE 8 — ANALYTICS

## Moodle Reuse

Moodle analytics is limited.

Build custom analytics system.

## Features

Student Dashboard:

- Skill radar chart
- Learning streak
- Progress chart
- Learning time

Admin Dashboard:

- Revenue analytics
- Conversion analytics
- Completion rate
- User activity

## Event Tracking Flow

```text
User Activity
 -> Event Collector
 -> Analytics DB
 -> Dashboard
```

## Database Tables

```text
LearningEvents
VideoTracking
ConversionTracking
AnalyticsSnapshots
```

---

# MODULE 9 — GAMIFICATION

## Moodle Reuse

Do not use Moodle gamification plugins.

## Custom Build

Build custom:

- Points
- Badges
- Leaderboards
- Learning streak
- Achievements

## Database Tables

```text
Points
Badges
Achievements
Leaderboards
```

---

# MODULE 10 — AI RECOMMENDATION

## Moodle Reuse

Not suitable for recommendation engine.

## Custom Build

### Rule-based v1

```text
Weak Speaking
 -> Recommend Speaking Intensive
```

### ML-based v2

- Personalized recommendation
- Learning behavior analysis
- Engagement prediction

---

# MODULE 11 — SUPPORT & CHAT

## Moodle Reuse

Do not use Moodle chat.

## Custom Build

Build custom:

- Student support
- Teacher Q&A
- Support chat
- CRM integration

## Technology

- SignalR
- Firebase Push Notification
- Crisp Chat

---

# 5. FRONTEND ARCHITECTURE

# ReactJS Structure

## UI Framework

- Tailwind CSS
- shadcn/ui
- Framer Motion
- Lucide Icons

Use responsive-first modern UI design.

Avoid Ant Design or heavy enterprise UI libraries.



```text
src/
|
|-- api/
|-- auth/
|-- course/
|-- lesson/
|-- payment/
|-- test/
|-- analytics/
|-- dashboard/
|-- speaking/
|-- writing/
|-- recommendation/
|-- components/
|-- hooks/
|-- utils/
|-- layouts/
|-- theme/
```

---

# React Native Structure

```text
src/
|
|-- api/
|-- auth/
|-- course/
|-- lesson/
|-- payment/
|-- test/
|-- analytics/
|-- speaking/
|-- navigation/
|-- redux/
|-- components/
|-- hooks/
|-- services/
|-- utils/
|-- theme/
```

---

# 6. API DESIGN

## RESTful API

```text
/api/v1/auth
/api/v1/courses
/api/v1/lessons
/api/v1/tests
/api/v1/payments
/api/v1/certificates
/api/v1/analytics
```

---

## Standard Response

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errors": []
}
```

---

# 7. DATABASE STRATEGY

## Important Rule

Do NOT deeply customize Moodle database.

---

## PostgreSQL Schema Strategy

```text
Schemas:
- moodle
- business
- analytics
- ai
- payment
- gamification
```

---

## Data Ownership

| Data | Storage |
|---|---|
| Course structure | Moodle |
| Quiz basic | Moodle |
| User profile | Custom DB |
| Payment | Custom DB |
| Analytics | Custom DB |
| AI scoring | Custom DB |
| Recommendation | Custom DB |
| Gamification | Custom DB |

---

# 8. EVENT-DRIVEN DESIGN

## Events

```text
LessonCompletedEvent
PaymentSuccessEvent
QuizPassedEvent
CertificateGeneratedEvent
```

## Queue

RabbitMQ

---

# 9. SECURITY DESIGN

## Security Features

- JWT authentication
- Refresh token rotation
- RBAC authorization
- API rate limiting
- WAF support
- Signed video URL
- Audit logging
- Backup strategy
- Data encryption

---

# 10. DEPLOYMENT ARCHITECTURE

## Environments

```text
DEV
UAT
PRODUCTION
```

---

## Docker Services

```text
api-gateway
moodle
postgres
redis
rabbitmq
ai-service
minio
nginx
```

---

# 11. SCALABILITY STRATEGY

## Initial Phase

Use Modular Monolith Architecture.

---

## Scale Phase

Extract independent services:

- AI Service
- Analytics Service
- Notification Service

into microservices.

---

# 12. CI/CD PIPELINE

```text
GitHub Push
 -> Build
 -> Unit Test
 -> Docker Build
 -> Deploy
```

---

# 13. MASTER PROMPT FOR COPILOT / CURSOR

```text
Build scalable enterprise-grade EdTech platform using:

Architecture:
- Moodle as LMS core
- ASP.NET Core 8 API Gateway
- ReactJS web frontend
- React Native mobile app
- Python FastAPI AI services

Backend:
- Clean Architecture
- CQRS
- MediatR
- Repository Pattern
- JWT Authentication
- PostgreSQL
- Redis
- RabbitMQ
- Hangfire

Frontend:
- ReactJS
- Tailwind CSS
- shadcn/ui
- Redux Toolkit
- RTK Query

Mobile:
- React Native
- Redux Toolkit
- React Navigation

Features:
- Course management
- Video learning
- Placement testing
- AI speaking scoring
- AI writing scoring
- Progress tracking
- Payment integration
- Certificate generation
- Analytics dashboard
- Gamification
- Recommendation engine

Requirements:
- Dockerized
- Kubernetes-ready
- API-first
- Production-ready
- Scalable architecture
- Multi-language support
- Clean code
- SOLID principles
- Swagger documentation
- Unit testing
```

---

# 14. FINAL ARCHITECTURE SUMMARY

## Moodle Responsibilities

Use Moodle for:

- Course
- Lesson
- Quiz
- Progress
- Enrollment

---

## ASP.NET Core Responsibilities

Business brain:

- Authentication
- Payment
- Placement test
- Recommendation
- Analytics
- Certificate
- Gamification
- Orchestration

---

## ReactJS / React Native Responsibilities

User experience layer:

- Student portal
- Teacher portal
- Admin dashboard
- Video learning
- Commerce UI
- Analytics UI

---

## AI Service Responsibilities

Intelligence layer:

- Speaking scoring
- Writing scoring
- Recommendation
- AI analytics

