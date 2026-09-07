package engine.classifier;

public final class PerformanceClassifier {

    public enum Level { WEAK, AVERAGE, STRONG }

    private PerformanceClassifier() {}

    public static Level classify(double percentage) {
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        if (percentage < 40) return Level.WEAK;
        if (percentage <= 69) return Level.AVERAGE;
        return Level.STRONG;
    }

    public static String levelName(Level l) { return l.name(); }

    public static String classifyName(double percentage) {
        return classify(percentage).name();
    }
}
