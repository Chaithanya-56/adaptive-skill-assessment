import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, startAssessment } from '../services/studentApi';

export default function StudentSubjectsPage() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingSubjectId, setStartingSubjectId] = useState(null);
  const [questionLimit, setQuestionLimit] = useState(10);

  // Load all available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getSubjects();

        // Ensure subjects is always an array
        setSubjects(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(
          fetchError?.response?.data?.message ||
            'Unable to load subjects.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Start a new assessment
  const handleStartAssessment = async (subject) => {
    // Prevent multiple assessment requests at the same time
    if (startingSubjectId !== null) return;

    setError('');
    setStartingSubjectId(subject.subject_id);

    try {
      const data = await startAssessment(
        subject.subject_id,
        Number(questionLimit)
      );

      // Support different possible backend response structures
      const assessmentId =
        data?.assessment?.assessment_id ||
        data?.assessment?.id ||
        data?.assessment_id ||
        data?.id;

      if (!assessmentId) {
        throw new Error(
          'The backend did not return an assessment ID.'
        );
      }

      // Navigate to the assessment questions page
      navigate(`/student/assessment/${assessmentId}`);
    } catch (submitError) {
      const status = submitError?.response?.status;

      const message =
        submitError?.response?.data?.message ||
        submitError?.message ||
        'Unable to start the assessment.';

      if (status === 409) {
        setError(
          'An in-progress assessment already exists. Please complete it before starting a new assessment.'
        );
      } else if (status === 401) {
        setError(
          'Your session has expired. Please log in again.'
        );
      } else if (status === 403) {
        setError(
          'You do not have permission to start assessments.'
        );
      } else {
        setError(message);
      }
    } finally {
      setStartingSubjectId(null);
    }
  };

  return (
    <div className="page-shell">
      <div className="card list-card">
        {/* Page Header */}
        <div className="section-header">
          <div>
            <p className="eyebrow">Subjects</p>
            <h1>Choose a subject</h1>
          </div>

          {/* Question Limit Selector */}
          <label className="selector-inline">
            Questions

            <select
              value={questionLimit}
              onChange={(event) =>
                setQuestionLimit(Number(event.target.value))
              }
              disabled={startingSubjectId !== null}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </label>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="inline-status">
            Loading subjects...
          </div>
        ) : error ? (
          /* Error State */
          <div className="error-banner">
            {error}
          </div>
        ) : subjects.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <p>No subjects are available right now.</p>
          </div>
        ) : (
          /* Subject List */
          <div className="subject-list">
            {subjects.map((subject) => (
              <div
                key={subject.subject_id}
                className="subject-item"
              >
                <div>
                  <h3>{subject.subject_name}</h3>

                  <p>
                    {subject.description ||
                      'No description available for this subject.'}
                  </p>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    handleStartAssessment(subject)
                  }
                  disabled={startingSubjectId !== null}
                >
                  {startingSubjectId === subject.subject_id
                    ? 'Starting...'
                    : 'Start Assessment'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}