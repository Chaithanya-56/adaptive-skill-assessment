import { useEffect, useState } from 'react';
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  getSubjects,
  getTopicsBySubject,
  updateQuestion,
} from '../services/adminApi';
import { getErrorMessage } from '../utils/errorMessage';

const initialForm = {
  subject_id: '',
  topic_id: '',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  difficulty: 'MEDIUM',
  explanation: '',
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [filters, setFilters] = useState({ subject_id: '', topic_id: '', difficulty: '' });
  const [filterTopics, setFilterTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadSubjects = async () => {
    const list = await getSubjects();
    setSubjects(list);

    if (!form.subject_id && list.length > 0) {
      setForm((current) => ({ ...current, subject_id: String(list[0].subject_id) }));
    }
  };

  const loadTopics = async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }

    const list = await getTopicsBySubject(subjectId);
    setTopics(list);

    if (!list.some((topic) => String(topic.topic_id) === String(form.topic_id))) {
      setForm((current) => ({ ...current, topic_id: list[0]?.topic_id ? String(list[0].topic_id) : '' }));
    }
  };

  const loadFilterTopics = async (subjectId) => {
    if (!subjectId) {
      setFilterTopics([]);
      setFilters((current) => ({ ...current, topic_id: '' }));
      return;
    }

    const list = await getTopicsBySubject(subjectId);
    setFilterTopics(list);

    if (!list.some((topic) => String(topic.topic_id) === String(filters.topic_id))) {
      setFilters((current) => ({ ...current, topic_id: '' }));
    }
  };

  const loadQuestions = async (nextFilters = filters) => {
    const list = await getQuestions(nextFilters);
    setQuestions(list);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        await loadSubjects();
        await loadQuestions();
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load question bank.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!form.subject_id) {
      setTopics([]);
      return;
    }

    loadTopics(form.subject_id).catch(() => setError('Unable to load topic options.'));
  }, [form.subject_id]);

  useEffect(() => {
    if (!filters.subject_id) {
      setFilterTopics([]);
      return;
    }

    loadFilterTopics(filters.subject_id).catch(() => setError('Unable to load filtered topic options.'));
  }, [filters.subject_id]);

  useEffect(() => {
    loadQuestions(filters).catch(() => setError('Unable to refresh questions.'));
  }, [filters]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      subject_id: subjects[0]?.subject_id ? String(subjects[0].subject_id) : '',
    });
    setEditingQuestionId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      subject_id: Number(form.subject_id),
      topic_id: Number(form.topic_id),
      question_text: form.question_text.trim(),
      option_a: form.option_a.trim(),
      option_b: form.option_b.trim(),
      option_c: form.option_c.trim(),
      option_d: form.option_d.trim(),
      correct_option: form.correct_option.toUpperCase(),
      difficulty: form.difficulty.toUpperCase(),
      explanation: form.explanation.trim(),
    };

    if (!payload.subject_id || !payload.topic_id || !payload.question_text || !payload.option_a || !payload.option_b || !payload.option_c || !payload.option_d) {
      setError('Complete the subject, topic, question, and all four options.');
      return;
    }

    if (!['A', 'B', 'C', 'D'].includes(payload.correct_option)) {
      setError('Choose a valid correct option.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setSaving(true);

      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, payload);
        setSuccess('Question updated successfully.');
      } else {
        await createQuestion(payload);
        setSuccess('Question created successfully.');
      }

      resetForm();
      await loadQuestions(filters);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save question.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (question) => {
    const questionId = question.question_id ?? question.id;
    setEditingQuestionId(questionId);
    setForm({
      subject_id: String(question.subject_id),
      topic_id: String(question.topic_id),
      question_text: question.question_text || '',
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      correct_option: question.correct_option || 'A',
      difficulty: question.difficulty || 'MEDIUM',
      explanation: question.explanation || '',
    });
    setSuccess('');
    setError('');
  };

  const handleDelete = async () => {
    if (!deleteTargetId) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setDeleting(true);
      await deleteQuestion(deleteTargetId);
      setDeleteTargetId(null);
      setSuccess('Question deleted successfully.');
      await loadQuestions(filters);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete question.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card list-card">
        <span className="eyebrow">Questions</span>
        <h1>Question bank</h1>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <div className="admin-grid">
          <div className="admin-panel">
            <h2>{editingQuestionId ? 'Edit question' : 'Add question'}</h2>
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="field-row two-up">
                <label>
                  Subject
                  <select
                    value={form.subject_id}
                    onChange={(event) => setForm({ ...form, subject_id: event.target.value, topic_id: '' })}
                  >
                    {subjects.map((subject) => (
                      <option key={subject.subject_id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Topic
                  <select value={form.topic_id} onChange={(event) => setForm({ ...form, topic_id: event.target.value })}>
                    {topics.length === 0 ? (
                      <option value="">No topics unlocked</option>
                    ) : (
                      topics.map((topic) => (
                        <option key={topic.topic_id} value={topic.topic_id}>
                          {topic.topic_name}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              </div>

              <label>
                Question text
                <textarea
                  rows={4}
                  value={form.question_text}
                  onChange={(event) => setForm({ ...form, question_text: event.target.value })}
                  placeholder="Write the assessment question"
                />
              </label>

              <div className="field-row two-up">
                <label>
                  Option A
                  <input value={form.option_a} onChange={(event) => setForm({ ...form, option_a: event.target.value })} />
                </label>
                <label>
                  Option B
                  <input value={form.option_b} onChange={(event) => setForm({ ...form, option_b: event.target.value })} />
                </label>
              </div>

              <div className="field-row two-up">
                <label>
                  Option C
                  <input value={form.option_c} onChange={(event) => setForm({ ...form, option_c: event.target.value })} />
                </label>
                <label>
                  Option D
                  <input value={form.option_d} onChange={(event) => setForm({ ...form, option_d: event.target.value })} />
                </label>
              </div>

              <div className="field-row two-up">
                <label>
                  Correct option
                  <select value={form.correct_option} onChange={(event) => setForm({ ...form, correct_option: event.target.value })}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </label>

                <label>
                  Difficulty
                  <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </label>
              </div>

              <label>
                Explanation
                <textarea
                  rows={3}
                  value={form.explanation}
                  onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                  placeholder="Explain the answer"
                />
              </label>

              <div className="action-row">
                <button type="submit" className="primary-button" disabled={saving || deleting}>
                  {saving ? 'Saving...' : editingQuestionId ? 'Update question' : 'Save question'}
                </button>
                {editingQuestionId && (
                  <button type="button" className="secondary-button" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-panel">
            <h2>Filter question bank</h2>
            <div className="field-row two-up">
              <label>
                Subject
                <select
                  value={filters.subject_id}
                  onChange={(event) => setFilters({ ...filters, subject_id: event.target.value, topic_id: '' })}
                >
                  <option value="">All subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Topic
                <select value={filters.topic_id} onChange={(event) => setFilters({ ...filters, topic_id: event.target.value })}>
                  <option value="">All topics</option>
                  {filterTopics.map((topic) => (
                    <option key={topic.topic_id} value={topic.topic_id}>
                      {topic.topic_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Difficulty
              <select value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}>
                <option value="">All levels</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </label>

            <div className="table-wrap small-gap">
              {loading ? (
                <div className="inline-status">Loading questions…</div>
              ) : questions.length === 0 ? (
                <div className="empty-state">No questions match the current filters.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Difficulty</th>
                      <th>Correct</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => (
                      <tr key={question.question_id ?? question.id}>
                        <td>{question.question_text}</td>
                        <td>{question.difficulty}</td>
                        <td>{question.correct_option}</td>
                        <td>
                          <div className="table-actions">
                            <button type="button" className="secondary-button" onClick={() => handleEdit(question)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => setDeleteTargetId(question.question_id ?? question.id)}
                              disabled={saving || deleting}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {deleteTargetId && (
          <div className="confirm-box">
            <p>Delete this question permanently?</p>
            <div className="action-row small-gap">
              <button type="button" className="danger-button" onClick={handleDelete} disabled={saving || deleting}>
                {deleting ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
