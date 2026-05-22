import math

def get_orbital_period(a: float, m: float = 1.0) -> float:
    # Kepler T^2 = a^3 / M
    if a <= 0 or m <= 0:
        raise ValueError("Valores deben ser positivos")
    return math.sqrt(a**3 / m)

if __name__ == "__main__":
    # Tierra a 1 AU
    t_earth = get_orbital_period(1.0, 1.0)
    print(f"Periodo orbital Tierra: {t_earth:.2f} años")
