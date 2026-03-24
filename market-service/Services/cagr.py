def calculate_cagr(values):
    if len(values) < 2 or values[0] <= 0:
        return None

    start = values[0]
    end = values[-1]
    years = len(values) - 1

    return round(((end / start) ** (1 / years) - 1) * 100, 2)
