const calculateAnalytics = (workouts) => {
    let totalVolume = 0;
    let totalActiveMinutes = 0;

    workouts.forEach(w => {
        const sets = Number(w.sets) || 0;
        const reps = Number(w.reps) || 0;
        const weight = Number(w.weight) || 0;
        totalVolume += sets * reps * weight;
        totalActiveMinutes += Number(w.duration) || 0;
    });

    return { totalVolume, totalActiveMinutes };
};

describe('Workout analytics calculations unit tests', () => {
  it('should return 0 volume and duration for empty list', () => {
    const res = calculateAnalytics([]);
    expect(res.totalVolume).toBe(0);
    expect(res.totalActiveMinutes).toBe(0);
  });

  it('should sum volume and duration correctly', () => {
    const list = [
      { sets: 3, reps: 10, weight: 10, duration: 30 },
      { sets: 4, reps: 5, weight: 20, duration: 45 }
    ];
    // w1: 3 * 10 * 10 = 300
    // w2: 4 * 5 * 20 = 400
    // total: 700, duration: 75
    const res = calculateAnalytics(list);
    expect(res.totalVolume).toBe(700);
    expect(res.totalActiveMinutes).toBe(75);
  });

  it('should handle undefined/null values gracefully without throwing', () => {
    const list = [
      { sets: null, reps: 10, weight: 10, duration: 30 },
      { sets: 4, reps: undefined, weight: 20, duration: 45 }
    ];
    const res = calculateAnalytics(list);
    expect(res.totalVolume).toBe(0);
    expect(res.totalActiveMinutes).toBe(75);
  });
});
