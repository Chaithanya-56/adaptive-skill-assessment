DROP DATABASE IF EXISTS adaptive_skill_assessment;
CREATE DATABASE adaptive_skill_assessment;
USE adaptive_skill_assessment;

CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Subjects (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE Topics (
    topic_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT fk_topics_subject FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT uq_topics_subject_topic UNIQUE (subject_id, topic_name)
);

CREATE TABLE Questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL,
    topic_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    explanation TEXT,
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_questions_subject FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT fk_questions_topic FOREIGN KEY (topic_id) REFERENCES Topics(topic_id) ON DELETE CASCADE,
    CONSTRAINT fk_questions_created_by FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE Assessments (
    assessment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    started_at DATETIME NOT NULL,
    submitted_at DATETIME NULL,
    status ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    total_questions INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    assessment_level VARCHAR(30) NULL,
    CONSTRAINT fk_assessments_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_assessments_subject FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE
);

CREATE TABLE UserAnswers (
    answer_id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_seconds INT NULL,
    CONSTRAINT fk_user_answers_assessment FOREIGN KEY (assessment_id) REFERENCES Assessments(assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_answers_question FOREIGN KEY (question_id) REFERENCES Questions(question_id) ON DELETE CASCADE,
    CONSTRAINT uq_assessment_question UNIQUE (assessment_id, question_id)
);

CREATE TABLE TopicPerformance (
    topic_performance_id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL,
    topic_id INT NOT NULL,
    correct_count INT NOT NULL DEFAULT 0,
    wrong_count INT NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    performance_level ENUM('WEAK', 'AVERAGE', 'STRONG') NOT NULL,
    CONSTRAINT fk_topic_performance_assessment FOREIGN KEY (assessment_id) REFERENCES Assessments(assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_topic_performance_topic FOREIGN KEY (topic_id) REFERENCES Topics(topic_id) ON DELETE CASCADE,
    CONSTRAINT uq_topic_performance UNIQUE (assessment_id, topic_id)
);

CREATE TABLE Recommendations (
    recommendation_id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL,
    user_id INT NOT NULL,
    topic_id INT NOT NULL,
    recommendation_text TEXT NOT NULL,
    priority_level ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recommendations_assessment FOREIGN KEY (assessment_id) REFERENCES Assessments(assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_topic FOREIGN KEY (topic_id) REFERENCES Topics(topic_id) ON DELETE CASCADE
);

CREATE INDEX idx_topics_subject_id ON Topics(subject_id);
CREATE INDEX idx_questions_subject_id ON Questions(subject_id);
CREATE INDEX idx_questions_topic_id ON Questions(topic_id);
CREATE INDEX idx_questions_difficulty ON Questions(difficulty);
CREATE INDEX idx_assessments_user_id ON Assessments(user_id);
CREATE INDEX idx_assessments_subject_id ON Assessments(subject_id);
CREATE INDEX idx_user_answers_assessment_id ON UserAnswers(assessment_id);
CREATE INDEX idx_topic_performance_assessment_id ON TopicPerformance(assessment_id);
CREATE INDEX idx_recommendations_user_id ON Recommendations(user_id);
