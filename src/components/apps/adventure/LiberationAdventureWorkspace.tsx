"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, RotateCcw, Volume2, VolumeX, Feather } from "lucide-react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

type LiberationAdventureWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type EndingTone = "good" | "bitter" | "neutral" | "bad";

type Effects = {
  resolve?: number;
  suspicion?: number;
  item?: string;
};

type Choice = {
  label: string;
  to: string;
  set?: Effects;
};

type Scene = {
  id: string;
  chapter?: string;
  text: string;
  choices?: Choice[];
  ending?: EndingTone;
  note?: string;
};

const CPS = 46; // characters revealed per second
const MAX_RESOLVE = 5;
const MAX_SUSPICION = 5;

const endingMeta: Record<EndingTone, { label: string; seal: string; tone: string }> = {
  good: { label: "이어진 불씨", seal: "光復", tone: "ending-good" },
  bitter: { label: "꺾이지 않는", seal: "不屈", tone: "ending-bitter" },
  neutral: { label: "지켜본 사람", seal: "記憶", tone: "ending-neutral" },
  bad: { label: "이른 끝", seal: "終", tone: "ending-bad" },
};

const scenes: Record<string, Scene> = {
  intro: {
    id: "intro",
    chapter: "1919년 2월, 경성",
    text: "차가운 바람이 종로 거리를 훑고 지나간다. 너는 열일곱 살 학생. 나라를 잃은 지 아홉 해, 거리에는 일본 헌병의 발소리만 가득하다.\n\n늦은 저녁, 친구 동주가 숨을 몰아쉬며 찾아왔다.\n\"곧 큰일이 일어나. 너도 함께하지 않을래?\"",
    choices: [
      { label: "무슨 일인지 묻는다", to: "meeting_info", set: { resolve: 1 } },
      { label: "위험하다며 문을 닫으려 한다", to: "hesitate" },
    ],
  },
  hesitate: {
    id: "hesitate",
    text: "동주의 눈빛이 흔들린다.\n\"…네 마음 알아. 하지만 지금이 아니면 기회가 없어.\"\n그는 품에서 접힌 종이 한 장을 꺼내 네 손에 쥐여 준다.",
    choices: [
      { label: "종이를 펼쳐 읽어 본다", to: "read_manifesto", set: { item: "격문" } },
      { label: "돌려주고 돌아선다", to: "step_back_early" },
    ],
  },
  read_manifesto: {
    id: "read_manifesto",
    text: "종이에는 또박또박 눌러쓴 글씨가 가득하다.\n「오등은 자(玆)에 아(我) 조선의 독립국임과 조선인의 자주민임을 선언하노라.」\n독립선언서의 한 구절이다. 가슴이 뜨겁게 뛴다.",
    choices: [
      { label: "동주를 따라 모임에 간다", to: "meeting_info", set: { resolve: 1 } },
      { label: "혼자 더 생각해 본다", to: "step_back_early" },
    ],
  },
  step_back_early: {
    id: "step_back_early",
    text: "너는 종이를 돌려준다. 동주는 말없이 어둠 속으로 사라진다.\n며칠 뒤, 거리에서 들려온 함성이 네 잠을 깨운다.\n\"대한 독립 만세!\" 창밖, 사람들의 물결이 종로를 가득 메우고 있다.",
    choices: [
      { label: "지금이라도 거리로 뛰쳐나간다", to: "tapgol_arrive", set: { resolve: 1 } },
      { label: "끝내 방 안에 머문다", to: "ending_regret" },
    ],
  },
  meeting_info: {
    id: "meeting_info",
    chapter: "어두운 골목 끝, 작은 인쇄소",
    text: "등불 아래 학생과 어른 몇이 모여 있다. 한 사람이 낮고 단단한 목소리로 말한다.\n\"3월 1일, 탑골공원에서 독립선언서를 낭독하고 만세를 부른다. 폭력 없이, 온 겨레가 함께.\"\n사람들의 눈이 너를 향한다. 무엇을 맡겠는가.",
    choices: [
      { label: "격문을 인쇄해 돌리겠다고 한다", to: "print_leaflets", set: { item: "격문", resolve: 1 } },
      { label: "태극기를 만들어 나르겠다고 한다", to: "sew_flags", set: { item: "태극기", resolve: 1 } },
      { label: "발각 위험을 알리며 신중하자고 말한다", to: "caution_meeting" },
    ],
  },
  caution_meeting: {
    id: "caution_meeting",
    text: "\"발각되면 모두 잡혀갑니다.\" 네 말에 잠시 침묵이 흐른다.\n한 어른이 고개를 끄덕인다.\n\"맞다. 그래서 더 조심히, 그러나 멈추지 않고 간다.\" 너는 맡을 일을 고른다.",
    choices: [
      { label: "격문 인쇄를 돕는다", to: "print_leaflets", set: { item: "격문", resolve: 1 } },
      { label: "태극기 제작을 돕는다", to: "sew_flags", set: { item: "태극기", resolve: 1 } },
    ],
  },
  print_leaflets: {
    id: "print_leaflets",
    chapter: "이튿날 새벽",
    text: "밤새 등사기 손잡이를 돌린다. 잉크 냄새가 코를 찌르고, 격문이 한 장 한 장 쌓인다.\n새벽, 너는 격문 뭉치를 품에 안고 거리로 나선다.",
    choices: [
      { label: "대담하게 큰길에서도 나눠 준다", to: "risky_distribute", set: { suspicion: 2 } },
      { label: "사람 없는 골목으로만 조심히 다닌다", to: "safe_distribute" },
    ],
  },
  risky_distribute: {
    id: "risky_distribute",
    text: "큰길 한복판, 너는 격문을 외치며 나눠 준다. 사람들이 모여든다. 그러나 저만치 헌병의 시선이 너를 향한다.\n동주가 네 팔을 잡아끈다.\n\"여기서 잡히면 끝이야. 3월 1일까지 버텨야 해!\"",
    choices: [
      { label: "군중 속으로 몸을 숨긴다", to: "march_first_eve" },
      { label: "끝까지 그 자리에서 외친다", to: "ending_caught_early" },
    ],
  },
  safe_distribute: {
    id: "safe_distribute",
    text: "너는 그림자처럼 골목을 누빈다. 격문은 조용히, 그러나 빠르게 사람들 사이로 번진다.\n어느새 2월의 끝. 거리의 공기가 달라졌다. 모두가 무언가를 기다리고 있다.",
    choices: [{ label: "3월 1일을 기다린다", to: "march_first_eve", set: { resolve: 1 } }],
  },
  sew_flags: {
    id: "sew_flags",
    chapter: "등불 아래, 밤이 깊도록",
    text: "흰 천에 손수 태극과 사괘를 그려 넣는다. 바늘에 찔린 손끝이 붉어져도 멈출 수 없다.\n태극기가 한 장, 두 장, 차곡차곡 쌓인다. 이 깃발이 내일 거리에 펼쳐질 것이다.",
    choices: [
      { label: "더 많이 만들기 위해 밤을 새운다", to: "march_first_eve", set: { resolve: 1 } },
      { label: "들키지 않게 깊이 숨겨 둔다", to: "march_first_eve" },
    ],
  },
  march_first_eve: {
    id: "march_first_eve",
    chapter: "1919년 3월 1일, 아침",
    text: "마침내 그날이 밝았다. 탑골공원으로 향하는 길, 사람들의 발걸음이 한 방향으로 흐른다.\n네 품에는 {item}이 있다. 심장이 북처럼 울린다.",
    choices: [{ label: "탑골공원 안으로 들어간다", to: "tapgol_arrive" }],
  },
  tapgol_arrive: {
    id: "tapgol_arrive",
    chapter: "탑골공원, 정오",
    text: "공원은 사람으로 가득하다. 학생, 상인, 노인, 아이까지. 팔각정 위로 한 사람이 올라선다.\n낭독이 시작된다. 「오등은 자에 아 조선의 독립국임과…」 떨리던 목소리가 점점 또렷해진다.",
    choices: [
      { label: "다 함께 '대한 독립 만세'를 외친다", to: "mansae", set: { resolve: 1 } },
      { label: "조용히 뒤편에서 지켜본다", to: "watch_back" },
    ],
  },
  watch_back: {
    id: "watch_back",
    text: "너는 인파 뒤에 선다. 그러나 함성은 네 몸을 통째로 흔든다.\n'만세!' 소리가 하늘을 찌른다. 더는 가만히 있을 수 없다.",
    choices: [
      { label: "결국 목청껏 만세를 외친다", to: "mansae", set: { resolve: 1 } },
      { label: "인파를 빠져나와 집으로 향한다", to: "ending_witness" },
    ],
  },
  mansae: {
    id: "mansae",
    chapter: "만세",
    text: "\"대한 독립 만세!\" 너의 외침이 수천의 목소리와 하나가 된다. 태극기가 물결처럼 펼쳐진다.\n그러나 곧 호각 소리가 울리고, 헌병들이 군중을 향해 달려든다. 비명과 함성이 뒤섞인다.",
    choices: [
      { label: "넘어진 동주를 일으켜 함께 피한다", to: "save_friend", set: { resolve: 1 } },
      { label: "흩어지는 인파를 따라 몸을 피한다", to: "flee_crowd" },
      { label: "물러서지 않고 헌병 앞에 선다", to: "stand_ground", set: { suspicion: 2, resolve: 1 } },
    ],
  },
  save_friend: {
    id: "save_friend",
    text: "너는 인파를 거슬러 동주에게 달려간다. 그의 팔을 붙잡아 일으킨다. 둘은 좁은 골목으로 몸을 던진다.\n담벼락에 기대 숨을 고르는 동안에도, 거리의 만세 소리는 그치지 않는다.",
    choices: [{ label: "더 안전한 곳으로 함께 달린다", to: "ending_hope" }],
  },
  flee_crowd: {
    id: "flee_crowd",
    text: "너는 인파에 휩쓸려 골목으로 빠져나온다. 등 뒤로 멀어지는 함성.\n무사히 몸은 피했지만, 가슴 한켠이 무겁다. 그러나 안다. 오늘의 외침은 결코 사라지지 않으리란 걸.",
    choices: [
      { label: "흩어진 사람들을 모아 다시 거리로 나선다", to: "spread_more", set: { resolve: 1 } },
      { label: "집으로 돌아가 내일을 기약한다", to: "ending_witness" },
    ],
  },
  spread_more: {
    id: "spread_more",
    text: "골목마다 흩어진 사람들이 다시 모인다. 만세의 불씨는 경성을 넘어 방방곡곡으로 번져 간다.\n며칠 사이, 전국 곳곳에서 같은 외침이 터져 나온다. 너의 한 걸음이 그 들불의 일부가 되었다.",
    choices: [{ label: "끝까지 함께 걷는다", to: "ending_hope" }],
  },
  stand_ground: {
    id: "stand_ground",
    text: "너는 물러서지 않는다. 맨손으로, 오직 태극기 하나를 높이 든 채. \"대한 독립 만세!\"\n헌병의 손이 네 어깨를 거칠게 붙잡는다. 시야가 흔들린다.",
    choices: [
      { label: "끝까지 깃발을 놓지 않는다", to: "ending_arrested" },
      { label: "마지막 순간 몸을 빼 달아난다", to: "flee_crowd" },
    ],
  },
  ending_hope: {
    id: "ending_hope",
    chapter: "그날 이후",
    text: "1919년 봄, 그 외침은 들불처럼 번졌다. 전국 곳곳, 바다 건너 만주와 연해주까지.\n너와 동주는 살아남아 그날을 기억한다. 빼앗긴 들에도 봄은 끝내 온다는 것을, 너희는 온몸으로 알았다.",
    ending: "good",
    note: "3·1 운동은 전국으로 번져 대한민국 임시정부 수립의 밑거름이 되었습니다.",
  },
  ending_arrested: {
    id: "ending_arrested",
    chapter: "꺾이지 않는",
    text: "너는 붙잡혔다. 차가운 감옥, 그러나 마음만은 빼앗기지 않았다.\n옆 감방에서 또렷한 목소리가 들려온다. 누군가 외친다. \"대한 독립 만세.\"\n너도 따라 외친다. 벽을 넘어, 만세가 이어진다.",
    ending: "bitter",
    note: "수많은 이들이 잡혀가면서도 굴하지 않았고, 그 정신은 다음 세대로 이어졌습니다.",
  },
  ending_witness: {
    id: "ending_witness",
    chapter: "지켜본 사람",
    text: "너는 그날 거리로 끝까지 나서지는 못했다. 그러나 두 눈으로 똑똑히 보았다. 두려움보다 큰 함성을.\n집으로 돌아온 밤, 너는 다짐한다. 다음에는, 반드시 저 한가운데에 서리라.",
    ending: "neutral",
    note: "3·1 운동을 지켜본 많은 이들이 이후의 독립운동에 함께했습니다.",
  },
  ending_regret: {
    id: "ending_regret",
    chapter: "닫힌 창",
    text: "너는 끝내 방을 나서지 못했다. 창밖의 함성은 밤새 이어지다 잦아들었다.\n오랜 세월이 흐른 뒤에도, 너는 그날 열지 못한 창문을 떠올린다. 용기는 늘 한 걸음의 차이였다.",
    ending: "neutral",
    note: "역사 속 선택의 순간들이 모여 오늘에 이르렀습니다.",
  },
  ending_caught_early: {
    id: "ending_caught_early",
    chapter: "이른 밤의 끝",
    text: "너는 큰길에서 끝까지 외치다 헌병에게 붙잡혔다. 3월 1일을 보지 못한 채.\n그러나 네가 뿌린 격문은 이미 수많은 손에 들려 있었다. 씨앗은 이미 뿌려진 뒤였다.",
    ending: "bad",
    note: "이름 없이 스러져 간 이들의 용기가 3·1 운동의 밑바탕이 되었습니다.",
  },
};

function primaryItem(inventory: string[]) {
  if (inventory.includes("격문")) return "격문";
  if (inventory.includes("태극기")) return "태극기";
  return "굳은 결심";
}

function renderText(text: string, inventory: string[]) {
  return text.replace(/\{item\}/g, primaryItem(inventory));
}

export function LiberationAdventureWorkspace({ app, spec }: LiberationAdventureWorkspaceProps) {
  const [sceneId, setSceneId] = useState("intro");
  const [resolve, setResolve] = useState(0);
  const [suspicion, setSuspicion] = useState(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [revealCount, setRevealCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);

  const revealRef = useRef(0);
  const audioRef = useRef<{ ctx: AudioContext; master: GainNode; noise: AudioBuffer } | null>(null);
  const ambientRef = useRef<{ stop: () => void } | null>(null);
  const mutedRef = useRef(false);
  const lastTickRef = useRef(0);

  const scene = scenes[sceneId];
  const fullText = useMemo(() => renderText(scene.text, inventory), [scene, inventory]);
  const fullLen = fullText.length;
  const revealed = revealCount >= fullLen;
  const ending = scene.ending ?? null;

  /* ---------- audio ---------- */
  const ensureAudio = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.ctx.state === "suspended") void audioRef.current.ctx.resume().catch(() => undefined);
      return audioRef.current;
    }
    const AudioCtor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.55;
    master.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    audioRef.current = { ctx, master, noise };
    return audioRef.current;
  }, []);

  const startAmbient = useCallback(() => {
    const a = ensureAudio();
    if (!a || ambientRef.current) return;
    const oscs = [110, 110.5, 164.8].map((freq, index) => {
      const osc = a.ctx.createOscillator();
      osc.type = index === 2 ? "sine" : "triangle";
      osc.frequency.value = freq;
      return osc;
    });
    const lp = a.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const gain = a.ctx.createGain();
    gain.gain.value = 0.07;
    oscs.forEach((osc) => {
      osc.connect(lp);
      osc.start();
    });
    lp.connect(gain);
    gain.connect(a.master);
    ambientRef.current = {
      stop: () => {
        oscs.forEach((osc) => {
          try {
            osc.stop();
          } catch {
            /* already stopped */
          }
        });
      },
    };
  }, [ensureAudio]);

  const playQuill = useCallback(() => {
    const a = audioRef.current;
    if (!a || mutedRef.current) return;
    const t = a.ctx.currentTime;
    const src = a.ctx.createBufferSource();
    src.buffer = a.noise;
    const bp = a.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600 + Math.random() * 800;
    bp.Q.value = 1.4;
    const gain = a.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(a.master);
    src.start(t);
    src.stop(t + 0.05);
  }, []);

  const playPageTurn = useCallback(() => {
    const a = audioRef.current;
    if (!a || mutedRef.current) return;
    const t = a.ctx.currentTime;
    const src = a.ctx.createBufferSource();
    src.buffer = a.noise;
    const bp = a.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.18);
    bp.Q.value = 0.8;
    const gain = a.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(a.master);
    src.start(t);
    src.stop(t + 0.26);
  }, []);

  const playChord = useCallback((tone: EndingTone) => {
    const a = audioRef.current;
    if (!a || mutedRef.current) return;
    const chords: Record<EndingTone, number[]> = {
      good: [57, 61, 64, 69],
      bitter: [57, 60, 64, 67],
      neutral: [57, 60, 64],
      bad: [56, 59, 63],
    };
    chords[tone].forEach((midi, index) => {
      const t = a.ctx.currentTime + index * 0.16;
      const osc = a.ctx.createOscillator();
      const gain = a.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      osc.connect(gain);
      gain.connect(a.master);
      osc.start(t);
      osc.stop(t + 1.3);
    });
  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    const a = audioRef.current;
    if (a) a.master.gain.setTargetAtTime(mutedRef.current ? 0 : 0.55, a.ctx.currentTime, 0.02);
  }, []);

  /* ---------- typewriter ---------- */
  // Restart the reveal when the scene changes. Adjusting during render instead
  // of in an effect means the new scene never paints at the old scene's length.
  const [typedSceneId, setTypedSceneId] = useState(sceneId);
  if (typedSceneId !== sceneId) {
    setTypedSceneId(sceneId);
    setRevealCount(0);
  }

  useEffect(() => {
    revealRef.current = 0;
    lastTickRef.current = 0;
    const timer = window.setInterval(() => {
      if (revealRef.current >= fullLen) return;
      revealRef.current = Math.min(fullLen, revealRef.current + (CPS * 30) / 1000);
      const next = Math.floor(revealRef.current);
      setRevealCount(next);
      // quill tick on roughly every other revealed character (skip spaces/newlines)
      if (started && next > lastTickRef.current) {
        const ch = fullText[next - 1];
        if (ch && ch !== " " && ch !== "\n" && next % 2 === 0) playQuill();
        lastTickRef.current = next;
      }
    }, 30);
    return () => window.clearInterval(timer);
  }, [fullLen, fullText, playQuill, started]);

  // play the ending chord once the ending text is fully revealed
  const endingChordPlayedRef = useRef<string | null>(null);
  useEffect(() => {
    if (ending && revealed && endingChordPlayedRef.current !== sceneId) {
      endingChordPlayedRef.current = sceneId;
      playChord(ending);
    }
  }, [ending, revealed, sceneId, playChord]);

  /* ---------- actions ---------- */
  const skipReveal = useCallback(() => {
    revealRef.current = fullLen;
    setRevealCount(fullLen);
  }, [fullLen]);

  const goToScene = useCallback(
    (choice: Choice) => {
      if (choice.set) {
        if (choice.set.resolve) setResolve((value) => Math.min(MAX_RESOLVE, value + choice.set!.resolve!));
        if (choice.set.suspicion) setSuspicion((value) => Math.min(MAX_SUSPICION, value + choice.set!.suspicion!));
        if (choice.set.item) setInventory((items) => (items.includes(choice.set!.item!) ? items : [...items, choice.set!.item!]));
      }
      lastTickRef.current = 0;
      playPageTurn();
      setSceneId(choice.to);
    },
    [playPageTurn],
  );

  const startStory = useCallback(() => {
    ensureAudio();
    startAmbient();
    setStarted(true);
    setSceneId("intro");
    setResolve(0);
    setSuspicion(0);
    setInventory([]);
    lastTickRef.current = 0;
    endingChordPlayedRef.current = null;
  }, [ensureAudio, startAmbient]);

  const restart = useCallback(() => {
    setSceneId("intro");
    setResolve(0);
    setSuspicion(0);
    setInventory([]);
    lastTickRef.current = 0;
    endingChordPlayedRef.current = null;
    playPageTurn();
  }, [playPageTurn]);

  useEffect(() => {
    return () => {
      ambientRef.current?.stop();
      ambientRef.current = null;
    };
  }, []);

  /* ---------- test harness ---------- */
  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        game: "liberation-text-adventure",
        sceneId,
        chapter: scene.chapter ?? null,
        started,
        revealed,
        revealedChars: revealCount,
        totalChars: fullLen,
        text: fullText,
        choices: (scene.choices ?? []).map((choice) => choice.label),
        resolve,
        suspicion,
        inventory,
        ending,
        endingLabel: ending ? endingMeta[ending].label : null,
        note: scene.note ?? null,
        isEnding: Boolean(ending),
      });
    window.advanceTime = (ms: number) => {
      revealRef.current = Math.min(fullLen, revealRef.current + (CPS * Math.max(0, ms)) / 1000);
      setRevealCount(Math.floor(revealRef.current));
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [ending, fullLen, fullText, inventory, resolve, revealCount, revealed, scene, sceneId, started, suspicion]);

  const visibleText = fullText.slice(0, revealCount);
  const paragraphs = visibleText.split("\n");
  const endInfo = ending ? endingMeta[ending] : null;

  if (!started) {
    return (
      <main className="adv-page">
        <AdventureHero app={app} spec={spec} muted={muted} onToggleMute={toggleMute} />
        <section className="adv-stage">
          <article className="adv-parchment adv-parchment--cover">
            <div className="adv-cover-mark" aria-hidden="true">
              <Feather size={30} />
            </div>
            <p className="adv-cover-kicker">오래된 기록</p>
            <h2 className="adv-cover-title">1919, 어둠을 넘어</h2>
            <p className="adv-cover-lead">
              빼앗긴 봄, 한 학생의 선택. 펼쳐지는 글을 따라 당신의 결정이 이야기와 결말을 바꿉니다.
            </p>
            <button className="adv-start-btn" type="button" onClick={startStory}>
              <BookOpen size={18} />첫 장을 펼친다
            </button>
            <p className="adv-cover-foot">3·1 운동 · 독립선언서 · 탑골공원</p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="adv-page">
      <AdventureHero app={app} spec={spec} muted={muted} onToggleMute={toggleMute} />

      <section className="adv-stage">
        <article className={`adv-parchment ${endInfo ? endInfo.tone : ""}`}>
          <header className="adv-ledger" aria-label="이야기 기록">
            <span className="adv-ledger-item">
              각오
              <span className="adv-pips" aria-hidden="true">
                {Array.from({ length: MAX_RESOLVE }, (_, index) => (
                  <i key={index} className={index < resolve ? "is-on" : ""} />
                ))}
              </span>
            </span>
            <span className="adv-ledger-item adv-ledger-item--items">
              지닌 것: {inventory.length ? inventory.join(" · ") : "—"}
            </span>
            <span className="adv-ledger-item">
              감시
              <span className="adv-meter" aria-hidden="true">
                <i style={{ width: `${(suspicion / MAX_SUSPICION) * 100}%` }} />
              </span>
            </span>
          </header>

          {scene.chapter ? <p className="adv-chapter">{scene.chapter}</p> : null}

          <div
            className="adv-prose"
            role="button"
            tabIndex={0}
            aria-label="이야기 본문. 누르면 전체가 바로 펼쳐집니다."
            onClick={() => !revealed && skipReveal()}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !revealed) {
                event.preventDefault();
                skipReveal();
              }
            }}
          >
            {paragraphs.map((line, index) => (
              <p key={index}>
                {line}
                {!revealed && index === paragraphs.length - 1 ? <span className="adv-caret" aria-hidden="true" /> : null}
              </p>
            ))}
          </div>

          {!revealed ? (
            <p className="adv-hint">눌러서 바로 펼치기</p>
          ) : ending ? (
            <div className="adv-ending">
              <div className={`adv-seal ${endInfo?.tone ?? ""}`} aria-hidden="true">
                {endInfo?.seal}
              </div>
              <p className="adv-ending-label">{endInfo?.label}</p>
              {scene.note ? <p className="adv-note">{scene.note}</p> : null}
              <button className="adv-choice adv-choice--restart" type="button" onClick={restart}>
                <RotateCcw size={16} />
                처음부터 다시
              </button>
            </div>
          ) : (
            <div className="adv-choices">
              {(scene.choices ?? []).map((choice, index) => (
                <button key={choice.to + index} className="adv-choice" type="button" onClick={() => goToScene(choice)}>
                  <span className="adv-choice-mark" aria-hidden="true">
                    {index + 1}
                  </span>
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </article>

        <div className="adv-controls">
          <button className="adv-ctrl-btn" type="button" onClick={restart}>
            <RotateCcw size={15} />
            처음부터
          </button>
          <span className="adv-controls-hint">선택에 따라 결말이 달라집니다.</span>
        </div>
      </section>
    </main>
  );
}

function AdventureHero({
  app,
  spec,
  muted,
  onToggleMute,
}: {
  app: AppItem;
  spec: MvpSpec;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <section className="mvp-topbar mvp-showroom-hero mvp-work-hero adv-hero">
      <div className="mvp-hero-copy">
        <div className="mvp-hero-title-row">
          <h1>{app.title}</h1>
          <span className="mvp-surface-icon">
            <BookOpen size={16} />
            역사 어드벤처
          </span>
          <p>
            {app.category} · {spec.workLabel}
          </p>
        </div>
        <strong>1919년 경성, 선택에 따라 이야기와 결말이 달라지는 일제강점기 텍스트 어드벤처입니다.</strong>
      </div>
      <div className="mvp-hero-actions">
        <button className="button-secondary adv-mute" type="button" onClick={onToggleMute} aria-pressed={muted}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {muted ? "소리 켜기" : "소리"}
        </button>
        <Link className="button-secondary" href="/library">
          앱 선택
        </Link>
      </div>
    </section>
  );
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
