import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Typography, Empty, Spin, message } from 'antd';
import { TrophyOutlined, StarOutlined, HistoryOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined, CalendarOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph } = Typography;

function Statistics() {
  const [stats, setStats] = useState({
    total_games: 0,
    correct_games: 0,
    average_guesses: 0,
    highest_score: 0,
    total_score: 0,
    games_played: 0,
    win_rate: 0,
    average_score: 0,
    best_difficulty: 1,
    last_played: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('gameSessionId') || 'demo_user';
      const response = await axios.get(`/api/statistics?user_id=${userId}`);
      setStats(response.data);
      setError(false);
    } catch (error) {
      console.error('获取统计信息失败:', error);
      message.error('获取统计信息失败，请重试');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和自动刷新
  useEffect(() => {
    fetchStatistics();
    
    // 设置自动刷新定时器
    const timer = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(timer);
  }, []);

  // 监听刷新键变化
  useEffect(() => {
    fetchStatistics();
  }, [refreshKey]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: '20px' }}>加载统计数据...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        游戏统计
      </Title>

      {error || (stats.total_games === 0 && stats.games_played === 0) ? (
        <Empty description="暂无游戏数据" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="最高分"
                  value={stats.highest_score}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="总积分"
                  value={stats.total_score}
                  prefix={<StarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="游戏场次"
                  value={stats.games_played}
                  prefix={<HistoryOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="平均得分"
                  value={stats.average_score}
                  precision={1}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="总题目数"
                  value={stats.total_games}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="答对题数"
                  value={stats.correct_games}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="正确率"
                  value={stats.win_rate}
                  precision={1}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="平均猜测次数"
                  value={stats.average_guesses}
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="最佳难度"
                  value={stats.best_difficulty === 1 ? '简单' : stats.best_difficulty === 2 ? '中等' : '困难'}
                  prefix={<FireOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="最后游戏时间"
                  value={stats.last_played || '暂无记录'}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 24 }}>
            <Title level={4}>游戏说明</Title>
            <p>1. 选择难度等级开始游戏，难度越高得分越多</p>
            <p>2. 简单模式：10题，中等模式：20题，困难模式：30题</p>
            <p>3. 每局游戏有一定数量的生命值，答错或跳过会消耗</p>
            <p>4. 生命值用完或全部答完，游戏结束</p>
            <p>5. 统计页面可以查看你的历史表现和成就</p>
          </Card>
        </>
      )}
    </div>
  );
}

export default Statistics; 