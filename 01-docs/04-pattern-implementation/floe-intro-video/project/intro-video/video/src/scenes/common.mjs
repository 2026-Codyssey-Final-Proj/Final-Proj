// 장면들이 같이 쓰는 배경 · 카메라 · 장면 넘기기
import { C } from '../art/palette.mjs';

const n3 = (v) => +v.toFixed(3);

export const sky = () => `<rect x="-200" y="-200" width="720" height="580" fill="${C.sky}"/>
  <path d="M40 150 C20 110 40 50 100 30 C160 10 250 20 285 60 C315 95 305 150 270 170 L60 172 C50 165 45 160 40 150 Z" fill="${C.blob}"/>`;

// 카메라: (cx, cy)를 화면 가운데(160, 90)로 옮기며 scale배 확대
export const camera = (inner, { cx = 160, cy = 90, scale = 1 } = {}) =>
  `<g data-zoom="${n3(scale)}" transform="translate(160 90) scale(${n3(scale)}) translate(${n3(-cx)} ${n3(-cy)})">${inner}</g>`;

// 카메라 좌표 → 화면 좌표
export const toScreen = ([x, y], { cx, cy, scale }) => [160 + (x - cx) * scale, 90 + (y - cy) * scale];

// 둥근 물결로 다음 장면 열기 — (cx, cy)에서 반지름 r의 원 안에 inner를 보여 주고 가장자리에 물결 두 줄
let wid = 0;
export function wipe(inner, { cx, cy, r }) {
  const id = `wp${++wid}`;
  return `<g data-wipe="1"><clipPath id="${id}"><circle cx="${n3(cx)}" cy="${n3(cy)}" r="${n3(r)}"/></clipPath>
    <g clip-path="url(#${id})">${inner}</g>
    <circle cx="${n3(cx)}" cy="${n3(cy)}" r="${n3(r)}" fill="none" stroke="#FFFFFF" stroke-width="2.6" opacity=".95"/>
    <circle cx="${n3(cx)}" cy="${n3(cy)}" r="${n3(r + 6)}" fill="none" stroke="#BFE6FF" stroke-width="1.4" opacity=".7"/>
    <circle cx="${n3(cx)}" cy="${n3(cy)}" r="${n3(Math.max(0, r - 7))}" fill="none" stroke="#FFFFFF" stroke-width=".8" opacity=".5"/></g>`;
}

// 흰 막 — 영상 시작의 밝아지기
export const fadeVeil = (o) => (o > 0.001 ? `<rect data-fade="1" x="-10" y="-10" width="340" height="200" fill="#FFFFFF" opacity="${n3(o)}"/>` : '');
