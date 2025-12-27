import React from 'react';
import { View, StyleSheet, Dimensions, Text, ScrollView } from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = SCREEN_WIDTH; 
const CENTER = SIZE / 2;
const R = SIZE * 0.32; 
const D = R * 0.707; 

const CHAKRA = {
  PURPLE: "#d9bafaff", BLUE: "#69abfcff", SKY: "#BAE6FD",
  GREEN: "#a4e4baff", YELLOW: "#FEF08A", ORANGE: "#fcd7acff",
  RED: "#f9b5b5ff", BLACK: "#333333"
};

const CHAKRA_INFO = [
  { color: CHAKRA.PURPLE, name: "Сахасрара", task: "Духовность и предназначение" },
  { color: CHAKRA.BLUE, name: "Аджна", task: "Интуиция и осознанность" },
  { color: CHAKRA.SKY, name: "Вишудха", task: "Творчество и самовыражение" },
  { color: CHAKRA.GREEN, name: "Анахата", task: "Любовь и открытость сердца" },
  { color: CHAKRA.YELLOW, name: "Манипура", task: "Воля, реализация и деньги" },
  { color: CHAKRA.ORANGE, name: "Свадхистана", task: "Энергия и радость жизни" },
  { color: CHAKRA.RED, name: "Муладхара", task: "Здоровье и базовая опора" },
];

export default function MatrixGraphic({ matrixData, onPointPress }: { matrixData: any, onPointPress: (n: number) => void }) {
  if (!matrixData) return null;

  const { personal, ancestral, wellbeing, spheres } = matrixData;

  // Добавил key в аргументы renderNode
  const renderNode = (x: number, y: number, val: number, color: string, r = 13, fontSize = 9, isFilled = true, forceBlackText = false, key?: string) => (
    <G key={key} onPress={() => onPointPress(val)}>
      <Circle cx={x} cy={y} r={r} fill={isFilled ? color : "white"} stroke={isFilled ? color : CHAKRA.BLACK} strokeWidth="1.2" />
      <SvgText x={x} y={y + 3.5} fontSize={fontSize} fontWeight="bold" textAnchor="middle" fill={(isFilled && !forceBlackText && color !== CHAKRA.YELLOW) ? "white" : "#333"}>
        {val}
      </SvgText>
    </G>
  );

  const K1 = 0.74; const K2 = 0.52; const K_SPHERE = K2 * 0.56; 
  const s2RightX = CENTER + R * K2;
  const s2BottomY = CENTER + R * K2;
  const midX = (CENTER + s2RightX) / 2; 
  const midY = (s2BottomY + CENTER) / 2;

  const renderAgeLabels = () => {
    const agePoints = [
      { age: 0, x: CENTER - R, y: CENTER }, { age: 10, x: CENTER - D, y: CENTER - D },
      { age: 20, x: CENTER, y: CENTER - R }, { age: 30, x: CENTER + D, y: CENTER - D },
      { age: 40, x: CENTER + R, y: CENTER }, { age: 50, x: CENTER + D, y: CENTER + D },
      { age: 60, x: CENTER, y: CENTER + R }, { age: 70, x: CENTER - D, y: CENTER + D },
    ];
    return agePoints.map((pt) => {
      const angle = Math.atan2(pt.y - CENTER, pt.x - CENTER);
      return (
        <SvgText key={`age-${pt.age}`} x={pt.x + Math.cos(angle) * 25} y={pt.y + Math.sin(angle) * 25 + 4} fontSize="7" fontWeight="bold" fill="#999" textAnchor="middle">
          {pt.age}
        </SvgText>
      );
    });
  };

  return (
    <ScrollView 
      style={styles.mainScroll} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.matrixWrapper}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="5,5" />
          
          <G stroke="#4B5563" strokeWidth="1.2">
            <Line x1={CENTER} y1={CENTER - R} x2={CENTER + R} y2={CENTER} />
            <Line x1={CENTER + R} y1={CENTER} x2={CENTER} y2={CENTER + R} />
            <Line x1={CENTER} y1={CENTER + R} x2={CENTER - R} y2={CENTER} />
            <Line x1={CENTER - R} y1={CENTER} x2={CENTER} y2={CENTER - R} />
            
            <Line x1={CENTER - D} y1={CENTER - D} x2={CENTER + D} y2={CENTER - D} />
            <Line x1={CENTER + D} y1={CENTER - D} x2={CENTER + D} y2={CENTER + D} />
            <Line x1={CENTER + D} y1={CENTER + D} x2={CENTER - D} y2={CENTER + D} />
            <Line x1={CENTER - D} y1={CENTER + D} x2={CENTER - D} y2={CENTER - D} />

            <Line x1={CENTER} y1={CENTER - R} x2={CENTER} y2={CENTER + R} opacity={0.4} />
            <Line x1={CENTER - R} y1={CENTER} x2={CENTER + R} y2={CENTER} opacity={0.4} />
            <Line x1={CENTER - D} y1={CENTER - D} x2={CENTER + D} y2={CENTER + D} opacity={0.4} />
            <Line x1={CENTER + D} y1={CENTER - D} x2={CENTER - D} y2={CENTER + D} opacity={0.4} />

            <Line x1={s2RightX} y1={CENTER} x2={CENTER} y2={s2BottomY} stroke="#374151" strokeWidth="1.5" />
          </G>

          {renderAgeLabels()}

          {/* ТОЧКИ РОДА с ключами */}
          {[
            {x: CENTER-D, y: CENTER-D, v: ancestral.topLeft, r: 15, k: 'atl'},
            {x: CENTER-D*K1, y: CENTER-D*K1, v: ancestral.topLeftS1, r: 10, k: 'atl1'},
            {x: CENTER-D*K2, y: CENTER-D*K2, v: ancestral.topLeftS2, r: 10, k: 'atl2'},
            {x: CENTER+D, y: CENTER-D, v: ancestral.topRight, r: 15, k: 'atr'},
            {x: CENTER+D*K1, y: CENTER-D*K1, v: ancestral.topRightS1, r: 10, k: 'atr1'},
            {x: CENTER+D*K2, y: CENTER-D*K2, v: ancestral.topRightS2, r: 10, k: 'atr2'},
            {x: CENTER+D, y: CENTER+D, v: ancestral.bottomRight, r: 15, k: 'abr'},
            {x: CENTER+D*K1, y: CENTER+D*K1, v: ancestral.bottomRightS1, r: 10, k: 'abr1'},
            {x: CENTER+D*K2, y: CENTER+D*K2, v: ancestral.bottomRightS2, r: 10, k: 'abr2'},
            {x: CENTER-D, y: CENTER+D, v: ancestral.bottomLeft, r: 15, k: 'abl'},
            {x: CENTER-D*K1, y: CENTER+D*K1, v: ancestral.bottomLeftS1, r: 10, k: 'abl1'},
            {x: CENTER-D*K2, y: CENTER+D*K2, v: ancestral.bottomLeftS2, r: 10, k: 'abl2'},
          ].map((p) => renderNode(p.x, p.y, p.v, CHAKRA.BLACK, p.r, 9, false, false, p.k))}

          {/* ТОЧКИ ЛИЧНОСТИ */}
          {renderNode(CENTER, CENTER-R, personal.top, CHAKRA.PURPLE, 18, 12, true, false, 'pt')}
          {renderNode(CENTER, CENTER-R*K1, personal.topS1, CHAKRA.BLUE, 13, 9, true, false, 'pt1')}
          {renderNode(CENTER, CENTER-R*K2, personal.topS2, CHAKRA.SKY, 13, 9, true, false, 'pt2')}
          {renderNode(CENTER-R, CENTER, personal.left, CHAKRA.PURPLE, 18, 12, true, false, 'pl')}
          {renderNode(CENTER-R*K1, CENTER, personal.leftS1, CHAKRA.BLUE, 13, 9, true, false, 'pl1')}
          {renderNode(CENTER-R*K2, CENTER, personal.leftS2, CHAKRA.SKY, 13, 9, true, false, 'pl2')}
          {renderNode(CENTER, CENTER+R, personal.bottom, CHAKRA.RED, 18, 12, true, false, 'pb')}
          {renderNode(CENTER, CENTER+R*K1, personal.bottomS1, CHAKRA.BLACK, 13, 9, false, false, 'pb1')}
          {renderNode(CENTER, CENTER+R*K2, personal.bottomS2, CHAKRA.ORANGE, 13, 9, true, false, 'pb2')}
          {renderNode(CENTER+R, CENTER, personal.right, CHAKRA.RED, 18, 12, true, false, 'pr')}
          {renderNode(CENTER+R*K1, CENTER, personal.rightS1, CHAKRA.BLACK, 13, 9, false, false, 'pr1')}
          {renderNode(CENTER+R*K2, CENTER, personal.rightS2, CHAKRA.ORANGE, 13, 9, true, false, 'pr2')}

          {/* СФЕРЫ */}
          {renderNode(CENTER - R * K_SPHERE, CENTER, spheres.horizontal, CHAKRA.GREEN, 7, 6, true, false, 'sh')}
          {renderNode(CENTER, CENTER - R * K_SPHERE, spheres.vertical, CHAKRA.GREEN, 7, 6, true, false, 'sv')}

          {/* УЗЛЫ НА ЛИНИИ БЛАГОПОЛУЧИЯ */}
          <G key="wellbeing-group">
            {renderNode(midX, midY, wellbeing.center, CHAKRA.BLACK, 7, 6, false, false, 'wc')}
            <SvgText x={(midX+s2RightX)/2} y={(midY+CENTER)/2-10} fontSize="7" textAnchor="middle">💰</SvgText>
            {renderNode((midX+s2RightX)/2, (midY+CENTER)/2, wellbeing.money, CHAKRA.BLACK, 7, 6, false, false, 'wm')}
            <SvgText x={(midX+CENTER)/2} y={(midY+s2BottomY)/2-10} fontSize="7" textAnchor="middle">❤️</SvgText>
            {renderNode((midX+CENTER)/2, (midY+s2BottomY)/2, wellbeing.love, CHAKRA.BLACK, 7, 6, false, false, 'wl')}
          </G>
          
          {renderNode(CENTER, CENTER, personal.center, CHAKRA.YELLOW, 22, 14, true, true, 'pc')}
        </Svg>
      </View>

      <View style={styles.lightCard}>
        <Text style={styles.cardTitle}>Карта энергий</Text>
        <View style={styles.divider} />
        {CHAKRA_INFO.map((item, idx) => (
          <View key={`chakra-${idx}`} style={styles.chakraItem}>
            <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
            <View style={styles.textColumn}>
              <Text style={styles.chakraName}>{item.name}</Text>
              <Text style={styles.chakraTask}>{item.task}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainScroll: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { alignItems: 'center', paddingBottom: 40, paddingTop: 0},
  matrixWrapper: { width: SCREEN_WIDTH, height: SIZE, alignItems: 'center', marginTop: -30, justifyContent: 'center' },
  lightCard: {
    width: SCREEN_WIDTH * 0.92,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', textAlign: 'center', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 20 },
  chakraItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  colorBadge: { width: 10, height: 10, borderRadius: 5, marginRight: 16 },
  textColumn: { flex: 1 },
  chakraName: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  chakraTask: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});