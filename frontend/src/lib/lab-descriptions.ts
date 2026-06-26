/**
 * Plain-language descriptions for the most common lab tests.
 * Keys are lowercase normalized names. If a test is not found here,
 * the UI falls back to the /assistant/explain API.
 */
export interface LabDescription {
  what: string;
  high?: string;
  low?: string;
}

export const LAB_DESCRIPTIONS: Record<string, LabDescription> = {
  // ── Glycaemic ───────────────────────────────────────────────────────────
  "hba1c": {
    what: "Your 'blood sugar report card' — shows your average blood sugar level over the past 2–3 months. Used to diagnose and monitor diabetes.",
    high: "Above 6.5% suggests diabetes; 5.7–6.4% indicates pre-diabetes.",
    low: "Below 5.7% is normal. Very low values are rare but can occur with certain blood disorders.",
  },
  "fasting glucose": {
    what: "Measures blood sugar after an overnight fast. The gold standard for diagnosing diabetes and checking how well your body regulates sugar.",
    high: "Above 126 mg/dL on two tests suggests diabetes. 100–125 mg/dL is pre-diabetes.",
    low: "Below 70 mg/dL is hypoglycaemia and can cause dizziness, sweating, and confusion.",
  },
  "random glucose": {
    what: "Blood sugar measured at any time of day, regardless of meals. Used when a quick check is needed or for emergency assessment.",
    high: "Above 200 mg/dL with symptoms is a strong indicator of diabetes.",
    low: "Below 70 mg/dL (hypoglycaemia) warrants immediate attention.",
  },
  "postprandial glucose": {
    what: "Blood sugar taken 2 hours after a meal. Shows how efficiently your body clears sugar after eating.",
    high: "Above 140 mg/dL at 2 hours is abnormal; above 200 mg/dL suggests diabetes.",
    low: "Very low values after eating are uncommon and may suggest insulin excess.",
  },

  // ── Lipid panel ─────────────────────────────────────────────────────────
  "total cholesterol": {
    what: "Total amount of cholesterol (waxy fat) in your blood. Cholesterol is needed by the body but too much raises the risk of heart disease.",
    high: "Above 200 mg/dL is borderline; above 240 mg/dL is high and increases heart disease risk.",
    low: "Below 150 mg/dL is considered very low; occasionally linked to hormonal or liver issues.",
  },
  "ldl": {
    what: "'Bad' cholesterol — carries fat to artery walls, where it can build up as plaques. The main target of cholesterol-lowering therapy.",
    high: "Above 130 mg/dL is borderline high; above 160 mg/dL is high risk for heart disease.",
    low: "Lower is generally better; very low LDL is usually a sign of good health or statin therapy.",
  },
  "ldl cholesterol": {
    what: "'Bad' cholesterol — carries fat to artery walls, where it can build up as plaques. The main target of cholesterol-lowering therapy.",
    high: "Above 130 mg/dL is borderline high; above 160 mg/dL is high risk for heart disease.",
    low: "Lower is generally better; very low LDL is usually a sign of good health or statin therapy.",
  },
  "hdl": {
    what: "'Good' cholesterol — acts like a garbage truck, removing excess cholesterol from the bloodstream and delivering it to the liver for disposal.",
    high: "Higher HDL is protective. Above 60 mg/dL is considered excellent for heart health.",
    low: "Below 40 mg/dL (men) or 50 mg/dL (women) raises cardiovascular risk.",
  },
  "hdl cholesterol": {
    what: "'Good' cholesterol — acts like a garbage truck, removing excess cholesterol from the bloodstream and delivering it to the liver for disposal.",
    high: "Higher HDL is protective. Above 60 mg/dL is considered excellent for heart health.",
    low: "Below 40 mg/dL (men) or 50 mg/dL (women) raises cardiovascular risk.",
  },
  "triglycerides": {
    what: "A type of fat stored in your blood and fat cells, derived from calories you don't immediately use. High levels are linked to heart disease and pancreatitis.",
    high: "Above 150 mg/dL is borderline; above 500 mg/dL is very high and can cause pancreatitis.",
    low: "Below 150 mg/dL is normal. Very low values are rarely a clinical concern.",
  },

  // ── Complete Blood Count ─────────────────────────────────────────────────
  "hemoglobin": {
    what: "The protein in red blood cells that carries oxygen to your entire body. Low hemoglobin means your organs get less oxygen — this is called anaemia.",
    high: "Above normal can indicate dehydration, lung disease, or too many red cells (polycythaemia).",
    low: "Below normal means anaemia — symptoms include fatigue, breathlessness, and pallor.",
  },
  "haemoglobin": {
    what: "The protein in red blood cells that carries oxygen to your entire body. Low haemoglobin means your organs get less oxygen — this is called anaemia.",
    high: "Above normal can indicate dehydration, lung disease, or too many red cells.",
    low: "Below normal means anaemia — symptoms include fatigue, breathlessness, and pallor.",
  },
  "rbc": {
    what: "Red Blood Cell count — the number of oxygen-carrying cells per unit of blood. Reflects your body's ability to deliver oxygen to tissues.",
    high: "Elevated RBC can mean dehydration or a bone marrow disorder.",
    low: "Low RBC indicates anaemia, bleeding, or nutritional deficiencies (iron, B12, folate).",
  },
  "wbc": {
    what: "White Blood Cell count — your immune system's soldiers. Measures total infection-fighting cells in the blood.",
    high: "High WBC often means infection, inflammation, or rarely leukaemia.",
    low: "Low WBC (leucopenia) raises infection risk; can be caused by certain medications or bone marrow problems.",
  },
  "platelets": {
    what: "Tiny blood cells that clump together to stop bleeding. Essential for wound healing and preventing bruising.",
    high: "High platelets can increase clotting risk (thrombocytosis).",
    low: "Low platelets (thrombocytopenia) causes easy bruising and prolonged bleeding.",
  },
  "hematocrit": {
    what: "The percentage of your blood volume that is made up of red blood cells. A quick measure of anaemia or polycythaemia.",
    high: "Above normal may indicate dehydration or high-altitude adaptation.",
    low: "Below normal suggests anaemia or blood loss.",
  },

  // ── Kidney function ───────────────────────────────────────────────────────
  "creatinine": {
    what: "A waste product from muscle metabolism filtered out by your kidneys. Rising creatinine is a sensitive sign that the kidneys are struggling.",
    high: "Elevated creatinine signals reduced kidney filtration — may indicate kidney disease.",
    low: "Low creatinine can occur with low muscle mass (elderly, malnourished patients).",
  },
  "egfr": {
    what: "Estimated Glomerular Filtration Rate — calculates how many millilitres of blood your kidneys filter per minute. The best overall measure of kidney function.",
    high: "Higher is better. eGFR >90 is normal.",
    low: "Below 60 for 3+ months indicates chronic kidney disease. Below 15 is kidney failure.",
  },
  "urea": {
    what: "A waste product from protein breakdown, filtered by the kidneys. Elevated urea alongside high creatinine confirms kidney stress.",
    high: "High urea may indicate kidney disease, dehydration, or high protein intake.",
    low: "Low urea can occur with low protein diet or liver disease.",
  },
  "bun": {
    what: "Blood Urea Nitrogen — similar to urea, it measures nitrogen waste from protein metabolism. Often checked alongside creatinine for kidney assessment.",
    high: "Elevated BUN suggests dehydration, kidney disease, or high protein intake.",
    low: "Low BUN is rarely concerning; sometimes seen with liver disease.",
  },
  "uric acid": {
    what: "A breakdown product of purines (found in red meat, seafood, beer). Excess uric acid forms crystals in joints, causing gout.",
    high: "Above 7 mg/dL in men or 6 mg/dL in women can trigger gout attacks and kidney stones.",
    low: "Low uric acid is uncommon and rarely clinically significant.",
  },

  // ── Liver function ────────────────────────────────────────────────────────
  "ast": {
    what: "Aspartate Aminotransferase — an enzyme found mainly in the liver and heart. When cells are damaged, AST leaks into the blood.",
    high: "Elevated AST indicates liver damage (hepatitis, fatty liver) or heart muscle injury.",
    low: "Low AST is normal and not clinically meaningful.",
  },
  "alt": {
    what: "Alanine Aminotransferase — the most liver-specific enzyme. A sensitive marker of liver cell damage from any cause.",
    high: "Elevated ALT is a red flag for hepatitis, fatty liver, alcohol damage, or drug-induced liver injury.",
    low: "Low ALT is normal.",
  },
  "alp": {
    what: "Alkaline Phosphatase — an enzyme in the liver, bile ducts, and bones. Elevated levels can point to bile flow problems or bone disease.",
    high: "High ALP may indicate bile duct obstruction, bone disorders, or liver disease.",
    low: "Low ALP can occur with hypothyroidism, anaemia, or zinc deficiency.",
  },
  "bilirubin": {
    what: "A yellow pigment from red blood cell breakdown, processed by the liver. When it builds up in the blood, it causes jaundice (yellowing of skin/eyes).",
    high: "Elevated bilirubin causes jaundice and points to liver disease, bile duct blockage, or excess red cell destruction.",
    low: "Low bilirubin is not clinically significant.",
  },
  "albumin": {
    what: "The most abundant protein in blood, made by the liver. It maintains fluid balance and carries many substances in the blood.",
    high: "Elevated albumin is almost always due to dehydration.",
    low: "Low albumin suggests liver disease, malnutrition, or chronic illness — and can cause fluid to leak into tissues (oedema).",
  },

  // ── Thyroid ──────────────────────────────────────────────────────────────
  "tsh": {
    what: "Thyroid Stimulating Hormone — tells the thyroid gland how hard to work. TSH is the best first-line test for thyroid function.",
    high: "High TSH means the pituitary is pushing harder because the thyroid is underactive (hypothyroidism).",
    low: "Low TSH means the pituitary has backed off because the thyroid is overactive (hyperthyroidism).",
  },
  "t3": {
    what: "Triiodothyronine — the active thyroid hormone that regulates metabolism, heart rate, body temperature, and energy levels.",
    high: "High T3 suggests hyperthyroidism — rapid heartbeat, weight loss, anxiety.",
    low: "Low T3 suggests hypothyroidism — fatigue, weight gain, cold intolerance.",
  },
  "t4": {
    what: "Thyroxine — the main hormone secreted by the thyroid, converted to active T3 in tissues. Reflects overall thyroid output.",
    high: "High T4 points to hyperthyroidism.",
    low: "Low T4 confirms hypothyroidism.",
  },

  // ── Electrolytes & minerals ───────────────────────────────────────────────
  "sodium": {
    what: "The main electrolyte that controls fluid balance outside cells. It keeps your blood pressure, nerve signals, and muscle contractions working properly.",
    high: "High sodium (hypernatraemia) causes thirst, confusion, and is usually from dehydration.",
    low: "Low sodium (hyponatraemia) causes nausea, headache, and in severe cases seizures.",
  },
  "potassium": {
    what: "A critical mineral that keeps your heart beating regularly and muscles contracting. Even small deviations from normal are taken seriously.",
    high: "High potassium (hyperkalaemia) can cause dangerous irregular heartbeats.",
    low: "Low potassium (hypokalaemia) causes muscle weakness, cramps, and heart rhythm problems.",
  },
  "calcium": {
    what: "Essential for strong bones, muscle contraction, nerve signalling, and blood clotting. Most calcium is stored in bones and teeth.",
    high: "High calcium (hypercalcaemia) can cause fatigue, kidney stones, and confusion.",
    low: "Low calcium (hypocalcaemia) causes muscle cramps, tingling, and in severe cases seizures.",
  },

  // ── Vitamins & iron ───────────────────────────────────────────────────────
  "vitamin d": {
    what: "A hormone-like vitamin that keeps bones strong, supports the immune system, and regulates mood. Made by skin in sunlight and absorbed from food.",
    high: "Toxicity from supplements (rare) causes nausea, weakness, and kidney problems.",
    low: "Deficiency — extremely common in India — causes bone pain, muscle weakness, fatigue, and raises infection risk.",
  },
  "vitamin b12": {
    what: "Essential for making red blood cells, DNA, and keeping nerves healthy. Found only in animal products; vegetarians are at higher risk of deficiency.",
    high: "Very high B12 without supplementation can signal liver disease or certain blood cancers.",
    low: "Deficiency causes anaemia, tingling or numbness in hands and feet, and memory problems.",
  },
  "iron": {
    what: "A mineral needed to make haemoglobin. Without enough iron, your body can't carry sufficient oxygen — leading to iron-deficiency anaemia.",
    high: "Iron overload (haemochromatosis) can damage the liver, heart, and joints.",
    low: "Low iron is the most common cause of anaemia worldwide, causing fatigue and pallor.",
  },
  "ferritin": {
    what: "A protein that stores iron inside cells — it's the body's iron warehouse. Ferritin levels reflect your total iron reserves more accurately than serum iron alone.",
    high: "High ferritin can mean iron overload, inflammation, liver disease, or certain cancers.",
    low: "Low ferritin is the first sign of iron depletion, even before anaemia develops.",
  },

  // ── Inflammation markers ──────────────────────────────────────────────────
  "esr": {
    what: "Erythrocyte Sedimentation Rate — how fast red blood cells fall in a tube. A general indicator of inflammation anywhere in the body.",
    high: "High ESR signals active inflammation, infection, or autoimmune disease, but doesn't pinpoint the cause.",
    low: "Very low ESR has no clinical significance.",
  },
  "crp": {
    what: "C-Reactive Protein — a protein the liver releases rapidly in response to inflammation or infection. More sensitive and specific than ESR.",
    high: "High CRP means active inflammation — could be infection, injury, or autoimmune flare.",
    low: "Low or undetectable CRP means little or no active inflammation.",
  },

  // ── Coagulation ───────────────────────────────────────────────────────────
  "inr": {
    what: "International Normalized Ratio — measures how long your blood takes to clot. Essential monitoring for patients on blood thinners like warfarin.",
    high: "High INR means blood clots too slowly — bleeding risk increases. Target range for warfarin patients is usually 2.0–3.0.",
    low: "Low INR means blood clots normally or too readily.",
  },
  "pt": {
    what: "Prothrombin Time — measures one of the clotting pathways. Prolonged PT can indicate liver disease, vitamin K deficiency, or anticoagulant use.",
    high: "Prolonged PT means slower clotting — seen in liver disease or anticoagulant therapy.",
    low: "Low PT (fast clotting) can raise the risk of thrombosis.",
  },
};

/** Normalise a test name for lookup (lowercase, trim, collapse spaces) */
export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getStaticDescription(testName: string): LabDescription | null {
  const key = normaliseName(testName);
  return LAB_DESCRIPTIONS[key] ?? null;
}