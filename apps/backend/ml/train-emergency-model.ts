import fs from 'fs';
import path from 'path';

// Define structures for Decision Tree
export interface DecisionTreeNode {
  featureIndex?: number;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
  value?: string; // Predicted category
}

export interface ModelArtifact {
  features: string[];
  trees: DecisionTreeNode[];
  classes: string[];
}

interface RecordType {
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────
// Information Gain calculation helper functions
// ─────────────────────────────────────────────────────────────
function calculateEntropy(records: RecordType[]): number {
  if (records.length === 0) return 0;
  const counts: { [key: string]: number } = {};
  for (const r of records) {
    counts[r.targetCategory] = (counts[r.targetCategory] || 0) + 1;
  }
  let entropy = 0;
  for (const key in counts) {
    const p = counts[key] / records.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function splitRecords(records: RecordType[], featureIndex: number, featureName: string): { left: RecordType[]; right: RecordType[] } {
  const left: RecordType[] = [];
  const right: RecordType[] = [];
  for (const r of records) {
    if (r[featureName] === 1) {
      right.push(r);
    } else {
      left.push(r);
    }
  }
  return { left, right };
}

// ─────────────────────────────────────────────────────────────
// Recursive Decision Tree training
// ─────────────────────────────────────────────────────────────
function buildTree(
  records: RecordType[],
  features: string[],
  maxDepth: number,
  currentDepth: number,
  featureSubsetSize: number
): DecisionTreeNode {
  // Base cases
  if (records.length === 0) {
    return { value: 'UNKNOWN' };
  }

  const firstCat = records[0].targetCategory;
  const allSame = records.every(r => r.targetCategory === firstCat);
  if (allSame || currentDepth >= maxDepth || features.length === 0) {
    // Return majority class
    const counts: { [key: string]: number } = {};
    for (const r of records) {
      counts[r.targetCategory] = (counts[r.targetCategory] || 0) + 1;
    }
    let majority = 'UNKNOWN';
    let maxCount = -1;
    for (const cat in counts) {
      if (counts[cat] > maxCount) {
        maxCount = counts[cat];
        majority = cat;
      }
    }
    return { value: majority };
  }

  // Randomly select a subset of features (Random Forest characteristic)
  const shuffledFeatures = [...features].sort(() => Math.random() - 0.5);
  const selectedFeatures = shuffledFeatures.slice(0, Math.min(features.length, featureSubsetSize));

  const baseEntropy = calculateEntropy(records);
  let bestGain = -1;
  let bestSplitFeature = '';
  let bestSplitIndex = -1;
  let bestSplits: { left: RecordType[]; right: RecordType[] } = { left: [], right: [] };

  for (const feature of selectedFeatures) {
    const fIdx = features.indexOf(feature);
    const { left, right } = splitRecords(records, fIdx, feature);
    if (left.length === 0 || right.length === 0) continue;

    const leftEntropy = calculateEntropy(left);
    const rightEntropy = calculateEntropy(right);
    const splitEntropy = (left.length / records.length) * leftEntropy + (right.length / records.length) * rightEntropy;
    const gain = baseEntropy - splitEntropy;

    if (gain > bestGain) {
      bestGain = gain;
      bestSplitFeature = feature;
      bestSplitIndex = fIdx;
      bestSplits = { left, right };
    }
  }

  // If no split yields information gain, return majority class
  if (bestSplitIndex === -1 || bestGain <= 0) {
    const counts: { [key: string]: number } = {};
    for (const r of records) {
      counts[r.targetCategory] = (counts[r.targetCategory] || 0) + 1;
    }
    let majority = 'UNKNOWN';
    let maxCount = -1;
    for (const cat in counts) {
      if (counts[cat] > maxCount) {
        maxCount = counts[cat];
        majority = cat;
      }
    }
    return { value: majority };
  }

  // Build subtrees
  // Remove split feature to prevent infinite recursion on same split
  const nextFeatures = features.filter(f => f !== bestSplitFeature);

  return {
    featureIndex: bestSplitIndex,
    left: buildTree(bestSplits.left, nextFeatures, maxDepth, currentDepth + 1, featureSubsetSize),
    right: buildTree(bestSplits.right, nextFeatures, maxDepth, currentDepth + 1, featureSubsetSize)
  };
}

// ─────────────────────────────────────────────────────────────
// Bootstrap helper
// ─────────────────────────────────────────────────────────────
function bootstrapSample(records: RecordType[]): RecordType[] {
  const sample: RecordType[] = [];
  for (let i = 0; i < records.length; i++) {
    const rIdx = Math.floor(Math.random() * records.length);
    sample.push(records[rIdx]);
  }
  return sample;
}

// ─────────────────────────────────────────────────────────────
// Main offline training process
// ─────────────────────────────────────────────────────────────
function main() {
  console.log('🤖 Running offline Random Forest training pipeline...');

  // Setup paths
  const datasetPath = path.join(process.cwd(), 'ml/datasets/emergency_synthetic_dataset.json');
  const modelDir = path.join(process.cwd(), 'ml/models');
  const outputPath = path.join(modelDir, 'emergency-random-forest.json');

  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ Dataset file not found at: ${datasetPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  const rawData = fs.readFileSync(datasetPath, 'utf8');
  const dataset = JSON.parse(rawData);

  const { records, features, categories } = dataset;

  // Split into train/validation/test (70/15/15) deterministically using a seeded split
  // Simple seed LCG random helper for split consistency
  let seed = 42;
  function randomSeeded() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  const shuffledRecords = [...records].sort(() => randomSeeded() - 0.5);
  const trainSize = Math.floor(shuffledRecords.length * 0.7);
  const valSize = Math.floor(shuffledRecords.length * 0.15);

  const trainData = shuffledRecords.slice(0, trainSize);
  const valData = shuffledRecords.slice(trainSize, trainSize + valSize);
  const testData = shuffledRecords.slice(trainSize + valSize);

  console.log(`📊 Partitions: Train: ${trainData.length}, Val: ${valData.length}, Test: ${testData.length}`);

  // Train Forest (10 trees)
  const numTrees = 10;
  const maxDepth = 6;
  const featureSubsetSize = Math.floor(Math.sqrt(features.length)) + 1; // standard Random Forest split choice
  const trees: DecisionTreeNode[] = [];

  for (let i = 0; i < numTrees; i++) {
    const sample = bootstrapSample(trainData);
    const tree = buildTree(sample, features, maxDepth, 0, featureSubsetSize);
    trees.push(tree);
  }

  const modelArtifact: ModelArtifact = {
    features,
    trees,
    classes: categories
  };

  fs.writeFileSync(outputPath, JSON.stringify(modelArtifact, null, 2), 'utf8');
  console.log(`✅ Model successfully trained and saved to: ${outputPath}`);
}

main();
