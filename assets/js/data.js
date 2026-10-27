/* Site content. Only 雲在屾房 has full copy in the presentation PDF;
   the other cases use their cover photo and placeholder copy until content arrives. */
window.OUTLIER_DATA = (function () {
  var P = 'assets/img/photos/';
  var PENDING_INTRO = [
    ['本案完整文案與照片待提供。'],
    ['此頁沿用「雲在屾房」案例版型，', '取得資料後即可替換。']
  ];

  var cases = [
    {
      id: 'bluemoon',
      label: 'BLUE MOON',
      category: 'COMMERCIAL',
      cover: { src: P + 'bluemoon-01.jpg', w: 1203, h: 802, pos: '18% 50%' },
      hoverLogo: { src: 'assets/img/brand/hover-bluemoon.svg', width: 45 },
      title: 'Blue Moon',
      subtitle: 'Commercial',
      location: '—', year: '—', scope: ['資料待提供'],
      hero: { src: P + 'bluemoon-01.jpg', w: 1203, h: 802 },
      intro: PENDING_INTRO,
      pending: true
    },
    {
      id: 'tipsy',
      label: 'TIPSY',
      category: 'RESIDENTIAL',
      cover: { src: P + 'tipsy-01.jpg', w: 1092, h: 809, pos: '40% 50%' },
      hoverLogo: { src: 'assets/img/brand/hover-tipsy.svg', width: 32 },
      title: 'Tipsy 微醺',
      subtitle: 'Residential',
      location: '—', year: '—', scope: ['資料待提供'],
      hero: { src: P + 'tipsy-01.jpg', w: 1092, h: 809 },
      intro: PENDING_INTRO,
      pending: true
    },
    {
      id: 'yunzai',
      label: '雲在屾房',
      category: 'BOUTIQUE GUESTHOUSE',
      cover: { src: P + 'yunzai-cover.jpg', w: 1217, h: 812, pos: '45% 50%' },
      hoverText: { script: 'Guesthouse', zh: '雲在屾房' },
      title: '雲在屾房',
      subtitle: 'Boutique Guesthouse',
      location: '九份', year: '2021',
      scope: ['室內裝潢 建築外觀設計', '景觀 藝術擺件設計'],
      hero: { src: P + 'yunzai-01.jpg', w: 1646, h: 1098 },
      intro: [
        ['不追求完整的空間，選擇與不完美共處；侘寂，不是設計風格，', '而是一種慢下來與自然共處的人生語言。'],
        ['它沒有明顯的正門，也不在顯眼的街口，而是沿著一條', '窄小的樓梯蜿蜒而上。對我們來說，這段略顯彆扭的動線，', '不是設計上的缺陷，而是九份特有的「節奏」。'],
        ['因此，我們選擇保留它，甚至進一步讓動線成為', '一段「預備進入空間的過程」。', '木頭長椅、粗糙花崗岩牆、水泥色塊與碎石鋪面，這些並非華麗', '的迎賓語彙，卻能慢慢讓身體和心境，同時沈下來。']
      ],
      gallery: [
        {
          img: { src: P + 'yunzai-02.jpg', w: 2048, h: 1334 }, side: 'left',
          caption: ['住在「山」裡的民宿，不是概念，是實踐', '我們把原有格局重新配置成兩間套房與一間雅房，', '每一間房都有自己的戶外庭院，讓空氣能流動，', '視線能穿透，也讓身體知道：「你還在山裡」。']
        },
        {
          img: { src: P + 'yunzai-03.jpg', w: 1920, h: 1280 }, side: 'right',
          caption: ['住在「山」裡的民宿，不是概念，是實踐', '每一間房都有自己的戶外庭院，讓空氣能流動，', '視線能穿透，也讓身體知道：「你還在山裡」。']
        },
        {
          img: { src: P + 'yunzai-04.jpg', w: 1433, h: 1920 }, side: 'left', square: true,
          caption: ['住在「山」裡的民宿，不是概念，是實踐', '每一間房都有自己的戶外庭院，讓空氣能流動，']
        }
      ],
      carousel: [
        { src: P + 'yunzai-05.jpg', w: 1920, h: 1361 },
        { src: P + 'yunzai-01.jpg', w: 1646, h: 1098 },
        { src: P + 'yunzai-04.jpg', w: 1433, h: 1920 },
        { src: P + 'yunzai-03.jpg', w: 1920, h: 1280 },
        { src: P + 'yunzai-02.jpg', w: 2048, h: 1334 }
      ]
    },
    {
      id: 'dufeng',
      label: '新莊都峰苑',
      category: 'RESIDENTIAL',
      cover: { src: P + 'dufeng-01.jpg', w: 1715, h: 955, pos: '38% 50%' },
      hoverText: { script: 'Residential', zh: '新莊都峰苑' },
      title: '新莊都峰苑',
      subtitle: 'Residential',
      location: '新莊', year: '—', scope: ['資料待提供'],
      hero: { src: P + 'dufeng-01.jpg', w: 1715, h: 955 },
      intro: PENDING_INTRO,
      pending: true
    },
    {
      // The PDF only shows the first character (舞) of this case's name.
      id: 'wu',
      label: '舞（案名待確認）',
      category: 'TBC',
      cover: { src: P + 'wu-01.jpg', w: 620, h: 929, pos: '50% 50%' },
      hoverText: { script: 'Coming soon', zh: '舞' },
      title: '舞',
      subtitle: '案名待確認',
      location: '—', year: '—', scope: ['資料待提供'],
      hero: { src: P + 'wu-01.jpg', w: 620, h: 929 },
      intro: PENDING_INTRO,
      pending: true
    }
  ];

  // Archive is photos only (no copy), mixed from every case.
  var archive = [
    { src: P + 'yunzai-04.jpg', w: 1433, h: 1920 },
    { src: P + 'bluemoon-01.jpg', w: 1203, h: 802 },
    { src: P + 'wu-01.jpg', w: 620, h: 929 },
    { src: P + 'yunzai-02.jpg', w: 2048, h: 1334 },
    { src: P + 'tipsy-01.jpg', w: 1092, h: 809 },
    { src: P + 'yunzai-05.jpg', w: 1920, h: 1361 },
    { src: P + 'dufeng-01.jpg', w: 1715, h: 955 },
    { src: P + 'yunzai-03.jpg', w: 1920, h: 1280 },
    { src: P + 'yunzai-cover.jpg', w: 1217, h: 812 },
    { src: P + 'yunzai-01.jpg', w: 1646, h: 1098 }
  ];

  var podcasts = [
    { src: P + 'podcast-01.jpg', w: 231, h: 308 },
    { src: P + 'podcast-02.jpg', w: 231, h: 308 },
    { src: P + 'podcast-03.jpg', w: 221, h: 298 }
  ];

  return {
    maxShowcase: 6,
    cases: cases,
    archive: archive,
    podcasts: podcasts,
    about: { src: P + 'about-portrait.jpg', w: 411, h: 411 },
    company: {
      name: '異數空間室內設計有限公司',
      address: '臺北市中正區仁愛路2段71號11樓之6',
      phone: '+886 (09) 8315-0919'
    }
  };
})();
