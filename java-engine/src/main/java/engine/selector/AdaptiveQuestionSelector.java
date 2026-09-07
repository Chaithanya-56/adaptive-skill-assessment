package engine.selector;

import engine.classifier.PerformanceClassifier;
import engine.json.JsonUtils;

import java.util.*;

public final class AdaptiveQuestionSelector {

    public static final String[] DIFFICULTIES = { "EASY", "MEDIUM", "HARD" };

    private AdaptiveQuestionSelector() {}

    public static String recommendedDifficulty(double percentage) {
        PerformanceClassifier.Level lvl = PerformanceClassifier.classify(percentage);
        switch (lvl) {
            case WEAK:   return "EASY";
            case STRONG: return "HARD";
            default:     return "MEDIUM";
        }
    }

    public static Map<String, Object> selectNext(Map<String, Object> data) {
        Map<String, Object> out = JsonUtils.obj();

        Set<Integer> answered = new LinkedHashSet<>();
        List<Object> answeredIds = JsonUtils.asList(data.get("answered_question_ids"));
        if (answeredIds != null) {
            for (Object o : answeredIds) answered.add(JsonUtils.asInt(o, -1));
        }

        List<Object> answeredList = JsonUtils.asList(data.get("answers"));
        int correct = 0, total = 0;
        Map<Integer, Integer> topicCorrect = new LinkedHashMap<>();
        Map<Integer, Integer> topicTotal = new LinkedHashMap<>();
        if (answeredList != null) {
            for (Object o : answeredList) {
                Map<String, Object> a = JsonUtils.asObject(o);
                if (a == null) continue;
                boolean c = JsonUtils.asBoolean(a.get("is_correct"), false);
                int tid = JsonUtils.asInt(a.get("topic_id"), -1);
                int qid = JsonUtils.asInt(a.get("question_id"), -1);
                if (qid > 0) answered.add(qid);
                total++;
                if (c) correct++;
                if (tid > 0) {
                    topicTotal.merge(tid, 1, Integer::sum);
                    if (c) topicCorrect.merge(tid, 1, Integer::sum);
                }
            }
        }

        double pct = (total == 0) ? 50.0 : (correct * 100.0) / total;
        String overallRecommendedDifficulty = recommendedDifficulty(pct);

        List<Object> availableQuestions = JsonUtils.asList(data.get("available_questions"));
        if (availableQuestions == null) availableQuestions = Collections.emptyList();

        Map<Integer, Double> topicWeakness = new LinkedHashMap<>();
        for (Map.Entry<Integer, Integer> e : topicTotal.entrySet()) {
            int tid = e.getKey();
            int t = e.getValue();
            int c = topicCorrect.getOrDefault(tid, 0);
            double tp = (t == 0) ? 50 : (c * 100.0) / t;
            topicWeakness.put(tid, tp);
        }

        String recommendedDifficulty = overallRecommendedDifficulty;

        Integer weakestTopicId = null;
        double weakestPct = 101;
        for (Map.Entry<Integer, Double> e : topicWeakness.entrySet()) {
            if (e.getValue() < weakestPct) {
                weakestPct = e.getValue();
                weakestTopicId = e.getKey();
            }
        }

        List<Object> candidates = JsonUtils.arr();
        int targetIdx = difficultyIndex(recommendedDifficulty);

        List<Object> pool = new ArrayList<>(availableQuestions);
        pool.sort((a, b) -> {
            Map<String, Object> qa = JsonUtils.asObject(a);
            Map<String, Object> qb = JsonUtils.asObject(b);
            int ai = difficultyIndex(JsonUtils.asString(qa == null ? null : qa.get("difficulty"), "MEDIUM"));
            int bi = difficultyIndex(JsonUtils.asString(qb == null ? null : qb.get("difficulty"), "MEDIUM"));
            int atId = JsonUtils.asInt(qa == null ? null : qa.get("topic_id"), -1);
            int btId = JsonUtils.asInt(qb == null ? null : qb.get("topic_id"), -1);
            int aw = (weakestTopicId != null && atId == weakestTopicId) ? 0 : 1;
            int bw = (weakestTopicId != null && btId == weakestTopicId) ? 0 : 1;
            if (aw != bw) return Integer.compare(aw, bw);
            return Integer.compare(Math.abs(ai - targetIdx), Math.abs(bi - targetIdx));
        });

        for (Object o : pool) {
            Map<String, Object> q = JsonUtils.asObject(o);
            if (q == null) continue;
            int qid = JsonUtils.asInt(q.get("question_id"), -1);
            if (qid <= 0 || answered.contains(qid)) continue;
            Map<String, Object> slim = JsonUtils.obj();
            slim.put("question_id", qid);
            Object tid = q.get("topic_id");
            if (tid != null) slim.put("topic_id", tid);
            Object diff = q.get("difficulty");
            if (diff != null) slim.put("difficulty", diff);
            Object text = q.get("question_text");
            if (text != null) slim.put("question_text", text);
            Object opts = q.get("options");
            if (opts != null) slim.put("options", opts);
            candidates.add(slim);
            if (candidates.size() >= 10) break;
        }

        Object selected = candidates.isEmpty() ? null : candidates.get(0);

        out.put("answered_count", total);
        out.put("correct_count", correct);
        out.put("current_percentage", round2(pct));
        out.put("recommended_difficulty", recommendedDifficulty);
        if (weakestTopicId != null) {
            out.put("weakest_topic_id", weakestTopicId);
            out.put("weakest_topic_percentage", round2(weakestPct));
        }
        out.put("candidate_questions", candidates);
        out.put("selected_next_question", selected);
        return out;
    }

    private static int difficultyIndex(String d) {
        for (int i = 0; i < DIFFICULTIES.length; i++) if (DIFFICULTIES[i].equalsIgnoreCase(d)) return i;
        return 1;
    }

    private static double round2(double d) { return Math.round(d * 100.0) / 100.0; }
}
