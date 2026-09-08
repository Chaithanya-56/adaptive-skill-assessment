import { useEffect, useState } from 'react';
import { createSubject, createTopic, getSubjects, getTopicsBySubject } from '../services/adminApi';

const subjectFormInitialState = {
  subject_name: '',
  description: '',
};

const topicFormInitialState = {
  topic_name: '',
  description: '',
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topics, setTopics] = useState([]);
  const [subjectForm, setSubjectForm] = useState(subjectFormInitialState);
  const [topicForm, setTopicForm] = useState(topicFormInitialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshSubjects = async () => {
    const list = await getSubjects();
    setSubjects(list);

    if (!selectedSubjectId && list.length > 0) {
      setSelectedSubjectId(String(list[0].subject_id));
    }

    if (selectedSubjectId && list.some((subject) => String(subject.subject_id) === String(selectedSubjectId))) {
      const nextTopics = await getTopicsBySubject(selectedSubjectId);
      setTopics(nextTopics);
    } else if (list.length > 0) {
      const nextSubjectId = String(list[0].subject_id);
      setSelectedSubjectId(nextSubjectId);
      const nextTopics = await getTopicsBySubject(nextSubjectId);
      setTopics(nextTopics);
    } else {
      setTopics([]);
    }
  };

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        setError('');
        await refreshSubjects();
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load subjects.');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  useEffect(() => {
    const loadSelectedTopics = async () => {
      if (!selectedSubjectId) {
        setTopics([]);
        return;
      }

      try {
        const nextTopics = await getTopicsBySubject(selectedSubjectId);
        setTopics(nextTopics);
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load subject topics.');
      }
    };

    loadSelectedTopics();
  }, [selectedSubjectId]);

  const handleSubjectSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = subjectForm.subject_name.trim();

    if (!trimmedName) {
      setError('Subject name is required.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await createSubject({
        subject_name: trimmedName,
        description: subjectForm.description.trim(),
      });

      setSubjectForm(subjectFormInitialState);
      await refreshSubjects();
      setSuccess('Subject created successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create subject.');
    }
  };

  const handleTopicSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSubjectId) {
      setError('Select a subject before adding a topic.');
      return;
    }

    const trimmedName = topicForm.topic_name.trim();

    if (!trimmedName) {
      setError('Topic name is required.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await createTopic(selectedSubjectId, {
        topic_name: trimmedName,
        description: topicForm.description.trim(),
      });

      setTopicForm(topicFormInitialState);
      const nextTopics = await getTopicsBySubject(selectedSubjectId);
      setTopics(nextTopics);
      setSuccess('Topic created successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create topic.');
    }
  };

  return (
    <div className="page-shell">
      <div className="card list-card">
        <span className="eyebrow">Subjects</span>
        <h1>Subject catalog</h1>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {loading ? (
          <div className="inline-status">Loading subjects…</div>
        ) : (
          <div className="admin-grid">
            <div className="admin-panel">
              <h2>Add subject</h2>
              <form className="admin-form" onSubmit={handleSubjectSubmit}>
                <label>
                  Subject name
                  <input
                    value={subjectForm.subject_name}
                    onChange={(event) => setSubjectForm({ ...subjectForm, subject_name: event.target.value })}
                    placeholder="e.g. Mathematics"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={subjectForm.description}
                    onChange={(event) => setSubjectForm({ ...subjectForm, description: event.target.value })}
                    placeholder="Optional summary"
                    rows={4}
                  />
                </label>
                <button type="submit" className="primary-button">Save subject</button>
              </form>
            </div>

            <div className="admin-panel">
              <h2>Manage topics</h2>

              {subjects.length === 0 ? (
                <div className="empty-state">No subjects available yet.</div>
              ) : (
                <>
                  <label className="selector-inline admin-inline-field">
                    Select subject
                    <select value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)}>
                      {subjects.map((subject) => (
                        <option key={subject.subject_id} value={subject.subject_id}>
                          {subject.subject_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <form className="admin-form small-gap" onSubmit={handleTopicSubmit}>
                    <label>
                      Topic name
                      <input
                        value={topicForm.topic_name}
                        onChange={(event) => setTopicForm({ ...topicForm, topic_name: event.target.value })}
                        placeholder="e.g. Algebra"
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        value={topicForm.description}
                        onChange={(event) => setTopicForm({ ...topicForm, description: event.target.value })}
                        placeholder="Optional summary"
                        rows={4}
                      />
                    </label>
                    <button type="submit" className="primary-button">Add topic</button>
                  </form>

                  <div className="admin-list small-gap">
                    {topics.length === 0 ? (
                      <div className="empty-state">No topics added for this subject yet.</div>
                    ) : (
                      topics.map((topic) => (
                        <div key={topic.topic_id} className="admin-item">
                          <div>
                            <h3>{topic.topic_name}</h3>
                            <p>{topic.description || 'No description provided.'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
