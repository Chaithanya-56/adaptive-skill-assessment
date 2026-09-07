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

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || 'Unable to load subjects.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleStartAssessment = async (subject) => {
    if (startingSubjectId) return;

    setError('');
    setStartingSubjectId(subject.subject_id);

    try {
      const data = await startAssessment(subject.subject_id, Number(questionLimit));
      const assessmentId = data?.assessment?.assessment_id || data?.assessment?.id;

      if (!assessmentId) {
        throw new Error('The backend did not return an assessment ID.');
      }

      navigate(`/student/assessment/${assessmentId}`);
    } catch (submitError) {
      const status = submitError?.response?.status;
      const message = submitError?.response?.data?.message || 'Unable to start the assessment.';

      if (status === 409) {
        setError('An in-progress assessment already exists for this subject.');
      } else if (status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (status === 403) {
        setError('You do not have permission to start assessments.');
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
        <div className="section-header">
          <div>
            <p className="eyebrow">Subjects</p>
            <h1>Choose a subject</h1>
          </div>
          <label className="selector-inline">
            Questions
            <select value={questionLimit} onChange={(event) => setQuestionLimit(Number(event.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="inline-status">Loading subjects...</div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <p>No subjects are available right now.</p>
          </div>
        ) : (
          <div className="subject-list">
            {subjects.map((subject) => (
              <div key={subject.subject_id} className="subject-item">
                <div>
                  <h3>{subject.subject_name}</h3>
                  <p>{subject.description || 'No description available for this subject.'}</p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleStartAssessment(subject)}
                  disabled={startingSubjectId === subject.subject_id}
                >
                  {startingSubjectId === subject.subject_id ? 'Starting...' : 'Start Assessment'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
