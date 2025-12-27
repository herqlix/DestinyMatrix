import { calculateMatrix } from './MatrixCalculation';

/**
 * Сложение арканов по правилу 22
 */
const sumArcana = (a: number, b: number): number => {
  if (!a || !b) return a || b || 0;
  let res = a + b;
  while (res > 22) res -= 22;
  return res;
};

export const calculateCompatibility = (date1: string, date2: string) => {
  const m1 = calculateMatrix(date1);
  const m2 = calculateMatrix(date2);

  return {
    personal: {
      left: sumArcana(m1.personal.left, m2.personal.left),
      top: sumArcana(m1.personal.top, m2.personal.top),
      right: sumArcana(m1.personal.right, m2.personal.right),
      bottom: sumArcana(m1.personal.bottom, m2.personal.bottom),
      center: sumArcana(m1.personal.center, m2.personal.center),
      // Промежуточные точки прямого квадрата
      topS1: sumArcana(m1.personal.topS1, m2.personal.topS1),
      topS2: sumArcana(m1.personal.topS2, m2.personal.topS2),
      bottomS1: sumArcana(m1.personal.bottomS1, m2.personal.bottomS1),
      bottomS2: sumArcana(m1.personal.bottomS2, m2.personal.bottomS2),
      leftS1: sumArcana(m1.personal.leftS1, m2.personal.leftS1),
      leftS2: sumArcana(m1.personal.leftS2, m2.personal.leftS2),
      rightS1: sumArcana(m1.personal.rightS1, m2.personal.rightS1),
      rightS2: sumArcana(m1.personal.rightS2, m2.personal.rightS2),
    },
    ancestral: {
      // Углы родового квадрата
      topLeft: sumArcana(m1.ancestral.topLeft, m2.ancestral.topLeft),
      topRight: sumArcana(m1.ancestral.topRight, m2.ancestral.topRight),
      bottomRight: sumArcana(m1.ancestral.bottomRight, m2.ancestral.bottomRight),
      bottomLeft: sumArcana(m1.ancestral.bottomLeft, m2.ancestral.bottomLeft),
      // Промежуточные точки родовых линий (S1, S2)
      topLeftS1: sumArcana(m1.ancestral.topLeftS1, m2.ancestral.topLeftS1),
      topLeftS2: sumArcana(m1.ancestral.topLeftS2, m2.ancestral.topLeftS2),
      topRightS1: sumArcana(m1.ancestral.topRightS1, m2.ancestral.topRightS1),
      topRightS2: sumArcana(m1.ancestral.topRightS2, m2.ancestral.topRightS2),
      bottomRightS1: sumArcana(m1.ancestral.bottomRightS1, m2.ancestral.bottomRightS1),
      bottomRightS2: sumArcana(m1.ancestral.bottomRightS2, m2.ancestral.bottomRightS2),
      bottomLeftS1: sumArcana(m1.ancestral.bottomLeftS1, m2.ancestral.bottomLeftS1),
      bottomLeftS2: sumArcana(m1.ancestral.bottomLeftS2, m2.ancestral.bottomLeftS2),
    },
    wellbeing: {
      money: sumArcana(m1.wellbeing.money, m2.wellbeing.money),
      love: sumArcana(m1.wellbeing.love, m2.wellbeing.love),
      center: sumArcana(m1.wellbeing.center, m2.wellbeing.center), // Добавлено!
    },
    spheres: {
      horizontal: sumArcana(m1.spheres.horizontal, m2.spheres.horizontal),
      vertical: sumArcana(m1.spheres.vertical, m2.spheres.vertical),
    }
  };
};