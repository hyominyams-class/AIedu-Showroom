export type InventionStyle = {
  id: string;
  label: string;
  caption: string;
  src: string;
  alt: string;
  fileSuffix: string;
  ratio: "portrait" | "landscape";
};

export const INVENTION_STYLES: InventionStyle[] = [
  {
    id: "poster",
    label: "발표 포스터",
    caption: "발명품 이름과 핵심 기능이 함께 보이는 발표용 포스터",
    src: "/visuals/invention/auto-watering-planter-poster.png",
    alt: "자동 급수 화분 발명 포스터",
    fileSuffix: "poster",
    ratio: "portrait",
  },
  {
    id: "classroom",
    label: "교실 실배치",
    caption: "교실 창가에 놓고 쓰는 실제 사용 장면",
    src: "/visuals/invention/auto-watering-planter-classroom.png",
    alt: "교실 창가에서 사용하는 자동 급수 화분",
    fileSuffix: "classroom",
    ratio: "landscape",
  },
  {
    id: "home",
    label: "집 실배치",
    caption: "집 베란다에서 쓰는 실제 사용 장면",
    src: "/visuals/invention/auto-watering-planter-balcony.png",
    alt: "집 베란다에서 사용하는 자동 급수 화분",
    fileSuffix: "home",
    ratio: "landscape",
  },
];

export const INVENTION_STYLE_OPTIONS = INVENTION_STYLES.map(({ id, label, caption }) => ({ id, label, caption }));

export function findInventionStyleIndex(id?: string) {
  const index = INVENTION_STYLES.findIndex((style) => style.id === id);
  return index < 0 ? 0 : index;
}

export function findInventionStyle(id?: string) {
  return INVENTION_STYLES[findInventionStyleIndex(id)];
}
