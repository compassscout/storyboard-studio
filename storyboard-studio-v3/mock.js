/* 分镜台 Studio v0.3 — 单一模拟数据源
   状态不手工维护：scriptDone + shotsConfirmed + 素材缺口，全部由视图层派生。 */

window.STUDIO_DB = {
  project: {
    id: 'p-rotterdam',
    title: '鹿特丹港：从码头到枢纽',
    kind: '历史 · 城市',
    chapter: '第一章 城市与港口',
    target: 300,
    protectionWords: ['鹿特丹', '马斯河', '瓦尔港', '博斯曼'],
    sections: [
      {
        id: 's1',
        title: '序章：一座被战争清空的城市',
        target: 55,
        scriptDone: true,
        shotsConfirmed: true,
        issues: [],
        text: [
          '1940 年 5 月 14 日，鹿特丹市中心在空袭中被夷为平地。港口没有消失，但城市的记忆被撕开了一道口子。',
          '战后的重建没有回到旧日的尺度。规划者把码头推向更靠近北海的方向，让马斯河成为一条可以吞吐世界的通道。',
          '这不是一座城市重新长出来的故事，而是一座城市决定换一种方式呼吸的故事。'
        ].join('\n\n'),
        shots: [
          { id: 's1k1', no: 1, duration: 9, visual: '1940 年空袭后的鹿特丹市中心废墟，黑白航拍', type: '遗址', assetStatus: 'licensed', assetName: 'rotterdam_1940_aerial.jpg' },
          { id: 's1k2', no: 2, duration: 12, visual: '马斯河入海口的老地图，港口轮廓逐层叠化', type: '地图', assetStatus: 'licensed', assetName: 'delta_map_1940.png' },
          { id: 's1k3', no: 3, duration: 10, visual: '档案馆里的重建规划手稿，翻页特写', type: '档案', assetStatus: 'ready', assetName: 'rebuild_plan_1946.pdf' },
          { id: 's1k4', no: 4, duration: 14, visual: '清晨的港口天际线，第一艘货轮进港', type: '情景再现', assetStatus: 'ready', assetName: 'dawn_port.mp4' }
        ]
      },
      {
        id: 's2',
        title: '码头：马斯河边的第一排仓库',
        target: 70,
        scriptDone: true,
        shotsConfirmed: true,
        issues: [],
        text: [
          '鹿特丹的第一次转身发生在码头边。红砖仓库沿着马斯河排开，吊车的轨道像城市新的肋骨。',
          '货物从这里进入欧洲腹地，再从这里出海。港口不生产商品，它生产的是连接。',
          '到 20 世纪 50 年代，这座城市已经习惯了用吨位而不是人口来谈论自己。'
        ].join('\n\n'),
        shots: [
          { id: 's2k1', no: 1, duration: 11, visual: '马斯河边的老仓库群，红砖墙面与吊车轨道', type: '遗址', assetStatus: 'ready', assetName: 'maas_warehouses.jpg' },
          { id: 's2k2', no: 2, duration: 13, visual: '码头工人黑白工作照，1950 年代', type: '人物', assetStatus: 'candidate', assetName: 'dock_workers_1950.jpg' },
          { id: 's2k3', no: 3, duration: 9, visual: '港口吞吐量增长曲线，1945—1970', type: '图表', assetStatus: 'licensed', assetName: 'throughput_curve.svg' },
          { id: 's2k4', no: 4, duration: 12, visual: '货轮靠泊与装卸的档案影像', type: '档案', assetStatus: 'ready', assetName: 'cargo_archive_1957.mp4' }
        ]
      },
      {
        id: 's3',
        title: '黄金时代：1958 年的转运革命',
        target: 60,
        scriptDone: false,
        shotsConfirmed: false,
        issues: [
          { id: 'i1', type: '标点', safe: true, before: '1958.', after: '1958。', reason: '英文句号应改成中文句号', status: 'open' },
          { id: 'i2', type: '空格', safe: true, before: '港口  的', after: '港口的', reason: '中文句子中多了连续空格', status: 'open' },
          { id: 'i3', type: '重复', safe: false, before: '不断不断', after: '不断', reason: '疑似重复用词，请确认是否保留强调语气', status: 'open' }
        ],
        text: [
          '1958.这一年，鹿特丹港的转运量第一次越过三千万吨。港口  的吊机昼夜不停，来自鲁尔区的煤、矿石和钢材在这里换船。',
          '那是一个属于散货的黄金时代。码头越长，城市越忙；吞吐量不断不断刷新纪录，欧洲的工业节奏被写进了这座港口的时刻表。',
          '但纪录本身不会告诉人们，下一场变化已经在集装箱的金属棱角里发生。'
        ].join('\n\n'),
        shots: [
          { id: 's3k1', no: 1, duration: 13, visual: '1958 年转运码头的全景，吊机群', type: '遗址', assetStatus: 'candidate', assetName: 'transit_terminal_1958.jpg' },
          { id: 's3k2', no: 2, duration: 8, visual: '欧洲港口吞吐量排名，鹿特丹跃居第一', type: '图表', assetStatus: 'todo', assetName: '' },
          { id: 's3k3', no: 3, duration: 15, visual: '集装箱前夜的散货码头，工人搬运', type: '情景再现', assetStatus: 'ready', assetName: 'bulk_dock_workers.mp4' },
          { id: 's3k4', no: 4, duration: 11, visual: '港口管理局年报封面，1958', type: '档案', assetStatus: 'todo', assetName: '' }
        ]
      },
      {
        id: 's4',
        title: '转折：集装箱来了',
        target: 65,
        scriptDone: true,
        shotsConfirmed: false,
        issues: [],
        text: [
          '1966 年，第一批集装箱在鹿特丹卸船。它们安静、标准、无法被传统码头工人用肩膀扛起来。',
          '港口开始从劳动密集的地方，变成由算法、轨道和堆场组成的机器。',
          '城市的骄傲没有减少，只是换了计量单位：从吨，变成标准箱。'
        ].join('\n\n'),
        shots: [
          { id: 's4k1', no: 1, duration: 14, visual: '第一只集装箱被吊上岸，1966', type: '档案', assetStatus: 'todo', assetName: '' },
          { id: 's4k2', no: 2, duration: 10, visual: '集装箱堆场几何构图，航拍', type: '遗址', assetStatus: 'candidate', assetName: 'container_yard_drone.jpg' },
          { id: 's4k3', no: 3, duration: 12, visual: '传统码头工人面对空荡泊位', type: '人物', assetStatus: 'todo', assetName: '' }
        ]
      },
      {
        id: 's5',
        title: '今天：一座会呼吸的港口',
        target: 50,
        scriptDone: false,
        shotsConfirmed: false,
        issues: [],
        text: [
          '今天的鹿特丹港不再只是码头。它是数据、能源和供应链的交换站，也是城市重新想象自己的地方。',
          '从这里出发的每一条航线，最终都会回到一个问题：一座城市要靠什么继续生长？'
        ].join('\n\n'),
        shots: []
      }
    ]
  }
};
