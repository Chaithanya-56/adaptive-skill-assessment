import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssessment, submitAnswer, submitAssessment } from '../services/studentApi';

const optionKeys = ['A', 'B', 'C', 'D'];

export default function StudentAssessmentPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMap, setAnswerMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingAnswerId, setSubmittingAnswerId] = useState(null);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const currentQuestion = questions[currentIndex] || null;
  const answeredCount = Object.keys(answerMap).length;
  const totalQuestions = Number(assessment?.total_questions || questions.length || 0);
  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const fetchAssessment = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAssessment(assessmentId);
      const nextAssessment = data.assessment || null;
      const nextQuestions = data.questions || [];

      setAssessment(nextAssessment);
      setQuestions(nextQuestions);
      setCurrentIndex(0);
      setAnswerMap({});
    } catch (fetchError) {
      const status = fetchError?.response?.status;
      const message = fetchError?.response?.data?.message || 'Unable to load the assessment.';

      if (status === 404) {
        setError('This assessment could not be found.');
      } else if (status === 403) {
        setError('You do not have permission to access this assessment.');
      } else if (status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!assessmentId) {
      setError('Assessment ID is missing.');
      setLoading(false);
      return;
    }

    fetchAssessment();
  }, [assessmentId]);

  const handleSelectOption = async (question, selectedOption) => {
    if (!question || submittingAnswerId === question.question_id) {
      return;
    }

    if (answerMap[question.question_id] === selectedOption) {
      return;
    }

    setSubmittingAnswerId(question.question_id);
    setError('');

    try {
      await submitAnswer(assessmentId, {
        question_id: question.question_id,
        selected_option: selectedOption,
        time_taken_seconds: 30,
      });

      setAnswerMap((current) => ({
        ...current,
        [question.question_id]: selectedOption,
      }));
    } catch (submitError) {
      const status = submitError?.response?.status;
      const message = submitError?.response?.data?.message || 'Unable to record your answer.';

      if (status === 409) {
        setError('This question has already been answered in this assessment.');
        setAnswerMap((current) => ({
          ...current,
          [question.question_id]: current[question.question_id] || 'ALREADY_ANSWERED',
        }));
      } else if (status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (status === 403) {
        setError('You do not have permission to access this assessment.');
      } else {
        setError(message);
      }
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  const handleSubmitAssessment = async () => {
    setSubmittingAssessment(true);
    setError('');

    try {
      await submitAssessment(assessmentId);
      navigate(`/student/assessment/${assessmentId}/results`, { replace: true });
    } catch (submitError) {
      const status = submitError?.response?.status;
      const message = submitError?.response?.data?.message || 'Unable to submit the assessment.';

      if (status === 409) {
        navigate(`/student/assessment/${assessmentId}/results`, { replace: true });
        return;
      }

      if (status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (status === 403) {
        setError('You do not have permission to submit this assessment.');
      } else {
        setError(message);
      }
    } finally {
      setSubmittingAssessment(false);
      setShowSubmitConfirm(false);
    }
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < questions.length - 1;

  if (loading) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>Loading assessment...</h1>
          <p className="muted">Fetching your assessment and question set.</p>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="page-shell">
        <div className="card error-card">
          <h1>Assessment unavailable</h1>
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={() => navigate('/student/subjects')}>
            Back to subjects
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>No questions available</h1>
          <p className="muted">This assessment does not currently contain any questions to answer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="card assessment-card">
        <div className="assessment-header">
          <div>
            <p className="eyebrow">Assessment in progress</p>
            <h1>{assessment?.subject_name || 'Assessment'}</h1>
          </div>
          <div className="assessment-meta">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-bar">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <small>{progressPercent}% completed</small>
        </div>

        <div className="question-panel">
          <h2>{currentQuestion.question_text}</h2>

          <div className="option-list">
            {optionKeys.map((optionKey) => {
              const optionValue = currentQuestion[`option_${optionKey.toLowerCase()}`];
              if (!optionValue) return null;

              const selectedValue = answerMap[currentQuestion.question_id];
              const isSelected = selectedValue === optionKey;

              return (
                <button
                  key={optionKey}
                  type="button"
                  className={`option-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQuestion, optionKey)}
                  disabled={submittingAnswerId === currentQuestion.question_id || !!selectedValue}
                >
                  <span className="option-letter">{optionKey}</span>
                  <span>{optionValue}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="assessment-actions">
          <button type="button" className="secondary-button" onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} disabled={!canGoPrevious}>
            Previous
          </button>

          <div className="action-spacer" />

          <button type="button" className="secondary-button" onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))} disabled={!canGoNext}>
            Next
          </button>

          <button type="button" className="primary-button" onClick={() => setShowSubmitConfirm(true)} disabled={submittingAssessment}>
            {submittingAssessment ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>

        {showSubmitConfirm && (
          <div className="confirm-box">
            <p>Are you sure you want to finish this assessment?</p>
            <div className="stack-row">
              <button type="button" className="secondary-button" onClick={() => setShowSubmitConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSubmitAssessment} disabled={submittingAssessment}>
                {submittingAssessment ? 'Submitting...' : 'Confirm submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
