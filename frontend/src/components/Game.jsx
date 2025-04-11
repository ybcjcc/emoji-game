import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Select, message, Typography, Space, Modal, Form, Statistic, Row, Col, Tooltip, Image } from 'antd';
import { HeartFilled, HeartOutlined, TrophyOutlined, StarOutlined } from '@ant-design/icons';
import axios from 'axios';
import logo from '../../assets/logo.png';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

function Game() {
  // 游戏状态
  const [gameState, setGameState] = useState('initial'); // initial, playing, gameover
  
  // 游戏配置
  const [difficulty, setDifficulty] = useState('1');
  const [maxLives, setMaxLives] = useState(3);
  const [lives, setLives] = useState(3);
  
  // 用户状态
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [isNameModalVisible, setIsNameModalVisible] = useState(!playerName);
  
  // 题目数据
  const [allWords, setAllWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  
  // 游戏数据
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameSession, setGameSession] = useState(null);
  
  // 模态框控制
  const [form] = Form.useForm();
  
  // 评价内容
  const [evaluation, setEvaluation] = useState('');

  // 初始化游戏会话ID
  useEffect(() => {
    const sessionId = localStorage.getItem('gameSessionId') || 'session_' + Math.random().toString(36).substring(2, 9);
    setGameSession(sessionId);
    localStorage.setItem('gameSessionId', sessionId);
  }, []);

  // 根据分数生成评价
  const generateEvaluation = (score, totalPossible) => {
    const percentage = score / totalPossible;
    
    if (percentage >= 0.9) {
      return "太厉害了！你是Emoji解读大师，无人能敌！";
    } else if (percentage >= 0.7) {
      return "不错的成绩！你的Emoji理解能力相当强！";
    } else if (percentage >= 0.5) {
      return "还不错！继续练习，你会做得更好！";
    } else if (percentage >= 0.3) {
      return "加油！多练习几次，分数会提高的！";
    } else {
      return "别灰心，Emoji猜词需要一定的练习！再来一次吧！";
    }
  };

  // 保存玩家名称
  const handleNameSubmit = async (values) => {
    setPlayerName(values.playerName);
    localStorage.setItem('playerName', values.playerName);
    setIsNameModalVisible(false);
    startGame();
  };

  // 开始新游戏
  const startGame = async () => {
    if (!playerName) {
      setIsNameModalVisible(true);
      return;
    }
    
    try {
      const response = await axios.get(`/api/words/batch?difficulty=${difficulty}`);
      if (response.data && response.data.length > 0) {
        setAllWords(response.data);
        setCurrentWordIndex(0);
        setCurrentWord(response.data[0]);
        setLives(maxLives);
        setScore(0);
        setCorrectAnswers(0);
        setGameState('playing');
        setShowAnswer(false);
        setGuess('');
      } else {
        message.error('获取题目失败，请重试');
      }
    } catch (error) {
      console.error('获取题目出错:', error);
      message.error('获取题目失败，请重试');
    }
  };

  // 进入下一题
  const nextWord = () => {
    if (currentWordIndex < allWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentWord(allWords[currentWordIndex + 1]);
      setShowAnswer(false);
      setGuess('');
    } else {
      // 所有题目已完成
      const totalPossible = allWords.length * parseInt(difficulty) * 10;
      setEvaluation(generateEvaluation(score, totalPossible));
      setGameState('gameover');
    }
  };

  // 提交猜测
  const handleSubmit = async () => {
    if (!guess.trim()) {
      message.warning('请输入猜测的词语');
      return;
    }

    try {
      const response = await axios.post('/api/game/guess', {
        word_id: currentWord.id,
        guess: guess.trim(),
        user_id: gameSession,
        guess_time: 1, // 固定为1，因为我们不计算尝试次数
      });

      setShowAnswer(true);

      if (response.data.is_correct) {
        // 答对了
        message.success('恭喜你猜对了！');
        // 计算得分：难度 * 10
        const pointsEarned = parseInt(difficulty) * 10;
        setScore(score + pointsEarned);
        setCorrectAnswers(correctAnswers + 1);
        
        // 延迟进入下一题
        setTimeout(() => {
          nextWord();
        }, 1500);
      } else {
        // 答错了
        message.error('猜错了，正确答案是：' + response.data.answer);
        // 消耗一条命
        const newLives = lives - 1;
        setLives(newLives);
        
        if (newLives <= 0) {
          // 生命值耗尽，游戏结束
          const totalPossible = allWords.length * parseInt(difficulty) * 10;
          setEvaluation(generateEvaluation(score, totalPossible));
          
          setTimeout(() => {
            setGameState('gameover');
          }, 1500);
        } else {
          // 延迟进入下一题
          setTimeout(() => {
            nextWord();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('提交答案出错:', error);
      message.error('提交答案失败');
    }
  };

  // 跳过当前题目
  const handleSkip = () => {
    // 消耗一条命
    const newLives = lives - 1;
    setLives(newLives);
    setShowAnswer(true);
    
    message.info('已跳过，正确答案是：' + currentWord.word);
    
    if (newLives <= 0) {
      // 生命值耗尽，游戏结束
      const totalPossible = allWords.length * parseInt(difficulty) * 10;
      setEvaluation(generateEvaluation(score, totalPossible));
      
      setTimeout(() => {
        setGameState('gameover');
      }, 1500);
    } else {
      // 延迟进入下一题
      setTimeout(() => {
        nextWord();
      }, 1500);
    }
  };

  // 重置游戏
  const resetGame = () => {
    setGameState('initial');
    setLives(maxLives);
    setScore(0);
    setCorrectAnswers(0);
    setAllWords([]);
    setCurrentWord(null);
    setCurrentWordIndex(0);
  };

  // 提交分数到排行榜
  const submitScore = async () => {
    try {
      await axios.post('/api/leaderboard', {
        user_id: gameSession,
        player_name: playerName,
        score: score,
        difficulty: parseInt(difficulty),
      });
      
      message.success('成功提交得分到排行榜！');
      resetGame();
    } catch (error) {
      console.error('提交排行榜出错:', error);
      message.error('提交排行榜失败');
    }
  };

  // 心形生命值渲染
  const renderHearts = () => {
    const hearts = [];
    
    for (let i = 0; i < maxLives; i++) {
      if (i < lives) {
        hearts.push(
          <HeartFilled 
            key={i} 
            style={{ color: '#ff4d4f', fontSize: '24px', marginRight: '5px' }}
          />
        );
      } else {
        hearts.push(
          <HeartOutlined 
            key={i} 
            style={{ color: '#ff4d4f', fontSize: '24px', marginRight: '5px' }}
          />
        );
      }
    }
    
    return hearts;
  };

  // 渲染初始界面（配置界面）
  const renderInitialScreen = () => {
    return (
      <>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Image 
            src={logo} 
            preview={false} 
            style={{ maxWidth: 200, height: 'auto' }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          />
        </div>
        <Title level={3}>开始新游戏</Title>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text>选择难度：</Text>
              <Select
                value={difficulty}
                style={{ width: '100%' }}
                onChange={setDifficulty}
              >
                <Option value="1">简单 (10题)</Option>
                <Option value="2">中等 (20题)</Option>
                <Option value="3">困难 (30题)</Option>
              </Select>
            </Col>
            <Col span={12}>
              <Text>生命值数量：</Text>
              <Select
                value={maxLives}
                style={{ width: '100%' }}
                onChange={setMaxLives}
              >
                <Option value={1}>1</Option>
                <Option value={2}>2</Option>
                <Option value={3}>3</Option>
                <Option value={4}>4</Option>
                <Option value={5}>5</Option>
              </Select>
            </Col>
          </Row>
          
          <Paragraph>
            每局游戏将随机抽取{difficulty === '1' ? '10' : difficulty === '2' ? '20' : '30'}道{difficulty === '1' ? '简单' : difficulty === '2' ? '中等' : '困难'}难度题目。
            每答对一题可获得{parseInt(difficulty) * 10}分。
            答错或跳过会消耗一颗心，全部用完游戏结束。
          </Paragraph>
          
          <Button type="primary" size="large" block onClick={startGame}>
            开始游戏
          </Button>
        </Space>
      </>
    );
  };

  // 渲染游戏界面
  const renderGameScreen = () => {
    return (
      <>
        <Row justify="space-between" align="middle">
          <Col>
            <Text strong>题目: {currentWordIndex + 1}/{allWords.length}</Text>
          </Col>
          <Col>
            <Text strong>得分: {score}</Text>
          </Col>
        </Row>
        
        <Row style={{ marginTop: 10, marginBottom: 10 }}>
          <Col span={24} style={{ textAlign: 'center' }}>
            {renderHearts()}
          </Col>
        </Row>
        
        {currentWord && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <Title level={1} style={{ fontSize: '96px', marginBottom: '16px' }}>{currentWord.emoji}</Title>
            {showAnswer && (
              <Text type="secondary" style={{ fontSize: '20px' }}>正确答案：{currentWord.word}</Text>
            )}
          </div>
        )}
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input
            placeholder="请输入你猜测的词语"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={showAnswer}
            onPressEnter={handleSubmit}
            size="large"
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={showAnswer}
                size="large"
                block
              >
                提交答案
              </Button>
            </Col>
            <Col span={12}>
              <Button
                onClick={handleSkip}
                disabled={showAnswer}
                size="large"
                danger
                block
              >
                跳过此题
              </Button>
            </Col>
          </Row>
        </Space>
      </>
    );
  };

  // 渲染游戏结束界面
  const renderGameOverScreen = () => {
    // 计算完成率
    const completionRate = Math.round((correctAnswers / allWords.length) * 100);
    const difficultyFactor = parseInt(difficulty);
    
    return (
      <>
        <Title level={2} style={{ textAlign: 'center' }}>游戏结束</Title>
        
        <Row gutter={[16, 16]}>
          <Col span={24} md={8}>
            <Card>
              <Statistic
                title="最终得分"
                value={score}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={24} md={8}>
            <Card>
              <Statistic
                title="答对题数"
                value={correctAnswers}
                suffix={`/ ${allWords.length}`}
                valueStyle={{ color: '#0050b3' }}
              />
            </Card>
          </Col>
          <Col span={24} md={8}>
            <Card>
              <Statistic
                title="完成率"
                value={completionRate}
                suffix="%"
                precision={0}
                prefix={<StarOutlined />}
                valueStyle={{ color: completionRate >= 60 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
        
        <div style={{ margin: '24px 0', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
          <Paragraph strong style={{ fontSize: '18px' }}>{evaluation}</Paragraph>
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <Button
              type="primary"
              onClick={submitScore}
              size="large"
              block
            >
              提交得分
            </Button>
          </Col>
          <Col span={12}>
            <Button
              onClick={resetGame}
              size="large"
              block
            >
              再来一局
            </Button>
          </Col>
        </Row>
      </>
    );
  };

  // 主渲染函数
  return (
    <Card title="Emoji猜词游戏" style={{ maxWidth: 800, margin: '0 auto' }}>
      {gameState === 'initial' && renderInitialScreen()}
      {gameState === 'playing' && renderGameScreen()}
      {gameState === 'gameover' && renderGameOverScreen()}
      
      <Modal
        title="请输入你的名字"
        open={isNameModalVisible}
        onCancel={() => setIsNameModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleNameSubmit} layout="vertical">
          <Form.Item
            name="playerName"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称!' }]}
            initialValue={playerName}
          >
            <Input placeholder="输入昵称" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Game; 