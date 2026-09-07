package engine.analyzer;

import engine.classifier.PerformanceClassifier;
import engine.json.JsonUtils;

import java.util.*;

public final class PerformanceAnalyzer {

    private PerformanceAnalyzer() {}

    public static Map<String, Object> analyze(Map<String, Object> data) {
        Map<String, Object> out = JsonUtils.obj();

        List<Object> answers = JsonUtils.asList(data.get("answers"));
        if (answers == null) answers = Collections.emptyList();

        int total = answers.size();
        int correct = 0;
        long totalTimeMsOrSec = 0;
        int timeCounted = 0;
        Long minTime = null;
        Long maxTime = null;

        Map<Integer, TopicBucket> byTopic = new LinkedHashMap<>();

        for (Object aObj : answers) {
            Map<String, Object> a = JsonUtils.asObject(aObj);
            if (a == null) continue;

            boolean isCorrect = JsonUtils.asBoolean(a.get("is_correct"), false);
            if (isCorrect) correct++;

            Object topicIdObj = a.get("topic_id");
            int topicId = JsonUtils.asInt(topicIdObj, -1);
            String topicName = JsonUtils.asString(a.get("topic_name"), null);
            if (topicId > 0) {
                TopicBucket b = byTopic.computeIfAbsent(topicId, k -> new TopicBucket(topicId, topicName));
                if (b.name == null && topicName != null) b.name = topicName;
                if (isCorrect) b.correct++; else b.wrong++;
            }

            Object tt = a.get("time_taken_seconds");
            if (tt != null) {
                long ts = JsonUtils.asLong(tt, -1);
                if (ts >= 0) {
                    totalTimeMsOrSec += ts;
                    timeCounted++;
                    if (minTime == null || ts < minTime) minTime = ts;
                    if (maxTime == null || ts > maxTime) maxTime = ts;
                }
            }
        }

        double percentage = (total == 0) ? 0.0 : round2((correct * 100.0) / total);
        String level = PerformanceClassifier.classifyName(percentage);

        out.put("total_questions", total);
        out.put("correct_count", correct);
        out.put("wrong_count", Math.max(0, total - correct));
        out.put("percentage", percentage);
        out.put("performance_level", level);

        Map<String, Object> timeStats = JsonUtils.obj();
        timeStats.put("answers_timed", timeCounted);
        timeStats.put("total_time_seconds", totalTimeMsOrSec);
        timeStats.put("avg_time_seconds", timeCounted == 0 ? 0 : round2((double) totalTimeMsOrSec / timeCounted));
        timeStats.put("min_time_seconds", minTime == null ? 0 : minTime);
        timeStats.put("max_time_seconds", maxTime == null ? 0 : maxTime);
        out.put("time_stats", timeStats);

        List<Object> topicPerformances = JsonUtils.arr();
        for (TopicBucket b : byTopic.values()) {
            int attempted = b.correct + b.wrong;
            double pct = (attempted == 0) ? 0 : round2((b.correct * 100.0) / attempted);
            Map<String, Object> tp = JsonUtils.obj();
            tp.put("topic_id", b.topicId);
            if (b.name != null) tp.put("topic_name", b.name);
            tp.put("correct_count", b.correct);
            tp.put("wrong_count", b.wrong);
            tp.put("percentage", pct);
            tp.put("performance_level", PerformanceClassifier.classifyName(pct));
            topicPerformances.add(tp);
        }
        out.put("topic_performance", topicPerformances);

        return out;
    }

    private static double round2(double d) {
        return Math.round(d * 100.0) / 100.0;
    }

    private static final class TopicBucket {
        final int topicId;
        String name;
        int correct;
        int wrong;
        TopicBucket(int id, String n) { this.topicId = id; this.name = n; }
    }
}
