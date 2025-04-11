import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Radio, Spin, Empty, message } from 'antd';
import axios from 'axios';

const { Title } = Typography;

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // 定义表格列
  const columns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, __, index) => index + 1,
      width: 80,
      fixed: 'left',
    },
    {
      title: '玩家',
      dataIndex: 'player_name',
      key: 'player_name',
      width: 150,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => a.score - b.score,
      sortDirections: ['descend'],
      defaultSortOrder: 'descend',
      width: 120,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        const difficultyText = {
          1: '简单',
          2: '中等',
          3: '困难',
        };
        return difficultyText[difficulty] || difficulty;
      },
      width: 100,
    },
    {
      title: '日期',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      width: 120,
    },
  ];

  // 获取排行榜数据
  const fetchLeaderboardData = async (diff) => {
    setLoading(true);
    try {
      const url = diff === 'all' 
        ? '/api/leaderboard?limit=50' 
        : `/api/leaderboard?difficulty=${diff}&limit=50`;
      
      const response = await axios.get(url);
      setLeaderboardData(response.data);
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      message.error('获取排行榜数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理难度筛选变化
  const handleDifficultyChange = (e) => {
    const value = e.target.value;
    setDifficulty(value);
    fetchLeaderboardData(value);
  };

  // 初始加载和自动刷新
  useEffect(() => {
    fetchLeaderboardData('all');
    
    // 设置自动刷新定时器
    const timer = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(timer);
  }, []);

  // 监听刷新键变化
  useEffect(() => {
    fetchLeaderboardData(difficulty);
  }, [refreshKey, difficulty]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        排行榜
      </Title>

      <Card>
        <div style={{ marginBottom: 20 }}>
          <Radio.Group value={difficulty} onChange={handleDifficultyChange}>
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="1">简单</Radio.Button>
            <Radio.Button value="2">中等</Radio.Button>
            <Radio.Button value="3">困难</Radio.Button>
          </Radio.Group>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : leaderboardData.length > 0 ? (
          <Table
            dataSource={leaderboardData}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
            size="middle"
          />
        ) : (
          <Empty description="暂无排行榜数据" />
        )}
      </Card>
    </div>
  );
}

export default Leaderboard; 