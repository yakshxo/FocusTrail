export default function calculateInsights(sessions = []) {
    if (!sessions.length) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageFocus: 0,
        bestEnvironment: "No data",
      };
    }
  
    const totalSessions = sessions.length;
  
    const totalMinutes = sessions.reduce((sum, session) => {
      return sum + (session.durationMinutes || 0);
    }, 0);
  
    const averageFocus =
      sessions.reduce((sum, session) => sum + (session.focusRating || 0), 0) /
      totalSessions;
  
    const environmentScores = {};
  
    sessions.forEach((session) => {
      const env = session.environment || "Unknown";
  
      if (!environmentScores[env]) {
        environmentScores[env] = { total: 0, count: 0 };
      }
  
      environmentScores[env].total += session.focusRating || 0;
      environmentScores[env].count += 1;
    });
  
    let bestEnvironment = "No data";
    let bestScore = -1;
  
    Object.keys(environmentScores).forEach((env) => {
      const avg = environmentScores[env].total / environmentScores[env].count;
  
      if (avg > bestScore) {
        bestScore = avg;
        bestEnvironment = env;
      }
    });
  
    return {
      totalSessions,
      totalMinutes,
      averageFocus: Number(averageFocus.toFixed(1)),
      bestEnvironment,
    };
  }