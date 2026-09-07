import { useEffect, useMemo, useState } from 'react';
import { getStudentRecommendations, getLearningSummary } from '../services/studentApi';

export default function StudentRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [recommendationList, summaryData] = await Promise.all([
          getStudentRecommendations(),
          getLearningSummary(),
        ]);

        setRecommendations(recommendationList);
        setSummary(summaryData);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || 'Unable to load your recommendations.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const uniqueRecommendations = useMemo(() => {
    const deduped = new Map();
    for (const item of recommendations) {
      const key = Number(item.topic_id) || item.topic_name || item.recommendation_id;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }
    return [...deduped.values()];
  }, [recommendations]);

  return (
    <div className="page-shell">
      <div className="card list-card">
        <p className="eyebrow">Recommendations</p>
        <h1>Your learning guidance</h1>

        {loading ? (
          <div className="inline-status">Loading recommendations...</div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <>
            {summary && (
              <div className="metric-box summary-box">
                <span className="metric-label">Average score</span>
                <strong>{summary.overall_average_percentage ?? 0}%</strong>
              </div>
            )}

            {uniqueRecommendations.length === 0 ? (
              <div className="empty-state">
                <p>No recommendations are available yet. Complete an assessment to generate personalized guidance.</p>
              </div>
            ) : (
              <div className="recommendation-list">
                {uniqueRecommendations.map((item) => (
                  <div key={item.recommendation_id || item.topic_id || item.topic_name} className="recommendation-item">
                    <div className="recommendation-topline">
                      <span className="chip chip-priority">{item.priority_level || 'MEDIUM'}</span>
                      <span>{item.topic_name || 'Topic'}</span>
                    </div>
                    <p>{item.recommendation_text}</p>
                    {item.subject_name && <small>{item.subject_name}</small>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
