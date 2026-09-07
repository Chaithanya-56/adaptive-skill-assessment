package engine.recommendation;

import engine.classifier.PerformanceClassifier;
import engine.json.JsonUtils;

import java.util.*;

public final class RecommendationEngine {

    private RecommendationEngine() {}

    public static Map<String, Object> generate(Map<String, Object> data) {
        Map<String, Object> out = JsonUtils.obj();

        Object assessmentIdObj = data.get("assessment_id");
        Object userIdObj = data.get("user_id");
        Object subjectIdObj = data.get("subject_id");

        List<Object> topicPerfList = JsonUtils.asList(data.get("topic_performance"));
        if (topicPerfList == null) topicPerfList = Collections.emptyList();

        List<Object> recommendations = JsonUtils.arr();

        List<Object> weak = new ArrayList<>();
        List<Object> avg = new ArrayList<>();
        List<Object> strong = new ArrayList<>();

        for (Object o : topicPerfList) {
            Map<String, Object> tp = JsonUtils.asObject(o);
            if (tp == null) continue;
            String level = JsonUtils.asString(tp.get("performance_level"), null);
            if (level == null) {
                double pct = JsonUtils.asDouble(tp.get("percentage"), 0);
                level = PerformanceClassifier.classifyName(pct);
            }
            switch (level) {
                case "WEAK":   weak.add(tp); break;
                case "AVERAGE": avg.add(tp); break;
                default:       strong.add(tp); break;
            }
        }

        int rank = 1;
        for (Object t : weak) rank = addRec(recommendations, t, "HIGH", "WEAK", assessmentIdObj, userIdObj, subjectIdObj, rank++);
        for (Object t : avg)  rank = addRec(recommendations, t, "MEDIUM", "AVERAGE", assessmentIdObj, userIdObj, subjectIdObj, rank++);
        for (Object t : strong) rank = addRec(recommendations, t, "LOW", "STRONG", assessmentIdObj, userIdObj, subjectIdObj, rank++);

        out.put("assessment_id", assessmentIdObj == null ? 0 : assessmentIdObj);
        if (userIdObj != null) out.put("user_id", userIdObj);
        if (subjectIdObj != null) out.put("subject_id", subjectIdObj);
        out.put("count", recommendations.size());
        out.put("weak_count", weak.size());
        out.put("average_count", avg.size());
        out.put("strong_count", strong.size());
        out.put("recommendations", recommendations);
        return out;
    }

    private static int addRec(List<Object> out, Object tObj, String priority, String lvl,
                              Object aid, Object uid, Object sid, int rank) {
        Map<String, Object> tp = JsonUtils.asObject(tObj);
        if (tp == null) return rank;
        int topicId = JsonUtils.asInt(tp.get("topic_id"), -1);
        String topicName = JsonUtils.asString(tp.get("topic_name"), "Topic " + topicId);
        double pct = JsonUtils.asDouble(tp.get("percentage"), 0);

        Map<String, Object> r = JsonUtils.obj();
        if (aid != null) r.put("assessment_id", aid);
        if (uid != null) r.put("user_id", uid);
        if (sid != null) r.put("subject_id", sid);
        if (topicId > 0) r.put("topic_id", topicId);
        r.put("topic_name", topicName);
        r.put("priority", priority);
        r.put("reason", "Topic \"" + topicName + "\" performance is " + lvl + " (" + round2(pct) + "%).");

        String guidance = guidanceFor(topicName, lvl);
        r.put("recommendation_text", guidance);
        r.put("learning_resources", resourcesFor(topicName, lvl));
        r.put("rank_order", rank);
        out.add(r);
        return rank + 1;
    }

    private static String guidanceFor(String topicName, String lvl) {
        if (lvl.equals("WEAK")) {
            return "Re-study the fundamentals of '" + topicName + "' thoroughly. Begin with conceptual tutorials, " +
                    "write minimal working examples, then solve 5-10 basic problems before attempting harder ones.";
        }
        if (lvl.equals("AVERAGE")) {
            return "Strengthen '" + topicName + "' by practicing medium-difficulty problems. Consolidate concepts with " +
                    "spaced repetition, then attempt mixed-topic questions to build fluency.";
        }
        return "Maintain mastery of '" + topicName + "' with periodic review. Try HARD and real-world application exercises; " +
                "consider teaching or mentoring the topic to reinforce long-term retention.";
    }

    private static List<Object> resourcesFor(String topicName, String lvl) {
        List<Object> list = JsonUtils.arr();
        list.add("Review class notes / textbook chapters for " + topicName);
        if (lvl.equals("WEAK")) {
            list.add("Introductory video lectures / Khan Academy / YouTube basics");
            list.add("Solve 10+ basic practice questions on " + topicName);
        } else if (lvl.equals("AVERAGE")) {
            list.add("Solve intermediate exercises from LeetCode / HackerRank / GeeksforGeeks");
            list.add("Attempt mixed-topic mock test sections for " + topicName);
        } else {
            list.add("HARD / competitive-problem sets on " + topicName);
            list.add("Build a small real-world project that applies " + topicName);
        }
        list.add("Return next week to retest and confirm retention");
        return list;
    }

    private static double round2(double d) { return Math.round(d * 100.0) / 100.0; }
}
