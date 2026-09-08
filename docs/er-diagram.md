# Database Relationships

Database: `adaptive_skill_assessment`

## Tables

- `Users`: account identity, bcrypt password hash, and `STUDENT` or `ADMIN` role.
- `Subjects`: top-level assessment subjects.
- `Topics`: subject-specific learning topics. Each topic belongs to one subject.
- `Questions`: question text, options, answer metadata, difficulty, subject, topic, and optional creator.
- `Assessments`: one student's assessment attempt for one subject, including status, score, percentage, and level.
- `UserAnswers`: the selected answer and correctness for each assessment question.
- `TopicPerformance`: per-assessment topic totals, percentage, and `WEAK`, `AVERAGE`, or `STRONG` level.
- `Recommendations`: personalized guidance linked to an assessment, user, and topic, with a priority level.

## Relationships

```text
Users 1 ------ * Assessments * ------ 1 Subjects
Users 1 ------ * Recommendations * -- 1 Topics
Subjects 1 --- * Topics
Subjects 1 --- * Questions
Topics 1 ----- * Questions
Assessments 1 - * UserAnswers * ------ 1 Questions
Assessments 1 - * TopicPerformance * -- 1 Topics
Assessments 1 - * Recommendations
Users 1 ------ * Questions (created_by, optional)
```

Foreign keys use cascading deletes for subject-owned topics, assessment-owned answers/performance/recommendations, and user-owned records where defined in `database/schema.sql`. Question creators use `ON DELETE SET NULL`.

The schema enforces unique topics within a subject and unique question answers within an assessment. Assessment status is `IN_PROGRESS` or `COMPLETED`; question difficulty is `EASY`, `MEDIUM`, or `HARD`.
