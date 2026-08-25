export type TokenSkin = {
  id: string;
  name: string;
  from: string;
  to: string;
};

export type BoardSkin = {
  id: string;
  name: string;
  colors: [string, string, string];
};

export const tokens: TokenSkin[] = [
  { id: "t1", name: "مارگرین", from: "#34d399", to: "#065f46" },
  { id: "t2", name: "زێڕین", from: "#fcd34d", to: "#b45309" },
  { id: "t3", name: "خوێنین", from: "#fb7185", to: "#881337" },
  { id: "t4", name: "شینەبەرد", from: "#60a5fa", to: "#1e3a8a" },
  { id: "t5", name: "بەنەوشەیی", from: "#c084fc", to: "#581c87" },
  { id: "t6", name: "ئاسنین", from: "#cbd5e1", to: "#334155" },
  { id: "t7", name: "قاوەیی", from: "#d6a26a", to: "#4a2b12" },
  { id: "t8", name: "فیرۆزەیی", from: "#5eead4", to: "#0f766e" },
  { id: "t9", name: "پرتەقاڵی", from: "#fdba74", to: "#9a3412" },
  { id: "t10", name: "شەوەزەنگ", from: "#94a3b8", to: "#0b1120" },
];

export const boards: BoardSkin[] = [
  { id: "b1", name: "دارستانی سەوز", colors: ["#052e16", "#166534", "#4ade80"] },
  { id: "b2", name: "بیابانی زێڕین", colors: ["#3b2606", "#92400e", "#fbbf24"] },
  { id: "b3", name: "دەریای شین", colors: ["#082f49", "#0369a1", "#38bdf8"] },
  { id: "b4", name: "ئاگری سوور", colors: ["#450a0a", "#b91c1c", "#fb7185"] },
  { id: "b5", name: "شەوی بەنەوشەیی", colors: ["#2e1065", "#7c3aed", "#c4b5fd"] },
  { id: "b6", name: "بەفری سپی", colors: ["#1e293b", "#64748b", "#e2e8f0"] },
  { id: "b7", name: "زمروودی کۆن", colors: ["#022c22", "#0f766e", "#5eead4"] },
  { id: "b8", name: "خۆرئاوا", colors: ["#431407", "#ea580c", "#fed7aa"] },
  { id: "b9", name: "ئەستێرەیی", colors: ["#0b1120", "#1e40af", "#a78bfa"] },
  { id: "b10", name: "گوڵی سوور", colors: ["#4c0519", "#be123c", "#fda4af"] },
];

export const goldPackages = [
  { id: "p1", gold: 100, price: "0.50" },
  { id: "p2", gold: 400, price: "2.00" },
  { id: "p3", gold: 700, price: "4.99" },
  { id: "p4", gold: 1100, price: "7.99" },
  { id: "p5", gold: 1800, price: "9.99" },
];
