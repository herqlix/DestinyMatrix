const reduceArcana = (num: number): number => {
  if (num === 0) return 22;
  let result = num;
  while (result > 22) {
    result = String(result).split('').reduce((acc, curr) => acc + parseInt(curr), 0);
  }
  return result;
};

export const calculateMatrix = (birthDate: string) => {
  const [year, month, day] = birthDate.split('-').map(Number);

  // Углы Личностного квадрата
  const left = reduceArcana(day); 
  const top = reduceArcana(month); 
  const right = reduceArcana(year); 
  const bottom = reduceArcana(left + top + right); 
  const center = reduceArcana(left + top + right + bottom);

  // Углы Родового квадрата
  const topLeft = reduceArcana(left + top); 
  const topRight = reduceArcana(top + right); 
  const bottomRight = reduceArcana(right + bottom); 
  const bottomLeft = reduceArcana(bottom + left); 


  const calcTriple = (corner: number, ctr: number) => {
    const s2 = reduceArcana(corner + ctr); 
    const s1 = reduceArcana(corner + s2);  
    return { s1, s2 };
  };

  const t = calcTriple(top, center);
  const b = calcTriple(bottom, center);
  const l = calcTriple(left, center);
  const r = calcTriple(right, center);

  const tl = calcTriple(topLeft, center);
  const tr = calcTriple(topRight, center);
  const br = calcTriple(bottomRight, center);
  const bl = calcTriple(bottomLeft, center);

  // Линия благополучия
  const pointA = b.s2; 
  const pointB = r.s2; 
  const channelCenter = reduceArcana(pointA + pointB);
  const channelMoney = reduceArcana(channelCenter + pointB);
  const channelLove = reduceArcana(channelCenter + pointA);

  // Сферы жизни
  const sphereHorizontal = reduceArcana(l.s2 + center); 
  const sphereVertical = reduceArcana(t.s2 + center);

  return {
    personal: {
      left, top, right, bottom, center,
      topS1: t.s1, topS2: t.s2,
      bottomS1: b.s1, bottomS2: b.s2,
      leftS1: l.s1, leftS2: l.s2,
      rightS1: r.s1, rightS2: r.s2
    },
    ancestral: {
      topLeft, topRight, bottomRight, bottomLeft,
      topLeftS1: tl.s1, topLeftS2: tl.s2,
      topRightS1: tr.s1, topRightS2: tr.s2,
      bottomRightS1: br.s1, bottomRightS2: br.s2,
      bottomLeftS1: bl.s1, bottomLeftS2: bl.s2
    },
    wellbeing: {
      center: channelCenter,
      money: channelMoney,
      love: channelLove,
      pAy: pointA,
      pBx: pointB
    },
    spheres: {
      horizontal: sphereHorizontal,
      vertical: sphereVertical
    }
  };
};