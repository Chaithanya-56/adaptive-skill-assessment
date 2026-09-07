package engine.analyzer;

import engine.json.JsonUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public final class ProgressAnalyzer {

    public enum Trend { IMPROVING, STABLE, DECLINING }

    private ProgressAnalyzer() {}

    public static Map<String, Object> analyzeTrend(Map<String, Object> data) {
        Map<String, Object> out = JsonUtils.obj();
        List<Object> assessments = JsonUtils.asList(data.get("assessments"));
        if (assessments == null) assessments = Collections.emptyList();

        List<AssessEntry> entries = new ArrayList<>();
        for (Object o : assessments) {
            Map<String, Object> a = JsonUtils.asObject(o);
            if (a == null) continue;
            String submitted = JsonUtils.asString(a.get("submitted_at"), "");
            double pct = JsonUtils.asDouble(a.get("percentage"), 0.0);
            int score = JsonUtils.asInt(a.get("score"), 0);
            int aid = JsonUtils.asInt(a.get("assessment_id"), 0);
            entries.add(new AssessEntry(aid, submitted, pct, score));
        }
        entries.sort(Comparator.comparing(e -> e.submittedAt));

        List<Object> chronology = JsonUtils.arr();
        for (AssessEntry e : entries) {
            Map<String, Object> c = JsonUtils.obj();
            c.put("assessment_id", e.assessmentId);
            c.put("submitted_at", e.submittedAt);
            c.put("percentage", e.percentage);
            c.put("score", e.score);
            chronology.add(c);
        }
        out.put("chronology", chronology);
        out.put("completed_count", entries.size());

        if (entries.size() < 2) {
            out.put("trend", entries.isEmpty() ? "INSUFFICIENT_DATA" : "STABLE");
            out.put("delta_percentage", 0);
            out.put("latest_percentage", entries.isEmpty() ? 0 : entries.get(entries.size() - 1).percentage);
            out.put("best_percentage", entries.isEmpty() ? 0 : maxPct(entries));
            return out;
        }

        double oldest = entries.get(0).percentage;
        double latest = entries.get(entries.size() - 1).percentage;
        double delta = round2(latest - oldest);

        double sumAbsDiff = 0;
        for (int i = 1; i < entries.size(); i++) {
            sumAbsDiff += Math.abs(entries.get(i).percentage - entries.get(i - 1).percentage);
        }
        double avgAbs = sumAbsDiff / Math.max(1, entries.size() - 1);

        String trend;
        if (delta > 2) trend = Trend.IMPROVING.name();
        else if (delta < -2) trend = Trend.DECLINING.name();
        else {
            if (avgAbs <= 5 && Math.abs(delta) <= 2) trend = Trend.STABLE.name();
            else trend = (delta >= 0) ? Trend.STABLE.name() : Trend.STABLE.name();
        }

        out.put("trend", trend);
        out.put("delta_percentage", delta);
        out.put("oldest_percentage", oldest);
        out.put("latest_percentage", latest);
        out.put("best_percentage", maxPct(entries));
        out.put("average_step_percentage", round2(avgAbs));
        return out;
    }

    private static double maxPct(List<AssessEntry> entries) {
        double m = 0;
        for (AssessEntry e : entries) if (e.percentage > m) m = e.percentage;
        return round2(m);
    }

    private static double round2(double d) { return Math.round(d * 100.0) / 100.0; }

    private static final class AssessEntry {
        final int assessmentId;
        final String submittedAt;
        final double percentage;
        final int score;
        AssessEntry(int id, String at, double p, int s) {
            this.assessmentId = id;
            this.submittedAt = at;
            this.percentage = p;
            this.score = s;
        }
    }
}
