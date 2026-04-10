import type { Project } from '../models/types';
import { DEFAULT_CARD_OFFSET } from '../models/types';

/**
 * 陽明山步道範例專案
 * 路線：小油坑 → 七星山東峰 → 七星山主峰 → 擎天崗
 */
export const SAMPLE_PROJECT: Project = {
  version: 2,
  name: '陽明山七星山步道',
  center: [25.175, 121.545],
  zoom: 14,
  spots: [
    {
      id: 'sample-spot-1',
      latlng: [25.1667, 121.5344],
      num: 1,
      title: '小油坑遊客服務站',
      desc: '步道起點，可欣賞火山噴氣孔地貌，設有廁所與解說站。',
      photo: null,
      iconId: 'info',
      cardOffset: DEFAULT_CARD_OFFSET,
    },
    {
      id: 'sample-spot-2',
      latlng: [25.1744, 121.5431],
      num: 2,
      title: '七星山東峰',
      desc: '海拔約 1,108 公尺，視野開闊，可遠眺台北盆地與淡水河口。',
      photo: null,
      iconId: 'sun',
      cardOffset: DEFAULT_CARD_OFFSET,
    },
    {
      id: 'sample-spot-3',
      latlng: [25.1795, 121.5385],
      num: 3,
      title: '七星山主峰',
      desc: '海拔 1,120 公尺，北台灣最高火山，天氣晴朗時可見基隆嶼。',
      photo: null,
      iconId: 'rock',
      cardOffset: DEFAULT_CARD_OFFSET,
    },
    {
      id: 'sample-spot-4',
      latlng: [25.1928, 121.5614],
      num: 4,
      title: '擎天崗草原',
      desc: '廣闊青翠的高山草原，牛群自由漫步，是陽明山最具代表性的景致。',
      photo: null,
      iconId: 'leaf',
      cardOffset: DEFAULT_CARD_OFFSET,
    },
  ],
  routes: [
    {
      id: 'sample-route-1',
      name: '七星山縱走步道',
      color: 'green',
      elevations: null,
      pts: [
        [25.1667, 121.5344],
        [25.1688, 121.5362],
        [25.1710, 121.5378],
        [25.1730, 121.5405],
        [25.1744, 121.5431],
        [25.1762, 121.5415],
        [25.1778, 121.5400],
        [25.1795, 121.5385],
        [25.1820, 121.5420],
        [25.1855, 121.5480],
        [25.1890, 121.5545],
        [25.1928, 121.5614],
      ],
    },
  ],
};

/**
 * 將範例專案載入到 store 的 importJSON 方法
 */
export function getSampleProjectJSON(): string {
  return JSON.stringify(SAMPLE_PROJECT);
}
