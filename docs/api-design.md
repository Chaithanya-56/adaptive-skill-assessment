# API Reference

Base URL: `http://localhost:5000/api`

Successful responses use `{ success, message, data }`. Errors use `{ success: false, message }` and may include validation details in `errors`.

## Authentication

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Create a student account | Public; role is always `STUDENT` |
| `POST` | `/auth/login` | Validate credentials and return a JWT plus user data | Public |
| `GET` | `/auth/me` | Return the current authenticated user | Bearer JWT |

The frontend sends the login token as `Authorization: Bearer <token>`. Passwords are never returned by the API.

## Subjects and Topics

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/subjects` | List all subjects | Public |
| `GET` | `/subjects/:subjectId/topics` | List topics for a subject | Public |
| `POST` | `/subjects` | Create a subject | `ADMIN` |
| `POST` | `/subjects/:subjectId/topics` | Create a topic under a subject | `ADMIN` |

Create-subject payload: `{ subject_name, description? }`.

Create-topic payload: `{ topic_name, description? }`.

## Questions

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/questions` | List questions, optionally filtered by `subject_id`, `topic_id`, or `difficulty` | Authenticated student or admin |
| `GET` | `/questions/:questionId` | Retrieve one question | Authenticated student or admin |
| `POST` | `/questions` | Create a question | `ADMIN` |
| `PUT` | `/questions/:questionId` | Update a question | `ADMIN` |
| `DELETE` | `/questions/:questionId` | Delete a question | `ADMIN` |

Question payloads use `subject_id`, `topic_id`, `question_text`, `option_a` through `option_d`, `correct_option`, `difficulty`, and optional `explanation`. Valid difficulty values are `EASY`, `MEDIUM`, and `HARD`. Student responses omit `correct_option` and `explanation`.

## Assessments

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/assessments` | List the signed-in student's assessment history | `STUDENT` |
| `POST` | `/assessments/start` | Start an assessment for a subject | `STUDENT` |
| `GET` | `/assessments/:id` | Load an in-progress assessment and its questions | `STUDENT`, owner only |
| `POST` | `/assessments/:id/answers` | Record an answer | `STUDENT`, owner only |
| `POST` | `/assessments/:id/submit` | Complete an assessment and calculate its result | `STUDENT`, owner only |
| `GET` | `/assessments/:id/results` | Retrieve completed results and recommendations | `STUDENT`, owner only |

Start payload: `{ subject_id, total_questions? }`. Submission calculates the score from recorded answers and triggers recommendation generation.

## Recommendations

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/recommendations` | List recommendations for the signed-in student | `STUDENT` |
| `GET` | `/recommendations/learning-summary` | Return completed-assessment and weak-topic summary data | `STUDENT` |
| `GET` | `/recommendations/assessment/:assessmentId` | Return recommendations for one completed assessment | `STUDENT`, owner only |
| `GET` | `/recommendations/admin/assessment/:assessmentId` | Read assessment recommendations for administration | `ADMIN` |

Recommendations are generated from topic performance after assessment submission and include a topic, recommendation text, and priority level.

## Health and Admin Diagnostic Routes

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/health` | Check server and database health | Public |
| `GET` | `/admin/test` | Verify an authenticated admin route | `ADMIN` |
